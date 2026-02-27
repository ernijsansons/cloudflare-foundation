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
│  │  - naomi_tasks │  │    flags       │  │                │  │                │  │
│  │  - naomi_logs  │  │                │  │                │  │                │  │
│  │  - audit_chain │  │                │  │                │  │                │  │
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

-- Naomi execution tasks (Open Claw)
CREATE TABLE naomi_tasks (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  agent TEXT DEFAULT 'claude',
  status TEXT DEFAULT 'pending',
  phase TEXT,
  vm_id TEXT,
  claimed_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER,
  retry_count INTEGER DEFAULT 0,
  error TEXT,
  tenant_id TEXT DEFAULT 'default',
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE TABLE naomi_execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  phase TEXT,
  level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE naomi_locks (
  repo_url TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  acquired_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
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
