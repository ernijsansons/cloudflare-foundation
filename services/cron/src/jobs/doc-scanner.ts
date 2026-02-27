/**
 * doc-scanner.ts
 * Scans Cloudflare release sources for updates and generates
 * actionable doc update reports stored in D1.
 *
 * Sources:
 *  1. npm registry     — agents, @cloudflare/ai-chat, @cloudflare/codemode
 *  2. CF changelog RSS — developers.cloudflare.com/changelog.rss
 *  3. CF blog RSS      — blog.cloudflare.com/rss.xml
 *  4. GitHub releases  — cloudflare/agents, cloudflare/workers-sdk
 *  5. Nitter RSS       — @CloudflareDev, @Cloudflare, @threepointone
 *                        (multiple fallback instances)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanResult {
	source: string;
	newItems: ChangeItem[];
	error?: string;
}

export interface ChangeItem {
	source: string;
	title: string;
	description: string;
	url: string;
	publishedAt: string;
	rawContent: string;
}

export interface DocUpdateReport {
	scannedAt: string;
	findings: Finding[];
	rawItemCount: number;
	newItemCount: number;
}

export interface Finding {
	source: string;
	changeTitle: string;
	changeUrl: string;
	publishedAt: string;
	affectedFiles: string[];
	suggestedAction: string;
	priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ScannerEnv {
	DB: D1Database;
	DEEPSEEK_API_KEY?: string;
	DOC_UPDATE_WEBHOOK?: string;
}

// ---------------------------------------------------------------------------
// Source definitions
// ---------------------------------------------------------------------------

const NPM_PACKAGES = [
	'agents',
	'@cloudflare/ai-chat',
	'@cloudflare/codemode',
	'wrangler',
	'workers-ai-provider'
];

const RSS_FEEDS = [
	{
		name: 'cf-changelog',
		url: 'https://developers.cloudflare.com/changelog/rss.xml'
	},
	{
		name: 'cf-blog',
		url: 'https://blog.cloudflare.com/rss/'
	}
];

const GITHUB_REPOS = [
	{ owner: 'cloudflare', repo: 'agents' },
	{ owner: 'cloudflare', repo: 'workers-sdk' },
	{ owner: 'cloudflare', repo: 'templates' } // Project Factory v3.0 - Track template updates
];

// Nitter instances in priority order — tries each until one works
const NITTER_INSTANCES = [
	'nitter.privacydev.net',
	'nitter.poast.org',
	'nitter.lunar.icu',
	'nitter.1d4.us'
];

const X_ACCOUNTS = [
	'CloudflareDev',
	'Cloudflare',
	'threepointone' // Workers lead
];

// Your doc files that can be affected — used by Claude to target edits
const DOC_FILES = [
	'BIBLE.md',
	'patterns/MCP_SERVER.md',
	'patterns/DURABLE_OBJECTS.md',
	'patterns/AI_AND_VECTORS.md',
	'patterns/DATABASE.md',
	'patterns/WORKFLOWS.md',
	'patterns/AUTH.md',
	'patterns/SECURITY.md',
	'patterns/SVELTEKIT.md',
	'patterns/MICROFRONTENDS.md',
	'patterns/OBSERVABILITY.md',
	'patterns/QUEUES_AND_DLQ.md',
	'platform/SERVICES.md',
	'platform/WRANGLER.md',
	'platform/DEPLOYMENT.md',
	'INDEX.md'
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { 'User-Agent': 'foundation-doc-scanner/1.0' }
		});
		return res;
	} finally {
		clearTimeout(timer);
	}
}

function parseRssItems(xml: string, sourceName: string): ChangeItem[] {
	const items: ChangeItem[] = [];
	const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

	for (const match of itemMatches) {
		const block = match[1];

		const title =
			block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
			block.match(/<title>(.*?)<\/title>/)?.[1] ||
			'';

		const description =
			block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
			block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
			'';

		const link =
			block.match(/<link>(.*?)<\/link>/)?.[1] || block.match(/<guid>(.*?)<\/guid>/)?.[1] || '';

		const pubDate =
			block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ||
			block.match(/<dc:date>(.*?)<\/dc:date>/)?.[1] ||
			new Date().toISOString();

		if (title) {
			items.push({
				source: sourceName,
				title: title.trim(),
				description: description
					.replace(/<[^>]+>/g, '')
					.trim()
					.slice(0, 500),
				url: link.trim(),
				publishedAt: pubDate.trim(),
				rawContent: block
			});
		}
	}

	return items;
}

// ---------------------------------------------------------------------------
// Scanners
// ---------------------------------------------------------------------------

async function scanNpm(db: D1Database): Promise<ScanResult> {
	const newItems: ChangeItem[] = [];
	const errors: string[] = [];

	for (const pkg of NPM_PACKAGES) {
		try {
			const encoded = pkg.replace('/', '%2F');
			const res = await fetchWithTimeout(`https://registry.npmjs.org/${encoded}/latest`);
			if (!res.ok) continue;

			const data = (await res.json()) as { version: string; description?: string };
			const version = data.version;

			// Check against last seen
			const row = await db
				.prepare('SELECT last_seen FROM doc_scan_state WHERE source = ?')
				.bind(`npm:${pkg}`)
				.first<{ last_seen: string }>();

			const lastSeen = row?.last_seen ?? '';

			if (version !== lastSeen) {
				newItems.push({
					source: `npm:${pkg}`,
					title: `${pkg} updated to v${version}`,
					description: `Previous: ${lastSeen || 'unknown'}. New: ${version}`,
					url: `https://www.npmjs.com/package/${pkg}`,
					publishedAt: new Date().toISOString(),
					rawContent: JSON.stringify(data)
				});

				// Update state
				await db
					.prepare(
						`INSERT INTO doc_scan_state (source, last_seen, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(source) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at`
					)
					.bind(`npm:${pkg}`, version, Math.floor(Date.now() / 1000))
					.run();
			}
		} catch (e) {
			errors.push(`npm:${pkg}: ${e instanceof Error ? e.message : String(e)}`);
		}
	}

	return {
		source: 'npm',
		newItems,
		error: errors.length ? errors.join('; ') : undefined
	};
}

async function scanRss(feed: { name: string; url: string }, db: D1Database): Promise<ScanResult> {
	try {
		const res = await fetchWithTimeout(feed.url);
		if (!res.ok) {
			return { source: feed.name, newItems: [], error: `HTTP ${res.status}` };
		}

		const xml = await res.text();
		const items = parseRssItems(xml, feed.name);

		if (items.length === 0) {
			return { source: feed.name, newItems: [] };
		}

		// Use the most recent item's pubDate as the cursor
		const mostRecentDate = items[0].publishedAt;
		const row = await db
			.prepare('SELECT last_seen FROM doc_scan_state WHERE source = ?')
			.bind(`rss:${feed.name}`)
			.first<{ last_seen: string }>();

		const lastSeen = row?.last_seen ?? '';

		// Filter to items newer than last seen
		const newItems = lastSeen
			? items.filter((item) => {
					try {
						return new Date(item.publishedAt) > new Date(lastSeen);
					} catch {
						return true;
					}
				})
			: items.slice(0, 10); // First run: take last 10

		if (newItems.length > 0) {
			await db
				.prepare(
					`INSERT INTO doc_scan_state (source, last_seen, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(source) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at`
				)
				.bind(`rss:${feed.name}`, mostRecentDate, Math.floor(Date.now() / 1000))
				.run();
		}

		return { source: feed.name, newItems };
	} catch (e) {
		return {
			source: feed.name,
			newItems: [],
			error: e instanceof Error ? e.message : String(e)
		};
	}
}

async function scanGitHub(
	repo: { owner: string; repo: string },
	db: D1Database
): Promise<ScanResult> {
	try {
		const res = await fetchWithTimeout(
			`https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`
		);
		if (!res.ok) {
			return {
				source: `github:${repo.repo}`,
				newItems: [],
				error: `HTTP ${res.status}`
			};
		}

		const data = (await res.json()) as {
			tag_name: string;
			name: string;
			body: string;
			html_url: string;
			published_at: string;
		};

		const row = await db
			.prepare('SELECT last_seen FROM doc_scan_state WHERE source = ?')
			.bind(`github:${repo.owner}/${repo.repo}`)
			.first<{ last_seen: string }>();

		const lastSeen = row?.last_seen ?? '';

		if (data.tag_name === lastSeen) {
			return { source: `github:${repo.repo}`, newItems: [] };
		}

		await db
			.prepare(
				`INSERT INTO doc_scan_state (source, last_seen, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(source) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at`
			)
			.bind(`github:${repo.owner}/${repo.repo}`, data.tag_name, Math.floor(Date.now() / 1000))
			.run();

		return {
			source: `github:${repo.repo}`,
			newItems: [
				{
					source: `github:${repo.repo}`,
					title: `${repo.repo} ${data.tag_name} released`,
					description: (data.body || '').slice(0, 500),
					url: data.html_url,
					publishedAt: data.published_at,
					rawContent: JSON.stringify(data)
				}
			]
		};
	} catch (e) {
		return {
			source: `github:${repo.repo}`,
			newItems: [],
			error: e instanceof Error ? e.message : String(e)
		};
	}
}

async function scanNitter(account: string, db: D1Database): Promise<ScanResult> {
	// Try each Nitter instance until one works
	for (const instance of NITTER_INSTANCES) {
		try {
			const url = `https://${instance}/${account}/rss`;
			const res = await fetchWithTimeout(url, 6000);

			if (!res.ok) continue;

			const xml = await res.text();

			// Validate it looks like an RSS feed
			if (!xml.includes('<rss') && !xml.includes('<feed')) continue;

			const items = parseRssItems(xml, `x:${account}`);
			if (items.length === 0) continue;

			const mostRecentDate = items[0].publishedAt;
			const row = await db
				.prepare('SELECT last_seen FROM doc_scan_state WHERE source = ?')
				.bind(`nitter:${account}`)
				.first<{ last_seen: string }>();

			const lastSeen = row?.last_seen ?? '';

			const newItems = lastSeen
				? items.filter((item) => {
						try {
							return new Date(item.publishedAt) > new Date(lastSeen);
						} catch {
							return true;
						}
					})
				: items.slice(0, 5); // First run: last 5 tweets

			// Filter to only CF-relevant content (avoid noise)
			const relevant = newItems.filter((item) =>
				isCloudflareRelevant(item.title + ' ' + item.description)
			);

			if (relevant.length > 0 || newItems.length > 0) {
				await db
					.prepare(
						`INSERT INTO doc_scan_state (source, last_seen, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(source) DO UPDATE SET last_seen = excluded.last_seen, updated_at = excluded.updated_at`
					)
					.bind(`nitter:${account}`, mostRecentDate, Math.floor(Date.now() / 1000))
					.run();
			}

			return { source: `x:${account}`, newItems: relevant };
		} catch {
			// Try next instance
			continue;
		}
	}

	return {
		source: `x:${account}`,
		newItems: [],
		error: 'All Nitter instances failed'
	};
}

// Simple relevance filter to reduce noise from X
function isCloudflareRelevant(text: string): boolean {
	const lower = text.toLowerCase();
	const keywords = [
		'workers',
		'agents',
		'sdk',
		'd1',
		'r2',
		'kv',
		'durable object',
		'workflow',
		'mcp',
		'wrangler',
		'pages',
		'changelog',
		'release',
		'v0.',
		'v1.',
		'beta',
		'ga ',
		'generally available',
		'launch',
		'new:',
		'announcing',
		'update',
		'breaking',
		'deprecated',
		'vectorize',
		'hyperdrive',
		'ai gateway',
		'browser rendering',
		'containers',
		'pipelines',
		'queues'
	];
	return keywords.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// AI analysis
// ---------------------------------------------------------------------------

// ─── Shared prompt builder ───────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT =
	'You are a Cloudflare documentation maintenance agent. ' +
	'Analyze release announcements and return ONLY a valid JSON array. ' +
	'No markdown fences. No explanation. No preamble. Just the JSON array.';

function buildAnalysisPrompt(newItems: ChangeItem[]): string {
	return `The following new Cloudflare releases were detected:

${newItems
	.map(
		(item, i) => `--- Item ${i + 1} ---
Source: ${item.source}
Title: ${item.title}
Published: ${item.publishedAt}
URL: ${item.url}
Description: ${item.description}`
	)
	.join('\n\n')}

Our doc files (at C:\\dev\\.cloudflare\\):
${DOC_FILES.map((f) => `- ${f}`).join('\n')}

Always update docs for: new SDK versions, new/changed APIs, new CF products,
breaking changes, deprecations, new limits, new auth flows.

Return a JSON array. Each element:
{
  "source": "source name",
  "changeTitle": "concise title",
  "changeUrl": "url",
  "publishedAt": "ISO date",
  "affectedFiles": ["BIBLE.md"],
  "suggestedAction": "Exact edit: what to change, where, and new value",
  "priority": "critical|high|medium|low"
}

Priority: critical=SDK bump/breaking, high=new feature/product,
medium=new limit/quota, low=blog/announcement only.
Omit items needing no doc changes. Return [] if nothing needs updating.`;
}

// ─── DeepSeek analysis ───────────────────────────────────────────────────────

async function analyzeWithDeepSeek(newItems: ChangeItem[], apiKey: string): Promise<Finding[]> {
	if (newItems.length === 0) return [];

	try {
		const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'deepseek-chat',
				max_tokens: 3000,
				temperature: 0.1,
				messages: [
					{ role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
					{ role: 'user', content: buildAnalysisPrompt(newItems) }
				]
			})
		});

		if (!res.ok) {
			console.error(`DeepSeek returned HTTP ${res.status}:`, await res.text());
			return [];
		}

		const data = (await res.json()) as {
			choices: Array<{ message: { content: string } }>;
		};
		const text = data.choices?.[0]?.message?.content ?? '';
		const clean = text.replace(/```json\n?|\n?```/g, '').trim();
		const parsed = JSON.parse(clean);
		return Array.isArray(parsed) ? (parsed as Finding[]) : [];
	} catch (e) {
		console.error('DeepSeek analysis failed:', e instanceof Error ? e.message : e);
		return [];
	}
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runDocScanner(db: D1Database, env: ScannerEnv): Promise<DocUpdateReport> {
	console.log('Doc scanner starting:', new Date().toISOString());

	// Ensure tables exist
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS doc_scan_state (
        source TEXT PRIMARY KEY,
        last_seen TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`
		)
		.run();

	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS doc_update_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scanned_at INTEGER NOT NULL,
        findings TEXT NOT NULL,
        raw_item_count INTEGER NOT NULL,
        new_item_count INTEGER NOT NULL,
        applied INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`
		)
		.run();

	// Run all scanners in parallel
	const [
		npmResult,
		cfChangelogResult,
		cfBlogResult,
		agentsGithubResult,
		sdkGithubResult,
		_templatesGithubResult,
		xCfDevResult,
		xCfResult,
		x3pointResult
	] = await Promise.allSettled([
		scanNpm(db),
		scanRss(RSS_FEEDS[0], db),
		scanRss(RSS_FEEDS[1], db),
		scanGitHub(GITHUB_REPOS[0], db),
		scanGitHub(GITHUB_REPOS[1], db),
		scanGitHub(GITHUB_REPOS[2], db), // Track cloudflare/templates
		scanNitter(X_ACCOUNTS[0], db),
		scanNitter(X_ACCOUNTS[1], db),
		scanNitter(X_ACCOUNTS[2], db)
	]);

	// Collect all new items
	const allNewItems: ChangeItem[] = [];
	const results = [
		npmResult,
		cfChangelogResult,
		cfBlogResult,
		agentsGithubResult,
		sdkGithubResult,
		xCfDevResult,
		xCfResult,
		x3pointResult
	];

	for (const result of results) {
		if (result.status === 'fulfilled') {
			allNewItems.push(...result.value.newItems);
			if (result.value.error) {
				console.warn(`Scanner warning [${result.value.source}]:`, result.value.error);
			}
		}
	}

	console.log(`Found ${allNewItems.length} new items across all sources`);

	// Analyze with AI
	const findings = env.DEEPSEEK_API_KEY
		? await analyzeWithDeepSeek(allNewItems, env.DEEPSEEK_API_KEY)
		: [];
	if (!env.DEEPSEEK_API_KEY) {
		console.warn('DEEPSEEK_API_KEY not set — skipping AI analysis');
	}
	console.log(`AI analysis identified ${findings.length} doc updates needed`);

	// Store report
	const now = Math.floor(Date.now() / 1000);
	await db
		.prepare(
			`INSERT INTO doc_update_reports
       (scanned_at, findings, raw_item_count, new_item_count, applied, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
		)
		.bind(now, JSON.stringify(findings), allNewItems.length, findings.length, now)
		.run();

	return {
		scannedAt: new Date().toISOString(),
		findings,
		rawItemCount: allNewItems.length,
		newItemCount: findings.length
	};
}
