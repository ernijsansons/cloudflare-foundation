# CLAUDE.md — cloudflare-foundation-dev

## Identity

This is **cloudflare-foundation-dev**, a 10-plane serverless monorepo on Cloudflare.

**Current state** (what exists and works today):

1. **Planning Machine** — 18-phase AI research engine that deeply analyzes business ideas
2. **Gateway** — Hono API with multi-tenant auth, rate limiting, audit chain
3. **Agents** — 6 Durable Object agents (Chat, Task, Tenant, Session, MCP, RateLimiter)
4. **Workflows** — 4 durable workflow stubs + planning pipeline
5. **Queues** — Audit, notifications, analytics, webhooks
6. **Cron** — Doc scanner, hourly/daily jobs
7. **UI** — SvelteKit dashboard (Cloudflare Pages)

**In progress** (Project Factory v3.0 — see PROJECT_FACTORY_EXECUTION.md):

- Architecture Advisor agent (post-pipeline recommendation engine)
- Template Registry (32+ CF templates + 5 BIBLE patterns in D1)
- Scaffold Generator (reads BuildSpec, creates projects)

**Vision**: Idea → Deep Research → Architecture Recommendation → Scaffold → Deploy

---

## Project Structure

```
C:\dev\.cloudflare\cloudflare-foundation-dev\
├── packages/
│   ├── shared/          — Shared types, schemas, constants (BUILD FIRST)
│   ├── db/              — Drizzle ORM schemas + migrations
│   ├── foundation-cli/  — CLI for creating/managing planning runs
│   └── foundation-plan/ — Planning scaffolding tool
├── services/
│   ├── gateway/         — Hono API gateway (Worker: foundation-gateway)
│   │   └── migrations/  — D1 migrations for foundation-primary (0000-0011)
│   ├── planning-machine/ — 18-phase research engine (Worker: foundation-planning-machine)
│   │   └── migrations/  — D1 migrations for planning-primary (0000-0006)
│   ├── agents/          — Durable Objects (Worker: foundation-agents)
│   ├── workflows/       — Cloudflare Workflows (Worker: foundation-workflows)
│   ├── queues/          — Queue consumers (Worker: foundation-queues)
│   ├── cron/            — Scheduled tasks + doc scanner (Worker: foundation-cron)
│   └── ui/              — SvelteKit frontend (Cloudflare Pages)
├── planning-machine/    — Standalone CLI scripts (NOT the Worker service)
│   ├── scripts/         — generate-scaffold.ts, seed scripts
│   ├── output/          — Generated TASKS.json per run
│   └── memory/          — Pipeline memory (lessons from prior builds)
├── .claude/commands/    — Claude Code slash commands
└── docs/                — Architecture documentation
```

**IMPORTANT**: `planning-machine/` at the root is the CLI/scripts directory. `services/planning-machine/` is the Worker service. Don't confuse them.

## Two Separate D1 Databases

This project uses TWO D1 databases. Never mix them up.

| Database             | ID                                     | Used By          | Migrations Dir                          |
| -------------------- | -------------------------------------- | ---------------- | --------------------------------------- |
| `foundation-primary` | `34bce593-9df9-4acf-ac40-c8d93a7c7244` | gateway, agents  | `services/gateway/migrations/`          |
| `planning-primary`   | `a5d92afd-7c3a-48b8-89ae-abf1a523f6ce` | planning-machine | `services/planning-machine/migrations/` |

```bash
# Apply gateway migrations
cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote

# Apply planning-machine migrations
cd services/planning-machine && npx wrangler d1 migrations apply planning-primary --remote
```

## Build Order

```bash
pnpm --filter @foundation/shared build    # 1. Shared types (ALWAYS first)
pnpm --filter @foundation/db build        # 2. DB schemas
pnpm run build:services                   # 3. SvelteKit UI build
pnpm run typecheck:workers                # 4. All Workers typecheck
```

Shortcut: `pnpm run build` does all four in order. **Must pass with 0 errors after every change.**

## Local Development

```bash
# Full dev (all services):
pnpm run dev

# Gateway only (most common):
pnpm run dev:gateway    # Port 8788

# SvelteKit UI only:
cd services/ui && pnpm run dev    # Port 5173
```

## Key Technologies

| Component       | Package                     | Version         |
| --------------- | --------------------------- | --------------- |
| Runtime         | Cloudflare Workers          | nodejs_compat   |
| API framework   | hono                        | v4              |
| Database        | D1 (SQLite)                 | via Drizzle ORM |
| Agent SDK       | `agents`                    | 0.5.0           |
| AI Chat         | `@cloudflare/ai-chat`       | 0.1.2           |
| MCP SDK         | `@modelcontextprotocol/sdk` | 1.26.0          |
| AI SDK          | `ai`                        | 6.0.0           |
| Validation      | `zod`                       | 3.25+           |
| Package manager | pnpm                        | 10.20.0         |
| Node.js         |                             | >=20            |
| TypeScript      |                             | 5.7+            |

---

## Critical Rules

### NEVER Modify These Files (Unless Explicitly Asked)

```
services/planning-machine/src/workflows/planning-workflow.ts  — 900-line durable pipeline
services/planning-machine/src/agents/*.ts                     — 18 working agents (see list below)
services/planning-machine/src/lib/orchestrator.ts             — Multi-model parallel inference
services/planning-machine/src/lib/model-router.ts             — Model routing logic
services/planning-machine/src/lib/reasoning-engine.ts         — 5-phase reasoning protocol
services/planning-machine/src/lib/schema-validator.ts         — Phase output validation
services/planning-machine/src/middleware/context-token.ts      — JWT inter-service auth
services/gateway/src/middleware/*.ts                           — Auth, tenant, CORS, rate-limit, security headers
services/gateway/src/index.ts                                 — Gateway route registration (only ADD routes)
packages/shared/src/types/planning-phases.ts                  — Canonical phase order (only ADD, never remove/reorder)
packages/db/schema/*.ts                                       — Drizzle schemas (only ADD new schemas)
All wrangler.jsonc files                                      — Production bindings + database IDs
All existing migrations (gateway 0000-0011, planning 0000-0006)
```

### Extension Strategy

All new code goes into **NEW files**. Existing files only get:

- New `import` statements
- New route registrations (append to gateway)
- New phase registrations (append to agent registry)
- New `export` statements (append to shared index)

### Naming Conventions

| Thing            | Convention             | Example                         |
| ---------------- | ---------------------- | ------------------------------- |
| Files            | kebab-case             | `architecture-advisor-agent.ts` |
| Functions        | camelCase              | `queryTemplates()`              |
| DB columns       | snake_case             | `estimated_cost_mid`            |
| Types/Interfaces | PascalCase             | `BuildSpec`                     |
| D1 tables        | snake_case             | `template_registry`             |
| Agent classes    | PascalCase             | `ArchitectureAdvisorAgent`      |
| Migrations       | `NNNN_description.sql` | `0007_template_registry.sql`    |
| Worker names     | `foundation-{service}` | `foundation-gateway`            |

---

## Planning Pipeline

### How It Works

```
Idea → Intake → [18 Research Phases] → Artifacts in D1
                      ↓
        Each phase: Agent → LLM → Parse → Validate → Store → RAG embed
                      ↓
        Quality scoring + reviewer loop (revise if score < threshold)
                      ↓
        Multi-model orchestration (Workers AI + Anthropic + Nvidia in parallel)
```

### Phase Order (Canonical — from packages/shared/src/types/planning-phases.ts)

```
 1. opportunity          — Find best opportunity variant
 2. customer-intel       — Deep customer research (web search)
 3. market-research      — TAM/SAM/SOM, trends (web search)
 4. competitive-intel    — Competitive landscape (web search)
 5. kill-test            — GO / PIVOT / KILL decision gate ← CRITICAL
 6. revenue-expansion    — Revenue model + expansion paths
 7. strategy             — Strategic positioning + roadmap
 8. business-model       — Business model canvas + unit economics
 9. product-design       — Features, UX, user journey (+ draftTasks)
10. gtm-marketing        — Go-to-market strategy (+ draftTasks)
11. content-engine       — Content strategy + calendar (+ draftTasks)
12. tech-arch            — Technical architecture, Cloudflare-mapped (+ draftTasks)
13. analytics            — Metrics framework (+ draftTasks)
14. launch-execution     — Launch plan + checklists (+ draftTasks)
15. synthesis            — Executive summary + recommendation
16. task-reconciliation  — Merge draftTasks → TASKS.json
17. diagram-generation   — Mermaid diagrams
18. validation           — Final quality validation
```

Phases 9-14 produce `draftTasks` arrays. Phase 16 merges them into the final `TASKS.json`.

Kill-test (phase 5) is a real gate: CONTINUE / PIVOT (restart from opportunity) / KILL (end run).

### 18 Agent Files (in services/planning-machine/src/agents/)

```
opportunity-agent.ts, customer-intel-agent.ts, market-research-agent.ts,
competitive-intel-agent.ts, kill-test-agent.ts, revenue-expansion-agent.ts,
strategy-agent.ts, business-model-agent.ts, product-design-agent.ts,
gtm-agent.ts, content-engine-agent.ts, tech-arch-agent.ts,
analytics-agent.ts, launch-execution-agent.ts, synthesis-agent.ts,
task-reconciliation-agent.ts, diagram-generator-agent.ts, validator-agent.ts
```

Plus: `base-agent.ts` (abstract base), `registry.ts` (phase→agent mapping)

### D1 Tables — Planning Machine (`planning-primary`)

| Table                   | Purpose                                               | Migration |
| ----------------------- | ----------------------------------------------------- | --------- |
| `planning_runs`         | Run metadata, status, current phase                   | 0000      |
| `planning_artifacts`    | Phase outputs (JSON), quality scores, review feedback | 0000      |
| `planning_sources`      | Web search citations per artifact                     | 0000      |
| `planning_memory`       | RAG embeddings per run                                | 0000      |
| `planning_quality`      | Per-dimension quality scores                          | 0000      |
| `orchestration_outputs` | Multi-model parallel inference results                | 0005      |
| `ideas`                 | Idea cards with full content                          | 0006      |

### D1 Tables — Gateway (`foundation-primary`)

| Table                    | Purpose                            | Migration |
| ------------------------ | ---------------------------------- | --------- |
| `tenants`                | Multi-tenant core                  | 0000      |
| `users`                  | User accounts per tenant           | 0000      |
| `audit_log`              | Audit events                       | 0000      |
| `audit_chain`            | Tamper-evident SHA-256 hash chain  | 0000      |
| `webhook_destinations`   | Webhook endpoints per tenant       | 0001      |
| `notifications`          | Notification queue                 | 0002      |
| `naomi_*` tables         | AI assistant tables                | 0003-0004 |
| `project_documentation`  | Project docs                       | 0005      |
| `planning_runs` (mirror) | Planning run references            | 0009      |
| `doc_scan_state`         | Scanner last-seen state per source | 0011      |
| `doc_update_reports`     | Scanner findings + apply status    | 0011      |

### API Routes

**Gateway** (`gateway.erlvinc.com`):

```
GET  /health                          — Health check (no auth)
POST /api/public/*                    — Public routes (no auth)
GET  /mcp/*                           — MCP server (self-auth)
                                        ↓ (auth + tenant middleware below)
GET/POST /api/planning/*              — Proxy to planning-machine service binding
GET/POST /api/agents/*                — Agent management
GET/POST /api/files/*                 — R2 file upload/download
POST     /api/images/transform        — Cloudflare Images transform
POST     /api/analytics/event         — Analytics Engine events
GET/POST /api/data/*                  — Data queries
GET/POST /api/workflows/*             — Workflow triggers
GET/POST /api/webhooks/*              — Webhook management
GET/POST /api/admin/*                 — Admin routes
GET/POST /api/naomi/*                 — AI assistant
GET/POST /api/projects/*              — Project documentation
GET/POST /api/cron/*                  — Doc scanner status/updates
```

**Planning Machine** (via service binding PLANNING_SERVICE, not public):

```
POST /api/planning/runs               — Start planning run
GET  /api/planning/runs               — List runs
GET  /api/planning/runs/:id           — Run status + metadata
DELETE /api/planning/runs/:id         — Delete run
POST /api/planning/runs/:id/cancel    — Cancel running pipeline
POST /api/planning/runs/:id/pause     — Pause at next gate
POST /api/planning/runs/:id/resume    — Resume paused run
GET  /api/planning/runs/:id/phases    — List phase results
GET  /api/planning/runs/:id/artifacts/:phase — Get phase artifact
POST /api/planning/run-{phase}        — Direct agent test endpoint (per phase)
GET/POST /api/planning/ideas          — Idea card CRUD
POST /api/planning/ideas/:id/runs     — Create run from idea
GET  /api/planning/health             — Health (no auth)
```

---

## Deployment

```bash
# Deploy all
pnpm run deploy

# Deploy individually
cd services/gateway && npx wrangler deploy --env production
cd services/planning-machine && npx wrangler deploy --env production
cd services/agents && npx wrangler deploy --env production
cd services/workflows && npx wrangler deploy --env production
cd services/queues && npx wrangler deploy --env production
cd services/cron && npx wrangler deploy --env production
cd services/ui && npx wrangler pages deploy   # Pages, not Workers
```

### Production URLs

| Service          | URL                                                    | Access                             |
| ---------------- | ------------------------------------------------------ | ---------------------------------- |
| Gateway          | `gateway.erlvinc.com`                                  | Public (auth required for /api/\*) |
| UI               | `dashboard.erlvinc.com`                                | Public                             |
| Planning Machine | N/A                                                    | Service binding only               |
| Agents           | N/A                                                    | Service binding only               |
| Cron             | `foundation-cron-production.ernijs-ansons.workers.dev` | Internal                           |

---

## Slash Commands (.claude/commands/)

| Command                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `/plan "idea"`         | Run full 18-phase planning pipeline locally via Claude Code |
| `/plan-tasks <RUN_ID>` | Regenerate TASKS.json for a completed run                   |
| `/update-docs`         | Scan CF releases and update `C:\dev\.cloudflare\` doc files |
| `/audit-plan <RUN_ID>` | Verify no hallucinations in planning output                 |

---

## Environment Variables

**Required secrets** (set via `wrangler secret put` per service):
| Secret | Services | Purpose |
|--------|----------|---------|
| `ANTHROPIC_API_KEY` | planning-machine | Orchestration synthesizer |
| `TAVILY_API_KEY` | planning-machine | Web search in research phases |
| `BRAVE_API_KEY` | planning-machine | Alternative web search |
| `CONTEXT_SIGNING_KEY` | gateway | JWT signing for inter-service auth |

**Optional**:
| Secret | Services | Purpose |
|--------|----------|---------|
| `NVIDIA_API_KEY` | planning-machine | Kimi K2.5 / GLM-5 models |
| `MINIMAX_API_KEY` | planning-machine | MiniMax model in orchestration |
| `DEEPSEEK_API_KEY` | cron (local) | Doc scanner analysis (cheap) |

---

## Reference Library

Parent directory `C:\dev\.cloudflare\` contains the master reference library:

| Resource  | Path            | Purpose                                        |
| --------- | --------------- | ---------------------------------------------- |
| BIBLE     | `../BIBLE.md`   | Cloudflare Agent Engineering Bible (659 lines) |
| Templates | `../templates/` | 5 agent implementation blueprints              |
| Patterns  | `../patterns/`  | 12 CF service integration guides               |
| Platform  | `../platform/`  | Service catalog, wrangler ref, deployment      |
| Research  | `../research/`  | Tiered CF service analysis                     |

Read `../CLAUDE.md` for library-level instructions.

---

## Current Sprint: Project Factory v3.0

**Execution doc**: `PROJECT_FACTORY_EXECUTION.md` (1,875 lines, in project root)

### What's Being Built

Transform from locked-in SvelteKit monorepo into platform-aware AI project factory:

- **Architecture Advisor** — New post-pipeline agent reading research + template registry → BuildSpec
- **Template Registry** — D1 table: 32 CF templates + 5 BIBLE patterns with costs/bindings/tags
- **CF Capabilities** — D1 table: all CF products with pricing for cost estimation
- **Build Specs** — D1 table: Architecture Advisor output per planning run
- **Gateway routes** — `/api/factory/*` for templates, capabilities, build specs

### Sprint Status

| Phase           | Status         | Description                           |
| --------------- | -------------- | ------------------------------------- |
| 1. Data Layer   | ⬜ Not started | BuildSpec types, D1 tables, seed data |
| 2. Intelligence | ⬜ Not started | Architecture Advisor agent + schema   |
| 3. Gateway      | ⬜ Not started | /api/factory/\* routes                |
| 4. Scanner      | ⬜ Not started | Watch cloudflare/templates repo       |
| 5. Context      | ⬜ Not started | Make foundation-context.ts switchable |
| 6. Verification | ⬜ Not started | Build + E2E test                      |

### Safety Rules

- Architecture Advisor runs as **post-pipeline** step (after validation) — existing 18-phase pipeline UNTOUCHED
- All new code in **NEW files** — existing agents never modified
- Only ~8 existing files get modified (adding imports/exports/routes)
- Every change independently reversible
- `pnpm run build` must pass after every task
