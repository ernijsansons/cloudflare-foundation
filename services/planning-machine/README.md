# Planning Machine Service

Automated planning from one sentence to investor-ready package. Uses Cloudflare Workers AI, D1, R2, Vectorize.

## Setup

```bash
# From monorepo root
pnpm run planning:setup

# Or manually (from services/planning-machine):
wrangler d1 create planning-primary
# Update wrangler.jsonc with database_id from output
wrangler d1 migrations apply planning-primary --remote

# Create R2 bucket (if not exists)
wrangler r2 bucket create planning-files

# Create Vectorize index (if not exists)
wrangler vectorize create planning-embeddings --dimensions=768 --metric=cosine
```

## Dev

```bash
pnpm run planning:dev
# Or: cd services/planning-machine && wrangler dev
```

## API

- `POST /api/planning/runs` — Start run (body: `{ idea: string, config?: {} }`)
- `GET /api/planning/runs/:id` — Run status
- `GET /api/planning/runs/:id/artifacts/:phase` — Get artifact
- `POST /api/planning/runs/:id/approve` — Approve phase (when gates enabled)
- `POST /api/planning/run-opportunity` — Run Opportunity Agent (Phase 0)
- `POST /api/planning/run-customer-intel` — Run Customer Intel Agent (Phase 1)
- `POST /api/planning/run-market-research` — Run Market Research Agent (Phase 2)
- `POST /api/planning/run-competitive-intel` — Run Competitive Intel Agent (Phase 3)
- `POST /api/planning/run-kill-test` — Run Kill Test Agent (Phase 4)
- `POST /api/planning/run-strategy` — Run Strategy Agent (Phase 5)
- `POST /api/planning/run-business-model` — Run Business Model Agent (Phase 6)
- `POST /api/planning/run-product-design` — Run Product Design Agent (Phase 7)
- `POST /api/planning/run-gtm` — Run GTM Agent (Phase 8)
- `POST /api/planning/run-content-engine` — Run Content Engine Agent (Phase 9)
- `POST /api/planning/run-tech-arch` — Run Technical Architecture Agent (Phase 10)
- `POST /api/planning/run-analytics` — Run Analytics Agent (Phase 11)
- `POST /api/planning/run-launch-execution` — Run Launch Execution Agent (Phase 12)
- `POST /api/planning/run-synthesis` — Run Synthesis Agent (Phase 13)
- `GET /api/planning/health` — Health check

**Workflow**: `POST /api/planning/runs` with `{ idea: string }` starts the full 14-phase PlanningWorkflow (if PLANNING_WORKFLOW binding is configured). Returns `workflow_instance_id`.

All agent endpoints accept: `{ idea: string, refinedIdea?: string, priorOutputs?: Record<string, unknown> }`

## Secrets (optional)

- `TAVILY_API_KEY` — Tavily search (free 1000/mo)
- `BRAVE_API_KEY` — Brave Search (free 2000/mo)

### Safe storage

- **Local dev**: Copy `.dev.vars.example` to `.dev.vars` and add your keys. `.dev.vars` is gitignored.
- **Production**: `wrangler secret put TAVILY_API_KEY` (and same for BRAVE_API_KEY) — never commit secrets.
- If keys were ever shared in chat or logs, rotate them in the provider dashboard.
