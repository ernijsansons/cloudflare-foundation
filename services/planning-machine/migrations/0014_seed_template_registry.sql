-- Migration: 0014_seed_template_registry
-- Seed data for template_registry and cf_capabilities tables
-- This provides the initial dataset for Project Factory

-- =============================================================================
-- TEMPLATE REGISTRY - Official Cloudflare Templates
-- =============================================================================

INSERT OR IGNORE INTO template_registry (id, slug, name, description, source, category, framework, bindings, complexity, estimated_cost_low, estimated_cost_mid, estimated_cost_high, repo_url, docs_url, deprecated, tags) VALUES
-- Starter Templates
('tpl_001', 'hello-world', 'Hello World', 'Basic Worker starter template with minimal configuration', 'cloudflare', 'worker', 'vanilla', '[]', 1, 0, 0, 0, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker', 'https://developers.cloudflare.com/workers/get-started/guide/', 0, '["starter","minimal","beginner"]'),
('tpl_002', 'hello-world-ts', 'Hello World TypeScript', 'TypeScript Worker starter with type safety', 'cloudflare', 'worker', 'typescript', '[]', 1, 0, 0, 0, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-typescript', 'https://developers.cloudflare.com/workers/get-started/guide/', 0, '["starter","typescript","beginner"]'),

-- API Templates
('tpl_003', 'hono-api', 'Hono REST API', 'REST API with Hono framework and routing', 'cloudflare', 'api', 'hono', '[]', 2, 0, 5, 20, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-hono', 'https://hono.dev/docs/getting-started/cloudflare-workers', 0, '["api","hono","rest","routing"]'),
('tpl_004', 'hono-d1-api', 'Hono API with D1', 'REST API with Hono and D1 database', 'cloudflare', 'api', 'hono', '["d1_databases"]', 2, 0, 5, 25, NULL, 'https://developers.cloudflare.com/d1/', 0, '["api","hono","d1","database","crud"]'),
('tpl_005', 'openapi', 'OpenAPI REST API', 'Type-safe REST API with OpenAPI spec generation', 'cloudflare', 'api', 'chanfana', '[]', 3, 0, 5, 25, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-openapi', 'https://github.com/cloudflare/chanfana', 0, '["api","openapi","swagger","typed"]'),

-- Database Templates
('tpl_006', 'd1-starter', 'D1 Database Starter', 'D1 SQLite database with migrations', 'cloudflare', 'database', 'vanilla', '["d1_databases"]', 2, 0, 5, 30, NULL, 'https://developers.cloudflare.com/d1/', 0, '["d1","sqlite","database","migrations"]'),
('tpl_007', 'd1-drizzle', 'D1 with Drizzle ORM', 'D1 database with Drizzle ORM type-safe queries', 'cloudflare', 'database', 'drizzle', '["d1_databases"]', 3, 0, 8, 40, NULL, 'https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1', 0, '["d1","drizzle","orm","typed","migrations"]'),
('tpl_008', 'kv-starter', 'KV Storage Starter', 'Workers KV key-value storage basics', 'cloudflare', 'storage', 'vanilla', '["kv_namespaces"]', 1, 0, 0, 10, NULL, 'https://developers.cloudflare.com/kv/', 0, '["kv","storage","cache","key-value"]'),
('tpl_009', 'r2-file-uploads', 'R2 File Uploads', 'R2 object storage with presigned URLs', 'cloudflare', 'storage', 'hono', '["r2_buckets"]', 2, 0, 5, 30, NULL, 'https://developers.cloudflare.com/r2/', 0, '["r2","storage","files","uploads","presigned"]'),

-- Durable Objects Templates
('tpl_010', 'durable-objects-counter', 'Durable Objects Counter', 'Basic Durable Objects state with counter example', 'cloudflare', 'durable-objects', 'vanilla', '["durable_objects"]', 3, 5, 15, 50, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-durable-objects', 'https://developers.cloudflare.com/durable-objects/', 0, '["durable-objects","state","counter"]'),
('tpl_011', 'websocket-chat', 'WebSocket Chat', 'Real-time chat with WebSocket hibernation', 'cloudflare', 'durable-objects', 'vanilla', '["durable_objects"]', 4, 5, 20, 80, NULL, 'https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/', 0, '["durable-objects","websocket","chat","real-time","hibernation"]'),
('tpl_012', 'rate-limiter-do', 'Rate Limiter', 'Distributed rate limiting with Durable Objects', 'cloudflare', 'durable-objects', 'vanilla', '["durable_objects"]', 3, 5, 15, 40, NULL, 'https://developers.cloudflare.com/durable-objects/', 0, '["durable-objects","rate-limiting","security"]'),

-- AI Templates
('tpl_013', 'workers-ai-basic', 'Workers AI Basic', 'Basic Workers AI inference with text generation', 'cloudflare', 'ai', 'vanilla', '["ai"]', 2, 0, 10, 50, 'https://github.com/cloudflare/workers-sdk/tree/main/templates/worker-ai', 'https://developers.cloudflare.com/workers-ai/', 0, '["ai","llm","inference","text-generation"]'),
('tpl_014', 'ai-rag', 'RAG Application', 'Retrieval-augmented generation with Vectorize', 'cloudflare', 'ai', 'hono', '["ai","vectorize","d1_databases"]', 4, 10, 40, 120, NULL, 'https://developers.cloudflare.com/vectorize/', 0, '["ai","rag","vectorize","embeddings","semantic-search"]'),
('tpl_015', 'ai-gateway-proxy', 'AI Gateway Proxy', 'AI Gateway with caching and rate limiting', 'cloudflare', 'ai', 'hono', '["ai"]', 3, 0, 15, 60, NULL, 'https://developers.cloudflare.com/ai-gateway/', 0, '["ai","gateway","proxy","caching","rate-limiting"]'),

-- Agent Templates
('tpl_016', 'agents-starter', 'Agents SDK Starter', 'Basic agent with Durable Objects and tools', 'cloudflare', 'agent', 'agents-sdk', '["durable_objects","ai"]', 4, 10, 35, 100, 'https://github.com/cloudflare/agents', 'https://developers.cloudflare.com/agents/', 0, '["agents","durable-objects","tools","ai"]'),
('tpl_017', 'mcp-server', 'MCP Server', 'Model Context Protocol server for AI integration', 'cloudflare', 'agent', 'agents-sdk', '["durable_objects"]', 4, 10, 30, 90, NULL, 'https://developers.cloudflare.com/agents/model-context-protocol/', 0, '["agents","mcp","ai-integration","tools"]'),

-- Workflow Templates
('tpl_018', 'workflows-starter', 'Workflows Starter', 'Durable workflow with steps and retries', 'cloudflare', 'workflow', 'vanilla', '["workflows"]', 3, 5, 20, 70, NULL, 'https://developers.cloudflare.com/workflows/', 0, '["workflows","durable-execution","steps","retries"]'),
('tpl_019', 'email-workflow', 'Email Workflow', 'Email processing workflow with queues', 'cloudflare', 'workflow', 'vanilla', '["workflows","queues"]', 3, 5, 25, 80, NULL, 'https://developers.cloudflare.com/workflows/', 0, '["workflows","email","queues","processing"]'),

-- Queue Templates
('tpl_020', 'queues-producer-consumer', 'Queues Producer/Consumer', 'Queue-based async processing pattern', 'cloudflare', 'queue', 'vanilla', '["queues"]', 2, 0, 10, 40, NULL, 'https://developers.cloudflare.com/queues/', 0, '["queues","async","producer","consumer"]'),
('tpl_021', 'queues-dlq', 'Queues with DLQ', 'Queue with dead letter queue for failures', 'cloudflare', 'queue', 'vanilla', '["queues"]', 3, 5, 15, 50, NULL, 'https://developers.cloudflare.com/queues/', 0, '["queues","dlq","error-handling","reliability"]'),

-- Frontend Templates
('tpl_022', 'pages-sveltekit', 'SvelteKit on Pages', 'SvelteKit full-stack on Cloudflare Pages', 'cloudflare', 'frontend', 'sveltekit', '[]', 2, 0, 0, 15, NULL, 'https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site/', 0, '["pages","sveltekit","frontend","ssr"]'),
('tpl_023', 'pages-nextjs', 'Next.js on Pages', 'Next.js with edge runtime on Pages', 'cloudflare', 'frontend', 'nextjs', '[]', 3, 0, 5, 25, NULL, 'https://developers.cloudflare.com/pages/framework-guides/nextjs/', 0, '["pages","nextjs","frontend","ssr","react"]'),
('tpl_024', 'pages-remix', 'Remix on Pages', 'Remix full-stack on Cloudflare Pages', 'cloudflare', 'frontend', 'remix', '[]', 3, 0, 5, 25, NULL, 'https://developers.cloudflare.com/pages/framework-guides/deploy-a-remix-site/', 0, '["pages","remix","frontend","ssr","react"]'),

-- =============================================================================
-- TEMPLATE REGISTRY - BIBLE Agent Patterns (from C:\dev\.cloudflare\templates\)
-- =============================================================================

('tpl_bible_01', 'super-agent', 'Super Agent', 'God-mode agent with shell, browser, swarm, queues - maximum capability', 'bible', 'agent', 'agents-sdk', '["durable_objects","d1_databases","r2_buckets","kv_namespaces","queues","ai","vectorize","browser","containers"]', 5, 65, 150, 300, NULL, NULL, 0, '["agent","full-featured","shell","browser","swarm","enterprise"]'),
('tpl_bible_02', 'lightweight-agent', 'Lightweight Agent', 'API-only agent for webhooks, fetch, database operations', 'bible', 'agent', 'agents-sdk', '["durable_objects","d1_databases","kv_namespaces","ai"]', 2, 5, 15, 40, NULL, NULL, 0, '["agent","lightweight","api","webhooks","low-cost"]'),
('tpl_bible_03', 'full-power-agent', 'Full Power Agent', 'Shell commands, Python execution, browser automation', 'bible', 'agent', 'agents-sdk', '["durable_objects","d1_databases","r2_buckets","ai","browser","containers"]', 4, 50, 120, 250, NULL, NULL, 0, '["agent","shell","python","browser","automation"]'),
('tpl_bible_04', 'agent-swarm', 'Agent Swarm', 'Multi-agent coordination with specialized workers', 'bible', 'agent', 'agents-sdk', '["durable_objects","d1_databases","kv_namespaces","queues","ai"]', 4, 30, 80, 180, NULL, NULL, 0, '["agent","swarm","multi-agent","coordination","workers"]'),
('tpl_bible_05', 'multi-agent-orchestration', 'Multi-Agent Orchestration', 'Enterprise task queues with auto-scaling and load balancing', 'bible', 'agent', 'agents-sdk', '["durable_objects","d1_databases","queues","workflows","ai"]', 5, 50, 130, 280, NULL, NULL, 0, '["agent","orchestration","task-queues","enterprise","scaling"]');


-- =============================================================================
-- CF CAPABILITIES - All Cloudflare Products with Pricing
-- =============================================================================

INSERT OR IGNORE INTO cf_capabilities (id, slug, name, description, binding_type, has_free_quota, free_quota, paid_pricing, best_for, limitations) VALUES
-- Compute
('cap_001', 'workers', 'Cloudflare Workers', 'Serverless JavaScript/TypeScript execution at the edge with global deployment', 'main', 1, '100K requests/day, 10ms CPU', '$0.30/M requests, $0.02/M CPU ms', '["compute","api","edge-functions","serverless"]', '["10ms CPU limit on free tier","128MB memory"]'),
('cap_002', 'workers-paid', 'Workers Paid', 'Enhanced Workers with higher limits and additional features', 'main', 0, NULL, '$5/mo base + $0.30/M requests', '["high-traffic","cpu-intensive","production"]', '["50ms CPU limit standard","30s CPU limit unbound"]'),

-- Storage
('cap_003', 'd1', 'D1 Database', 'SQLite at the edge with automatic replication and zero-latency reads', 'd1_databases', 1, '5M reads/day, 100K writes/day, 5GB storage', '$0.75/M reads, $1.00/M writes', '["structured-data","sql","relational","crud"]', '["500MB max database size on free","no stored procedures"]'),
('cap_004', 'kv', 'Workers KV', 'Global low-latency key-value storage with eventual consistency', 'kv_namespaces', 1, '100K reads/day, 1K writes/day, 1GB storage', '$0.50/M reads, $5.00/M writes', '["caching","config","session","key-value"]', '["eventual consistency","25MB max value size"]'),
('cap_005', 'r2', 'R2 Object Storage', 'S3-compatible object storage with zero egress fees', 'r2_buckets', 1, '10GB storage, 10M Class A, 1M Class B ops/mo', '$0.015/GB storage, $4.50/M Class A', '["files","media","backups","large-objects"]', '["5TB max object size"]'),

-- State
('cap_006', 'durable-objects', 'Durable Objects', 'Strongly consistent, stateful serverless compute with coordination', 'durable_objects', 0, NULL, '$0.15/M requests, $12.50/M GB-seconds', '["real-time","websockets","coordination","state"]', '["requires Workers paid plan","128MB memory per DO"]'),

-- AI
('cap_007', 'workers-ai', 'Workers AI', 'Run AI models at the edge with automatic scaling', 'ai', 1, '10K neurons/day', '$0.011/1K neurons (varies by model)', '["inference","llm","text-generation","embeddings"]', '["model availability varies","rate limits apply"]'),
('cap_008', 'vectorize', 'Vectorize', 'Vector database for embeddings with semantic search', 'vectorize', 1, '5M queries/mo, 5M vectors, 5 indexes', '$0.01/M vectors stored, $0.01/M queries', '["rag","semantic-search","embeddings","similarity"]', '["1536 max dimensions","10MB per namespace"]'),
('cap_009', 'ai-gateway', 'AI Gateway', 'Proxy for AI APIs with caching, rate limiting, and analytics', 'ai', 1, '100K logs/day', '$0.00 (included with Workers paid)', '["ai-proxy","caching","logging","rate-limiting"]', '["logs retained 7 days free tier"]'),

-- Async Processing
('cap_010', 'queues', 'Cloudflare Queues', 'Serverless message queue for async workloads', 'queues', 1, '1M messages/mo', '$0.40/M messages', '["async","background-jobs","decoupling","reliability"]', '["256KB max message size","default 4hr retention"]'),
('cap_011', 'workflows', 'Cloudflare Workflows', 'Durable execution engine for long-running tasks', 'workflows', 0, NULL, 'Included with Workers paid', '["orchestration","long-running","retries","state-machines"]', '["requires Workers paid plan","15min step timeout"]'),

-- Browser & Containers
('cap_012', 'browser-rendering', 'Browser Rendering', 'Headless Chrome browser for screenshots and automation', 'browser', 0, NULL, '$0.02/browser session', '["screenshots","pdf-generation","scraping","automation"]', '["2min session limit","requires Workers paid"]'),
('cap_013', 'containers', 'Worker Containers', 'Run containers at the edge for heavy compute', 'containers', 0, NULL, '$0.0000025/ms', '["heavy-compute","docker","python","ml-inference"]', '["BETA","cold start latency"]'),

-- Connectivity
('cap_014', 'hyperdrive', 'Hyperdrive', 'Connection pooling and caching for PostgreSQL databases', 'hyperdrive', 0, NULL, 'Included with Workers paid', '["postgres","connection-pooling","latency","existing-db"]', '["PostgreSQL only","requires Workers paid"]'),

-- Security
('cap_015', 'turnstile', 'Turnstile', 'Privacy-preserving CAPTCHA alternative for bot protection', 'N/A', 1, 'Unlimited', '$0.00 (free)', '["bot-protection","captcha","security","forms"]', '["client-side only"]'),

-- Analytics
('cap_016', 'analytics-engine', 'Analytics Engine', 'Write and query time-series analytics data at scale', 'analytics_engine_datasets', 1, '25M data points/mo', '$0.25/M data points', '["analytics","metrics","time-series","dashboards"]', '["90 day retention","SQL query interface"]'),

-- Images
('cap_017', 'images', 'Cloudflare Images', 'Image storage, optimization, and transformation', 'images', 0, NULL, '$5/100K images stored, $1/100K variants', '["image-optimization","cdn","transforms","responsive"]', '["no free tier"]'),

-- Pages
('cap_018', 'pages', 'Cloudflare Pages', 'Full-stack deployment platform for web applications', 'N/A', 1, '500 builds/mo, 100GB bandwidth', '$20/mo (Pro)', '["frontend","deployment","preview","ci-cd"]', '["1 concurrent build free tier"]');
