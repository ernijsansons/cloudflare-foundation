/**
 * Seed Template Registry — Project Factory v3.0
 *
 * Populates the template_registry table with:
 * - 22 Cloudflare official templates
 * - 5 BIBLE patterns
 * - 5+ community templates
 *
 * Usage:
 *   npx tsx scripts/seed-registry.ts
 *
 * Outputs SQL to stdout for piping to wrangler:
 *   npx tsx scripts/seed-registry.ts | npx wrangler d1 execute planning-primary --remote --command=-
 */

/* global crypto */
/* eslint-disable no-console */

interface TemplateEntry {
	slug: string;
	name: string;
	description: string;
	source: 'cloudflare' | 'bible' | 'community';
	category: string;
	framework: string;
	bindings: string[];
	complexity: 1 | 2 | 3 | 4 | 5;
	estimatedCostLow: number;
	estimatedCostMid: number;
	estimatedCostHigh: number;
	repoUrl?: string;
	docsUrl?: string;
	costNotes?: string;
	tags: string[];
}

// Cloudflare Official Templates (22 templates)
const CLOUDFLARE_TEMPLATES: TemplateEntry[] = [
	{
		slug: 'worker-hono',
		name: 'Hono API Worker',
		description: 'Lightweight HTTP API using Hono framework with TypeScript',
		source: 'cloudflare',
		category: 'api',
		framework: 'hono',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 5,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-hono',
		tags: ['api', 'hono', 'starter', 'typescript']
	},
	{
		slug: 'worker-typescript',
		name: 'TypeScript Worker',
		description: 'Bare-bones TypeScript Worker for custom logic',
		source: 'cloudflare',
		category: 'api',
		framework: 'none',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 5,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-typescript',
		tags: ['worker', 'typescript', 'minimal']
	},
	{
		slug: 'worker-router',
		name: 'React Router SPA',
		description: 'Single-page app with React Router v7 and Vite',
		source: 'cloudflare',
		category: 'fullstack',
		framework: 'react-router',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 20,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-react-router',
		tags: ['react', 'spa', 'frontend', 'vite']
	},
	{
		slug: 'worker-d1-drizzle',
		name: 'D1 Database with Drizzle ORM',
		description: 'SQLite database with type-safe Drizzle ORM and migrations',
		source: 'cloudflare',
		category: 'database',
		framework: 'hono',
		bindings: ['d1_databases'],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 25,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-d1-drizzle',
		tags: ['database', 'd1', 'drizzle', 'orm', 'sqlite']
	},
	{
		slug: 'worker-websocket',
		name: 'WebSocket Server',
		description: 'Real-time WebSocket connections with Durable Objects',
		source: 'cloudflare',
		category: 'realtime',
		framework: 'hono',
		bindings: ['durable_objects'],
		complexity: 3,
		estimatedCostLow: 5,
		estimatedCostMid: 25,
		estimatedCostHigh: 100,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-websocket',
		costNotes: 'Cost depends on concurrent connections and message volume',
		tags: ['websocket', 'realtime', 'durable-objects']
	},
	{
		slug: 'worker-durable-objects',
		name: 'Durable Objects Template',
		description: 'Stateful edge compute with strong consistency',
		source: 'cloudflare',
		category: 'realtime',
		framework: 'hono',
		bindings: ['durable_objects'],
		complexity: 4,
		estimatedCostLow: 10,
		estimatedCostMid: 50,
		estimatedCostHigh: 200,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-durable-objects',
		costNotes: 'Paid Workers plan required',
		tags: ['durable-objects', 'stateful', 'edge-compute']
	},
	{
		slug: 'worker-r2',
		name: 'R2 File Storage',
		description: 'S3-compatible object storage with zero egress fees',
		source: 'cloudflare',
		category: 'storage',
		framework: 'hono',
		bindings: ['r2_buckets'],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 30,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-r2',
		tags: ['storage', 'r2', 'files', 'uploads']
	},
	{
		slug: 'worker-kv',
		name: 'KV Key-Value Store',
		description: 'Global low-latency key-value cache',
		source: 'cloudflare',
		category: 'caching',
		framework: 'hono',
		bindings: ['kv_namespaces'],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 20,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-kv',
		tags: ['kv', 'cache', 'key-value']
	},
	{
		slug: 'worker-queues',
		name: 'Cloudflare Queues',
		description: 'Message queue for async processing and background jobs',
		source: 'cloudflare',
		category: 'async',
		framework: 'hono',
		bindings: ['queues'],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 30,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-queues',
		tags: ['queues', 'async', 'background-jobs']
	},
	{
		slug: 'worker-ai',
		name: 'Workers AI Template',
		description: 'Run LLM inference at the edge with Workers AI',
		source: 'cloudflare',
		category: 'ai',
		framework: 'hono',
		bindings: ['ai'],
		complexity: 3,
		estimatedCostLow: 5,
		estimatedCostMid: 30,
		estimatedCostHigh: 150,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-ai',
		costNotes: 'Cost depends on model choice and token volume',
		tags: ['ai', 'llm', 'machine-learning', 'inference']
	},
	{
		slug: 'worker-vectorize',
		name: 'Vectorize Template',
		description: 'Vector database for embeddings and semantic search',
		source: 'cloudflare',
		category: 'ai',
		framework: 'hono',
		bindings: ['vectorize', 'ai'],
		complexity: 3,
		estimatedCostLow: 0,
		estimatedCostMid: 10,
		estimatedCostHigh: 60,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-vectorize',
		tags: ['vectorize', 'embeddings', 'semantic-search', 'rag']
	},
	{
		slug: 'worker-workflows',
		name: 'Workflows Template',
		description: 'Durable execution for long-running processes',
		source: 'cloudflare',
		category: 'workflow',
		framework: 'hono',
		bindings: ['workflows'],
		complexity: 3,
		estimatedCostLow: 5,
		estimatedCostMid: 25,
		estimatedCostHigh: 120,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-workflows',
		costNotes: 'Paid Workers plan required, Beta',
		tags: ['workflows', 'durable-execution', 'orchestration']
	},
	{
		slug: 'worker-openapi',
		name: 'OpenAPI Worker',
		description: 'Auto-generated OpenAPI documentation with Hono',
		source: 'cloudflare',
		category: 'api',
		framework: 'hono',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 20,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/worker-openapi',
		tags: ['api', 'openapi', 'documentation', 'swagger']
	},
	{
		slug: 'pages-react',
		name: 'React on Pages',
		description: 'React SPA deployed to Cloudflare Pages',
		source: 'cloudflare',
		category: 'static',
		framework: 'react',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 0,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-react',
		tags: ['react', 'pages', 'static', 'spa']
	},
	{
		slug: 'pages-svelte',
		name: 'Svelte on Pages',
		description: 'SvelteKit app deployed to Cloudflare Pages',
		source: 'cloudflare',
		category: 'fullstack',
		framework: 'svelte',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 20,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-svelte',
		tags: ['svelte', 'sveltekit', 'pages', 'fullstack']
	},
	{
		slug: 'pages-astro',
		name: 'Astro on Pages',
		description: 'Astro static site with content collections',
		source: 'cloudflare',
		category: 'static',
		framework: 'astro',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 0,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-astro',
		tags: ['astro', 'static', 'blog', 'content']
	},
	{
		slug: 'pages-remix',
		name: 'Remix on Pages',
		description: 'Remix fullstack app with nested routes',
		source: 'cloudflare',
		category: 'fullstack',
		framework: 'remix',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 25,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-remix',
		tags: ['remix', 'fullstack', 'ssr', 'pages']
	},
	{
		slug: 'pages-solid',
		name: 'Solid on Pages',
		description: 'SolidJS SPA with fine-grained reactivity',
		source: 'cloudflare',
		category: 'static',
		framework: 'solid',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 5,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-solid',
		tags: ['solid', 'solidjs', 'reactive', 'pages']
	},
	{
		slug: 'pages-qwik',
		name: 'Qwik on Pages',
		description: 'Qwik resumable framework for instant loading',
		source: 'cloudflare',
		category: 'fullstack',
		framework: 'qwik',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 20,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-qwik',
		tags: ['qwik', 'resumable', 'performance', 'pages']
	},
	{
		slug: 'pages-vue',
		name: 'Vue on Pages',
		description: 'Vue 3 SPA with Composition API',
		source: 'cloudflare',
		category: 'static',
		framework: 'vue',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 5,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-vue',
		tags: ['vue', 'vue3', 'composition-api', 'pages']
	},
	{
		slug: 'pages-angular',
		name: 'Angular on Pages',
		description: 'Angular SPA with standalone components',
		source: 'cloudflare',
		category: 'static',
		framework: 'angular',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 5,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-angular',
		tags: ['angular', 'spa', 'typescript', 'pages']
	},
	{
		slug: 'pages-static',
		name: 'Static HTML/CSS/JS',
		description: 'Plain HTML/CSS/JS hosted on Pages',
		source: 'cloudflare',
		category: 'static',
		framework: 'none',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 0,
		repoUrl: 'https://github.com/cloudflare/templates/tree/main/pages-static',
		tags: ['static', 'html', 'vanilla-js', 'pages']
	}
];

// BIBLE Patterns (5 patterns from C:\dev\.cloudflare\patterns\)
const BIBLE_PATTERNS: TemplateEntry[] = [
	{
		slug: 'bible-durable-objects',
		name: 'BIBLE: Durable Objects Pattern',
		description:
			'Agent-based stateful objects with hibernation, WebSocket support, and task queues',
		source: 'bible',
		category: 'realtime',
		framework: 'hono',
		bindings: ['durable_objects'],
		complexity: 4,
		estimatedCostLow: 20,
		estimatedCostMid: 60,
		estimatedCostHigh: 200,
		docsUrl: 'file://C:/dev/.cloudflare/patterns/DURABLE_OBJECTS.md',
		costNotes: 'Paid Workers plan required, cost scales with active DO instances',
		tags: ['agents', 'stateful', 'websocket', 'hibernation', 'bible']
	},
	{
		slug: 'bible-workflows',
		name: 'BIBLE: Durable Workflows',
		description: 'Long-running orchestration with Workflows, saga patterns, and approval flows',
		source: 'bible',
		category: 'workflow',
		framework: 'hono',
		bindings: ['workflows'],
		complexity: 3,
		estimatedCostLow: 10,
		estimatedCostMid: 40,
		estimatedCostHigh: 150,
		docsUrl: 'file://C:/dev/.cloudflare/patterns/WORKFLOWS.md',
		costNotes: 'Paid Workers plan required, Beta',
		tags: ['workflows', 'orchestration', 'durable-execution', 'saga', 'bible']
	},
	{
		slug: 'bible-ai-vectors',
		name: 'BIBLE: AI & Vectors Pattern',
		description: 'RAG pipeline with Workers AI, Vectorize, and embeddings',
		source: 'bible',
		category: 'ai',
		framework: 'hono',
		bindings: ['ai', 'vectorize', 'd1_databases'],
		complexity: 4,
		estimatedCostLow: 15,
		estimatedCostMid: 60,
		estimatedCostHigh: 250,
		docsUrl: 'file://C:/dev/.cloudflare/patterns/AI_AND_VECTORS.md',
		costNotes: 'Cost depends on AI model choice and embedding volume',
		tags: ['ai', 'rag', 'embeddings', 'vectorize', 'llm', 'bible']
	},
	{
		slug: 'bible-mcp-server',
		name: 'BIBLE: MCP Server Pattern',
		description: 'Remote MCP server with OAuth, elicitation, and streamable HTTP',
		source: 'bible',
		category: 'api',
		framework: 'hono',
		bindings: ['durable_objects', 'd1_databases'],
		complexity: 4,
		estimatedCostLow: 10,
		estimatedCostMid: 40,
		estimatedCostHigh: 150,
		docsUrl: 'file://C:/dev/.cloudflare/patterns/MCP_SERVER.md',
		costNotes: 'Requires authentication setup (OAuth or API keys)',
		tags: ['mcp', 'protocol', 'oauth', 'api', 'bible']
	},
	{
		slug: 'bible-queues-dlq',
		name: 'BIBLE: Queues & DLQ Pattern',
		description: 'Message queue producer/consumer with Dead Letter Queue handling',
		source: 'bible',
		category: 'async',
		framework: 'hono',
		bindings: ['queues', 'd1_databases'],
		complexity: 3,
		estimatedCostLow: 5,
		estimatedCostMid: 25,
		estimatedCostHigh: 100,
		docsUrl: 'file://C:/dev/.cloudflare/patterns/QUEUES_AND_DLQ.md',
		tags: ['queues', 'async', 'dlq', 'background-jobs', 'bible']
	}
];

// Community Templates (5+ exemplars)
const COMMUNITY_TEMPLATES: TemplateEntry[] = [
	{
		slug: 'community-astro-blog',
		name: 'Astro Blog Starter',
		description: 'Static blog with Astro, Markdown, and RSS feed',
		source: 'community',
		category: 'static',
		framework: 'astro',
		bindings: [],
		complexity: 1,
		estimatedCostLow: 0,
		estimatedCostMid: 0,
		estimatedCostHigh: 0,
		tags: ['blog', 'static', 'astro', 'markdown', 'content']
	},
	{
		slug: 'community-nextjs',
		name: 'Next.js on Workers',
		description: 'Next.js App Router with edge runtime',
		source: 'community',
		category: 'fullstack',
		framework: 'nextjs',
		bindings: [],
		complexity: 3,
		estimatedCostLow: 5,
		estimatedCostMid: 20,
		estimatedCostHigh: 80,
		costNotes: 'Requires custom Workers adapter',
		tags: ['nextjs', 'react', 'ssr', 'app-router']
	},
	{
		slug: 'community-remix-cf',
		name: 'Remix Cloudflare Template',
		description: 'Remix with Cloudflare adapter and D1 integration',
		source: 'community',
		category: 'fullstack',
		framework: 'remix',
		bindings: ['d1_databases'],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 10,
		estimatedCostHigh: 40,
		tags: ['remix', 'fullstack', 'd1', 'ssr']
	},
	{
		slug: 'community-sveltekit',
		name: 'SvelteKit on Workers',
		description: 'SvelteKit with Cloudflare adapter',
		source: 'community',
		category: 'fullstack',
		framework: 'svelte',
		bindings: [],
		complexity: 2,
		estimatedCostLow: 0,
		estimatedCostMid: 5,
		estimatedCostHigh: 25,
		tags: ['sveltekit', 'svelte', 'fullstack', 'ssr']
	},
	{
		slug: 'community-trpc-api',
		name: 'tRPC API on Workers',
		description: 'Type-safe tRPC API with end-to-end TypeScript',
		source: 'community',
		category: 'api',
		framework: 'hono',
		bindings: ['d1_databases'],
		complexity: 3,
		estimatedCostLow: 0,
		estimatedCostMid: 10,
		estimatedCostHigh: 40,
		tags: ['trpc', 'api', 'typescript', 'type-safe']
	}
];

// Generate SQL
const allTemplates = [...CLOUDFLARE_TEMPLATES, ...BIBLE_PATTERNS, ...COMMUNITY_TEMPLATES];

const now = new Date().toISOString();

console.log('-- Seed Template Registry');
console.log('-- Generated:', now);
console.log(`-- Total templates: ${allTemplates.length}`);
console.log('');

for (const t of allTemplates) {
	const id = crypto.randomUUID();
	const bindings = JSON.stringify(t.bindings).replace(/'/g, "''");
	const tags = JSON.stringify(t.tags).replace(/'/g, "''");

	console.log(`INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '${id}',
  '${t.slug}',
  '${t.name.replace(/'/g, "''")}',
  '${t.description.replace(/'/g, "''")}',
  '${t.source}',
  '${t.category}',
  '${t.framework}',
  '${bindings}',
  ${t.complexity},
  ${t.estimatedCostLow},
  ${t.estimatedCostMid},
  ${t.estimatedCostHigh},
  ${t.repoUrl ? `'${t.repoUrl}'` : 'NULL'},
  ${t.docsUrl ? `'${t.docsUrl}'` : 'NULL'},
  ${t.costNotes ? `'${t.costNotes.replace(/'/g, "''")}'` : 'NULL'},
  0,
  '${tags}',
  '${now}',
  '${now}'
);
`);
}

console.log(`-- Seeded ${allTemplates.length} templates successfully`);
