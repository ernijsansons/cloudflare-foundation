# CLAUDE CODE — DOC SCANNER DEPLOY

# C:\dev\.cloudflare\cloudflare-foundation-dev

#

# PASTE THIS ENTIRE FILE AS YOUR FIRST MESSAGE IN CLAUDE CODE

# ─────────────────────────────────────────────────────────────────────────────

You are a senior Cloudflare platform engineer. Deploy and validate the
Cloudflare Doc Auto-Update System in this monorepo. Work autonomously.
Show every command output. Fix every error before moving on.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## GROUND TRUTH — EXACTLY WHAT EXISTS RIGHT NOW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECRETS (already set on cron Worker production):
✅ DEEPSEEK_API_KEY — set via wrangler secret

D1 TABLES (already exist in foundation-primary):
✅ doc_scan_state
✅ doc_update_reports

MIGRATION: skip Phase 5 entirely — tables exist.

ANTHROPIC_API_KEY: NOT set. NOT needed on the Worker.
The Worker must work with DeepSeek ONLY (no Claude API key on the server).
The local apply script (apply-updates.mjs) will use Claude Code's built-in
subscription via the computer — it does NOT need ANTHROPIC_API_KEY env var.

BUGS TO FIX:
❌ doc-scanner.ts — only calls Claude API, has no DeepSeek support,
will FAIL at runtime since ANTHROPIC_API_KEY not set
❌ services/cron/src/index.ts — Env interface has `ANTHROPIC_API_KEY: string`
(required, non-optional) — deploy will break without it
❌ apply-updates.mjs — DOC_ROOT resolves one level too shallow (points to
cloudflare-foundation-dev instead of cloudflare root),
exits if ANTHROPIC_API_KEY not set (wrong for our setup),
gateway URLs are /cron/... instead of /api/cron/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## RULES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Read every file before editing it. Never guess at current content.
2. No hardcoded secrets. Secrets already exist — just reference them.
3. Run `npx tsc --noEmit` after every edit. Zero errors before deploy.
4. DeepSeek is the ONLY AI provider on the Worker. No Claude fallback server-side.
5. apply-updates.mjs applies edits by calling YOU (Claude Code) directly — no API key needed.
6. One source failing must not crash the scanner — Promise.allSettled everywhere (already done).
7. Surgical edits to doc files. Never reformat unrelated sections.
8. Show every command output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 1 — FIX services/cron/src/jobs/doc-scanner.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the file first. Then make these changes:

### 1A — Add ScannerEnv interface (after the Finding interface)

```typescript
export interface ScannerEnv {
	DB: D1Database;
	DEEPSEEK_API_KEY?: string;
	DOC_UPDATE_WEBHOOK?: string;
}
```

### 1B — Replace the entire analyzeWithClaude function

Delete `analyzeWithClaude` and everything in it. Replace with:

````typescript
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
````

### 1C — Update runDocScanner signature and internal call

Change the function signature from:

```typescript
export async function runDocScanner(
  db: D1Database,
  anthropicApiKey: string
): Promise<DocUpdateReport> {
```

To:

```typescript
export async function runDocScanner(
  db: D1Database,
  env: ScannerEnv
): Promise<DocUpdateReport> {
```

Inside the function, replace:

```typescript
const findings = await analyzeWithClaude(allNewItems, anthropicApiKey);
console.log(`Claude identified ${findings.length} doc updates needed`);
```

With:

```typescript
const findings = env.DEEPSEEK_API_KEY
	? await analyzeWithDeepSeek(allNewItems, env.DEEPSEEK_API_KEY)
	: [];
if (!env.DEEPSEEK_API_KEY) {
	console.warn('DEEPSEEK_API_KEY not set — skipping AI analysis');
}
console.log(`AI analysis identified ${findings.length} doc updates needed`);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 2 — FIX services/cron/src/index.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the file first. Then:

### 2A — Fix Env interface

Replace:

```typescript
export interface Env {
	DB: D1Database;
	ANTHROPIC_API_KEY: string;
	DOC_UPDATE_WEBHOOK?: string;
}
```

With:

```typescript
export interface Env {
	DB: D1Database;
	DEEPSEEK_API_KEY?: string; // Primary AI — set via wrangler secret
	DOC_UPDATE_WEBHOOK?: string; // Optional Slack/Discord webhook
}
```

### 2B — Fix all three runDocScanner call sites

There are exactly 3 calls to runDocScanner in this file. Change ALL of them:

From: `runDocScanner(env.DB, env.ANTHROPIC_API_KEY)`
To: `runDocScanner(env.DB, env)`

### 2C — Add AI provider status to health check

In the health endpoint, replace:

```typescript
const checks: Record<string, boolean> = { db: false };
```

With:

```typescript
const checks: Record<string, boolean> = {
	db: false,
	ai_deepseek: !!env.DEEPSEEK_API_KEY
};
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 3 — FIX scripts/apply-updates.mjs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the file first. Then:

### 3A — Fix DOC_ROOT path

The script is at `scripts/apply-updates.mjs` inside `cloudflare-foundation-dev/`.
The doc files are at `C:\dev\.cloudflare\` which is ONE LEVEL ABOVE the monorepo.

Current (wrong):

```javascript
const DOC_ROOT = path.resolve(__dirname, '..');
// resolves to: C:\dev\.cloudflare\cloudflare-foundation-dev  ← WRONG
```

Fix:

```javascript
// scripts/ → cloudflare-foundation-dev/ → cloudflare/ (the doc root)
const DOC_ROOT = path.resolve(__dirname, '..', '..');
```

Add startup validation immediately after:

```javascript
// Validate DOC_ROOT is correct
if (!fs.existsSync(path.join(DOC_ROOT, 'BIBLE.md'))) {
	console.error(`\n❌ DOC_ROOT misconfigured. BIBLE.md not found at:\n   ${DOC_ROOT}`);
	process.exit(1);
}
console.log(`📁 Doc root: ${DOC_ROOT}`);
```

### 3B — Remove the hard exit on missing ANTHROPIC_API_KEY

Remove the entire block:

```javascript
if (!ANTHROPIC_API_KEY) {
	console.error('❌ ANTHROPIC_API_KEY not set');
	process.exit(1);
}
```

Replace with:

```javascript
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY && !ANTHROPIC_API_KEY) {
	console.warn('⚠️  No AI env vars set — will apply edits using Claude Code directly');
}
```

### 3C — Replace applyFinding's AI call with multi-provider logic

The current `applyFinding` function calls Claude API directly at the bottom.
Replace the entire fetch block (from `const response = await fetch(` to the end
of the `result.summary` block) with this:

```javascript
const result = await callAI(prompt);
if (!result) {
	console.error('   ❌ AI call failed — skipping');
	return;
}

for (const [file, content] of Object.entries(result.files ?? {})) {
	const filePath = path.join(DOC_ROOT, file);
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content, 'utf8');
	console.log(`   ✅ Updated: ${file}`);
}

if (result.summary) {
	console.log(`   💬 ${result.summary}`);
}
```

And add this `callAI` function BEFORE `applyFinding`:

````javascript
/**
 * Apply doc edit using whichever AI is available.
 * Priority: DeepSeek env var → Anthropic env var → error (user must apply manually)
 */
async function callAI(prompt) {
	// 1. Try DeepSeek (fast + cheap, good for structured edits)
	if (DEEPSEEK_API_KEY) {
		try {
			const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${DEEPSEEK_API_KEY}`
				},
				body: JSON.stringify({
					model: 'deepseek-chat',
					max_tokens: 8000,
					temperature: 0.1,
					messages: [
						{
							role: 'system',
							content:
								'You are a documentation editor. Return ONLY valid JSON. No markdown. No explanation.'
						},
						{ role: 'user', content: prompt }
					]
				})
			});
			if (res.ok) {
				const data = await res.json();
				const text = data.choices?.[0]?.message?.content ?? '';
				const clean = text.replace(/```json\n?|\n?```/g, '').trim();
				const parsed = JSON.parse(clean);
				console.log('   🤖 DeepSeek applied the edit');
				return parsed;
			}
		} catch (e) {
			console.warn(`   ⚠️  DeepSeek failed: ${e.message}`);
		}
	}

	// 2. Try Anthropic API key if set
	if (ANTHROPIC_API_KEY) {
		try {
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': ANTHROPIC_API_KEY,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model: 'claude-sonnet-4-20250514',
					max_tokens: 8000,
					system:
						'You are a documentation editor. Return ONLY valid JSON. No markdown. No explanation.',
					messages: [{ role: 'user', content: prompt }]
				})
			});
			if (res.ok) {
				const data = await res.json();
				const text = data.content?.find((b) => b.type === 'text')?.text ?? '';
				const clean = text.replace(/```json\n?|\n?```/g, '').trim();
				const parsed = JSON.parse(clean);
				console.log('   🤖 Claude (API) applied the edit');
				return parsed;
			}
		} catch (e) {
			console.warn(`   ⚠️  Claude API failed: ${e.message}`);
		}
	}

	// 3. No provider available — print instructions for Claude Code user
	console.log('\n   🤖 No AI env vars set. Paste this into Claude Code to apply manually:');
	console.log('   ─────────────────────────────────────────────────────────────────');
	console.log(prompt.slice(0, 800) + (prompt.length > 800 ? '\n   [... truncated ...]' : ''));
	console.log('   ─────────────────────────────────────────────────────────────────');
	return null;
}
````

### 3D — Fix the gateway URLs (2 places)

In `fetchPendingReports`, change:

```javascript
const res = await fetch(`${GATEWAY_URL}/cron/doc-updates`, { headers });
```

To:

```javascript
const res = await fetch(`${GATEWAY_URL}/api/cron/doc-updates`, { headers });
```

In `markReportApplied`, change:

```javascript
await fetch(`${GATEWAY_URL}/cron/doc-updates/${reportId}`, {
```

To:

```javascript
await fetch(`${GATEWAY_URL}/api/cron/doc-updates/${reportId}`, {
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 4 — TYPE CHECK (zero tolerance)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
cd services/cron && npx tsc --noEmit
cd ../gateway && npx tsc --noEmit
```

Do not proceed until both return exit code 0 with zero errors.

Common errors and exact fixes:

- "analyzeWithClaude is not defined" → old name still referenced, grep and fix
- "Expected 2 args (string)" → runDocScanner signature not updated in index.ts
- "Property ANTHROPIC_API_KEY does not exist on Env" → Env interface not cleaned up
- "Property DEEPSEEK_API_KEY does not exist on ScannerEnv" → interface missing field

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 5 — SKIP (D1 tables already confirmed to exist)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tables doc_scan_state and doc_update_reports already exist in foundation-primary.
Verified via wrangler d1 execute. Move directly to Phase 6.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 6 — DEPLOY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
# Deploy cron Worker
cd services/cron
npx wrangler deploy --env production
```

Expected output contains: "Deployed foundation-cron-production"

```bash
# Deploy gateway (exposes /api/cron/* endpoints)
cd ../gateway
npx wrangler deploy --env production
```

Expected output contains: "Deployed" with gateway Worker name.

If either deploy fails: read the error, fix it, re-run tsc, redeploy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 7 — VALIDATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run each check and show the full output:

### 7A — Health (confirm ai_deepseek: true)

```bash
curl -s https://foundation-cron-production.workers.dev/health | npx fx
```

Expected: `"ai_deepseek": true`

### 7B — Trigger scan (THE real test — runs all 11 sources + DeepSeek analysis)

```bash
curl -s -X POST https://foundation-cron-production.workers.dev/scan-docs | npx fx
```

Takes 10-30 seconds. Show the full response.
rawItemCount > 0 means sources are working.
If rawItemCount = 0, check Worker logs:

```bash
npx wrangler tail foundation-cron-production --env production
```

### 7C — Confirm D1 scan state written

```bash
npx wrangler d1 execute foundation-primary --command \
  "SELECT source, last_seen FROM doc_scan_state ORDER BY source" --remote
```

### 7D — Test apply script dry run

```bash
cd ../..
node scripts/apply-updates.mjs --dry-run
```

First line should print: `📁 Doc root: C:\dev\.cloudflare`
If it prints `cloudflare-foundation-dev` instead → DOC_ROOT fix didn't land.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 8 — APPLY KNOWN DOC UPDATES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read each file before editing. Make ONLY the changes listed. Touch nothing else.

### 8A — C:\dev\.cloudflare\BIBLE.md

THREE separate surgical edits:

EDIT 1 — SDK version bump
Find: any occurrence of `v0.3.7` or `agents@0.3.7`
Change to: `v0.6.0` (released Feb 2026)

EDIT 2 — RPC transport (add after the agents SDK section, before the next heading)

````markdown
### RPC Transport for MCP — Same-Worker (v0.6.0+)

Connect Agent → McpAgent via Durable Object binding instead of HTTP.
Zero network overhead. No OAuth required for internal connections.

**wrangler.jsonc:**

```jsonc
{
	"durable_objects": {
		"bindings": [{ "name": "MY_MCP", "class_name": "MyMcpServer" }]
	}
}
```
````

**Agent code:**

```typescript
await this.addMcpServer('tools', this.env.MY_MCP);
// With user context:
await this.addMcpServer('tools', this.env.MY_MCP, { props: { userId: this.props.userId } });
```

Use HTTP transport only for cross-Worker or external MCP servers.
OAuth is now opt-in — simple connections work without it.

````

EDIT 3 — Container limits (find and update the limits table or list)
Old values → New values (Feb 2026, 15× increase across the board):
- Memory: 400 GiB → **6 TiB**
- vCPU: 100 → **1,500**
- Disk: 2 TB → **30 TB**

### 8B — C:\dev\.cloudflare\patterns\MCP_SERVER.md

Add new section after "When to Use MCP":

```markdown
## RPC Transport — Preferred for Same-Worker MCP (v0.6.0+)

When your Agent and McpAgent live in the same Worker, use RPC (DO binding)
instead of HTTP. Benefits: hibernation support, zero latency, no auth setup.

```typescript
// wrangler.jsonc binding
{ "name": "MY_MCP", "class_name": "MyMcpServer" }

// In your Agent
await this.addMcpServer("tools", this.env.MY_MCP);
````

Use HTTP (`url:`) only for external or cross-Worker MCP servers.

````

### 8C — C:\dev\.cloudflare\patterns\DURABLE_OBJECTS.md

Find the `deleteAll()` section or storage cleanup section. Add this note:

```typescript
// ⚠️ Behavior change (compat >= 2026-02-24):
// deleteAll() now atomically deletes BOTH storage AND alarms.
// Previously you needed: await storage.deleteAll() + await storage.deleteAlarm()
await this.ctx.storage.deleteAll(); // handles alarms too, if compat date set
````

### 8D — C:\dev\.cloudflare\platform\SERVICES.md

Add these three new entries in the appropriate section:

````markdown
### @cloudflare/codemode v0.1.0 (Feb 2026)

Collapses 2,500+ CF API endpoints into ~1,000 tokens for AI coding agents.

- `createCodeTool()` — Workers AI-compatible tool definition
- `DynamicWorkerExecutor` — sandboxed, network-isolated code execution
- `npm i @cloudflare/codemode`

### R2 Local Uploads (Open Beta, Feb 2026)

Writes data to nearest R2 location first, replicates globally async.
~75% faster uploads for distributed users. No API change, no extra cost.
Enable: Dashboard → R2 → Bucket → Settings → Local Uploads.

### Sandbox Backups API (Feb 2026)

Point-in-time snapshots of Sandbox state, backed by R2.

```typescript
const id = await sandbox.createBackup();
await sandbox.restoreBackup(id);
```
````

````

### 8E — C:\dev\.cloudflare\patterns\MICROFRONTENDS.md

Add new section:

```markdown
## Vinext — Next.js Native on Workers (Feb 2026)

Next.js rebuilt on Vite for Cloudflare Workers. Drop-in replacement.
- 4.4× faster builds than @cloudflare/next-on-pages
- 57% smaller bundles
- KV-backed ISR caching
- 94% Next.js API coverage (App Router, Pages Router, RSC, Server Actions)

```bash
npm i vinext
npx vinext deploy
````

Migrate from next-on-pages by swapping the build script in package.json.

````

### 8F — C:\dev\.cloudflare\platform\WRANGLER.md

Find the Pipelines section, add:

```markdown
**Wrangler 4.x Pipelines improvements:**
- `wrangler types` now generates TypeScript types for Pipeline bindings
- Simple mode: auto-creates R2 bucket + Data Catalog, minimal config required
- Dashboard: dropped-event metrics per pipeline
````

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 9 — ADD npm SCRIPTS TO ROOT package.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the root package.json. Add these scripts (merge, don't overwrite):

```json
{
	"scripts": {
		"docs:scan": "curl -s -X POST https://foundation-cron-production.workers.dev/scan-docs | npx fx",
		"docs:status": "curl -s https://foundation-cron-production.workers.dev/health | npx fx",
		"docs:pending": "curl -s -H \"Authorization: Bearer $FOUNDATION_API_KEY\" https://gateway.erlvinc.com/api/cron/doc-updates | npx fx",
		"docs:apply": "node scripts/apply-updates.mjs",
		"docs:dry": "node scripts/apply-updates.mjs --dry-run",
		"docs:state": "npx wrangler d1 execute foundation-primary --command \"SELECT source, last_seen FROM doc_scan_state ORDER BY source\" --remote"
	}
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE 10 — FINAL CHECKS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```bash
# 1. TypeScript clean
cd services/cron && npx tsc --noEmit && echo "CRON OK"
cd ../gateway && npx tsc --noEmit && echo "GATEWAY OK"

# 2. Verify doc edits landed
grep -n "v0\.6\.0" C:\dev\.cloudflare\BIBLE.md
grep -n "RPC Transport" C:\dev\.cloudflare\patterns\MCP_SERVER.md
grep -n "2026-02-24\|deleteAll" C:\dev\.cloudflare\patterns\DURABLE_OBJECTS.md
grep -n "codemode" C:\dev\.cloudflare\platform\SERVICES.md
grep -n "Vinext\|vinext" C:\dev\.cloudflare\patterns\MICROFRONTENDS.md
grep -n "Simple mode" C:\dev\.cloudflare\platform\WRANGLER.md

# 3. Worker health
curl -s https://foundation-cron-production.workers.dev/health | npx fx

# 4. D1 has data
npx wrangler d1 execute foundation-primary --command \
  "SELECT COUNT(*) as sources FROM doc_scan_state" --remote
```

Then output this completion report:

```
╔══════════════════════════════════════════════════════════════════════╗
║     CLOUDFLARE DOC AUTO-UPDATE SYSTEM — DEPLOYMENT COMPLETE         ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  WORKERS                                                             ║
║  ├─ foundation-cron-production      [DEPLOYED / FAILED]             ║
║  └─ foundation-gateway-production   [DEPLOYED / FAILED]             ║
║                                                                      ║
║  CRON: Doc scanner fires at 06:00 UTC daily                         ║
║                                                                      ║
║  AI PROVIDER                                                         ║
║  └─ DeepSeek (primary)   ✅ DEEPSEEK_API_KEY set via wrangler       ║
║     Claude Code (local)  ✅ Used by apply-updates.mjs natively      ║
║                                                                      ║
║  SOURCES MONITORED (11)                                              ║
║  ├─ npm:  agents, ai-chat, codemode, wrangler, workers-ai-provider  ║
║  ├─ RSS:  CF changelog, CF blog                                      ║
║  ├─ GitHub: cloudflare/agents, cloudflare/workers-sdk               ║
║  └─ X:    @CloudflareDev, @Cloudflare                               ║
║                                                                      ║
║  DOC FILES UPDATED THIS SESSION                                      ║
║  ├─ BIBLE.md                  SDK v0.6.0, RPC, container limits     ║
║  ├─ patterns/MCP_SERVER.md    RPC transport section                 ║
║  ├─ patterns/DURABLE_OBJECTS.md  deleteAll() alarm behavior         ║
║  ├─ platform/SERVICES.md      codemode, R2 local, Sandbox backups  ║
║  ├─ patterns/MICROFRONTENDS.md   Vinext                             ║
║  └─ platform/WRANGLER.md      Pipelines typed bindings              ║
║                                                                      ║
║  DAILY WORKFLOW                                                      ║
║  ├─ Scanner auto-runs 6am UTC                                       ║
║  ├─ /update-docs  →  runs from Claude Code terminal                 ║
║  └─ pnpm docs:dry →  preview without writing files                 ║
║                                                                      ║
║  YOUR DOCS WILL NEVER BE STALE AGAIN 🚀                             ║
╚══════════════════════════════════════════════════════════════════════╝
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## TROUBLESHOOTING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROBLEM: rawItemCount: 0 after scan
FIX: npx wrangler tail foundation-cron-production --env production
Look for timeout/fetch errors on individual sources.

PROBLEM: DOC_ROOT prints cloudflare-foundation-dev instead of cloudflare
FIX: DOC_ROOT path.resolve is still 1 level up, not 2. Check Phase 3A.

PROBLEM: "No environment found in configuration with name production" from wrangler d1
FIX: Normal warning — the execute still works. The --remote flag is what matters.
You can also omit --env production for d1 execute commands.

PROBLEM: DeepSeek returns malformed JSON
FIX: Add response_format: { type: "json_object" } to the DeepSeek request body
in analyzeWithDeepSeek.

PROBLEM: Gateway /api/cron/doc-updates returns 401
FIX: Pass Authorization header: curl -H "Authorization: Bearer $FOUNDATION_API_KEY"
The gateway token is already in SESSION_KV — just set the env var.

PROBLEM: Nitter sources fail
FIX: Expected. Public instances go down. Scanner handles this gracefully with
Promise.allSettled — other sources still work.

PROBLEM: Both Workers deploy but health shows ai_deepseek: false
FIX: wrangler secret list --env production should show DEEPSEEK_API_KEY.
If missing: cd services/cron && npx wrangler secret put DEEPSEEK_API_KEY --env production
