-- Seed Template Registry
-- Generated: 2026-02-26T15:58:55.546Z
-- Total templates: 32

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '86c07c75-c4a4-458d-8dc3-9dec5a137690',
  'worker-hono',
  'Hono API Worker',
  'Lightweight HTTP API using Hono framework with TypeScript',
  'cloudflare',
  'api',
  'hono',
  '[]',
  1,
  0,
  0,
  5,
  'https://github.com/cloudflare/templates/tree/main/worker-hono',
  NULL,
  NULL,
  0,
  '["api","hono","starter","typescript"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '0464993c-9487-455c-9349-029ed004f2a3',
  'worker-typescript',
  'TypeScript Worker',
  'Bare-bones TypeScript Worker for custom logic',
  'cloudflare',
  'api',
  'none',
  '[]',
  1,
  0,
  0,
  5,
  'https://github.com/cloudflare/templates/tree/main/worker-typescript',
  NULL,
  NULL,
  0,
  '["worker","typescript","minimal"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '8001cdac-9dac-4d7d-a02e-6a0708fa1cbb',
  'worker-router',
  'React Router SPA',
  'Single-page app with React Router v7 and Vite',
  'cloudflare',
  'fullstack',
  'react-router',
  '[]',
  2,
  0,
  5,
  20,
  'https://github.com/cloudflare/templates/tree/main/worker-react-router',
  NULL,
  NULL,
  0,
  '["react","spa","frontend","vite"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '6b027f97-6444-4041-910d-66d31a244404',
  'worker-d1-drizzle',
  'D1 Database with Drizzle ORM',
  'SQLite database with type-safe Drizzle ORM and migrations',
  'cloudflare',
  'database',
  'hono',
  '["d1_databases"]',
  2,
  0,
  5,
  25,
  'https://github.com/cloudflare/templates/tree/main/worker-d1-drizzle',
  NULL,
  NULL,
  0,
  '["database","d1","drizzle","orm","sqlite"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '99a134d1-c0f9-42f5-aae2-791f74231572',
  'worker-websocket',
  'WebSocket Server',
  'Real-time WebSocket connections with Durable Objects',
  'cloudflare',
  'realtime',
  'hono',
  '["durable_objects"]',
  3,
  5,
  25,
  100,
  'https://github.com/cloudflare/templates/tree/main/worker-websocket',
  NULL,
  'Cost depends on concurrent connections and message volume',
  0,
  '["websocket","realtime","durable-objects"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '4dfb92bd-ba2e-43dd-91a8-f3c0a73ef8f2',
  'worker-durable-objects',
  'Durable Objects Template',
  'Stateful edge compute with strong consistency',
  'cloudflare',
  'realtime',
  'hono',
  '["durable_objects"]',
  4,
  10,
  50,
  200,
  'https://github.com/cloudflare/templates/tree/main/worker-durable-objects',
  NULL,
  'Paid Workers plan required',
  0,
  '["durable-objects","stateful","edge-compute"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '5c363d9b-3f44-4613-b2be-dad6f3ac364a',
  'worker-r2',
  'R2 File Storage',
  'S3-compatible object storage with zero egress fees',
  'cloudflare',
  'storage',
  'hono',
  '["r2_buckets"]',
  2,
  0,
  5,
  30,
  'https://github.com/cloudflare/templates/tree/main/worker-r2',
  NULL,
  NULL,
  0,
  '["storage","r2","files","uploads"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'cca2cff2-5372-4e58-b4ac-d65bb14a4a64',
  'worker-kv',
  'KV Key-Value Store',
  'Global low-latency key-value cache',
  'cloudflare',
  'caching',
  'hono',
  '["kv_namespaces"]',
  1,
  0,
  5,
  20,
  'https://github.com/cloudflare/templates/tree/main/worker-kv',
  NULL,
  NULL,
  0,
  '["kv","cache","key-value"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'f0e6edd1-fc0d-4539-bc10-3a68b854242f',
  'worker-queues',
  'Cloudflare Queues',
  'Message queue for async processing and background jobs',
  'cloudflare',
  'async',
  'hono',
  '["queues"]',
  2,
  0,
  5,
  30,
  'https://github.com/cloudflare/templates/tree/main/worker-queues',
  NULL,
  NULL,
  0,
  '["queues","async","background-jobs"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '4c343775-7705-49e1-8ecd-64be7e237ef4',
  'worker-ai',
  'Workers AI Template',
  'Run LLM inference at the edge with Workers AI',
  'cloudflare',
  'ai',
  'hono',
  '["ai"]',
  3,
  5,
  30,
  150,
  'https://github.com/cloudflare/templates/tree/main/worker-ai',
  NULL,
  'Cost depends on model choice and token volume',
  0,
  '["ai","llm","machine-learning","inference"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'bf6badb3-0642-46e6-aefc-425eef62f630',
  'worker-vectorize',
  'Vectorize Template',
  'Vector database for embeddings and semantic search',
  'cloudflare',
  'ai',
  'hono',
  '["vectorize","ai"]',
  3,
  0,
  10,
  60,
  'https://github.com/cloudflare/templates/tree/main/worker-vectorize',
  NULL,
  NULL,
  0,
  '["vectorize","embeddings","semantic-search","rag"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '235b827b-3e9c-43ad-889f-3ac5fd492921',
  'worker-workflows',
  'Workflows Template',
  'Durable execution for long-running processes',
  'cloudflare',
  'workflow',
  'hono',
  '["workflows"]',
  3,
  5,
  25,
  120,
  'https://github.com/cloudflare/templates/tree/main/worker-workflows',
  NULL,
  'Paid Workers plan required, Beta',
  0,
  '["workflows","durable-execution","orchestration"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'f71d5a62-5737-417e-abf7-663a2dc6882a',
  'worker-openapi',
  'OpenAPI Worker',
  'Auto-generated OpenAPI documentation with Hono',
  'cloudflare',
  'api',
  'hono',
  '[]',
  2,
  0,
  5,
  20,
  'https://github.com/cloudflare/templates/tree/main/worker-openapi',
  NULL,
  NULL,
  0,
  '["api","openapi","documentation","swagger"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '3cb94f71-8243-4bbd-b3b6-085518d2584c',
  'pages-react',
  'React on Pages',
  'React SPA deployed to Cloudflare Pages',
  'cloudflare',
  'static',
  'react',
  '[]',
  1,
  0,
  0,
  0,
  'https://github.com/cloudflare/templates/tree/main/pages-react',
  NULL,
  NULL,
  0,
  '["react","pages","static","spa"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '1ebd109b-a676-4f6e-a81c-60477b9455ed',
  'pages-svelte',
  'Svelte on Pages',
  'SvelteKit app deployed to Cloudflare Pages',
  'cloudflare',
  'fullstack',
  'svelte',
  '[]',
  2,
  0,
  5,
  20,
  'https://github.com/cloudflare/templates/tree/main/pages-svelte',
  NULL,
  NULL,
  0,
  '["svelte","sveltekit","pages","fullstack"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'fce210b3-9db7-4eb4-9bf3-75536b7d426e',
  'pages-astro',
  'Astro on Pages',
  'Astro static site with content collections',
  'cloudflare',
  'static',
  'astro',
  '[]',
  1,
  0,
  0,
  0,
  'https://github.com/cloudflare/templates/tree/main/pages-astro',
  NULL,
  NULL,
  0,
  '["astro","static","blog","content"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '8d15ac74-6ac5-45cd-ba1b-bd5a3e50736c',
  'pages-remix',
  'Remix on Pages',
  'Remix fullstack app with nested routes',
  'cloudflare',
  'fullstack',
  'remix',
  '[]',
  2,
  0,
  5,
  25,
  'https://github.com/cloudflare/templates/tree/main/pages-remix',
  NULL,
  NULL,
  0,
  '["remix","fullstack","ssr","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'b5decd05-7d7f-47a4-ae35-449d272a3397',
  'pages-solid',
  'Solid on Pages',
  'SolidJS SPA with fine-grained reactivity',
  'cloudflare',
  'static',
  'solid',
  '[]',
  2,
  0,
  0,
  5,
  'https://github.com/cloudflare/templates/tree/main/pages-solid',
  NULL,
  NULL,
  0,
  '["solid","solidjs","reactive","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'b1daf0b3-aa13-43be-b3c2-9331bfa58ea5',
  'pages-qwik',
  'Qwik on Pages',
  'Qwik resumable framework for instant loading',
  'cloudflare',
  'fullstack',
  'qwik',
  '[]',
  2,
  0,
  5,
  20,
  'https://github.com/cloudflare/templates/tree/main/pages-qwik',
  NULL,
  NULL,
  0,
  '["qwik","resumable","performance","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'f51686a8-fef1-4d62-9e75-bf07f153e38f',
  'pages-vue',
  'Vue on Pages',
  'Vue 3 SPA with Composition API',
  'cloudflare',
  'static',
  'vue',
  '[]',
  1,
  0,
  0,
  5,
  'https://github.com/cloudflare/templates/tree/main/pages-vue',
  NULL,
  NULL,
  0,
  '["vue","vue3","composition-api","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '0513d315-27b2-4f8c-9484-37ad01ae97de',
  'pages-angular',
  'Angular on Pages',
  'Angular SPA with standalone components',
  'cloudflare',
  'static',
  'angular',
  '[]',
  2,
  0,
  0,
  5,
  'https://github.com/cloudflare/templates/tree/main/pages-angular',
  NULL,
  NULL,
  0,
  '["angular","spa","typescript","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'a33ad3d3-6af7-4b4c-91dd-05a5f699c5e9',
  'pages-static',
  'Static HTML/CSS/JS',
  'Plain HTML/CSS/JS hosted on Pages',
  'cloudflare',
  'static',
  'none',
  '[]',
  1,
  0,
  0,
  0,
  'https://github.com/cloudflare/templates/tree/main/pages-static',
  NULL,
  NULL,
  0,
  '["static","html","vanilla-js","pages"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'eb88c4ca-362b-4591-b802-a8054ba5c418',
  'bible-durable-objects',
  'BIBLE: Durable Objects Pattern',
  'Agent-based stateful objects with hibernation, WebSocket support, and task queues',
  'bible',
  'realtime',
  'hono',
  '["durable_objects"]',
  4,
  20,
  60,
  200,
  NULL,
  'file://C:/dev/.cloudflare/patterns/DURABLE_OBJECTS.md',
  'Paid Workers plan required, cost scales with active DO instances',
  0,
  '["agents","stateful","websocket","hibernation","bible"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '141e5fee-599e-4214-b4ae-5531f7f2100b',
  'bible-workflows',
  'BIBLE: Durable Workflows',
  'Long-running orchestration with Workflows, saga patterns, and approval flows',
  'bible',
  'workflow',
  'hono',
  '["workflows"]',
  3,
  10,
  40,
  150,
  NULL,
  'file://C:/dev/.cloudflare/patterns/WORKFLOWS.md',
  'Paid Workers plan required, Beta',
  0,
  '["workflows","orchestration","durable-execution","saga","bible"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'f5a51635-3921-497d-ba20-c87af58279ec',
  'bible-ai-vectors',
  'BIBLE: AI & Vectors Pattern',
  'RAG pipeline with Workers AI, Vectorize, and embeddings',
  'bible',
  'ai',
  'hono',
  '["ai","vectorize","d1_databases"]',
  4,
  15,
  60,
  250,
  NULL,
  'file://C:/dev/.cloudflare/patterns/AI_AND_VECTORS.md',
  'Cost depends on AI model choice and embedding volume',
  0,
  '["ai","rag","embeddings","vectorize","llm","bible"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '692db88c-6d6f-42ca-b830-703febbba4f6',
  'bible-mcp-server',
  'BIBLE: MCP Server Pattern',
  'Remote MCP server with OAuth, elicitation, and streamable HTTP',
  'bible',
  'api',
  'hono',
  '["durable_objects","d1_databases"]',
  4,
  10,
  40,
  150,
  NULL,
  'file://C:/dev/.cloudflare/patterns/MCP_SERVER.md',
  'Requires authentication setup (OAuth or API keys)',
  0,
  '["mcp","protocol","oauth","api","bible"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '4d426de4-56eb-42f7-a53e-b1b9e4496fd9',
  'bible-queues-dlq',
  'BIBLE: Queues & DLQ Pattern',
  'Message queue producer/consumer with Dead Letter Queue handling',
  'bible',
  'async',
  'hono',
  '["queues","d1_databases"]',
  3,
  5,
  25,
  100,
  NULL,
  'file://C:/dev/.cloudflare/patterns/QUEUES_AND_DLQ.md',
  NULL,
  0,
  '["queues","async","dlq","background-jobs","bible"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '967079fe-23d2-4b00-93e9-e896974e0260',
  'community-astro-blog',
  'Astro Blog Starter',
  'Static blog with Astro, Markdown, and RSS feed',
  'community',
  'static',
  'astro',
  '[]',
  1,
  0,
  0,
  0,
  NULL,
  NULL,
  NULL,
  0,
  '["blog","static","astro","markdown","content"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'b3ba2746-711c-4a71-aeff-8cd1c6f79930',
  'community-nextjs',
  'Next.js on Workers',
  'Next.js App Router with edge runtime',
  'community',
  'fullstack',
  'nextjs',
  '[]',
  3,
  5,
  20,
  80,
  NULL,
  NULL,
  'Requires custom Workers adapter',
  0,
  '["nextjs","react","ssr","app-router"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  'e3deeb67-fb2a-462d-96d2-9d85f8b57355',
  'community-remix-cf',
  'Remix Cloudflare Template',
  'Remix with Cloudflare adapter and D1 integration',
  'community',
  'fullstack',
  'remix',
  '["d1_databases"]',
  2,
  0,
  10,
  40,
  NULL,
  NULL,
  NULL,
  0,
  '["remix","fullstack","d1","ssr"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '5f70ffcd-f35a-4229-8caf-4e17709c127c',
  'community-sveltekit',
  'SvelteKit on Workers',
  'SvelteKit with Cloudflare adapter',
  'community',
  'fullstack',
  'svelte',
  '[]',
  2,
  0,
  5,
  25,
  NULL,
  NULL,
  NULL,
  0,
  '["sveltekit","svelte","fullstack","ssr"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

INSERT OR REPLACE INTO template_registry (
  id, slug, name, description, source, category, framework,
  bindings, complexity, estimated_cost_low, estimated_cost_mid,
  estimated_cost_high, repo_url, docs_url, cost_notes, deprecated,
  tags, created_at, updated_at
) VALUES (
  '56e127e4-b29c-4db2-a9f2-17f45978defa',
  'community-trpc-api',
  'tRPC API on Workers',
  'Type-safe tRPC API with end-to-end TypeScript',
  'community',
  'api',
  'hono',
  '["d1_databases"]',
  3,
  0,
  10,
  40,
  NULL,
  NULL,
  NULL,
  0,
  '["trpc","api","typescript","type-safe"]',
  '2026-02-26T15:58:55.546Z',
  '2026-02-26T15:58:55.546Z'
);

-- Seeded 32 templates successfully
