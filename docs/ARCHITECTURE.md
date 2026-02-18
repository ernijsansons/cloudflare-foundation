# Foundation v2.5 Architecture

## Overview

Cloudflare Foundation v2.5 is a 10-plane serverless architecture for building AI-powered SaaS applications. It runs entirely on Cloudflare's edge network with zero traditional servers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENTS                                       │
│                          (Browser, CLI, API consumers)                           │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 1: UI                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  SvelteKit + adapter-cloudflare                                          │    │
│  │  - SSR on Cloudflare Pages                                               │    │
│  │  - Static assets on CDN                                                  │    │
│  │  - Service bindings to Gateway                                           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 2: API GATEWAY                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  Hono framework                                                          │    │
│  │  Middleware Stack:                                                       │    │
│  │  - CORS                    - Rate Limiting (Redis-like via DO)          │    │
│  │  - Correlation ID          - Auth (JWT/Session)                          │    │
│  │  - Turnstile (public)      - Tenant isolation                           │    │
│  │  - Context token (JWT)     - Audit chain logging                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  PLANE 3: AGENTS     │  │  PLANE 4: WORKFLOWS  │  │  PLANE 6: ISOLATION  │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ Durable Objects│  │  │  │ CF Workflows   │  │  │  │ Sandbox API    │  │
│  │ - Stateful     │  │  │  │ - 15 phases    │  │  │  │ Browser Render │  │
│  │ - WebSocket    │  │  │  │ - Step caching │  │  │  │ (optional)     │  │
│  │ - MCP server   │  │  │  │ - Durable      │  │  │  └────────────────┘  │
│  │ - Rate limiter │  │  │  │ - Retries      │  │  └──────────────────────┘
│  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘
            │                          │
            └──────────────────────────┼──────────────────────────┐
                                       ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 5: DATA LAYER                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │      D1        │  │       KV       │  │       R2       │  │   Vectorize    │  │
│  │   (SQLite)     │  │  (Key-Value)   │  │  (Object Store)│  │  (Embeddings)  │  │
│  │  - planning_   │  │  - Sessions    │  │  - File uploads│  │  - RAG context │  │
│  │    runs        │  │  - Cache       │  │  - Artifacts   │  │  - Artifact    │  │
│  │  - artifacts   │  │  - Feature     │  │  - Packages    │  │    similarity  │  │
│  │  - audit_chain │  │    flags       │  │                │  │                │  │
│  │  - parked_ideas│  │                │  │                │  │                │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 7: AI                                                                      │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐      │
│  │         Workers AI               │  │         AI Gateway               │      │
│  │  - LLM inference (local mode)    │  │  - Rate limiting                 │      │
│  │  - Embeddings (@cf/bge-base-en)  │  │  - Logging                       │      │
│  │  - Phase agents                  │  │  - External provider proxy       │      │
│  └──────────────────────────────────┘  └──────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 8: COMMUNICATION                           PLANE 9: MEDIA                  │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │              Queues                     │  │       Cloudflare Images        │  │
│  │  - foundation-audit                     │  │  - Image transformation        │  │
│  │  - foundation-notifications             │  │  - Optimization                │  │
│  │  - foundation-analytics                 │  │  - Delivery                    │  │
│  │  - foundation-webhooks                  │  │                                │  │
│  └────────────────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  PLANE 10: OBSERVABILITY                                                          │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │        Analytics Engine                 │  │        Audit Hash Chain        │  │
│  │  - Custom metrics                       │  │  - Tamper-evident log          │  │
│  │  - Event tracking                       │  │  - SHA-256 linked              │  │
│  │  - Usage analytics                      │  │  - Per-tenant isolation        │  │
│  └────────────────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Service Structure

```
services/
├── ui/                    # SvelteKit frontend (Cloudflare Pages)
├── gateway/               # API Gateway (Hono + middleware)
├── agents/                # Durable Object agents
├── planning-machine/      # Planning workflow + API
├── queues/                # Queue consumers
└── workflows/             # Additional workflow definitions
```

## Request Flow

### 1. Authenticated API Request

```
Browser → UI (SSR) → Gateway → Auth Middleware → Tenant Middleware
                                                        │
                                                        ▼
                                              Context Token (JWT)
                                                        │
                                                        ▼
                                              Service (Planning/Agents)
                                                        │
                                                        ▼
                                              D1 Database → Response
```

### 2. Planning Run Execution

```
POST /api/planning/runs
        │
        ▼
Create run in D1 (status: running)
        │
        ▼
Start PlanningWorkflow.create()
        │
        ▼
┌───────────────────────────────────────┐
│  For each phase in PHASE_ORDER:       │
│  1. Load RAG context from Vectorize   │
│  2. Run phase agent                   │
│  3. If requireReview: review loop     │
│  4. Save artifact to D1               │
│  5. Embed in Vectorize                │
│  6. Emit webhook event                │
│  │                                    │
│  Special: kill-test phase             │
│  - KILL → terminate, park idea        │
│  - PIVOT → restart from phase 1       │
│  - GO → continue to next phase        │
└───────────────────────────────────────┘
        │
        ▼
Save package to R2, update status
        │
        ▼
Emit run_completed webhook
```

## D1 Schema

### Core Tables

```sql
-- Planning runs
CREATE TABLE planning_runs (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  current_phase TEXT,
  mode TEXT DEFAULT 'cloud',
  quality_score REAL,
  revenue_potential TEXT,
  workflow_instance_id TEXT,
  kill_verdict TEXT,
  pivot_count INTEGER DEFAULT 0,
  package_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

-- Phase artifacts
CREATE TABLE planning_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  review_verdict TEXT,
  review_iterations INTEGER DEFAULT 1,
  overall_score REAL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

-- Parked ideas for future revisit
CREATE TABLE planning_parked_ideas (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  run_id TEXT,
  source_phase TEXT NOT NULL,
  reason TEXT NOT NULL,
  revisit_estimate_months INTEGER,
  revisit_estimate_note TEXT,
  artifact_summary TEXT,
  created_at INTEGER NOT NULL
);

-- Audit hash chain
CREATE TABLE audit_chain (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seq INTEGER NOT NULL,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Webhook destinations
CREATE TABLE webhook_destinations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT DEFAULT '',
  hostname TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  active INTEGER DEFAULT 1,
  events TEXT DEFAULT '*',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Queue Topology

```
┌─────────────────────┐
│  foundation-audit   │──▶ Audit chain + Analytics Engine
└─────────────────────┘

┌─────────────────────┐
│foundation-analytics │──▶ Analytics Engine writes
└─────────────────────┘

┌─────────────────────┐
│foundation-webhooks  │──▶ External webhook delivery (HMAC signed)
└─────────────────────┘

┌───────────────────────┐
│foundation-notifications│──▶ (Future: email, push)
└───────────────────────┘
```

## Security Model

### Authentication
- JWT tokens with HS256 signature
- Session cookies (httpOnly, secure)
- Turnstile for public endpoints

### Authorization
- Tenant isolation via middleware
- Context tokens carry tenant/user info
- Row-level security via tenant_id

### Audit
- Hash-chained audit log (tamper-evident)
- Per-tenant isolation
- Verification endpoint

### Webhook Security
- SSRF protection (hostname validation)
- HMAC-SHA256 signatures
- Event filtering

## Scaling Characteristics

| Component | Scaling Model |
|-----------|--------------|
| UI | Edge-cached static + SSR at edge |
| Gateway | Auto-scaled Workers |
| Agents | Durable Objects (stateful, colocated) |
| Workflows | Durable execution (step caching) |
| D1 | SQLite at edge (read replicas) |
| Queues | Auto-scaled consumers |

## Local Development

```bash
# Start all services
pnpm run dev

# Services run at:
# - UI:              http://127.0.0.1:5173 (Vite dev server)
# - Gateway:         http://127.0.0.1:8788
# - Planning Machine: http://127.0.0.1:8787
# - Agents:          http://127.0.0.1:8789
```

## Environment Bindings

See `wrangler.jsonc` in each service for required bindings:

| Binding | Type | Purpose |
|---------|------|---------|
| DB | D1 | Primary database |
| FILES | R2 | File storage |
| KV | KV | Session/cache |
| VECTOR_INDEX | Vectorize | RAG embeddings |
| AI | Workers AI | LLM inference |
| ANALYTICS | Analytics Engine | Metrics |
| AUDIT_QUEUE | Queue | Audit events |
| WEBHOOK_QUEUE | Queue | Webhook events |
## Recent Updates (2025-11 → 2026-02)

### Plane 3: Agents — SDK v0.5.0 (Feb 17, 2026)

The `agents` package is now at v0.5.0. Key additions since v0.3.0:

**Retry utilities** — Built-in exponential backoff for any async operation:
```ts
const result = await this.retry(() => fetch("https://api.example.com"), {
  maxRetries: 3,
  shouldRetry: (error) => error.status !== 404,
});
```
Per-task retry options on `schedule()`, `scheduleEvery()`, `addMcpServer()`:
```ts
await this.schedule("sendReport", Date.now() + 60_000, { retry: { maxRetries: 5 } });
```

**`scheduleEvery()`** — Recurring tasks with overlap prevention (v0.3.7):
```ts
await this.scheduleEvery("syncData", 60_000); // every 60s, no overlap
```

**`AgentWorkflow` class** — First-class Workflows integration (v0.3.7):
```ts
import { AgentWorkflow } from "agents";
const workflow = this.env.ONBOARDING_WORKFLOW as AgentWorkflow;
await workflow.create({ id: nanoid(), params: { userId } });
```

**Readonly connections** — Clients with readonly flag cannot mutate state (v0.4.0).

**`shouldSendProtocolMessages()`** — Per-connection protocol filtering (v0.5.0):
```ts
shouldSendProtocolMessages(connection, ctx) {
  return ctx.request.headers.get("Sec-WebSocket-Protocol") !== "mqtt";
}
```

**`validateStateChange(state)` hook** — Synchronous state validation before writes (v0.3.7).

**`@cloudflare/ai-chat` v0.1.2** — New companion package for persistent chat UIs:
- Tool approval persistence (survives DO hibernation and page refresh)
- Data parts — attach typed JSON blobs to messages
- `autoContinueAfterToolResult` (default `true`) — tool results auto-trigger continuation
- `maxPersistedMessages` — cap SQLite storage per agent
- `body` option on `useAgentChat` — send custom data with requests

**MCP SDK upgraded to 1.26.0** (v0.4.0) — Security fix preventing cross-client response leakage.

### Plane 3: Agents — Durable Objects SQLite Billing

**Active as of January 7, 2026.** Workers Paid plan accounts are billed for SQLite storage above free limits. Agent classes using SQLite storage (`ChatAgent`, `TaskAgent`, `TenantAgent`, `SessionAgent`, `FoundationMcpServer`, `TenantRateLimiter`) should minimize data retention. Use `maxPersistedMessages` from `@cloudflare/ai-chat` to cap message storage.

Best practices: see [Rules of Durable Objects](https://developers.cloudflare.com/changelog/2025-12-15-rules-of-durable-objects/) — design around logical coordination units, leverage SQLite with RPC methods, use concurrency gates, use hibernatable WebSockets.

### Plane 4: Workflows — Increased Limits & Dashboard Visualizer

As of October 2025, Workflows limits are:
- **100 instances/second** creation rate (was 10/sec)
- **10,000 concurrent** instances per account (was 4,500)

**Dashboard Visualizer** (Feb 4, 2026): Workflows now auto-generate visual diagrams in the Cloudflare dashboard from your code, showing step connections, loops, and branching logic.

### Plane 7: Workers AI — New Models

New models available on Workers AI:
- **GLM-4.7-Flash** (`@cf/zhipuai/glm-4-flash`) — fast multilingual text generation (Feb 2026)
- **FLUX.2 [klein] 9B** — distilled image generation, 4-step inference (Jan 2026)
- **FLUX.2 [klein] 4B** — faster/cheaper image generation (Jan 2026)
- **FLUX.2 [dev]** — advanced image generation with multi-language support (Nov 2025)

New packages: `@cloudflare/tanstack-ai`, `workers-ai-provider` v3.1.1 (transcription, TTS, reranking).
