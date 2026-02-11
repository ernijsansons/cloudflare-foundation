# CLOUDFLARE AGENTIC FOUNDATION — Claude Code Master Prompt

> **Version**: 2.3 | **Platform**: Cloudflare Developer Platform (2025-2026) | **Last verified**: February 2026
> **Purpose**: Build a production-grade, multi-tenant agentic application foundation using EVERY relevant Cloudflare primitive. This is meant to be forked and extended for any SaaS, AI agent, or full-stack application.
> **Changelog v2.1**: Softened Constraint 1 (same-Worker possible, separation recommended); support both wrangler.toml and .jsonc; marked unverified SDK features; added Zero Trust, Cost Model, Observability, Package Verification sections.
> **Changelog v2.2**: Added `run_worker_first` for UI assets; deterministic agent IDs (not random UUIDs); `validateStateChange()` for server-side state validation; readonly connections; Agent↔Workflow symbiosis pattern; Sandbox R2 persistence; Secrets Store; MCP OAuth provider + deferred tool loading; OTel chain-of-thought traces + Logpush; AI Search tenant isolation via folder filters; phased build/deploy order; native error hooks.
> **Changelog v2.3**: Fixed Browser Rendering API (`puppeteer.launch(env.BROWSER)` not `env.BROWSER.launch()`); fixed Sandbox code execution (write-to-file, not shell quoting); removed incorrect `ai_gateway` binding (use `env.AI` with gateway options); fixed agent routing path rewrite (`/api/agents/*` → `/agents/*`); added `main` entry to UI wrangler for SSR; added `host` to `useAgent` for cross-origin; fixed SQL injection via table allowlist; fixed webhook SSRF via destination allowlist; enforced server-side tenant filters on Vectorize and AI Search; added cross-script workflow bindings to gateway; rewrote Constraint 6 (no filesystem discovery, bundled imports fine); raised Wrangler pin to ^4.36.0; added per-service Env types note; added Workers VPC, local dev, Email Routing to not-covered.

---

## MISSION

Build `cloudflare-foundation` — a pnpm monorepo that serves as a **production-ready starter architecture** utilizing the full Cloudflare Developer Platform. It must be immediately deployable, correctly wired, and extensible. Every binding, every SDK, every primitive — used where it belongs.

This foundation is NOT a toy. It is the base layer for shipping real products. Treat it accordingly.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLANE 1: UI                                  │
│  React Router v7 + Cloudflare Vite Plugin + Workers Assets          │
│  Real-time: useAgent / useAgentChat hooks from agents/react         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Service Binding
┌──────────────────────────▼──────────────────────────────────────────┐
│                     PLANE 2: API GATEWAY                            │
│  Hono on Workers — auth, rate limiting, routing, CORS               │
│  Forwards to Agent plane via DO bindings + Workflow dispatch         │
└───────┬──────────────┬───────────────┬──────────────────────────────┘
        │              │               │
┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────────────────────────────┐
│ PLANE 3:     │ │ PLANE 4:  │ │ PLANE 5: DATA & ANALYTICS           │
│ AGENTS       │ │ WORKFLOWS │ │ D1, KV, R2, Vectorize, Queues,      │
│ Agent SDK    │ │ Durable   │ │ Hyperdrive, AI Search, Pipelines,   │
│ (DO-backed)  │ │ Execution │ │ R2 Data Catalog, R2 SQL,            │
│ + MCP Server │ │ w/ Retries│ │ Analytics Engine                    │
└───────┬──────┘ └─────┬─────┘ └──────────────────────────────────────┘
        │              │
┌───────▼──────────────▼──────────────────────────────────────────────┐
│                     PLANE 6: ISOLATION                               │
│  Sandbox SDK (@cloudflare/sandbox) for untrusted code execution     │
│  Browser Rendering (Playwright) for web scraping / screenshots      │
│  Containers for long-running compute                                │
└─────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│                     PLANE 7: AI                                     │
│  Workers AI (inference) + AI Gateway (routing/caching/observability) │
│  AI Search (managed RAG) + Vectorize (vector DB)                    │
│  MCP Client connections to external services                        │
└─────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│                     PLANE 8: COMMUNICATION                          │
│  Email Service (send binding) + Email Routing (receive/process)     │
│  Queues (async messaging + event-driven) + Pub/Sub patterns         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL ARCHITECTURE CONSTRAINTS

These are non-negotiable. Violating any will cause build or deploy failures.

### Constraint 1: Separate Workers for UI and Agents (Recommended)
While the Cloudflare Vite Plugin technically allows Durable Objects and React Router v7 in the same Worker, this foundation **recommends separate Workers** for production multi-agent architectures:
- **Independent deployment**: Agents iterate faster than UI — don't redeploy everything for a prompt change
- **Memory isolation**: A runaway agent shouldn't crash the UI
- **Separate observability**: Different log streams, different error budgets
- **Security boundaries**: Agents have elevated bindings (Sandbox, Browser) that UI shouldn't access directly

> **For simple apps**: A single Worker with Durable Objects + React Router is fine. Use the `cloudflare/react-router-hono-fullstack-template` template. This prompt is for **production multi-tenant platforms** where separation of concerns matters.

- **UI Worker**: React Router v7 + `@cloudflare/vite-plugin` + Workers Assets (static files)
- **Agent Worker**: Exports Agent classes, Workflow classes, Queue consumers
- Connected via **service bindings** in wrangler config

### Constraint 2: Agents SDK Class Hierarchy
All stateful agents **MUST** extend the `Agent` class from the `agents` package — NOT raw `DurableObject`.
```typescript
// ✅ CORRECT
import { Agent, type Connection } from "agents";
export class MyAgent extends Agent<Env, State> { ... }

// ❌ WRONG — do NOT use raw DurableObject
export class MyAgent extends DurableObject { ... }
```
The Agent class provides: `this.sql` (SQLite), `this.setState()` / `onStateUpdate()` (sync), `this.schedule()` / `this.scheduleEvery()` (cron), WebSocket handling (`onConnect` / `onMessage` / `onClose`).

> **⚠️ Verify availability**: `this.queue()` (background tasks) and `onEmail()` (email handling) have been referenced in Agents SDK changelogs but may not be in the current stable release. Check the `agents` package changelog before using. If unavailable, use Cloudflare Queues for background work and Email Routing Workers for inbound email instead.

**State validation (SDK ≥ 0.3.7)**: Implement `validateStateChange(oldState, newState)` to perform server-side validation of client state updates. This prevents clients from pushing invalid or malicious state into the agent. The method can transform or reject incoming state.

```typescript
export class TenantAgent extends Agent<Env, TenantState> {
  validateStateChange(oldState: TenantState, newState: TenantState): TenantState | false {
    // Reject if client tries to change their own plan tier
    if (newState.plan !== oldState.plan) return false;
    // Reject if client tries to exceed resource limits
    if (newState.agentCount > oldState.limits.maxAgents) return false;
    return newState; // Accept (can also transform before returning)
  }
}
```

**Readonly connections (SDK ≥ 0.4.0 — verify)**: For dashboard/monitoring views, upgrade WebSocket connections with a readonly flag. Readonly clients receive state updates via `onStateUpdate()` but cannot call `setState()` or mutating `@callable()` methods. Useful for spectator modes and admin dashboards.

**SQLite as zero-latency memory**: The embedded SQLite (`this.sql`) has no network traversal — it's co-located with the DO. Use it for agent memory, chain-of-thought logs, and tool call history. Only sync minimal UI state to clients via `this.setState()`.

### Constraint 3: Sandbox SDK ≠ Raw Containers
`@cloudflare/sandbox` is a HIGH-LEVEL abstraction over Containers. Use `getSandbox()`, `sandbox.exec()`, `sandbox.writeFile()`, `sandbox.readFile()`.
- Requires a **Dockerfile** in the sandbox service directory
- Requires **Docker running locally** for `wrangler dev`
- Do NOT use raw Container APIs when Sandbox SDK is available

**Sandbox persistence**: Sandboxes are ephemeral by default — files are lost when the container stops due to inactivity. For long-running coding projects, mount a tenant-specific R2 bucket to `/workspace` so files persist across container restarts. Check Sandbox SDK docs for R2 mount configuration.

**Cost optimization**: For simple code execution (evaluating a JS snippet or Python function), consider whether Workers runtime execution is sufficient before spinning up a full container. Containers bill on vCPU + memory duration; a simple `eval` in a Worker isolate is orders of magnitude cheaper.

### Constraint 4: Wrangler Configuration Format
Wrangler supports both `wrangler.toml` (TOML) and `wrangler.jsonc` (JSON with comments). Both are fully supported.
- **`wrangler.toml`**: The traditional default, used in most Cloudflare documentation and templates
- **`wrangler.jsonc`**: Supported since Wrangler v3+, offers JSON Schema validation, better IDE autocomplete

This prompt uses `.jsonc` for examples (enables `$schema` for validation), but `.toml` is equally valid. Pick one format and be consistent across all services. When referencing Cloudflare docs, note that most examples use `.toml`.

### Constraint 5: Multi-Worker Deployment
Each service is a separate Worker with its own wrangler config (`wrangler.jsonc` or `wrangler.toml`) and `package.json`. Deploy via pnpm workspace scripts, NOT a single `wrangler deploy`.

### Constraint 6: No Runtime Filesystem-Based Module Discovery
Workers has no filesystem at runtime — you cannot `fs.readdir()` to discover and load modules dynamically. However, bundled `import()` (dynamic imports resolved at build time) works fine — React Router's Cloudflare deployment uses this pattern. The constraint is: **extension registration must be resolved at build time** via a code generation step (Vite plugin or pre-build script) that scans directories and generates an import map. No runtime directory walking.

### Constraint 7: compatibility_date
Must be `"2025-09-25"` or later. This is required for Browser Rendering (Playwright), latest Node.js compatibility, and all 2025 features.

---

## REQUIRED PACKAGES AND EXACT VERSIONS

```jsonc
// Root package.json devDependencies
{
  // Pin to version that supports Rate Limiting binding (4.36.0+) and Browser Rendering local dev
  "wrangler": "^4.36.0",
  "@cloudflare/vite-plugin": "^1.0.0",
  "vite": "^6.0.0",
  "typescript": "^5.7.0"
}

// Agent/Backend Worker
{
  "agents": "^0.3.0",                          // Agents SDK (Agent, McpAgent, AIChatAgent)
  "@cloudflare/sandbox": "latest",              // Sandbox SDK
  "@cloudflare/puppeteer": "^1.0.4",           // Browser Rendering (Playwright)
  "hono": "^4.0.0",                            // API framework
  "ai": "^6.0.0",                              // Vercel AI SDK v6 (required by Agents SDK)
  "@ai-sdk/react": "^3.0.0",                   // React hooks for AI SDK
  "ai-gateway-provider": "^3.0.0",             // AI Gateway provider for AI SDK
  "workers-ai-provider": "^3.0.0",             // Workers AI provider for AI SDK
  "@modelcontextprotocol/sdk": "latest",        // MCP SDK
  "drizzle-orm": "latest",                     // ORM for D1
  "drizzle-kit": "latest",                     // Migration tooling
  "zod": "^3.23.0"                             // Schema validation
}

// UI Worker
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router": "^7.0.0",
  "@cloudflare/vite-plugin": "^1.0.0",
  "@ai-sdk/react": "^3.0.0",
  "agents": "^0.3.0"                           // For useAgent / useAgentChat hooks
}
```

---

## MONOREPO STRUCTURE

```
cloudflare-foundation/
├── pnpm-workspace.yaml
├── package.json                          # Root scripts
├── turbo.json                            # Turborepo config (optional)
│
├── packages/
│   ├── shared/                           # Shared types, schemas, utils
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/                    # Shared TypeScript types
│   │       │   ├── env.ts                # Env interface (all bindings)
│   │       │   ├── agent.ts              # Agent state types
│   │       │   └── api.ts               # API request/response types
│   │       ├── schemas/                  # Zod schemas
│   │       │   ├── tenant.ts
│   │       │   └── user.ts
│   │       ├── constants.ts
│   │       └── index.ts
│   │
│   └── db/                               # Drizzle schema + migrations
│       ├── package.json
│       ├── drizzle.config.ts
│       ├── schema/
│       │   ├── tenants.ts
│       │   ├── users.ts
│       │   ├── audit-log.ts
│       │   └── index.ts
│       └── migrations/
│
├── services/
│   ├── ui/                               # PLANE 1: React Router v7 UI
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── app/
│   │   │   ├── root.tsx
│   │   │   ├── routes/
│   │   │   │   ├── _index.tsx
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── chat.tsx              # Real-time agent chat
│   │   │   │   └── api.$.tsx             # Proxy to gateway
│   │   │   ├── components/
│   │   │   │   ├── ChatPanel.tsx          # useAgentChat integration
│   │   │   │   └── AgentStatus.tsx        # useAgent state sync
│   │   │   └── lib/
│   │   │       └── agent-client.ts        # Agent connection helpers
│   │   └── public/
│   │
│   ├── gateway/                          # PLANE 2: API Gateway (Hono)
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Hono app entry
│   │       ├── middleware/
│   │       │   ├── auth.ts               # JWT / API key validation
│   │       │   ├── rate-limit.ts         # Rate limiting (KV-based or Workers Rate Limiting API)
│   │       │   ├── cors.ts
│   │       │   ├── tenant.ts             # Tenant resolution
│   │       │   └── correlation.ts        # Request ID injection
│   │       ├── routes/
│   │       │   ├── agents.ts             # Forward to Agent DO
│   │       │   ├── workflows.ts          # Dispatch Workflows
│   │       │   ├── search.ts             # AI Search proxy
│   │       │   ├── data.ts               # D1/KV/R2 CRUD
│   │       │   ├── email.ts              # Email sending
│   │       │   └── health.ts
│   │       └── lib/
│   │           ├── bindings.ts           # Typed env bindings
│   │           └── errors.ts             # Error classes
│   │
│   ├── agents/                           # PLANE 3: Agent Runtime
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   ├── Dockerfile                    # For Sandbox SDK
│   │   └── src/
│   │       ├── index.ts                  # Export all DO classes + fetch handler
│   │       ├── agents/
│   │       │   ├── chat-agent.ts         # AIChatAgent — conversational AI
│   │       │   ├── task-agent.ts         # Agent — background task orchestration
│   │       │   ├── tenant-agent.ts       # Agent — per-tenant state machine
│   │       │   └── session-agent.ts      # Agent — per-session state
│   │       ├── mcp/
│   │       │   ├── server.ts             # McpAgent — expose tools to MCP clients
│   │       │   └── tools/                # MCP tool definitions
│   │       │       ├── database.ts       # D1 query tool
│   │       │       ├── search.ts         # AI Search tool
│   │       │       ├── email.ts          # Email sending tool
│   │       │       └── sandbox.ts        # Code execution tool
│   │       ├── tools/                    # AI SDK tool definitions
│   │       │   ├── web-browse.ts         # Browser Rendering tool
│   │       │   ├── code-exec.ts          # Sandbox execution tool
│   │       │   ├── file-store.ts         # R2 operations tool
│   │       │   └── db-query.ts           # D1 query tool
│   │       └── lib/
│   │           ├── ai-client.ts          # AI Gateway + Workers AI setup
│   │           └── sandbox-pool.ts       # Sandbox lifecycle management
│   │
│   ├── workflows/                        # PLANE 4: Durable Workflows
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── workflows/
│   │           ├── onboarding.ts         # Multi-step tenant onboarding
│   │           ├── data-pipeline.ts      # ETL with retry logic
│   │           ├── report-gen.ts         # Long-running report generation
│   │           └── email-sequence.ts     # Drip email workflow
│   │
│   ├── queues/                           # PLANE 8: Queue Consumers
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── consumers/
│   │           ├── audit-log.ts          # Write audit events to D1 + Pipelines
│   │           ├── notifications.ts      # Email/webhook notifications
│   │           ├── analytics.ts          # Stream to Pipelines (Iceberg)
│   │           └── webhook-dispatch.ts   # Outbound webhook delivery
│   │
│   └── cron/                             # Scheduled Workers (Cron Triggers)
│       ├── package.json
│       ├── wrangler.jsonc
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           └── jobs/
│               ├── cleanup.ts            # Stale data cleanup
│               ├── ai-search-sync.ts     # Trigger AI Search reindex
│               └── metrics-rollup.ts     # Analytics Engine rollup
│
├── extensions/                           # Extension point (auto-registered at build time)
│   ├── README.md
│   └── example-extension/
│       ├── manifest.json                 # Extension metadata
│       ├── tools.ts                      # Additional AI/MCP tools
│       └── routes.ts                     # Additional API routes
│
├── scripts/
│   ├── codegen-extensions.ts             # Build-time: scan /extensions, generate import map
│   ├── deploy-all.sh                     # Deploy all services in order
│   ├── setup-d1.sh                       # Create D1 databases
│   ├── setup-kv.sh                       # Create KV namespaces
│   ├── setup-r2.sh                       # Create R2 buckets
│   ├── setup-queues.sh                   # Create Queues
│   ├── setup-ai-search.sh               # Create AI Search instance
│   └── seed.ts                           # Seed data for development
│
├── docker/
│   └── sandbox/
│       └── Dockerfile                    # Sandbox SDK container image
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    └── EXTENDING.md
```

---

## pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
  - "services/*"
```

---

## SERVICE CONFIGURATIONS (wrangler.jsonc)

### services/ui/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-ui",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  // React Router v7 framework mode requires a Worker entrypoint for SSR/loaders/actions.
  // The Cloudflare Vite plugin generates this from your server build.
  // Without "main", you get static-only serving — no SSR, no loaders, no actions.
  "main": "./build/server/index.js",
  "assets": {
    "directory": "./build/client",
    // Ensures Worker logic (auth, tenant resolution) runs before static asset serving.
    // Without this, navigation requests may serve index.html instead of hitting your Worker.
    "run_worker_first": true
  },
  "observability": {
    "enabled": true
  },
  // Service binding to gateway — UI never talks directly to DOs
  "services": [
    {
      "binding": "GATEWAY",
      "service": "foundation-gateway"
    }
  ]
}
```

### services/gateway/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-gateway",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },

  // Service bindings to other planes
  "services": [
    { "binding": "AGENT_SERVICE", "service": "foundation-agents" }
  ],

  // Workflow bindings — cross-script bindings to workflows defined in the workflows Worker.
  // This allows gateway to call env.ONBOARDING_WORKFLOW.create(...) directly.
  // Requires script_name to reference the workflow-defining Worker.
  // Alternative: invoke workflows via the WORKFLOW_SERVICE service binding over HTTP/RPC.
  "workflows": [
    { "binding": "ONBOARDING_WORKFLOW", "name": "tenant-onboarding", "class_name": "TenantOnboardingWorkflow", "script_name": "foundation-workflows" },
    { "binding": "DATA_PIPELINE_WORKFLOW", "name": "data-pipeline", "class_name": "DataPipelineWorkflow", "script_name": "foundation-workflows" },
    { "binding": "REPORT_WORKFLOW", "name": "report-generation", "class_name": "ReportGenerationWorkflow", "script_name": "foundation-workflows" },
    { "binding": "EMAIL_WORKFLOW", "name": "email-sequence", "class_name": "EmailSequenceWorkflow", "script_name": "foundation-workflows" }
  ],

  // KV for rate limiting + sessions
  "kv_namespaces": [
    { "binding": "RATE_LIMIT_KV", "id": "KV_ID_HERE" },
    { "binding": "SESSION_KV", "id": "KV_ID_HERE" }
  ],

  // D1 for structured data
  "d1_databases": [
    { "binding": "DB", "database_name": "foundation-primary", "database_id": "D1_ID_HERE" }
  ],

  // R2 for file storage
  "r2_buckets": [
    { "binding": "FILES", "bucket_name": "foundation-files" },
    { "binding": "ASSETS", "bucket_name": "foundation-assets" }
  ],

  // Queues — produce messages
  "queues": {
    "producers": [
      { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" },
      { "binding": "NOTIFICATION_QUEUE", "queue": "foundation-notifications" },
      { "binding": "ANALYTICS_QUEUE", "queue": "foundation-analytics" },
      { "binding": "WEBHOOK_QUEUE", "queue": "foundation-webhooks" }
    ]
  },

  // AI bindings
  "ai": { "binding": "AI" },

  // Vectorize
  "vectorize": [
    { "binding": "VECTOR_INDEX", "index_name": "foundation-embeddings" }
  ],

  // Hyperdrive (external Postgres)
  "hyperdrive": [
    { "binding": "POSTGRES", "id": "HYPERDRIVE_ID_HERE" }
  ],

  // Email sending
  "send_email": [
    { "binding": "SEND_EMAIL", "name": "SEND_EMAIL" }
  ],

  // Analytics Engine
  "analytics_engine_datasets": [
    { "binding": "ANALYTICS", "dataset": "foundation_events" }
  ],

  // Pipelines (streaming ingestion → Iceberg)
  "pipelines": [
    { "binding": "EVENT_PIPELINE", "pipeline": "foundation-events" }
  ]
}
```

### services/agents/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-agents",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },

  // Durable Objects — every agent class
  "durable_objects": {
    "bindings": [
      { "name": "CHAT_AGENT", "class_name": "ChatAgent" },
      { "name": "TASK_AGENT", "class_name": "TaskAgent" },
      { "name": "TENANT_AGENT", "class_name": "TenantAgent" },
      { "name": "SESSION_AGENT", "class_name": "SessionAgent" },
      { "name": "MCP_SERVER", "class_name": "FoundationMcpServer" }
    ]
  },

  // SQLite migrations for Agent DOs
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ChatAgent", "TaskAgent", "TenantAgent", "SessionAgent", "FoundationMcpServer"] }
  ],

  // AI bindings
  "ai": { "binding": "AI" },

  // Browser Rendering
  "browser": {
    "binding": "BROWSER"
  },

  // Sandbox / Containers
  "containers": [
    { "binding": "SANDBOX", "image": "./Dockerfile" }
  ],

  // D1, R2, KV, Vectorize, Queues — agents need access too
  "d1_databases": [
    { "binding": "DB", "database_name": "foundation-primary", "database_id": "D1_ID_HERE" }
  ],
  "r2_buckets": [
    { "binding": "FILES", "bucket_name": "foundation-files" }
  ],
  "kv_namespaces": [
    { "binding": "CACHE_KV", "id": "KV_ID_HERE" }
  ],
  "vectorize": [
    { "binding": "VECTOR_INDEX", "index_name": "foundation-embeddings" }
  ],
  "queues": {
    "producers": [
      { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" },
      { "binding": "ANALYTICS_QUEUE", "queue": "foundation-analytics" }
    ]
  },

  // AI Gateway: accessed via the AI binding, NOT a separate binding.
  // Use env.AI.run() with gateway options, or env.AI.gateway("foundation-gateway")
  // for provider URL retrieval and log management. No separate ai_gateway stanza needed.

  // Email
  "send_email": [
    { "binding": "SEND_EMAIL", "name": "SEND_EMAIL" }
  ],

  // Pipelines
  "pipelines": [
    { "binding": "EVENT_PIPELINE", "pipeline": "foundation-events" }
  ]
}
```

### services/workflows/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-workflows",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "workflows": [
    { "binding": "ONBOARDING_WORKFLOW", "name": "onboarding-workflow", "class_name": "OnboardingWorkflow" },
    { "binding": "DATA_PIPELINE_WORKFLOW", "name": "data-pipeline-workflow", "class_name": "DataPipelineWorkflow" },
    { "binding": "REPORT_WORKFLOW", "name": "report-workflow", "class_name": "ReportWorkflow" },
    { "binding": "EMAIL_WORKFLOW", "name": "email-sequence-workflow", "class_name": "EmailSequenceWorkflow" }
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "foundation-primary", "database_id": "D1_ID_HERE" }
  ],
  "r2_buckets": [
    { "binding": "FILES", "bucket_name": "foundation-files" }
  ],
  "ai": { "binding": "AI" },
  "send_email": [
    { "binding": "SEND_EMAIL", "name": "SEND_EMAIL" }
  ],
  "queues": {
    "producers": [
      { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" }
    ]
  }
}
```

> **Agent ↔ Workflow Symbiosis Pattern (SDK ≥ 0.3.7 — verify)**:
> The modern pattern integrates Workflows as durable execution arms of stateful Agents. If `AgentWorkflow` is available in your SDK version:
> - **Agent → Workflow**: Agent dispatches long-running work via `this.runWorkflow()`, manages lifecycle with `this.approveWorkflow()` / `this.terminateWorkflow()`
> - **Workflow → Agent**: Workflow calls back to Agent via RPC stub (`this.agent.updateProgress(0.5)`) for real-time UI updates
> - **Human-in-the-loop**: Workflow pauses at `step.waitForApproval()`, Agent syncs approval request to UI via `setState()`, user approves, Agent resumes workflow
>
> This solves "long-running reasoning" — agent compute is limited to 30s per request, but workflows can run for hours/days, calling agent tools in durable steps.
> If `AgentWorkflow` is not yet available, use the current pattern: Agent dispatches via Workflow binding, polls status, updates UI state manually.

### services/queues/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-queues",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "queues": {
    "consumers": [
      { "queue": "foundation-audit", "max_batch_size": 50, "max_batch_timeout": 5 },
      { "queue": "foundation-notifications", "max_batch_size": 10, "max_batch_timeout": 3 },
      { "queue": "foundation-analytics", "max_batch_size": 100, "max_batch_timeout": 10 },
      { "queue": "foundation-webhooks", "max_batch_size": 10, "max_batch_timeout": 2, "max_retries": 5 }
    ]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "foundation-primary", "database_id": "D1_ID_HERE" }
  ],
  "send_email": [
    { "binding": "SEND_EMAIL", "name": "SEND_EMAIL" }
  ],
  "pipelines": [
    { "binding": "EVENT_PIPELINE", "pipeline": "foundation-events" }
  ],
  "analytics_engine_datasets": [
    { "binding": "ANALYTICS", "dataset": "foundation_events" }
  ]
}
```

---

## KEY IMPLEMENTATION FILES

### packages/shared/src/types/env.ts
```typescript
/**
 * GLOBAL Env type — contains ALL bindings across all services.
 * This is for reference and shared tooling (e.g., Drizzle config).
 *
 * PRODUCTION BEST PRACTICE: Generate per-service types via `wrangler types`
 * in each service directory. This ensures least-privilege — each service
 * only sees bindings it actually has, and "it compiles but deploy fails
 * because the binding doesn't exist" becomes a compile-time error.
 *
 * Example: cd services/gateway && npx wrangler types
 * This generates a .d.ts with only the gateway's bindings.
 */
import type { Agent } from "agents";

export interface Env {
  // Service bindings
  GATEWAY: Fetcher;
  AGENT_SERVICE: Fetcher;
  WORKFLOW_SERVICE: Fetcher;

  // Durable Objects (Agent classes)
  CHAT_AGENT: DurableObjectNamespace;
  TASK_AGENT: DurableObjectNamespace;
  TENANT_AGENT: DurableObjectNamespace;
  SESSION_AGENT: DurableObjectNamespace;
  MCP_SERVER: DurableObjectNamespace;

  // Storage
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  FILES: R2Bucket;
  ASSETS: R2Bucket;

  // AI — AI Gateway is accessed via AI binding methods, not a separate binding
  // Use: env.AI.run() with { gateway: { id: "foundation-gateway" } }
  // Or:  env.AI.gateway("foundation-gateway") for URL retrieval
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Browser Rendering — binding is a Fetcher, passed INTO puppeteer.launch(env.BROWSER)
  BROWSER: Fetcher;
  // Sandbox — binding is a DurableObjectNamespace, passed INTO getSandbox(env.SANDBOX, id)
  SANDBOX: DurableObjectNamespace;

  // Queues
  AUDIT_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  ANALYTICS_QUEUE: Queue;
  WEBHOOK_QUEUE: Queue;

  // Email
  SEND_EMAIL: SendEmail;

  // Analytics
  ANALYTICS: AnalyticsEngineDataset;

  // Pipelines
  EVENT_PIPELINE: Pipeline;

  // Hyperdrive
  POSTGRES: Hyperdrive;

  // Workflows
  ONBOARDING_WORKFLOW: Workflow;
  DATA_PIPELINE_WORKFLOW: Workflow;
  REPORT_WORKFLOW: Workflow;
  EMAIL_WORKFLOW: Workflow;

  // Secrets (use Cloudflare Secrets Store for production — single secret bound to multiple services)
  // See: https://developers.cloudflare.com/secrets-store/
  // For dev: use `wrangler secret put` or .dev.vars file
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}
```

### services/agents/src/agents/chat-agent.ts
```typescript
import { AIChatAgent, type Connection } from "agents";
import { createOpenAI } from "@ai-sdk/openai";
import { createAIGatewayProvider } from "ai-gateway-provider";
import { streamText, type CoreTool } from "ai";
import { z } from "zod";

// State synced to all connected clients via useAgentChat
interface ChatState {
  messages: Array<{ role: string; content: string }>;
  model: string;
  tenantId: string;
}

export class ChatAgent extends AIChatAgent<Env, ChatState> {
  // Called when useAgentChat sends a message
  async onChatMessage(onFinish: Parameters<AIChatAgent["onChatMessage"]>[0]) {
    // Route through AI Gateway for observability + caching
    const provider = createAIGatewayProvider({
      accountId: this.env.CLOUDFLARE_ACCOUNT_ID,
      gatewayId: "foundation-gateway",
    });

    const openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
      ...provider.openai(),
    });

    const tools: Record<string, CoreTool> = {
      searchKnowledge: {
        description: "Search the knowledge base using AI Search",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          const result = await this.env.AI.autorag("foundation-search").aiSearch({ query });
          return result.response;
        },
      },
      browseWeb: {
        description: "Browse a web page and extract content",
        parameters: z.object({ url: z.string().url() }),
        execute: async ({ url }) => {
          // CORRECT: The BROWSER binding is a Fetcher passed INTO the library
          const puppeteer = await import("@cloudflare/puppeteer");
          const browser = await puppeteer.default.launch(this.env.BROWSER);
          const page = await browser.newPage();
          page.setDefaultTimeout(30_000); // Always set timeouts
          try {
            await page.goto(url, { waitUntil: "domcontentloaded" });
            const text = await page.evaluate(() => document.body.innerText);
            return text.slice(0, 5000);
          } finally {
            await browser.close(); // Always close to avoid billing leaks
          }
        },
      },
      executeCode: {
        description: "Execute Python or Node.js code in a sandbox",
        parameters: z.object({
          code: z.string(),
          language: z.enum(["python", "node"]),
        }),
        execute: async ({ code, language }) => {
          // Sandbox binding is a DurableObjectNamespace — see Sandbox SDK docs
          const { getSandbox } = await import("@cloudflare/sandbox");
          const sandbox = await getSandbox(this.env.SANDBOX, `exec-${Date.now()}`);
          // IMPORTANT: Write code to a file then execute — never interpolate into shell commands
          const ext = language === "python" ? "py" : "js";
          const filename = `/tmp/run.${ext}`;
          await sandbox.writeFile(filename, code);
          const cmd = language === "python" ? `python3 ${filename}` : `node ${filename}`;
          const result = await sandbox.exec(cmd);
          return result.stdout || result.stderr;
        },
      },
      queryDatabase: {
        description: "Query the D1 database with SQL",
        parameters: z.object({ sql: z.string(), params: z.array(z.string()).optional() }),
        execute: async ({ sql, params }) => {
          const stmt = this.env.DB.prepare(sql);
          const result = params ? await stmt.bind(...params).all() : await stmt.all();
          return JSON.stringify(result.results);
        },
      },
      sendEmail: {
        description: "Send a transactional email",
        parameters: z.object({
          to: z.string().email(),
          subject: z.string(),
          body: z.string(),
        }),
        execute: async ({ to, subject, body }) => {
          await this.env.SEND_EMAIL.send({
            to: [{ email: to }],
            from: { email: "noreply@yourdomain.com", name: "Foundation" },
            subject,
            text: body,
          });
          return `Email sent to ${to}`;
        },
      },
      storeFile: {
        description: "Store a file in R2 storage",
        parameters: z.object({
          key: z.string(),
          content: z.string(),
          contentType: z.string().optional(),
        }),
        execute: async ({ key, content, contentType }) => {
          await this.env.FILES.put(key, content, {
            httpMetadata: { contentType: contentType || "text/plain" },
          });
          return `Stored at: ${key}`;
        },
      },
      vectorSearch: {
        description: "Semantic search over vector embeddings",
        parameters: z.object({ query: z.string(), topK: z.number().default(5) }),
        execute: async ({ query, topK }) => {
          const embedding = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
          const results = await this.env.VECTOR_INDEX.query(embedding.data[0], { topK });
          return JSON.stringify(results.matches);
        },
      },
    };

    const result = streamText({
      model: openai("gpt-4o"),
      messages: this.messages,
      tools,
      maxSteps: 10,
      onFinish: async (result) => {
        // Log to audit queue
        await this.env.AUDIT_QUEUE.send({
          type: "chat_completion",
          agentId: this.name,
          messageCount: this.messages.length,
          tokensUsed: result.usage,
          timestamp: Date.now(),
        });

        // Stream events to Pipelines for analytics
        await this.env.EVENT_PIPELINE.send([{
          event_type: "chat_completion",
          agent_id: this.name,
          model: "gpt-4o",
          input_tokens: result.usage?.promptTokens,
          output_tokens: result.usage?.completionTokens,
          timestamp: new Date().toISOString(),
        }]);
      },
    });

    return result.toDataStreamResponse();
  }

  // Scheduled tasks via this.schedule()
  async onScheduled(scheduledTime: number, type: string, data: unknown) {
    switch (type) {
      case "summarize_conversation":
        // Summarize and store in Vectorize for future retrieval
        break;
      case "cleanup_old_messages":
        // Prune messages older than 30 days from DO SQLite
        break;
    }
  }

  // Background task processing via this.queue()
  // ⚠️ Verify: this.queue() may not be in stable SDK yet.
  // Fallback: Use env.AUDIT_QUEUE.send() to push work to a Queue consumer instead.
  async onTask(type: string, data: unknown) {
    switch (type) {
      case "embed_messages":
        // Generate embeddings for message history
        break;
    }
  }
}
```

### services/agents/src/mcp/server.ts
```typescript
import { McpAgent } from "agents";
import { z } from "zod";

/**
 * MCP Server exposing foundation tools to external MCP clients
 * (Claude Desktop, Cursor, Windsurf, AI Playground, etc.)
 *
 * Supports:
 * - Streamable HTTP transport (recommended) at /mcp
 * - SSE transport (deprecated fallback) at /sse
 * - WebSocket hibernation for cost efficiency
 * - OAuth integration for authenticated access (use workers-oauth-provider library)
 * - Elicitation for human-in-the-loop workflows
 *
 * PRODUCTION NOTES:
 * 1. OAuth Provider: For remote MCP clients, this server must act as an OAuth Provider.
 *    Use the `workers-oauth-provider` library to issue scoped tokens. External LLMs
 *    authenticate to the foundation's DB/files without exposing the user's credentials.
 *
 * 2. Deferred Tool Loading: As tools grow (D1, R2, Sandbox, Email, etc.), agents may
 *    hit context window limits or suffer "tool confusion." Implement a meta-tool that
 *    discovers available toolsets and only loads tools relevant to the current intent.
 *    This reduces token consumption and improves reliability.
 */
export class FoundationMcpServer extends McpAgent<Env> {
  server = {
    name: "foundation-mcp",
    version: "1.0.0",
  };

  async init() {
    // Database tools
    this.addTool(
      "query_database",
      "Execute a read-only SQL query against the application database",
      { sql: z.string().describe("SELECT query to execute") },
      async ({ sql }) => {
        if (!sql.trim().toUpperCase().startsWith("SELECT")) {
          return { content: [{ type: "text", text: "Only SELECT queries are allowed" }] };
        }
        const result = await this.env.DB.prepare(sql).all();
        return { content: [{ type: "text", text: JSON.stringify(result.results, null, 2) }] };
      }
    );

    // AI Search tool
    this.addTool(
      "search_knowledge",
      "Search the knowledge base using natural language",
      { query: z.string(), maxResults: z.number().default(10) },
      async ({ query, maxResults }) => {
        const result = await this.env.AI.autorag("foundation-search").search({
          query,
          max_num_results: maxResults,
        });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
    );

    // File management tools
    this.addTool(
      "list_files",
      "List files stored in object storage",
      { prefix: z.string().optional(), limit: z.number().default(20) },
      async ({ prefix, limit }) => {
        const listing = await this.env.FILES.list({ prefix, limit });
        const files = listing.objects.map((o) => ({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded,
        }));
        return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
      }
    );

    this.addTool(
      "read_file",
      "Read a file from object storage",
      { key: z.string() },
      async ({ key }) => {
        const obj = await this.env.FILES.get(key);
        if (!obj) return { content: [{ type: "text", text: `File not found: ${key}` }] };
        const text = await obj.text();
        return { content: [{ type: "text", text }] };
      }
    );

    // Code execution (with elicitation for confirmation)
    this.addTool(
      "execute_code",
      "Execute code in an isolated sandbox (requires confirmation)",
      {
        code: z.string(),
        language: z.enum(["python", "node"]),
      },
      async ({ code, language }) => {
        // Use MCP elicitation to confirm before executing
        const confirmation = await this.elicit("confirm_execution", {
          type: "object",
          properties: {
            approved: {
              type: "boolean",
              description: `Execute this ${language} code?\n\n${code}`,
            },
          },
          required: ["approved"],
        });

        if (!confirmation?.approved) {
          return { content: [{ type: "text", text: "Execution cancelled by user" }] };
        }

        const { getSandbox } = await import("@cloudflare/sandbox");
        const sandbox = await getSandbox(this.env.SANDBOX, `mcp-exec-${Date.now()}`);
        // Write code to file to avoid shell injection via quoting
        const ext = language === "python" ? "py" : "js";
        const filename = `/tmp/run.${ext}`;
        await sandbox.writeFile(filename, code);
        const cmd = language === "python" ? `python3 ${filename}` : `node ${filename}`;
        const result = await sandbox.exec(cmd);
        return { content: [{ type: "text", text: result.stdout || result.stderr || "No output" }] };
      }
    );

    // Email tool
    this.addTool(
      "send_email",
      "Send a transactional email",
      {
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
      },
      async ({ to, subject, body }) => {
        await this.env.SEND_EMAIL.send({
          to: [{ email: to }],
          from: { email: "noreply@yourdomain.com", name: "Foundation" },
          subject,
          text: body,
        });
        return { content: [{ type: "text", text: `Email sent to ${to}` }] };
      }
    );
  }
}
```

### services/workflows/src/workflows/onboarding.ts
```typescript
import { WorkflowEntrypoint, type WorkflowStep, type WorkflowEvent } from "cloudflare:workers";

interface OnboardingParams {
  tenantId: string;
  tenantName: string;
  adminEmail: string;
  plan: "free" | "pro" | "enterprise";
}

export class OnboardingWorkflow extends WorkflowEntrypoint<Env, OnboardingParams> {
  async run(event: WorkflowEvent<OnboardingParams>, step: WorkflowStep) {
    const { tenantId, tenantName, adminEmail, plan } = event.payload;

    // Step 1: Create tenant record in D1
    const tenant = await step.do("create-tenant", async () => {
      await this.env.DB.prepare(
        "INSERT INTO tenants (id, name, plan, status, created_at) VALUES (?, ?, ?, 'active', datetime('now'))"
      ).bind(tenantId, tenantName, plan).run();
      return { tenantId, tenantName };
    });

    // Step 2: Create KV namespace entries for tenant config
    await step.do("setup-tenant-config", async () => {
      await this.env.SESSION_KV.put(
        `tenant:${tenantId}:config`,
        JSON.stringify({
          plan,
          features: plan === "enterprise" ? ["sandbox", "browser", "mcp"] : ["browser"],
          limits: { agents: plan === "free" ? 1 : plan === "pro" ? 5 : 50 },
        })
      );
    });

    // Step 3: Create R2 folder structure for tenant
    await step.do("setup-storage", async () => {
      await this.env.FILES.put(`tenants/${tenantId}/.init`, "");
      await this.env.FILES.put(`tenants/${tenantId}/uploads/.init`, "");
      await this.env.FILES.put(`tenants/${tenantId}/exports/.init`, "");
    });

    // Step 4: Initialize AI Search data source (if applicable)
    if (plan !== "free") {
      await step.do("setup-ai-search", async () => {
        // Upload initial documents to R2 for AI Search indexing
        await this.env.FILES.put(
          `tenants/${tenantId}/knowledge/welcome.md`,
          `# Welcome to ${tenantName}\n\nYour knowledge base is ready.`
        );
      });
    }

    // Step 5: Send welcome email
    await step.do("send-welcome-email", async () => {
      await this.env.SEND_EMAIL.send({
        to: [{ email: adminEmail }],
        from: { email: "welcome@yourdomain.com", name: "Foundation" },
        subject: `Welcome to Foundation, ${tenantName}!`,
        text: `Your workspace is ready. Log in at https://app.yourdomain.com to get started.\n\nPlan: ${plan}`,
      });
    });

    // Step 6: Wait 24 hours, then send tips email
    await step.sleep("wait-for-tips", "24 hours");

    await step.do("send-tips-email", async () => {
      await this.env.SEND_EMAIL.send({
        to: [{ email: adminEmail }],
        from: { email: "tips@yourdomain.com", name: "Foundation" },
        subject: "Getting the most out of Foundation",
        text: "Here are some tips to get started with your AI agents...",
      });
    });

    // Step 7: Log completion to audit + analytics
    await step.do("log-completion", async () => {
      await this.env.AUDIT_QUEUE.send({
        type: "onboarding_complete",
        tenantId,
        plan,
        timestamp: Date.now(),
      });
    });

    return { tenantId, status: "onboarded" };
  }
}
```

### services/ui/app/routes/chat.tsx
```tsx
import { useAgentChat } from "agents/react";
import { useAgent } from "agents/react";
import { useState } from "react";

export default function ChatRoute() {
  // IMPORTANT: Use deterministic IDs for production agents.
  // Random UUIDs create orphaned DOs on page refresh — user loses their conversation.
  // Pattern: tenantId:userId:purpose or tenantId:sessionId
  const tenantId = useTenantId(); // From your auth context
  const userId = useUserId();     // From your auth context
  const agentName = `${tenantId}:${userId}:chat`;

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
    agent: useAgent({
      agent: "chat-agent",   // Maps to ChatAgent DO class
      name: agentName,       // Deterministic — survives page refresh, enables reconnection
      // CROSS-ORIGIN: When UI and Agent are separate Workers, you MUST specify host.
      // The gateway rewrites /api/agents/* → /agents/* before forwarding to agent service.
      // See: https://developers.cloudflare.com/agents/guides/cross-domain-authentication/
      host: window.location.origin, // Same origin if gateway proxies agents
      // If agents are on a different domain:
      // host: "https://agents.yourdomain.com",
    }),
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === "user" ? "bg-blue-100 ml-auto max-w-md" : "bg-gray-100 max-w-2xl"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
          className="flex-1 border rounded-lg px-4 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

### services/agents/src/index.ts
```typescript
import { routeAgentRequest } from "agents";
import { ChatAgent } from "./agents/chat-agent";
import { TaskAgent } from "./agents/task-agent";
import { TenantAgent } from "./agents/tenant-agent";
import { SessionAgent } from "./agents/session-agent";
import { FoundationMcpServer } from "./mcp/server";

// Export all DO classes — required for Durable Object bindings
export { ChatAgent, TaskAgent, TenantAgent, SessionAgent, FoundationMcpServer };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // MCP endpoint (Streamable HTTP transport)
    const url = new URL(request.url);
    if (url.pathname.startsWith("/mcp")) {
      return FoundationMcpServer.serve("/mcp").fetch(request, env, ctx);
    }

    // Agent WebSocket routing (for useAgent / useAgentChat hooks)
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    return new Response("Agent service — use WebSocket or /mcp", { status: 200 });
  },
};
```

### services/gateway/src/index.ts
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { correlationMiddleware } from "./middleware/correlation";
import { tenantMiddleware } from "./middleware/tenant";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", cors());
app.use("*", correlationMiddleware());
app.use("*", rateLimitMiddleware());

// Public routes
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// Authenticated routes
app.use("/api/*", authMiddleware());
app.use("/api/*", tenantMiddleware());

// Agent proxy — forward to Agent service
// CRITICAL: routeAgentRequest() expects paths like /agents/:agentName/:instanceId
// We must rewrite the path from /api/agents/... to /agents/... before forwarding
app.all("/api/agents/:agentType/:agentId/*", async (c) => {
  const url = new URL(c.req.url);
  // Rewrite path: /api/agents/chat-agent/abc123 → /agents/chat-agent/abc123
  url.pathname = url.pathname.replace(/^\/api\/agents/, "/agents");
  // Forward with original method, headers, body (including WebSocket upgrade)
  return c.env.AGENT_SERVICE.fetch(new Request(url.toString(), c.req.raw));
});

// Workflow dispatch
app.post("/api/workflows/:workflowName", async (c) => {
  const { workflowName } = c.req.param();
  const body = await c.req.json();

  const workflows: Record<string, Workflow> = {
    onboarding: c.env.ONBOARDING_WORKFLOW,
    "data-pipeline": c.env.DATA_PIPELINE_WORKFLOW,
    report: c.env.REPORT_WORKFLOW,
    "email-sequence": c.env.EMAIL_WORKFLOW,
  };

  const workflow = workflows[workflowName];
  if (!workflow) return c.json({ error: "Unknown workflow" }, 404);

  const instance = await workflow.create({ params: body });
  return c.json({ instanceId: instance.id, status: "started" });
});

// AI Search
// AI Search — TENANT-SCOPED queries
// Each tenant's knowledge base lives under tenants/{tenantId}/knowledge/ in R2.
// Always apply folder filter derived from authenticated tenant context.
app.post("/api/search", async (c) => {
  const tenantId = c.get("tenantId");
  const { query, mode = "ai-search" } = await c.req.json();
  const aiSearch = c.env.AI.autorag("foundation-search");
  // Server-enforced tenant filter — client cannot search other tenants' data
  const tenantFilter = { folder: `tenants/${tenantId}/knowledge/` };

  if (mode === "search") {
    const result = await aiSearch.search({ query, ...tenantFilter });
    return c.json(result);
  } else {
    const result = await aiSearch.aiSearch({ query, ...tenantFilter });
    return c.json(result);
  }
});

// D1 CRUD — table allowlist to prevent SQL injection via path param
const ALLOWED_TABLES = ["tenants", "users", "audit_log", "settings"] as const;
app.get("/api/data/:table", async (c) => {
  const { table } = c.req.param();
  if (!ALLOWED_TABLES.includes(table as any)) {
    return c.json({ error: "Invalid table" }, 400);
  }
  const tenantId = c.get("tenantId");
  const result = await c.env.DB.prepare(
    `SELECT * FROM ${table} WHERE tenant_id = ? LIMIT 100`
  ).bind(tenantId).all();
  return c.json(result.results);
});

// R2 file operations
app.post("/api/files/upload", async (c) => {
  const tenantId = c.get("tenantId");
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file) return c.json({ error: "No file" }, 400);

  const key = `tenants/${tenantId}/uploads/${Date.now()}-${file.name}`;
  await c.env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, tenantId },
  });

  return c.json({ key, size: file.size });
});

// Email sending
app.post("/api/email/send", async (c) => {
  const { to, subject, text, html } = await c.req.json();
  await c.env.SEND_EMAIL.send({
    to: [{ email: to }],
    from: { email: "app@yourdomain.com", name: "Foundation" },
    subject,
    text,
    ...(html && { html }),
  });
  return c.json({ sent: true });
});

// Vectorize — store and query embeddings
// Vectorize — TENANT-SCOPED upsert and query
// IMPORTANT: Always include tenantId in metadata and enforce it in queries.
// Create a metadata index on "tenantId" during setup for filtering to work.
app.post("/api/vectors/upsert", async (c) => {
  const tenantId = c.get("tenantId");
  const { id, text, metadata = {} } = await c.req.json();
  const embedding = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
  await c.env.VECTOR_INDEX.upsert([{
    id: `${tenantId}:${id}`, // Prefix ID with tenant for uniqueness
    values: embedding.data[0],
    metadata: { ...metadata, tenantId }, // Always stamp tenant
  }]);
  return c.json({ upserted: id });
});

app.post("/api/vectors/query", async (c) => {
  const tenantId = c.get("tenantId");
  const { query, topK = 5 } = await c.req.json();
  const embedding = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
  // Server-enforced tenant filter — client cannot bypass
  const results = await c.env.VECTOR_INDEX.query(embedding.data[0], {
    topK,
    filter: { tenantId },
  });
  return c.json(results);
});

// Hyperdrive — query external Postgres
app.post("/api/external-db/query", async (c) => {
  const { sql, params } = await c.req.json();
  // Use Hyperdrive connection string with any Postgres driver
  const connectionString = c.env.POSTGRES.connectionString;
  // Implementation depends on your Postgres client of choice
  return c.json({ connectionString: "available", note: "Use with pg, drizzle, or prisma" });
});

// Analytics Engine — write custom metrics
app.post("/api/analytics/event", async (c) => {
  const event = await c.req.json();
  c.env.ANALYTICS.writeDataPoint({
    blobs: [event.type, event.tenantId || "", event.metadata || ""],
    doubles: [event.value || 0],
    indexes: [event.tenantId || "global"],
  });
  return c.json({ recorded: true });
});

// Pipelines — stream events to Iceberg tables
app.post("/api/pipeline/ingest", async (c) => {
  const events = await c.req.json();
  await c.env.EVENT_PIPELINE.send(Array.isArray(events) ? events : [events]);
  return c.json({ ingested: true });
});

export default app;
```

### services/queues/src/index.ts
```typescript
export default {
  async queue(batch: MessageBatch<unknown>, env: Env) {
    const queueName = batch.queue;

    switch (queueName) {
      case "foundation-audit":
        for (const msg of batch.messages) {
          const event = msg.body as Record<string, unknown>;
          await env.DB.prepare(
            "INSERT INTO audit_log (event_type, payload, created_at) VALUES (?, ?, datetime('now'))"
          ).bind(event.type, JSON.stringify(event)).run();

          // Also stream to Pipelines for long-term analytics in Iceberg
          await env.EVENT_PIPELINE.send([{
            ...event,
            source: "audit",
            ingested_at: new Date().toISOString(),
          }]);
          msg.ack();
        }
        break;

      case "foundation-notifications":
        for (const msg of batch.messages) {
          const notif = msg.body as { type: string; to: string; subject: string; body: string };
          if (notif.type === "email") {
            await env.SEND_EMAIL.send({
              to: [{ email: notif.to }],
              from: { email: "notifications@yourdomain.com", name: "Foundation" },
              subject: notif.subject,
              text: notif.body,
            });
          }
          msg.ack();
        }
        break;

      case "foundation-analytics":
        for (const msg of batch.messages) {
          const event = msg.body as Record<string, unknown>;
          env.ANALYTICS.writeDataPoint({
            blobs: [String(event.type), String(event.tenantId || "")],
            doubles: [Number(event.value) || 1],
            indexes: [String(event.tenantId || "global")],
          });
          msg.ack();
        }
        break;

      case "foundation-webhooks":
        for (const msg of batch.messages) {
          const webhook = msg.body as { url: string; payload: unknown; headers?: Record<string, string> };
          try {
            // SSRF protection: Only allow webhook destinations registered per-tenant in D1.
            // Never dispatch to arbitrary user-provided URLs from queue messages.
            const destUrl = new URL(webhook.url);
            const allowed = await env.DB.prepare(
              "SELECT 1 FROM webhook_destinations WHERE tenant_id = ? AND hostname = ?"
            ).bind(webhook.payload?.["tenantId"] ?? "", destUrl.hostname).first();
            if (!allowed) {
              console.error(`Webhook SSRF blocked: ${destUrl.hostname} not in allowlist`);
              msg.ack(); // Don't retry blocked destinations
              continue;
            }
            const response = await fetch(webhook.url, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...webhook.headers },
              body: JSON.stringify(webhook.payload),
            });
            if (response.ok) {
              msg.ack();
            } else {
              msg.retry({ delaySeconds: 30 });
            }
          } catch {
            msg.retry({ delaySeconds: 60 });
          }
        }
        break;
    }
  },
};
```

---

## DEPLOYMENT SCRIPT

### scripts/deploy-all.sh
```bash
#!/bin/bash
set -euo pipefail

echo "=== Cloudflare Foundation — Full Deployment ==="
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Build shared packages
echo "🔨 Building shared packages..."
pnpm --filter @foundation/shared build
pnpm --filter @foundation/db build

# 3. Run codegen for extensions
echo "🔧 Running extension codegen..."
npx tsx scripts/codegen-extensions.ts

# 4. Run Drizzle migrations
echo "🗄️ Running D1 migrations..."
cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote && cd ../..

# 5. Deploy services in dependency order
echo ""
echo "🚀 Deploying services..."

echo "  → Deploying queue consumers..."
cd services/queues && npx wrangler deploy && cd ../..

echo "  → Deploying workflows..."
cd services/workflows && npx wrangler deploy && cd ../..

echo "  → Deploying agents..."
cd services/agents && npx wrangler deploy && cd ../..

echo "  → Deploying API gateway..."
cd services/gateway && npx wrangler deploy && cd ../..

echo "  → Deploying cron workers..."
cd services/cron && npx wrangler deploy && cd ../..

echo "  → Building and deploying UI..."
cd services/ui && pnpm run build && npx wrangler deploy && cd ../..

echo ""
echo "✅ All services deployed!"
echo ""
echo "Services:"
echo "  UI:       https://foundation-ui.<account>.workers.dev"
echo "  Gateway:  https://foundation-gateway.<account>.workers.dev"
echo "  Agents:   https://foundation-agents.<account>.workers.dev"
echo "  MCP:      https://foundation-agents.<account>.workers.dev/mcp"
```

---

## COMPLETE CLOUDFLARE PRIMITIVE UTILIZATION CHECKLIST

| Primitive | Binding/Service | Where Used | Purpose |
|-----------|----------------|------------|---------|
| **Workers** | (runtime) | All services | Serverless compute |
| **Workers Assets** | `assets.directory` | UI service | Static file serving |
| **Durable Objects** | `CHAT_AGENT`, etc. | Agent service | Stateful agents |
| **Agents SDK** | `Agent`, `AIChatAgent`, `McpAgent` | Agent service | Agent lifecycle, state sync, scheduling |
| **MCP Server** | `McpAgent.serve()` | Agent service | External tool exposure |
| **MCP Client** | `this.addMcpServer()` | Agent service | Consume external MCP servers |
| **Workflows** | `ONBOARDING_WORKFLOW`, etc. | Workflow service | Durable multi-step execution |
| **D1** | `DB` | Gateway, Agents, Workflows | SQLite relational data |
| **KV** | `RATE_LIMIT_KV`, `SESSION_KV`, `CACHE_KV` | Gateway | Rate limits, sessions, cache |
| **R2** | `FILES`, `ASSETS` | Gateway, Agents | Object storage |
| **Queues** | `AUDIT_QUEUE`, `NOTIFICATION_QUEUE`, `ANALYTICS_QUEUE`, `WEBHOOK_QUEUE` | All producers → Queue consumers | Async messaging |
| **Workers AI** | `AI` | Agents, Gateway | On-edge inference |
| **AI Gateway** | `AI_GATEWAY` | Agents | Multi-provider routing, caching, observability |
| **AI Search** | `AI.autorag()` | Agents, Gateway | Managed RAG / semantic search. **Tenant isolation**: Use folder-based metadata filters — each tenant's knowledge base lives under a dedicated R2 prefix (e.g., `tenants/{tenantId}/knowledge/`). AI Search indexes per-prefix, and agents filter by tenant metadata during retrieval. |
| **Vectorize** | `VECTOR_INDEX` | Gateway, Agents | Vector embeddings DB |
| **Hyperdrive** | `POSTGRES` | Gateway | External Postgres acceleration |
| **Browser Rendering** | `BROWSER` | Agents | Headless Playwright |
| **Sandbox SDK** | `SANDBOX` | Agents | Isolated code execution |
| **Containers** | (via Sandbox) | Agents | Long-running compute |
| **Email Service** | `SEND_EMAIL` | Gateway, Agents, Workflows, Queues | Transactional email |
| **Email Routing** | `email` handler | Separate Worker | Inbound email processing (⚠️ `onEmail()` in Agents SDK — verify availability; fallback: dedicated Email Routing Worker) |
| **Pipelines** | `EVENT_PIPELINE` | Gateway, Queues | Stream events → Iceberg |
| **R2 Data Catalog** | (via Pipelines) | Analytics | Managed Apache Iceberg |
| **R2 SQL** | (via wrangler/API) | Analytics | Query Iceberg tables |
| **Analytics Engine** | `ANALYTICS` | Gateway, Queues | Custom metrics / time-series |
| **Service Bindings** | `GATEWAY`, `AGENT_SERVICE`, `WORKFLOW_SERVICE` | UI ↔ Gateway ↔ Agents | Zero-cost inter-Worker calls |
| **Cron Triggers** | `triggers.crons` | Cron service | Scheduled jobs |
| **Workers Builds** | (CI/CD) | GitHub integration | Automatic deployments |
| **Observability** | `observability.enabled` | All services | Logs, traces, metrics |
| **React Router v7** | Framework mode | UI service | Full-stack SSR/SPA |
| **Cloudflare Vite Plugin** | `@cloudflare/vite-plugin` | UI service | Dev experience |
| **Workers for Platforms** | (optional) | Multi-tenant isolation | Per-tenant Worker isolation |

---

## WHAT TO BUILD FIRST

Execute in this exact order:

**Phase 0: Infrastructure (run setup scripts)**
- Create D1 databases, KV namespaces, R2 buckets, Queues, Pipelines, AI Search instances
- Populate Secrets Store with API keys (OpenAI, Anthropic, JWT signing keys)
- These must exist before any `wrangler deploy` can succeed

**Phase 1: Shared packages**
1. **`packages/shared`** — Types, schemas, constants
2. **`packages/db`** — Drizzle schema + initial migration

**Phase 2: Backend services (deploy in dependency order)**
3. **`services/queues`** — Queue consumers (no dependencies)
4. **`services/workflows`** — Workflow definitions (must deploy before agents if using AgentWorkflow)
5. **`services/agents`** — Agent classes + MCP server (the brain)
6. **`services/gateway`** — Hono API gateway (the spine)
7. **`services/cron`** — Scheduled jobs

**Phase 3: Frontend**
8. **`services/ui`** — React Router v7 frontend (the face)

**Phase 4: Tooling**
9. **`scripts/`** — Setup scripts, deployment, codegen
10. **`extensions/`** — Example extension with manifest

---

## QUALITY REQUIREMENTS

- **TypeScript strict mode** everywhere. No `any` types.
- **Zod validation** on all API inputs and queue message payloads.
- **Correlation IDs** on every request (generated in gateway, propagated via headers).
- **Tenant isolation** — every D1 query, R2 key, KV key, and Vectorize filter MUST be scoped by tenant ID.
- **Audit logging** — all mutations write to AUDIT_QUEUE.
- **Error boundaries** — every tool, every route, every queue consumer wrapped in try/catch with structured error logging. Additionally, if your Agents SDK version supports native `onError` hook and client-side `onStateUpdateError` callback, use those to centralize error reporting and state rollback rather than manual try/catch in every method.
- **Wrangler config** — use `.jsonc` or `.toml` consistently across all services. This prompt uses `.jsonc` for examples.
- **compatibility_date: "2025-09-25"** on every service.
- **pnpm workspace** — no npm, no yarn.
- Each service must have a working `wrangler dev` command for local development.
- **Workers Logs** — `observability.enabled: true` on every service for structured logging and tracing.

---

## SECURITY: CLOUDFLARE ACCESS / ZERO TRUST

For production deployments, protect admin and API routes with Cloudflare Access:

```
Gateway Worker routes:
  /health                → Public (no auth)
  /api/agents/*          → JWT + Tenant middleware (application auth)
  /api/workflows/*       → JWT + Tenant middleware (application auth)
  /admin/*               → Cloudflare Access policy (Zero Trust SSO)
  /mcp                   → OAuth (MCP spec requires it)

Recommended Access policies:
  - Admin routes: Require corporate IdP (Okta, Google Workspace, Azure AD)
  - API routes: Service tokens for server-to-server, JWT for user sessions
  - MCP endpoint: OAuth 2.1 via Cloudflare Access or custom provider
```

Configure via Cloudflare Dashboard → Zero Trust → Access → Applications, or via Terraform. Access runs at the edge before your Worker code executes — zero additional latency for allowed requests.

### Secrets Management: Cloudflare Secrets Store

Sensitive keys (OpenAI, Anthropic, JWT signing keys) should use the **Cloudflare Secrets Store** (beta) rather than per-Worker `wrangler secret put`:
- **Account-level secrets**: A single secret bound to multiple services — no duplication across the monorepo
- **Rotation**: Update once, propagates to all bound Workers
- **Access control**: Secrets Store Admin role limits who can read/write secrets
- **Binding**: `{ "binding": "MY_SECRET", "secret": "account-level-secret-name" }` in wrangler config

For development, use `.dev.vars` files (gitignored) or `wrangler secret put` as fallback.

---

## COST MODEL AND BILLING GUARDRAILS

Understanding billing is critical for multi-tenant platforms. Key cost drivers:

| Primitive | Billing Model | Key Guardrails |
|-----------|--------------|----------------|
| **Workers** | Requests + CPU time (bundled or unbound) | Set `max_cpu_ms` per request; use unbound for AI workloads |
| **Durable Objects** | Requests ($0.15/M) + Duration ($12.50/M GB-s) + Storage ($0.20/GB) | Use WebSocket hibernation (`this.ctx.acceptWebSocket()`) to avoid duration charges during idle |
| **D1** | Reads ($0.001/M) + Writes ($1.00/M) + Storage ($0.75/GB) | Batch writes; use KV for read-heavy lookups |
| **KV** | Reads ($0.50/M) + Writes ($5.00/M) + Storage ($0.50/GB) | Cache in Worker memory for hot keys; TTL aggressively |
| **R2** | Storage ($0.015/GB) + Class A ops ($4.50/M) + Class B ops ($0.36/M) | Zero egress; prefer over S3 for all file storage |
| **Queues** | Operations ($0.40/M) | Batch messages; use max_batch_size |
| **Workers AI** | Neurons (varies by model) | Set max_tokens; prefer smaller models for classification |
| **AI Gateway** | Free (observability layer) | Always use — gives cost tracking per-model |
| **Vectorize** | Queried dims ($0.01/M) + Stored dims ($0.05/100M) | Filter by tenant to reduce query dimensions |
| **Workflows** | Per step + duration | Minimize step count; batch operations within steps |
| **Browser Rendering** | Included with paid Workers | Set page.setDefaultTimeout(); close browsers promptly |
| **Sandbox / Containers** | CPU time + memory | Set execution timeouts; limit concurrent sandboxes per tenant |

**Cost guardrail patterns:**
- Per-tenant rate limiting — two options: (1) **KV-based**: global consistency, custom logic, higher cost at scale; (2) **Workers Rate Limiting API binding**: locality-scoped, eventually consistent, lower cost, built-in Wrangler config (requires Wrangler v4.36.0+). Choose based on your accuracy needs. AI Gateway also provides sliding-window rate limiting for inference calls.
- `max_tokens` caps on all AI inference calls
- Browser Rendering timeouts (30s default, never unlimited)
- Sandbox execution limits (CPU time + memory caps)
- Queue Dead Letter Queues to prevent retry storms
- DO hibernation for all WebSocket agents (reduces duration billing 10-100x)
- AI Gateway caching enabled (eliminates duplicate inference costs)

---

## OBSERVABILITY AND OPERATIONS

### Workers Logs
All services have `observability.enabled: true` which activates Workers Logs (structured logs, traces, metrics in Cloudflare dashboard).

### Analytics Engine
Custom business metrics via `writeDataPoint()` — use for tenant activity, feature usage, billing counters.

### AI Gateway Dashboard
All AI inference routed through AI Gateway gets automatic:
- Request/response logging
- Token usage tracking
- Cost attribution per model/provider
- Latency percentiles
- Cache hit rates

### Recommended operational practices:
- Correlation IDs on every request (generated in gateway, propagated via headers)
- Structured JSON logging in all Workers (automatically captured by Workers Logs)
- Audit trail in D1 + Pipelines (real-time in D1, long-term in Iceberg via Pipelines)
- Error alerting via Cloudflare Notifications (configure in dashboard)

### Chain-of-Thought Audit Trail (OTel Traces + Logpush)
For agentic systems, knowing *what* happened matters less than knowing *why*. Enable OTel-compatible traces with high sampling rates on Agent DOs to capture the full sequence of tool calls and LLM reasoning steps as trace spans. Push these via **Workers Logpush** to R2 for long-term retention. This creates a "black box flight recorder" for the agentic fleet — essential for debugging, compliance, and cost attribution.

```
Agent DO receives message
  └─ Trace Span: "chat_completion"
       ├─ Span: "tool_call:searchKnowledge" (42ms)
       ├─ Span: "tool_call:queryDatabase" (15ms)
       ├─ Span: "llm_inference:gpt-4o" (1200ms, 850 tokens)
       └─ Span: "state_update:ui_sync" (2ms)
```

Configure Logpush destination to R2 bucket → query with R2 SQL for cross-tenant analytics.

---

## PACKAGE VERSION VERIFICATION

Before building, verify these packages exist at the specified versions on npm:

```bash
# Run this to verify all critical packages
npm view agents versions --json | tail -5
npm view @cloudflare/sandbox versions --json | tail -5
npm view @cloudflare/puppeteer versions --json | tail -5
npm view ai versions --json | tail -5
npm view @ai-sdk/react versions --json | tail -5
npm view ai-gateway-provider versions --json | tail -5
npm view workers-ai-provider versions --json | tail -5
npm view hono versions --json | tail -5
```

If a package version doesn't exist yet (pre-release/beta), pin to `latest` and document the risk. The Agents SDK (`agents`) and AI SDK (`ai`) are the most likely to have version mismatches — always verify before `pnpm install`.

---

## WHAT THIS PROMPT DOES NOT COVER (extend later)

- Auth provider integration (Clerk, Auth0, Lucia) — add as extension
- Workers for Platforms multi-tenant isolation — add when needed
- R2 Event Notifications → Queue triggers — configure in dashboard
- Custom domains + DNS — configure in dashboard
- WAF rules, DDoS protection, Bot Management — configure in dashboard
- Cloudflare Tunnel for hybrid connectivity — configure separately
- **Workers VPC** — private network access for Hyperdrive and internal APIs; use when private connectivity is required
- Terraform/Pulumi IaC — add as needed
- Load testing / performance benchmarks
- Inbound Email Routing Worker example — use `routeAgentEmail(message, env, { resolver })` with address-based or secure-reply resolver patterns. Requires email routing secret in env.
- CI/CD pipeline with Workers Builds + GitHub Actions — define build commands per service, `wrangler types` generation, secrets injection per environment
- **Local dev orchestration** — running multiple `wrangler dev` processes with consistent ports and cross-service URLs. Service bindings work locally but require coordinated startup.
- **Per-service Env types** — `wrangler types` generates per-service bindings for least-privilege; global Env type is for reference only
- **Pipelines stream/schema definitions** — stream IDs, pipeline SQL transforms, and sink targets as managed infrastructure

---

**END OF PROMPT. Ship it.**
