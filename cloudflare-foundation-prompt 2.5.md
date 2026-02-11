# CLOUDFLARE AGENTIC FOUNDATION — Claude Code Master Prompt

> **Version**: 2.5 | **Platform**: Cloudflare Developer Platform (2025-2026) | **Last verified**: February 2026
> **Purpose**: Build a production-grade, multi-tenant agentic application foundation using EVERY relevant Cloudflare primitive. This is meant to be forked and extended for any SaaS, AI agent, or full-stack application.
> **Changelog v2.1**: Softened Constraint 1 (same-Worker possible, separation recommended); support both wrangler.toml and .jsonc; marked unverified SDK features; added Zero Trust, Cost Model, Observability, Package Verification sections.
> **Changelog v2.2**: Added `run_worker_first` for UI assets; deterministic agent IDs (not random UUIDs); `validateStateChange()` for server-side state validation; readonly connections; Agent↔Workflow symbiosis pattern; Sandbox R2 persistence; Secrets Store; MCP OAuth provider + deferred tool loading; OTel chain-of-thought traces + Logpush; AI Search tenant isolation via folder filters; phased build/deploy order; native error hooks.
> **Changelog v2.3**: Fixed Browser Rendering API (`puppeteer.launch(env.BROWSER)` not `env.BROWSER.launch()`); fixed Sandbox code execution (write-to-file, not shell quoting); removed incorrect `ai_gateway` binding (use `env.AI` with gateway options); fixed agent routing path rewrite (`/api/agents/*` → `/agents/*`); added `main` entry to UI wrangler for SSR; added `host` to `useAgent` for cross-origin; fixed SQL injection via table allowlist; fixed webhook SSRF via destination allowlist; enforced server-side tenant filters on Vectorize and AI Search; added cross-script workflow bindings to gateway; rewrote Constraint 6 (no filesystem discovery, bundled imports fine); raised Wrangler pin to ^4.36.0; added per-service Env types note; added Workers VPC, local dev, Email Routing to not-covered.
> **Changelog v2.4**: **Platform Audit Edition** — 18 primitive categories (up from 12); upgraded to 10-plane architecture (up from 8); replaced React Router v7 with SvelteKit + @sveltejs/adapter-cloudflare (LAW 8); added 6 NEW primitive categories (Realtime/Calls, Turnstile, Data Platform/Analytics Engine, Email Service send+receive, Agents SDK Workflows/McpAgent, Media/Images/Stream); added 8 architecture improvements from alternative-architecture evaluation (TenantDO rate limiting, gateway-signed context tokens, DO naming taxonomy, audit hash chain, doc-backed Sandbox config, container rolling deploy, correlation ID propagation, community admin tooling); added SvelteKit binding access patterns via `event.platform.env`; added Turnstile integration for public forms; added Analytics Engine metering patterns; comprehensive wrangler.jsonc binding reference table; added NOT-COVERED section for Calls WebRTC and Stream video.
> **Changelog v2.5**: **Capability-complete edition** — Cloudflare Images Workers binding (Plane 9: `env.IMAGES.transform()`, `.draw()`, `.output()`, `.info()`); Workers Rate Limiting binding documented as alternative to KV/DO; Queues Event Subscriptions (R2, KV, Workers AI, Workflows, Vectorize → Queue); automatic resource provisioning (wrangler 4.45+); Phase 0: Secrets Store + AI Gateway BYOK; ephemeral node:fs/Web File System note (Constraint 6); Browser Rendering: Playwright and Puppeteer both supported; custom Queue retention (60s–14 days); Python Workflows (beta) note; Workers VPC (beta) one-liner in NOT COVERED; packages/db schema includes audit-chain.ts; checklist rows for Images binding and Rate Limiting binding; deployment note for optional auto-provisioning.

---

## MISSION

Build `cloudflare-foundation` — a pnpm monorepo that serves as a **production-ready starter architecture** utilizing the full Cloudflare Developer Platform. It must be immediately deployable, correctly wired, and extensible. Every binding, every SDK, every primitive — used where it belongs.

This foundation is NOT a toy. It is the base layer for shipping real products. Treat it accordingly.

---

## ARCHITECTURE OVERVIEW (10-PLANE)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLANE 1: UI                                  │
│  SvelteKit + @sveltejs/adapter-cloudflare + Workers Static Assets   │
│  Real-time: useAgent / custom Svelte stores from agents SDK         │
│  Turnstile on all public forms                                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Service Binding
┌──────────────────────────▼──────────────────────────────────────────┐
│                     PLANE 2: API GATEWAY                            │
│  Hono on Workers — auth, rate limiting, routing, CORS               │
│  Gateway-signed context tokens for tenant propagation               │
│  Correlation ID injection on every request                          │
│  Forwards to Agent plane via DO bindings + Workflow dispatch         │
└───────┬──────────────┬───────────────┬──────────────────────────────┘
        │              │               │
┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────────────────────────────┐
│ PLANE 3:     │ │ PLANE 4:  │ │ PLANE 5: DATA & STORAGE             │
│ AGENTS       │ │ WORKFLOWS │ │ D1 (Drizzle), KV, R2, Vectorize,   │
│ Agent SDK    │ │ Durable   │ │ Hyperdrive, AI Search, Pipelines,   │
│ (DO-backed)  │ │ Execution │ │ R2 Data Catalog, R2 SQL             │
│ + MCP Server │ │ w/ Retries│ │                                     │
│ + TenantDO   │ │ Agent↔WF  │ │                                     │
│   rate limit │ │ RPC       │ │                                     │
└───────┬──────┘ └─────┬─────┘ └──────────────────────────────────────┘
        │              │
┌───────▼──────────────▼──────────────────────────────────────────────┐
│                     PLANE 6: ISOLATION                               │
│  Sandbox SDK (@cloudflare/sandbox) for untrusted code execution     │
│  Browser Rendering (Puppeteer or Playwright) for scraping/screenshots│
│  Containers (doc-backed config) for long-running compute            │
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
│  Calls/WebRTC (SFU) for real-time audio/video (future)              │
└─────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│                     PLANE 9: MEDIA & TRANSFORMATION                 │
│  Cloudflare Images (Workers binding: transform, draw, output, info)│
│  Stream (video upload, encode, deliver, live) (future)             │
└─────────────────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────────┐
│                     PLANE 10: OBSERVABILITY                         │
│  Analytics Engine (custom metrics, billing metering)                │
│  Workers Logs (structured logs, OTel traces)                        │
│  Logpush → R2 (audit trail, compliance, long-term retention)        │
│  AI Gateway Dashboard (token tracking, cost attribution)            │
│  Audit hash chain (immutable, tamper-evident event log)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL ARCHITECTURE CONSTRAINTS

These are non-negotiable. Violating any will cause build or deploy failures.

### Constraint 1: Separate Workers for UI and Agents (Recommended)
While it's technically possible to co-locate Durable Objects and SvelteKit in the same Worker, this foundation **recommends separate Workers** for production multi-agent architectures:
- **Independent deployment**: Agents iterate faster than UI — don't redeploy everything for a prompt change
- **Memory isolation**: A runaway agent shouldn't crash the UI
- **Separate observability**: Different log streams, different error budgets
- **Security boundaries**: Agents have elevated bindings (Sandbox, Browser) that UI shouldn't access directly

> **For simple apps**: A single Worker with Durable Objects + SvelteKit is fine. This prompt is for **production multi-tenant platforms** where separation of concerns matters.

- **UI Worker**: SvelteKit + `@sveltejs/adapter-cloudflare` + Workers Static Assets (static files)
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

**Readonly connections (SDK ≥ 0.4.0 — verify)**: For dashboard/monitoring views, upgrade WebSocket connections with a readonly flag.

**SQLite as zero-latency memory**: The embedded SQLite (`this.sql`) has no network traversal — it's co-located with the DO. Use it for agent memory, chain-of-thought logs, and tool call history. Only sync minimal UI state to clients via `this.setState()`.

### Constraint 3: Sandbox SDK ≠ Raw Containers
`@cloudflare/sandbox` is a HIGH-LEVEL abstraction over Containers. Use `getSandbox()`, `sandbox.exec()`, `sandbox.writeFile()`, `sandbox.readFile()`.
- Requires a **Dockerfile** in the sandbox service directory
- Requires **Docker running locally** for `wrangler dev`
- Do NOT use raw Container APIs when Sandbox SDK is available

**Sandbox persistence**: Mount tenant-specific R2 bucket to `/workspace` so files persist across container restarts.

**Doc-backed configuration (v2.4 NEW)**: Store container configuration as versioned documents in R2 (`containers/{tenantId}/config.json`). This enables: deterministic provisioning, audit trail of config changes, rollback via R2 versioning. Never hardcode container config in wrangler.jsonc.

**Cost optimization**: For simple code execution (evaluating a JS snippet or Python function), consider whether Workers runtime execution is sufficient before spinning up a full container.

### Constraint 4: Wrangler Configuration Format
Wrangler supports both `wrangler.toml` (TOML) and `wrangler.jsonc` (JSON with comments). Both are fully supported.
- **`wrangler.toml`**: The traditional default, used in most Cloudflare documentation and templates
- **`wrangler.jsonc`**: Supported since Wrangler v3+, offers JSON Schema validation, better IDE autocomplete

This prompt uses `.jsonc` for examples (enables `$schema` for validation), but `.toml` is equally valid. Pick one format and be consistent across all services.

### Constraint 5: Multi-Worker Deployment
Each service is a separate Worker with its own wrangler config and `package.json`. Deploy via pnpm workspace scripts, NOT a single `wrangler deploy`.

### Constraint 6: No Runtime Filesystem-Based Module Discovery
Workers has no filesystem at runtime — you cannot `fs.readdir()` to discover and load modules dynamically. However, bundled `import()` (dynamic imports resolved at build time) works fine. The constraint is: **extension registration must be resolved at build time** via a code generation step.

**Ephemeral node:fs (v2.5)**: With `nodejs_compat` and compatibility_date `2025-09-01` or later, Workers provide a request-scoped virtual filesystem: `/tmp` (writable, not persistent across requests), `/bundle` (read-only). Use for staging files or temp data within a single request; do not rely on it for module discovery or cross-request state.

### Constraint 7: compatibility_date
Must be `"2025-09-25"` or later. Required for Browser Rendering (Playwright), latest Node.js compatibility, and all 2025 features.

### Constraint 8: SvelteKit for All Frontend (v2.4 NEW)
All user-facing interfaces **MUST** use SvelteKit with `@sveltejs/adapter-cloudflare` deploying to Workers Static Assets. No React. No Next.js. No React Router.

- Use `event.platform.env` to access Cloudflare bindings in server-side code (+server.ts, +page.server.ts, hooks.server.ts)
- Type bindings via `src/app.d.ts` with `@cloudflare/workers-types`
- Use Wrangler v4 for local dev: `wrangler dev .svelte-kit/cloudflare/_worker.js`
- The adapter-cloudflare-workers package is DEPRECATED — use adapter-cloudflare only

```typescript
// src/app.d.ts
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        KV: KVNamespace;
        FILES: R2Bucket;
        // ... all bindings
      };
    }
  }
}
```

```typescript
// src/routes/api/data/+server.ts
import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
  const db = platform!.env.DB;
  const results = await db.prepare('SELECT * FROM items WHERE tenant_id = ?')
    .bind(tenantId).all();
  return json(results.results);
}
```

### Constraint 9: DO Naming Taxonomy (v2.4 NEW)
All Durable Object instance IDs **MUST** follow a consistent naming convention for debuggability and tenant isolation:

```
Pattern: {tenantId}:{purpose}:{identifier}
Examples:
  tenant-abc:chat:user-123         → Chat agent for user 123 in tenant abc
  tenant-abc:rate-limit:api        → Rate limiter DO for tenant abc
  tenant-abc:session:sess-xyz      → Session state for session xyz
  global:admin:metrics             → Global admin metrics DO
```

This prevents orphaned DOs, enables tenant-scoped cleanup, and makes Durable Object debugging in the dashboard meaningful.

### Constraint 10: Gateway-Signed Context Tokens (v2.4 NEW)
The API Gateway **MUST** sign tenant context into a short-lived JWT (HS256, 60s TTL) before forwarding requests to downstream services. Downstream Workers verify this token instead of re-running auth logic.

```typescript
// Gateway middleware — sign context after auth
const contextToken = await signJWT({
  tenantId, userId, plan, permissions,
  exp: Math.floor(Date.now() / 1000) + 60, // 60s TTL
}, env.CONTEXT_SIGNING_KEY);

// Inject into forwarded request
headers.set('X-Context-Token', contextToken);
```

This eliminates redundant auth calls, ensures all downstream services see identical tenant context, and prevents privilege escalation via header manipulation.

---

## REQUIRED PACKAGES AND EXACT VERSIONS

```jsonc
// Root package.json devDependencies
// Use wrangler ^4.45.0+ for optional automatic D1/KV/R2 provisioning on first deploy
{
  "wrangler": "^4.36.0",
  "typescript": "^5.7.0"
}

// Agent/Backend Worker — Browser Rendering: use @cloudflare/puppeteer OR @cloudflare/playwright (Playwright requires compat 2025-09-15+)
{
  "agents": "^0.3.0",                          // Agents SDK (Agent, McpAgent, AIChatAgent)
  "@cloudflare/sandbox": "latest",              // Sandbox SDK
  "@cloudflare/puppeteer": "^1.0.4",           // Browser Rendering (Puppeteer)
  "@cloudflare/playwright": "^1.1.0",          // Browser Rendering (Playwright alternative; compat 2025-09-15+)
  "hono": "^4.0.0",                            // API framework
  "ai": "^6.0.0",                              // Vercel AI SDK v6 (required by Agents SDK)
  "ai-gateway-provider": "^3.0.0",             // AI Gateway provider for AI SDK
  "workers-ai-provider": "^3.0.0",             // Workers AI provider for AI SDK
  "@modelcontextprotocol/sdk": "latest",        // MCP SDK
  "drizzle-orm": "latest",                     // ORM for D1
  "drizzle-kit": "latest",                     // Migration tooling
  "zod": "^3.23.0"                             // Schema validation
}

// UI Worker (SvelteKit)
{
  "@sveltejs/kit": "latest",
  "@sveltejs/adapter-cloudflare": "latest",
  "svelte": "^5.0.0",
  "@cloudflare/workers-types": "latest",
  "agents": "^0.3.0"                           // For agent connection hooks
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
│   │       ├── types/
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
│       │   ├── audit-chain.ts            # v2.4/v2.5: tamper-evident audit chain table
│       │   └── index.ts
│       └── migrations/
│
├── services/
│   ├── ui/                               # PLANE 1: SvelteKit UI
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── app.d.ts                  # Cloudflare binding types
│   │   │   ├── app.html
│   │   │   ├── hooks.server.ts           # Auth, tenant resolution
│   │   │   ├── lib/
│   │   │   │   ├── server/
│   │   │   │   │   └── db.ts             # Drizzle D1 client
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatPanel.svelte  # Agent chat integration
│   │   │   │   │   └── AgentStatus.svelte
│   │   │   │   └── stores/
│   │   │   │       └── agent.ts          # Svelte stores for agent state
│   │   │   └── routes/
│   │   │       ├── +layout.svelte
│   │   │       ├── +page.svelte
│   │   │       ├── dashboard/
│   │   │       │   └── +page.svelte
│   │   │       ├── chat/
│   │   │       │   └── +page.svelte      # Real-time agent chat
│   │   │       └── api/
│   │   │           └── [...path]/+server.ts  # Proxy to gateway
│   │   └── static/
│   │
│   ├── gateway/                          # PLANE 2: API Gateway (Hono)
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Hono app entry
│   │       ├── middleware/
│   │       │   ├── auth.ts               # JWT / API key validation
│   │       │   ├── rate-limit.ts         # KV-based or Workers Rate Limiting API
│   │       │   ├── cors.ts
│   │       │   ├── tenant.ts             # Tenant resolution
│   │       │   ├── context-token.ts      # Gateway-signed context tokens (v2.4)
│   │       │   ├── turnstile.ts          # Turnstile verification (v2.4)
│   │       │   └── correlation.ts        # Request ID injection
│   │       ├── routes/
│   │       │   ├── agents.ts
│   │       │   ├── workflows.ts
│   │       │   ├── search.ts
│   │       │   ├── data.ts
│   │       │   ├── email.ts
│   │       │   └── health.ts
│   │       └── lib/
│   │           ├── bindings.ts
│   │           ├── errors.ts
│   │           └── audit-chain.ts        # Audit hash chain (v2.4)
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
│   │       │   ├── session-agent.ts      # Agent — per-session state
│   │       │   └── rate-limit-do.ts      # TenantRateLimiter DO (v2.4)
│   │       ├── mcp/
│   │       │   ├── server.ts             # McpAgent — expose tools to MCP clients
│   │       │   └── tools/
│   │       │       ├── database.ts
│   │       │       ├── search.ts
│   │       │       ├── email.ts
│   │       │       └── sandbox.ts
│   │       ├── tools/                    # AI SDK tool definitions
│   │       │   ├── web-browse.ts
│   │       │   ├── code-exec.ts
│   │       │   ├── file-store.ts
│   │       │   └── db-query.ts
│   │       └── lib/
│   │           ├── ai-client.ts
│   │           └── sandbox-pool.ts
│   │
│   ├── workflows/                        # PLANE 4: Durable Workflows
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   └── src/
│   │       ├── index.ts
│   │       └── workflows/
│   │           ├── onboarding.ts
│   │           ├── data-pipeline.ts
│   │           ├── report-gen.ts
│   │           └── email-sequence.ts
│   │
│   ├── queues/                           # PLANE 8: Queue Consumers
│   │   ├── package.json
│   │   ├── wrangler.jsonc
│   │   └── src/
│   │       ├── index.ts
│   │       └── consumers/
│   │           ├── audit-log.ts          # Write to D1 + Pipelines + hash chain
│   │           ├── notifications.ts
│   │           ├── analytics.ts          # Stream to Analytics Engine
│   │           └── webhook-dispatch.ts
│   │
│   └── cron/                             # Scheduled Workers
│       ├── package.json
│       ├── wrangler.jsonc
│       └── src/
│           ├── index.ts
│           └── jobs/
│               ├── cleanup.ts
│               ├── ai-search-sync.ts
│               └── metrics-rollup.ts
│
├── extensions/                           # Extension point (auto-registered at build time)
│   └── example-extension/
│       ├── manifest.json
│       ├── tools.ts
│       └── routes.ts
│
├── scripts/
│   ├── codegen-extensions.ts
│   ├── deploy-all.sh
│   ├── setup-d1.sh
│   ├── setup-kv.sh
│   ├── setup-r2.sh
│   ├── setup-queues.sh
│   ├── setup-ai-search.sh
│   └── seed.ts
│
├── docker/
│   └── sandbox/
│       └── Dockerfile
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
  // SvelteKit adapter-cloudflare builds to .svelte-kit/cloudflare/
  "main": ".svelte-kit/cloudflare/_worker.js",
  "assets": {
    "directory": ".svelte-kit/cloudflare",
    "binding": "ASSETS",
    // Ensures Worker logic (auth, tenant resolution) runs before static asset serving.
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
  ],

  // v2.5: Cloudflare Images — in-Worker transform, draw, output, info (Plane 9)
  "images": { "binding": "IMAGES" }

  // Optional: Workers Rate Limiting binding (Wrangler 4.36+) — alternative to TenantRateLimiter DO or KV for simple limits
  // "rate_limit": { "binding": "RATE_LIMIT", "namespace_id": "RATE_LIMIT_NAMESPACE_ID", "limit": 100, "period": 60 }
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

  // Durable Objects — every agent class + TenantRateLimiter (v2.4)
  "durable_objects": {
    "bindings": [
      { "name": "CHAT_AGENT", "class_name": "ChatAgent" },
      { "name": "TASK_AGENT", "class_name": "TaskAgent" },
      { "name": "TENANT_AGENT", "class_name": "TenantAgent" },
      { "name": "SESSION_AGENT", "class_name": "SessionAgent" },
      { "name": "MCP_SERVER", "class_name": "FoundationMcpServer" },
      { "name": "RATE_LIMITER", "class_name": "TenantRateLimiter" }
    ]
  },

  // SQLite migrations for Agent DOs
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ChatAgent", "TaskAgent", "TenantAgent", "SessionAgent", "FoundationMcpServer", "TenantRateLimiter"] }
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

  // D1, R2, KV, Vectorize, Queues
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

  // Email
  "send_email": [
    { "binding": "SEND_EMAIL", "name": "SEND_EMAIL" }
  ],

  // Analytics Engine
  "analytics_engine_datasets": [
    { "binding": "ANALYTICS", "dataset": "foundation_events" }
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
  "observability": { "enabled": true },
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

> **Python Workflows (v2.5)**: Python Workflows are in open beta (Aug 2025) for polyglot teams; this template uses TypeScript Workflows.
>
> **Agent ↔ Workflow Symbiosis Pattern (SDK ≥ 0.3.7 — verify)**:
> The modern pattern integrates Workflows as durable execution arms of stateful Agents. If `AgentWorkflow` is available in your SDK version:
> - **Agent → Workflow**: Agent dispatches long-running work via `this.runWorkflow()`
> - **Workflow → Agent**: Workflow calls back to Agent via RPC stub (`this.agent.updateProgress(0.5)`)
> - **Human-in-the-loop**: Workflow pauses at `step.waitForApproval()`, Agent syncs approval request to UI via `setState()`, user approves, Agent resumes workflow

### services/queues/wrangler.jsonc
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "foundation-queues",
  "main": "src/index.ts",
  "compatibility_date": "2025-09-25",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  // v2.5: Custom retention 60s–14 days per queue (optional); default 4 days. Event Subscriptions (Aug 2025): subscribe to R2, KV, Workers AI, Workflows, Vectorize via Queues for event-driven pipelines.
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

**Queues Event Subscriptions (v2.5)**: As of Aug 2025, Queues can subscribe to events from R2, KV, Workers AI, Workflows, Vectorize, and other Cloudflare services. Use `wrangler queues subscription create` or the dashboard to create subscriptions (e.g. R2 object created → queue → Worker) for event-driven pipelines without polling.

---

## KEY IMPLEMENTATION FILES (v2.4 / v2.5 — SvelteKit + New Primitives)

### packages/shared/src/types/env.ts
```typescript
/**
 * GLOBAL Env type — contains ALL bindings across all services.
 * PRODUCTION: Generate per-service types via `wrangler types` in each service directory.
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
  RATE_LIMITER: DurableObjectNamespace; // v2.4: TenantRateLimiter DO

  // Storage
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  FILES: R2Bucket;
  ASSETS: R2Bucket;

  // v2.5: Cloudflare Images — in-Worker env.IMAGES.transform(), .draw(), .output(), .info() (Plane 9)
  IMAGES?: unknown;

  // AI — AI Gateway accessed via AI binding methods
  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  // Browser Rendering — binding is a Fetcher; use puppeteer.launch(env.BROWSER) or Playwright equivalent (compat 2025-09-15+ for Playwright)
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

  // Analytics (v2.4: promoted to Plane 10)
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

  // Secrets
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  CONTEXT_SIGNING_KEY: string;  // v2.4: gateway-signed context tokens
  TURNSTILE_SECRET: string;     // v2.4: Turnstile site verify
}
```

### services/ui/src/app.d.ts (v2.4 — SvelteKit)
```typescript
import type {
  D1Database, KVNamespace, R2Bucket, Fetcher
} from '@cloudflare/workers-types';

declare global {
  namespace App {
    interface Platform {
      env: {
        GATEWAY: Fetcher;
        DB: D1Database;          // Direct D1 for SSR data loading
        SESSION_KV: KVNamespace; // Session management in hooks
        FILES: R2Bucket;         // Direct file access for SSR
      };
    }
  }
}

export {};
```

### services/ui/svelte.config.js (v2.4)
```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

### services/ui/src/hooks.server.ts (v2.4 — SvelteKit Server Hooks)
```typescript
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Extract session from cookie
  const sessionId = event.cookies.get('session_id');
  if (sessionId && event.platform?.env) {
    const session = await event.platform.env.SESSION_KV.get(
      `session:${sessionId}`, 'json'
    );
    if (session) {
      event.locals.user = session;
      event.locals.tenantId = session.tenantId;
    }
  }

  const response = await resolve(event);
  return response;
};
```

### services/ui/src/routes/chat/+page.svelte (v2.4 — Svelte Agent Chat)
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let messages: Array<{ role: string; content: string; id: string }> = [];
  let input = '';
  let isLoading = false;
  let ws: WebSocket | null = null;

  // Deterministic agent ID: tenantId:userId:chat
  // Prevents orphaned DOs on page refresh (Constraint 9)
  const agentName = `${$page.data.tenantId}:${$page.data.userId}:chat`;

  onMount(() => {
    // Connect to agent via WebSocket through gateway
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${location.host}/api/agents/chat-agent/${agentName}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'state_update') {
        messages = data.state.messages || [];
      } else if (data.type === 'chat_response') {
        messages = [...messages, { role: 'assistant', content: data.content, id: crypto.randomUUID() }];
        isLoading = false;
      }
    };
  });

  onDestroy(() => ws?.close());

  function sendMessage() {
    if (!input.trim() || !ws) return;
    const msg = { role: 'user', content: input, id: crypto.randomUUID() };
    messages = [...messages, msg];
    ws.send(JSON.stringify({ type: 'chat_message', content: input }));
    input = '';
    isLoading = true;
  }
</script>

<div class="flex flex-col h-screen">
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#each messages as msg (msg.id)}
      <div class="p-3 rounded-lg {msg.role === 'user' ? 'bg-blue-100 ml-auto max-w-md' : 'bg-gray-100 max-w-2xl'}">
        <p class="text-sm whitespace-pre-wrap">{msg.content}</p>
      </div>
    {/each}
  </div>

  <form on:submit|preventDefault={sendMessage} class="p-4 border-t flex gap-2">
    <input bind:value={input} placeholder="Ask anything..." class="flex-1 border rounded-lg px-4 py-2" disabled={isLoading} />
    <button type="submit" disabled={isLoading} class="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">
      Send
    </button>
  </form>
</div>
```

### services/agents/src/agents/rate-limit-do.ts (v2.4 NEW — TenantDO Rate Limiter)
```typescript
import { DurableObject } from "cloudflare:workers";

/**
 * Per-tenant rate limiter as a Durable Object.
 * Advantages over KV-based rate limiting:
 * - Strongly consistent (no eventual-consistency race conditions)
 * - Single-threaded (no concurrent writes)
 * - Co-located with tenant's agent DOs (same jurisdiction)
 * - Supports sliding window, token bucket, and leaky bucket algorithms
 *
 * DO naming: {tenantId}:rate-limit:api (per Constraint 9)
 */
interface RateLimitState {
  requests: number[];   // Timestamps of recent requests
  windowMs: number;     // Sliding window size
  maxRequests: number;  // Max requests per window
}

export class TenantRateLimiter extends DurableObject<Env> {
  private state: RateLimitState = {
    requests: [],
    windowMs: 60_000,    // 1 minute default
    maxRequests: 100,    // 100 req/min default
  };

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/check') {
      return this.checkLimit();
    }

    if (url.pathname === '/configure') {
      const { windowMs, maxRequests } = await request.json() as Partial<RateLimitState>;
      if (windowMs) this.state.windowMs = windowMs;
      if (maxRequests) this.state.maxRequests = maxRequests;
      return new Response(JSON.stringify({ configured: true }));
    }

    return new Response('Not found', { status: 404 });
  }

  private checkLimit(): Response {
    const now = Date.now();
    const windowStart = now - this.state.windowMs;

    // Prune expired entries
    this.state.requests = this.state.requests.filter(ts => ts > windowStart);

    if (this.state.requests.length >= this.state.maxRequests) {
      const retryAfter = Math.ceil((this.state.requests[0]! + this.state.windowMs - now) / 1000);
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        retryAfter,
      }), {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(this.state.maxRequests),
          'X-RateLimit-Remaining': '0',
        }
      });
    }

    this.state.requests.push(now);
    const remaining = this.state.maxRequests - this.state.requests.length;

    return new Response(JSON.stringify({
      allowed: true,
      remaining,
    }), {
      headers: {
        'X-RateLimit-Limit': String(this.state.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
      }
    });
  }
}
```

### services/gateway/src/middleware/turnstile.ts (v2.4 NEW)
```typescript
import type { MiddlewareHandler } from "hono";

/**
 * Turnstile verification middleware for public-facing forms.
 * Apply to: signup, login, contact forms, any public POST endpoint.
 * Client-side: <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
 */
export function turnstileMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    // Only verify POST requests with Turnstile token
    if (c.req.method !== 'POST') return next();

    const body = await c.req.parseBody();
    const token = body['cf-turnstile-response'] as string;

    if (!token) {
      return c.json({ error: 'Turnstile token required' }, 400);
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: c.env.TURNSTILE_SECRET,
        response: token,
        remoteip: c.req.header('CF-Connecting-IP'),
      }),
    });

    const outcome = await result.json() as { success: boolean };
    if (!outcome.success) {
      return c.json({ error: 'Turnstile verification failed' }, 403);
    }

    await next();
  };
}
```

### services/gateway/src/lib/audit-chain.ts (v2.4 NEW — Immutable Audit Hash Chain)
```typescript
/**
 * Audit hash chain — every audit event includes hash of previous event.
 * Creates tamper-evident, immutable audit trail.
 * Stored in D1 with hash verification on read.
 */
export async function appendAuditEvent(
  db: D1Database,
  event: { type: string; tenantId: string; payload: unknown }
): Promise<string> {
  // Get hash of last event
  const lastEvent = await db.prepare(
    'SELECT hash FROM audit_chain WHERE tenant_id = ? ORDER BY seq DESC LIMIT 1'
  ).bind(event.tenantId).first<{ hash: string }>();

  const previousHash = lastEvent?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

  // Create hash of: previousHash + eventType + payload + timestamp
  const timestamp = Date.now();
  const data = `${previousHash}:${event.type}:${JSON.stringify(event.payload)}:${timestamp}`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await db.prepare(
    'INSERT INTO audit_chain (tenant_id, event_type, payload, previous_hash, hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(event.tenantId, event.type, JSON.stringify(event.payload), previousHash, hash, timestamp).run();

  return hash;
}

/**
 * Verify audit chain integrity for a tenant.
 * Returns true if chain is unbroken, false if tampered.
 */
export async function verifyAuditChain(db: D1Database, tenantId: string): Promise<boolean> {
  const events = await db.prepare(
    'SELECT * FROM audit_chain WHERE tenant_id = ? ORDER BY seq ASC'
  ).bind(tenantId).all();

  let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (const event of events.results) {
    const data = `${previousHash}:${event.event_type}:${event.payload}:${event.created_at}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    const expectedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedHash !== event.hash) return false;
    previousHash = event.hash as string;
  }

  return true;
}
```

### services/gateway/src/middleware/context-token.ts (v2.4 NEW)
```typescript
import type { MiddlewareHandler } from "hono";

/**
 * Gateway-signed context token middleware (Constraint 10).
 * Signs tenant context into JWT after auth, before forwarding downstream.
 */
export function contextTokenMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const plan = c.get('plan');

    if (tenantId) {
      // Sign context into short-lived JWT
      const payload = {
        tid: tenantId,
        uid: userId,
        plan,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60, // 60s TTL
      };

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(c.env.CONTEXT_SIGNING_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
      const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));

      c.req.raw.headers.set('X-Context-Token', `${header}.${body}.${sig}`);
    }

    await next();
  };
}
```

### services/agents/src/index.ts
```typescript
import { routeAgentRequest } from "agents";
import { ChatAgent } from "./agents/chat-agent";
import { TaskAgent } from "./agents/task-agent";
import { TenantAgent } from "./agents/tenant-agent";
import { SessionAgent } from "./agents/session-agent";
import { TenantRateLimiter } from "./agents/rate-limit-do";
import { FoundationMcpServer } from "./mcp/server";

// Export all DO classes — required for Durable Object bindings
export { ChatAgent, TaskAgent, TenantAgent, SessionAgent, TenantRateLimiter, FoundationMcpServer };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // MCP endpoint (Streamable HTTP transport)
    if (url.pathname.startsWith("/mcp")) {
      return FoundationMcpServer.serve("/mcp").fetch(request, env, ctx);
    }

    // Agent WebSocket routing (for useAgent hooks)
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    return new Response("Agent service — use WebSocket or /mcp", { status: 200 });
  },
};
```

### services/gateway/src/index.ts (v2.4 — with Turnstile, Context Tokens, Audit Chain)
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { correlationMiddleware } from "./middleware/correlation";
import { tenantMiddleware } from "./middleware/tenant";
import { contextTokenMiddleware } from "./middleware/context-token";
import { turnstileMiddleware } from "./middleware/turnstile";
import { appendAuditEvent } from "./lib/audit-chain";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", cors());
app.use("*", correlationMiddleware());
app.use("*", rateLimitMiddleware());

// Public routes
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// Public routes with Turnstile (v2.4)
app.post("/api/public/signup", turnstileMiddleware(), async (c) => {
  // Turnstile verified — proceed with signup
  const body = await c.req.json();
  // ... signup logic
  return c.json({ created: true });
});

app.post("/api/public/contact", turnstileMiddleware(), async (c) => {
  // Turnstile verified — proceed with contact form
  const body = await c.req.json();
  // ... contact logic
  return c.json({ sent: true });
});

// Authenticated routes
app.use("/api/*", authMiddleware());
app.use("/api/*", tenantMiddleware());
app.use("/api/*", contextTokenMiddleware()); // v2.4: sign context for downstream

// Agent proxy — forward to Agent service
app.all("/api/agents/:agentType/:agentId/*", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api\/agents/, "/agents");
  return c.env.AGENT_SERVICE.fetch(new Request(url.toString(), c.req.raw));
});

// Workflow dispatch
app.post("/api/workflows/:workflowName", async (c) => {
  const { workflowName } = c.req.param();
  const body = await c.req.json();
  const tenantId = c.get("tenantId");

  const workflows: Record<string, Workflow> = {
    onboarding: c.env.ONBOARDING_WORKFLOW,
    "data-pipeline": c.env.DATA_PIPELINE_WORKFLOW,
    report: c.env.REPORT_WORKFLOW,
    "email-sequence": c.env.EMAIL_WORKFLOW,
  };

  const workflow = workflows[workflowName];
  if (!workflow) return c.json({ error: "Unknown workflow" }, 404);

  const instance = await workflow.create({ params: { ...body, tenantId } });

  // v2.4: Audit hash chain for workflow dispatch
  await appendAuditEvent(c.env.DB, {
    type: 'workflow_dispatched',
    tenantId,
    payload: { workflowName, instanceId: instance.id },
  });

  return c.json({ instanceId: instance.id, status: "started" });
});

// AI Search — TENANT-SCOPED
app.post("/api/search", async (c) => {
  const tenantId = c.get("tenantId");
  const { query, mode = "ai-search" } = await c.req.json();
  const aiSearch = c.env.AI.autorag("foundation-search");
  const tenantFilter = { folder: `tenants/${tenantId}/knowledge/` };

  if (mode === "search") {
    const result = await aiSearch.search({ query, ...tenantFilter });
    return c.json(result);
  } else {
    const result = await aiSearch.aiSearch({ query, ...tenantFilter });
    return c.json(result);
  }
});

// D1 CRUD — table allowlist
const ALLOWED_TABLES = ["tenants", "users", "audit_log", "settings"] as const;
app.get("/api/data/:table", async (c) => {
  const { table } = c.req.param();
  if (!ALLOWED_TABLES.includes(table as any)) return c.json({ error: "Invalid table" }, 400);
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
    subject, text, ...(html && { html }),
  });
  return c.json({ sent: true });
});

// Vectorize — TENANT-SCOPED
app.post("/api/vectors/upsert", async (c) => {
  const tenantId = c.get("tenantId");
  const { id, text, metadata = {} } = await c.req.json();
  const embedding = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
  await c.env.VECTOR_INDEX.upsert([{
    id: `${tenantId}:${id}`,
    values: embedding.data[0],
    metadata: { ...metadata, tenantId },
  }]);
  return c.json({ upserted: id });
});

app.post("/api/vectors/query", async (c) => {
  const tenantId = c.get("tenantId");
  const { query, topK = 5 } = await c.req.json();
  const embedding = await c.env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [query] });
  const results = await c.env.VECTOR_INDEX.query(embedding.data[0], {
    topK, filter: { tenantId },
  });
  return c.json(results);
});

// Analytics Engine — custom metrics (v2.4: Plane 10)
app.post("/api/analytics/event", async (c) => {
  const event = await c.req.json();
  c.env.ANALYTICS.writeDataPoint({
    blobs: [event.type, event.tenantId || "", event.metadata || ""],
    doubles: [event.value || 0],
    indexes: [event.tenantId || "global"],
  });
  return c.json({ recorded: true });
});

// Pipelines — stream events to Iceberg
app.post("/api/pipeline/ingest", async (c) => {
  const events = await c.req.json();
  await c.env.EVENT_PIPELINE.send(Array.isArray(events) ? events : [events]);
  return c.json({ ingested: true });
});

// v2.5: Cloudflare Images — in-Worker transform (resize, format, blur, etc.)
app.post("/api/images/transform", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  if (!file || !c.env.IMAGES) return c.json({ error: "No file or IMAGES binding" }, 400);
  const response = (await c.env.IMAGES.input(file.stream())
    .transform({ width: 256, height: 256 })
    .output({ format: "image/webp" })).response();
  return new Response(response.body, { headers: response.headers });
});

// Audit chain verification (v2.4)
app.get("/api/admin/audit-verify/:tenantId", async (c) => {
  const { tenantId } = c.req.param();
  const { verifyAuditChain } = await import("./lib/audit-chain");
  const valid = await verifyAuditChain(c.env.DB, tenantId);
  return c.json({ tenantId, chainValid: valid });
});

export default app;
```

---

## DEPLOYMENT SCRIPT

### scripts/deploy-all.sh
```bash
#!/bin/bash
set -euo pipefail

echo "=== Cloudflare Foundation v2.5 — Full Deployment ==="
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

echo "  → Building and deploying UI (SvelteKit)..."
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

## COMPLETE CLOUDFLARE PRIMITIVE UTILIZATION CHECKLIST (v2.5 — 20+ Categories)

| # | Primitive | Binding/Service | Where Used | Plane |
|---|-----------|----------------|------------|-------|
| 1 | **Workers** | (runtime) | All services | 1-10 |
| 2 | **Workers Assets** | `assets.directory` | UI service | 1 |
| 3 | **Durable Objects** | `CHAT_AGENT`, `RATE_LIMITER`, etc. | Agent service | 3 |
| 4 | **Agents SDK** | `Agent`, `AIChatAgent`, `McpAgent` | Agent service | 3 |
| 5 | **MCP Server** | `McpAgent.serve()` | Agent service | 3 |
| 6 | **MCP Client** | `this.addMcpServer()` | Agent service | 3 |
| 7 | **Workflows** | `ONBOARDING_WORKFLOW`, etc. | Workflow service | 4 |
| 8 | **D1** | `DB` | Gateway, Agents, Workflows | 5 |
| 9 | **KV** | `RATE_LIMIT_KV`, `SESSION_KV`, `CACHE_KV` | Gateway | 5,6 |
| 10 | **R2** | `FILES`, `ASSETS` | Gateway, Agents | 5 |
| 11 | **Queues** | `AUDIT_QUEUE`, `NOTIFICATION_QUEUE`, etc. | All producers → consumers | 8 |
| 12 | **Workers AI** | `AI` | Agents, Gateway | 7 |
| 13 | **AI Gateway** | via `AI` binding | Agents | 7 |
| 14 | **AI Search** | `AI.autorag()` | Agents, Gateway | 7 |
| 15 | **Vectorize** | `VECTOR_INDEX` | Gateway, Agents | 7 |
| 16 | **Hyperdrive** | `POSTGRES` | Gateway | 5 |
| 17 | **Browser Rendering** | `BROWSER` | Agents | 6 |
| 18 | **Sandbox SDK** | `SANDBOX` | Agents | 6 |
| 19 | **Containers** | (via Sandbox) | Agents | 6 |
| 20 | **Email Service (Send)** | `SEND_EMAIL` | Gateway, Agents, Workflows, Queues | 8 |
| 21 | **Email Routing (Receive)** | `email` handler | Separate Worker | 8 |
| 22 | **Pipelines** | `EVENT_PIPELINE` | Gateway, Queues | 5,10 |
| 23 | **R2 Data Catalog** | (via Pipelines) | Analytics | 5 |
| 24 | **R2 SQL** | (via wrangler/API) | Analytics | 5 |
| 25 | **Analytics Engine** | `ANALYTICS` | Gateway, Queues | 10 |
| 26 | **Service Bindings** | `GATEWAY`, `AGENT_SERVICE` | UI ↔ Gateway ↔ Agents | cross |
| 27 | **Cron Triggers** | `triggers.crons` | Cron service | cross |
| 28 | **Workers Logs** | `observability.enabled` | All services | 10 |
| 29 | **Logpush** | Dashboard config | All → R2 | 10 |
| 30 | **SvelteKit** | `adapter-cloudflare` | UI service | 1 |
| 31 | **Turnstile** | Server-side verify | Gateway (public forms) | 1,2 |
| 32 | **Secrets Store** | Account-level | All services | cross |
| 33 | **Workers Builds** | (CI/CD) | GitHub integration | cross |
| 34 | **Cloudflare Images** | `IMAGES` binding (transform, draw, output, info) + URL transform | Gateway, media | 9 |
| 35 | **Workers Rate Limiting** | `rate_limit` binding (Wrangler 4.36+) | Gateway (optional alternative to KV/DO) | 2 |
| 36 | **Workers for Platforms** | (optional) | Multi-tenant isolation | cross |

**v2.4 Additions** (rows 31-35): Turnstile, SvelteKit adapter, Cloudflare Images, TenantRateLimiter DO, Audit Hash Chain, Gateway Context Tokens, DO Naming Taxonomy.

**v2.5 Additions**: Cloudflare Images **Workers binding** (row 34); Workers Rate Limiting binding (row 35); Queues Event Subscriptions; automatic resource provisioning; Secrets Store + AI Gateway BYOK; node:fs ephemeral; Playwright option; custom Queue retention; Python Workflows (beta) note; Workers VPC (beta) in NOT COVERED.

---

## WHAT TO BUILD FIRST

Execute in this exact order:

**Phase 0: Infrastructure (run setup scripts)**
- Create D1 databases, KV namespaces, R2 buckets, Queues, Pipelines, AI Search instances (or use **automatic resource provisioning** with wrangler 4.45+: resources are created on first deploy and IDs written back to config).
- Populate **Cloudflare Secrets Store** with: API keys (OpenAI, Anthropic), JWT signing key, Turnstile secret, Context signing key. **Bind AI provider keys to AI Gateway** for BYOK (Bring Your Own Key) so inference uses a single endpoint with centralized key management.
- Configure Turnstile site in Cloudflare Dashboard.
- These must exist before any `wrangler deploy` can succeed (unless using automatic provisioning).

**Phase 1: Shared packages**
1. **`packages/shared`** — Types, schemas, constants
2. **`packages/db`** — Drizzle schema + initial migration (include `audit_chain` table)

**Phase 2: Backend services (deploy in dependency order)**
3. **`services/queues`** — Queue consumers (no dependencies)
4. **`services/workflows`** — Workflow definitions
5. **`services/agents`** — Agent classes + MCP server + TenantRateLimiter DO
6. **`services/gateway`** — Hono API gateway + Turnstile + Context tokens + Audit chain
7. **`services/cron`** — Scheduled jobs

**Phase 3: Frontend**
8. **`services/ui`** — SvelteKit frontend with adapter-cloudflare

**Phase 4: Tooling**
9. **`scripts/`** — Setup scripts, deployment, codegen
10. **`extensions/`** — Example extension with manifest

---

## QUALITY REQUIREMENTS

- **TypeScript strict mode** everywhere. No `any` types.
- **Zod validation** on all API inputs and queue message payloads.
- **Correlation IDs** on every request (generated in gateway, propagated via headers).
- **Gateway-signed context tokens** (v2.4) — downstream Workers verify JWT instead of re-running auth.
- **Tenant isolation** — every D1 query, R2 key, KV key, and Vectorize filter MUST be scoped by tenant ID.
- **DO naming taxonomy** (v2.4) — all DO IDs follow `{tenantId}:{purpose}:{identifier}` pattern.
- **Audit hash chain** (v2.4) — all mutations append to tamper-evident chain per tenant.
- **Audit logging** — all mutations write to AUDIT_QUEUE.
- **Error boundaries** — every tool, every route, every queue consumer wrapped in try/catch.
- **Turnstile** (v2.4) on all public-facing forms (signup, contact, login).
- **compatibility_date: "2025-09-25"** on every service.
- **pnpm workspace** — no npm, no yarn.
- **Workers Logs** — `observability.enabled: true` on every service.

---

## SECURITY: CLOUDFLARE ACCESS / ZERO TRUST

```
Gateway Worker routes:
  /health                → Public (no auth)
  /api/public/*          → Turnstile verification (v2.4)
  /api/agents/*          → JWT + Tenant middleware + Context token
  /api/workflows/*       → JWT + Tenant middleware + Context token
  /admin/*               → Cloudflare Access policy (Zero Trust SSO)
  /mcp                   → OAuth (MCP spec requires it)
```

### Secrets Management: Cloudflare Secrets Store
Sensitive keys should use the **Cloudflare Secrets Store** (beta) rather than per-Worker `wrangler secret put`:
- **Account-level secrets**: A single secret bound to multiple services
- **Rotation**: Update once, propagates to all bound Workers
- **v2.4 additions**: `CONTEXT_SIGNING_KEY`, `TURNSTILE_SECRET`
- **v2.5**: Bind AI provider keys (OpenAI, Anthropic) to AI Gateway via Secrets Store for BYOK and centralized cost tracking.

---

## COST MODEL AND BILLING GUARDRAILS

| Primitive | Billing Model | Key Guardrails |
|-----------|--------------|----------------|
| **Workers** | Requests + CPU time | Set `max_cpu_ms`; use unbound for AI workloads |
| **Durable Objects** | Requests + Duration + Storage | WebSocket hibernation; TenantRateLimiter DO is lightweight |
| **D1** | Reads + Writes + Storage | Batch writes; KV for read-heavy lookups |
| **KV** | Reads + Writes + Storage | Cache hot keys in Worker memory; TTL aggressively |
| **R2** | Storage + Class A/B ops | Zero egress; prefer over S3 |
| **Queues** | Operations | Batch messages; use max_batch_size |
| **Workers AI** | Neurons (per model) | Set max_tokens; prefer smaller models |
| **AI Gateway** | Free | Always use for cost tracking |
| **Vectorize** | Queried + Stored dims | Filter by tenant to reduce query scope |
| **Workflows** | Per step + duration | Minimize step count; batch within steps |
| **Browser Rendering** | Included (paid Workers) | Set timeouts; close browsers promptly |
| **Sandbox / Containers** | CPU + memory duration | Execution timeouts; limit per tenant |
| **Analytics Engine** | Free tier generous | Use for billing metering |
| **Turnstile** | Free | No cost impact |
| **Email Service** | Per message (paid Workers) | Rate limit sending per tenant |
| **Cloudflare Images** | Per transform/storage | Use Workers binding for in-request transforms; cache results in R2 |
| **Workers Rate Limiting** | Per namespace | Alternative to KV/DO for simple global limits |

---

## OBSERVABILITY AND OPERATIONS (PLANE 10)

### Workers Logs
All services have `observability.enabled: true` — structured logs, traces, metrics in Cloudflare dashboard.

### Analytics Engine (v2.4 — Promoted to Plane 10)
Custom business metrics via `writeDataPoint()` — use for:
- Tenant activity tracking
- Feature usage metering
- Billing counters (per-API-call, per-AI-token)
- Funnel analysis
- Up to 20 custom dimensions per datapoint

### AI Gateway Dashboard
All AI inference routed through AI Gateway gets automatic token tracking, cost attribution, latency percentiles, and cache hit rates.

### Audit Hash Chain (v2.4 NEW)
Tamper-evident audit trail per tenant. Every mutation event includes SHA-256 hash of previous event, creating an unbreakable chain. Verifiable via `/api/admin/audit-verify/:tenantId`. Essential for compliance (SOC 2, HIPAA).

### Chain-of-Thought Trace (OTel + Logpush)
Enable OTel-compatible traces with high sampling rates on Agent DOs. Push via **Workers Logpush** to R2. Creates "black box flight recorder" for the agentic fleet.

```
Agent DO receives message
  └─ Trace Span: "chat_completion"
       ├─ Span: "tool_call:searchKnowledge" (42ms)
       ├─ Span: "tool_call:queryDatabase" (15ms)
       ├─ Span: "llm_inference:gpt-4o" (1200ms, 850 tokens)
       └─ Span: "state_update:ui_sync" (2ms)
```

---

## PACKAGE VERSION VERIFICATION

```bash
npm view agents versions --json | tail -5
npm view @cloudflare/sandbox versions --json | tail -5
npm view @cloudflare/puppeteer versions --json | tail -5
npm view @cloudflare/playwright versions --json | tail -5
npm view ai versions --json | tail -5
npm view @sveltejs/adapter-cloudflare versions --json | tail -5
npm view @sveltejs/kit versions --json | tail -5
npm view hono versions --json | tail -5
```

---

## WHAT THIS PROMPT DOES NOT COVER (extend later)

- Auth provider integration (Clerk, Auth0, Lucia) — add as extension
- Workers for Platforms multi-tenant isolation — add when needed
- R2 Event Notifications → Queue triggers — configure in dashboard
- Custom domains + DNS — configure in dashboard
- WAF rules, DDoS protection, Bot Management — configure in dashboard
- Cloudflare Tunnel for hybrid connectivity — configure separately
- **Workers VPC** — private network access for Hyperdrive and internal APIs. Workers VPC (beta) can be used when you need to reach private APIs in AWS, Azure, GCP, or on-prem from Workers.
- Terraform/Pulumi IaC — add as needed
- Load testing / performance benchmarks
- Inbound Email Routing Worker example — use `routeAgentEmail(message, env, { resolver })`
- CI/CD pipeline with Workers Builds + GitHub Actions
- **Local dev orchestration** — running multiple `wrangler dev` processes
- **Per-service Env types** — `wrangler types` generates per-service bindings
- **Pipelines stream/schema definitions** — stream IDs, pipeline SQL transforms
- **Calls / WebRTC** — Cloudflare Calls SFU for real-time audio/video (Plane 8 future)
- **Stream** — Cloudflare Stream for video upload/encode/deliver (Plane 9 future)
- **Cloudflare Images advanced** — signed URLs, named transforms, custom origins
- **Container rolling deploy patterns** — blue/green, canary for Sandbox containers
- **Community admin tooling** — internal dashboards, tenant management UI

---

**END OF PROMPT v2.5. Ship it.**
