/**
 * Seed CF Capabilities — Project Factory v3.0
 *
 * Populates the cf_capabilities table with 16 primary Cloudflare products,
 * including free tier quotas and pricing information.
 *
 * Usage:
 *   npx tsx scripts/seed-capabilities.ts
 *
 * Outputs SQL to stdout for piping to wrangler:
 *   npx tsx scripts/seed-capabilities.ts | npx wrangler d1 execute planning-primary --remote --command=-
 */

/* global crypto */
/* eslint-disable no-console */

interface CapabilityEntry {
	slug: string;
	name: string;
	description: string;
	bindingType: string;
	hasFreeQuota: boolean;
	freeQuota?: string;
	paidPricing?: string;
	bestFor: string[];
	limitations?: string[];
}

const CF_CAPABILITIES: CapabilityEntry[] = [
	{
		slug: 'workers',
		name: 'Workers',
		description: 'Serverless compute on 300+ edge locations worldwide',
		bindingType: 'main',
		hasFreeQuota: true,
		freeQuota: '100K requests/day',
		paidPricing: '$0.50 per million requests',
		bestFor: ['API endpoints', 'Serverless functions', 'Edge compute', 'Request routing']
	},
	{
		slug: 'd1',
		name: 'D1 Database',
		description: 'Serverless SQLite at the edge with automatic replication',
		bindingType: 'd1_databases',
		hasFreeQuota: true,
		freeQuota: '5M reads/day, 100K writes/day, 5GB storage',
		paidPricing: '$0.75/M reads, $4.50/M writes',
		bestFor: ['Structured data', 'Relational queries', 'User data', 'Session storage'],
		limitations: ['SQLite only', 'No Postgres', '10 databases per account']
	},
	{
		slug: 'r2',
		name: 'R2 Storage',
		description: 'S3-compatible object storage with zero egress fees',
		bindingType: 'r2_buckets',
		hasFreeQuota: true,
		freeQuota: '10GB storage, 10M reads/mo, 1M writes/mo',
		paidPricing: '$0.015/GB storage, $4.50/M writes, $0 egress',
		bestFor: ['File uploads', 'Media storage', 'CDN origin', 'Backups']
	},
	{
		slug: 'kv',
		name: 'KV Store',
		description: 'Global low-latency key-value store with eventual consistency',
		bindingType: 'kv_namespaces',
		hasFreeQuota: true,
		freeQuota: '100K reads/day, 1K writes/day, 1GB storage',
		paidPricing: '$0.50/M reads, $5/M writes',
		bestFor: ['Caching', 'Session storage', 'Feature flags', 'Configuration'],
		limitations: ['1 MB value limit', 'Eventual consistency', 'No complex queries']
	},
	{
		slug: 'durable-objects',
		name: 'Durable Objects',
		description: 'Stateful serverless objects with strong consistency and hibernation',
		bindingType: 'durable_objects',
		hasFreeQuota: false,
		paidPricing: '$0.15/M requests + $0.20/GB-hour storage',
		bestFor: ['Real-time collaboration', 'WebSocket state', 'Agents', 'Coordination'],
		limitations: ['Paid Workers plan required', 'Regional constraints', 'Cold start latency']
	},
	{
		slug: 'vectorize',
		name: 'Vectorize',
		description: 'Vector database for embeddings and semantic search',
		bindingType: 'vectorize',
		hasFreeQuota: true,
		freeQuota: '5M queries/mo, 10M stored dimensions',
		paidPricing: '$0.04 per million queried dimensions',
		bestFor: ['Semantic search', 'RAG', 'Similarity matching', 'Recommendation engines']
	},
	{
		slug: 'queues',
		name: 'Queues',
		description: 'Message queue for async processing and background jobs',
		bindingType: 'queues',
		hasFreeQuota: true,
		freeQuota: '1M operations/mo',
		paidPricing: '$0.40 per million operations',
		bestFor: ['Background jobs', 'Event processing', 'Webhooks', 'Async workflows']
	},
	{
		slug: 'workflows',
		name: 'Workflows',
		description: 'Durable execution for long-running multi-step processes',
		bindingType: 'workflows',
		hasFreeQuota: false,
		paidPricing: '$0.40 per million step transitions',
		bestFor: ['Multi-step processes', 'Saga patterns', 'Approval flows', 'Orchestration'],
		limitations: ['Beta', 'Paid Workers plan required']
	},
	{
		slug: 'workers-ai',
		name: 'Workers AI',
		description: 'Run LLMs and ML models at the edge with GPU acceleration',
		bindingType: 'ai',
		hasFreeQuota: true,
		freeQuota: '10K neurons/day',
		paidPricing: 'Pay per neuron (varies by model)',
		bestFor: ['LLM inference', 'Embeddings', 'Image classification', 'Text generation']
	},
	{
		slug: 'ai-gateway',
		name: 'AI Gateway',
		description: 'Cache and log LLM API requests with rate limiting',
		bindingType: 'ai_gateway',
		hasFreeQuota: true,
		freeQuota: '100K logged requests/day',
		paidPricing: 'Unlimited free',
		bestFor: ['LLM caching', 'Rate limiting', 'Cost tracking', 'Request analytics']
	},
	{
		slug: 'analytics-engine',
		name: 'Analytics Engine',
		description: 'Write and query time-series analytics data',
		bindingType: 'analytics_engine_datasets',
		hasFreeQuota: true,
		freeQuota: '25M events/mo',
		paidPricing: 'Free tier sufficient for most apps',
		bestFor: ['Product analytics', 'Usage tracking', 'Metrics', 'Custom dashboards']
	},
	{
		slug: 'turnstile',
		name: 'Turnstile',
		description: 'Privacy-friendly CAPTCHA alternative with invisible challenges',
		bindingType: 'none',
		hasFreeQuota: true,
		freeQuota: 'Unlimited',
		paidPricing: 'Free',
		bestFor: ['Bot protection', 'Form security', 'Signup validation', 'Comment spam prevention']
	},
	{
		slug: 'hyperdrive',
		name: 'Hyperdrive',
		description: 'Connection pooler for Postgres with query caching',
		bindingType: 'hyperdrive',
		hasFreeQuota: false,
		paidPricing: 'Included with paid Workers plan',
		bestFor: ['Postgres connection pooling', 'Legacy database access', 'Query caching'],
		limitations: ['Paid Workers plan required', 'Postgres only']
	},
	{
		slug: 'browser-rendering',
		name: 'Browser Rendering',
		description: 'Headless Chrome at the edge for web automation',
		bindingType: 'browser',
		hasFreeQuota: false,
		paidPricing: '$0.20 per 10,000 CPU seconds',
		bestFor: ['Web scraping', 'PDF generation', 'Screenshots', 'E2E testing'],
		limitations: ['Beta', 'CPU intensive', 'Cold start overhead']
	},
	{
		slug: 'containers',
		name: 'Container Runtimes',
		description: 'Run arbitrary code in secure containers',
		bindingType: 'containers',
		hasFreeQuota: false,
		paidPricing: 'TBD (Beta)',
		bestFor: ['Heavy compute', 'Custom runtimes', 'Legacy code', 'Non-JS workloads'],
		limitations: ['Beta', 'Waitlist only', 'Higher cold start']
	},
	{
		slug: 'images',
		name: 'Cloudflare Images',
		description: 'Image optimization and transformations on-demand',
		bindingType: 'images',
		hasFreeQuota: false,
		paidPricing: '$5/mo for 100K images stored + $1/20K variants',
		bestFor: ['Image CDN', 'Resizing', 'Format conversion', 'Optimization']
	}
];

// Generate SQL
const now = new Date().toISOString();

console.log('-- Seed CF Capabilities');
console.log('-- Generated:', now);
console.log(`-- Total capabilities: ${CF_CAPABILITIES.length}`);
console.log('');

for (const c of CF_CAPABILITIES) {
	const id = crypto.randomUUID();
	const bestFor = JSON.stringify(c.bestFor).replace(/'/g, "''");
	const limitations = JSON.stringify(c.limitations || []).replace(/'/g, "''");

	console.log(`INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '${id}',
  '${c.slug}',
  '${c.name.replace(/'/g, "''")}',
  '${c.description.replace(/'/g, "''")}',
  '${c.bindingType}',
  ${c.hasFreeQuota ? 1 : 0},
  ${c.freeQuota ? `'${c.freeQuota.replace(/'/g, "''")}'` : 'NULL'},
  ${c.paidPricing ? `'${c.paidPricing.replace(/'/g, "''")}'` : 'NULL'},
  '${bestFor}',
  '${limitations}',
  '${now}',
  '${now}'
);
`);
}

console.log(`-- Seeded ${CF_CAPABILITIES.length} capabilities successfully`);
