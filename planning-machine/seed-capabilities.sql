-- Seed CF Capabilities
-- Generated: 2026-02-26T15:59:49.303Z
-- Total capabilities: 16

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'f5671f70-92a7-4d7d-9040-840f9b046a9e',
  'workers',
  'Workers',
  'Serverless compute on 300+ edge locations worldwide',
  'main',
  1,
  '100K requests/day',
  '$0.50 per million requests',
  '["API endpoints","Serverless functions","Edge compute","Request routing"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'b7963cb4-13a6-45bb-911e-5cb31ca852ba',
  'd1',
  'D1 Database',
  'Serverless SQLite at the edge with automatic replication',
  'd1_databases',
  1,
  '5M reads/day, 100K writes/day, 5GB storage',
  '$0.75/M reads, $4.50/M writes',
  '["Structured data","Relational queries","User data","Session storage"]',
  '["SQLite only","No Postgres","10 databases per account"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '547176d1-64de-495d-a93f-6540d8f0b023',
  'r2',
  'R2 Storage',
  'S3-compatible object storage with zero egress fees',
  'r2_buckets',
  1,
  '10GB storage, 10M reads/mo, 1M writes/mo',
  '$0.015/GB storage, $4.50/M writes, $0 egress',
  '["File uploads","Media storage","CDN origin","Backups"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '59d4f320-0501-4a74-9054-7722e9016175',
  'kv',
  'KV Store',
  'Global low-latency key-value store with eventual consistency',
  'kv_namespaces',
  1,
  '100K reads/day, 1K writes/day, 1GB storage',
  '$0.50/M reads, $5/M writes',
  '["Caching","Session storage","Feature flags","Configuration"]',
  '["1 MB value limit","Eventual consistency","No complex queries"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '8ee7d17a-3c0d-4b5b-bbe0-1238b53c5f2c',
  'durable-objects',
  'Durable Objects',
  'Stateful serverless objects with strong consistency and hibernation',
  'durable_objects',
  0,
  NULL,
  '$0.15/M requests + $0.20/GB-hour storage',
  '["Real-time collaboration","WebSocket state","Agents","Coordination"]',
  '["Paid Workers plan required","Regional constraints","Cold start latency"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'e5dbe0f3-5769-4038-97de-230b4e94d63a',
  'vectorize',
  'Vectorize',
  'Vector database for embeddings and semantic search',
  'vectorize',
  1,
  '5M queries/mo, 10M stored dimensions',
  '$0.04 per million queried dimensions',
  '["Semantic search","RAG","Similarity matching","Recommendation engines"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '2ab62eda-bee5-4cc9-88fa-a070f700f38b',
  'queues',
  'Queues',
  'Message queue for async processing and background jobs',
  'queues',
  1,
  '1M operations/mo',
  '$0.40 per million operations',
  '["Background jobs","Event processing","Webhooks","Async workflows"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '20ab0fb4-901f-4be9-ba56-93f6102552cc',
  'workflows',
  'Workflows',
  'Durable execution for long-running multi-step processes',
  'workflows',
  0,
  NULL,
  '$0.40 per million step transitions',
  '["Multi-step processes","Saga patterns","Approval flows","Orchestration"]',
  '["Beta","Paid Workers plan required"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '73637bbb-a8c5-40c1-a600-60ec28bde565',
  'workers-ai',
  'Workers AI',
  'Run LLMs and ML models at the edge with GPU acceleration',
  'ai',
  1,
  '10K neurons/day',
  'Pay per neuron (varies by model)',
  '["LLM inference","Embeddings","Image classification","Text generation"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'c6f5aa9c-51a3-4f35-b140-cc2f11d78e4b',
  'ai-gateway',
  'AI Gateway',
  'Cache and log LLM API requests with rate limiting',
  'ai_gateway',
  1,
  '100K logged requests/day',
  'Unlimited free',
  '["LLM caching","Rate limiting","Cost tracking","Request analytics"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '460fc02f-b2c1-462a-ac4c-e32b121343fb',
  'analytics-engine',
  'Analytics Engine',
  'Write and query time-series analytics data',
  'analytics_engine_datasets',
  1,
  '25M events/mo',
  'Free tier sufficient for most apps',
  '["Product analytics","Usage tracking","Metrics","Custom dashboards"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '0c597058-e831-45b6-9728-16ee77645e3f',
  'turnstile',
  'Turnstile',
  'Privacy-friendly CAPTCHA alternative with invisible challenges',
  'none',
  1,
  'Unlimited',
  'Free',
  '["Bot protection","Form security","Signup validation","Comment spam prevention"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '234904d6-8693-4d7f-8c24-6bd66f1d9d68',
  'hyperdrive',
  'Hyperdrive',
  'Connection pooler for Postgres with query caching',
  'hyperdrive',
  0,
  NULL,
  'Included with paid Workers plan',
  '["Postgres connection pooling","Legacy database access","Query caching"]',
  '["Paid Workers plan required","Postgres only"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  '818c24b3-3aa7-4d6a-a20a-189048369d08',
  'browser-rendering',
  'Browser Rendering',
  'Headless Chrome at the edge for web automation',
  'browser',
  0,
  NULL,
  '$0.20 per 10,000 CPU seconds',
  '["Web scraping","PDF generation","Screenshots","E2E testing"]',
  '["Beta","CPU intensive","Cold start overhead"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'd8092a4d-34a2-44b2-8a0a-9e67379309f3',
  'containers',
  'Container Runtimes',
  'Run arbitrary code in secure containers',
  'containers',
  0,
  NULL,
  'TBD (Beta)',
  '["Heavy compute","Custom runtimes","Legacy code","Non-JS workloads"]',
  '["Beta","Waitlist only","Higher cold start"]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

INSERT OR REPLACE INTO cf_capabilities (
  id, slug, name, description, binding_type,
  has_free_quota, free_quota, paid_pricing,
  best_for, limitations, created_at, updated_at
) VALUES (
  'ee7d1183-93b9-4f63-aa17-dabda1f458c1',
  'images',
  'Cloudflare Images',
  'Image optimization and transformations on-demand',
  'images',
  0,
  NULL,
  '$5/mo for 100K images stored + $1/20K variants',
  '["Image CDN","Resizing","Format conversion","Optimization"]',
  '[]',
  '2026-02-26T15:59:49.303Z',
  '2026-02-26T15:59:49.303Z'
);

-- Seeded 16 capabilities successfully
