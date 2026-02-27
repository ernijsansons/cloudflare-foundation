# Project Factory v3.0 — Architecture Documentation

## Overview

Project Factory v3.0 transforms the Planning Machine from a research-only tool into a complete AI-powered project factory that recommends optimal Cloudflare architectures based on deep business analysis.

**Flow**: Idea → 18-Phase Research → Architecture Advisor → BuildSpec → Scaffold Generator

---

## Architecture

### 1. Planning Machine (18-Phase Research)

The existing 18-phase pipeline analyzes business ideas through:

- Opportunity analysis & customer research (phases 1-4)
- Kill-test gate & revenue modeling (phases 5-7)
- Business model & product design (phases 8-9)
- Go-to-market & technical architecture (phases 10-12)
- Analytics, launch execution & synthesis (phases 13-15)
- Task reconciliation & validation (phases 16-18)

**Output**: Deep research artifacts in D1 (`planning_artifacts` table)

### 2. Architecture Advisor Agent (Post-Pipeline)

**Location**: `services/planning-machine/src/agents/architecture-advisor-agent.ts`

**Responsibilities**:

1. Extract insights from research phases (kill-test, business-model, product-design, tech-arch)
2. Query `template_registry` for matching templates (32+ templates)
3. Query `cf_capabilities` for free wins and cost estimation (16+ CF products)
4. Generate ranked `BuildSpec` recommendations

**Invocation**:

- Automatically runs after workflow completion (gated by `config.generateBuildSpec !== false`)
- Manually via `POST /api/factory/build-specs/:runId`

**Output**: `BuildSpec` object with:

- Recommended template + 0-3 alternatives
- Data model (tables, columns, indexes)
- API routes (methods, paths, auth)
- Frontend spec (framework, pages, components, motion tier)
- Agent specs (Durable Objects, state, tools)
- Free wins (Turnstile, Analytics Engine, etc.)
- Growth path (upgrade trigger + steps)
- Scaffold command (`npm create cloudflare@latest -- --template=...`)
- Cost estimates (bootstrap/growth/scale)

---

## Database Schema

### Template Registry (`template_registry`)

Stores 32+ Cloudflare templates with metadata:

| Column                | Type        | Description                                                     |
| --------------------- | ----------- | --------------------------------------------------------------- |
| `id`                  | TEXT        | UUID                                                            |
| `slug`                | TEXT UNIQUE | Template identifier (e.g., `worker-d1-drizzle`)                 |
| `name`                | TEXT        | Human-readable name                                             |
| `description`         | TEXT        | What this template does                                         |
| `source`              | TEXT        | `cloudflare` / `bible` / `community`                            |
| `category`            | TEXT        | `api` / `fullstack` / `static` / `realtime` / `ai` / `workflow` |
| `framework`           | TEXT        | `hono` / `react-router` / `svelte` / `astro` / etc.             |
| `bindings`            | TEXT (JSON) | Required CF bindings (e.g., `["d1_databases", "r2_buckets"]`)   |
| `complexity`          | INTEGER     | 1-5 (1=trivial, 5=expert)                                       |
| `estimated_cost_low`  | REAL        | Bootstrap cost ($/mo)                                           |
| `estimated_cost_mid`  | REAL        | Growth cost ($/mo)                                              |
| `estimated_cost_high` | REAL        | Scale cost ($/mo)                                               |
| `cost_notes`          | TEXT        | Pricing caveats (optional)                                      |
| `repo_url`            | TEXT        | GitHub URL                                                      |
| `docs_url`            | TEXT        | Documentation URL                                               |
| `deprecated`          | INTEGER     | 0/1 boolean                                                     |
| `tags`                | TEXT (JSON) | Searchable tags                                                 |

**Sources**:

- 22 Cloudflare official templates (from cloudflare/templates repo)
- 5 BIBLE patterns (DURABLE_OBJECTS, WORKFLOWS, AI_AND_VECTORS, MCP_SERVER, QUEUES_AND_DLQ)
- 5+ community templates (Next.js, Remix, SvelteKit, tRPC, etc.)

### CF Capabilities (`cf_capabilities`)

Stores 16 primary Cloudflare products:

| Column           | Type        | Description                                         |
| ---------------- | ----------- | --------------------------------------------------- |
| `id`             | TEXT        | UUID                                                |
| `slug`           | TEXT UNIQUE | Product identifier (e.g., `d1`, `r2`, `workers-ai`) |
| `name`           | TEXT        | Official product name                               |
| `description`    | TEXT        | What it does                                        |
| `binding_type`   | TEXT        | Wrangler binding type (e.g., `d1_databases`)        |
| `has_free_quota` | INTEGER     | 0/1 boolean                                         |
| `free_quota`     | TEXT        | Free tier details (e.g., `"5M reads/day"`)          |
| `paid_pricing`   | TEXT        | Paid plan pricing                                   |
| `best_for`       | TEXT (JSON) | Use cases                                           |
| `limitations`    | TEXT (JSON) | Known constraints                                   |

**Products**: Workers, D1, R2, KV, Durable Objects, Vectorize, Queues, Workflows, Workers AI, AI Gateway, Analytics Engine, Turnstile, Hyperdrive, Browser Rendering, Containers, Images

### Build Specs (`build_specs`)

Stores Architecture Advisor outputs:

| Column             | Type        | Description                          |
| ------------------ | ----------- | ------------------------------------ |
| `id`               | TEXT        | UUID                                 |
| `run_id`           | TEXT        | FK to `planning_runs.id`             |
| `recommended`      | TEXT (JSON) | Top template recommendation          |
| `alternatives`     | TEXT (JSON) | 0-3 alternative options              |
| `data_model`       | TEXT (JSON) | DB tables, columns, indexes          |
| `api_routes`       | TEXT (JSON) | HTTP endpoints                       |
| `frontend`         | TEXT (JSON) | Frontend spec (or NULL for API-only) |
| `agents`           | TEXT (JSON) | Durable Object specs                 |
| `free_wins`        | TEXT (JSON) | Free CF products to add              |
| `growth_path`      | TEXT (JSON) | Upgrade path (optional)              |
| `scaffold_command` | TEXT        | `npm create` command                 |
| `total_cost`       | TEXT (JSON) | Cost at bootstrap/growth/scale       |
| `status`           | TEXT        | `draft` / `approved` / `rejected`    |
| `approved_by`      | TEXT        | User ID (optional)                   |
| `approved_at`      | TEXT        | ISO timestamp (optional)             |

---

## API Routes

### Factory Routes (`/api/factory/*`)

**GET /api/factory/templates**

- Query templates with filters: `category`, `framework`, `maxComplexity`, `maxCostMid`, `source`
- Returns: `{ items: TemplateRegistryEntry[], total: number }`

**GET /api/factory/templates/:slug**

- Get single template by slug
- Returns: `TemplateRegistryEntry` or 404

**GET /api/factory/capabilities**

- Get all Cloudflare products
- Returns: `{ items: CFCapability[], total: number }`

**GET /api/factory/capabilities/free**

- Get products with free tier only
- Returns: `{ items: CFCapability[], total: number }`

**GET /api/factory/build-specs/:runId**

- Get BuildSpec for a completed run
- Returns: `BuildSpec` or 404

**POST /api/factory/build-specs/:runId**

- Manually trigger Architecture Advisor for a completed run
- Validates run exists and status = `completed`
- Generates and persists BuildSpec
- Returns: `BuildSpec` (201) or error (404/409/500)
- Error 409 if BuildSpec already exists

---

## Type Contracts

### BuildSpec Interface

**Location**: `packages/shared/src/types/build-spec.ts`

```typescript
export interface BuildSpec {
	id: string;
	runId: string;
	recommended: TemplateRecommendation;
	alternatives: TemplateRecommendation[];
	dataModel: BuildSpecDataModel;
	apiRoutes: ApiRoute[];
	frontend: FrontendSpec | null;
	agents: AgentSpec[];
	freeWins: FreeWin[];
	growthPath: GrowthPath | null;
	scaffoldCommand: string;
	totalEstimatedMonthlyCost: CostEstimate;
	status: 'draft' | 'approved' | 'rejected';
	approvedBy?: string;
	approvedAt?: string;
	createdAt: string;
	updatedAt: string;
}
```

### TemplateRecommendation

```typescript
export interface TemplateRecommendation {
	slug: string;
	name: string;
	score: number; // 0-100 match score
	reasoning: string;
	bindings: CFBinding[];
	estimatedCost: CostEstimate;
	motionTier: 'none' | 'basic' | 'premium' | 'linear-grade';
	complexity: 1 | 2 | 3 | 4 | 5;
	tradeoffs: string[];
}
```

### FreeWin

```typescript
export interface FreeWin {
	capability: string; // e.g., "turnstile", "analytics-engine"
	benefit: string; // Why to add it
	effort: 'trivial' | 'easy' | 'moderate';
	freeQuota: string; // e.g., "unlimited", "25M events/mo"
}
```

---

## Seeding Instructions

### 1. Apply Migrations

```bash
cd services/planning-machine
npx wrangler d1 migrations apply planning-primary --remote
```

Migrations:

- `0007_template_registry.sql` — Creates `template_registry` and `cf_capabilities` tables
- `0008_build_specs.sql` — Creates `build_specs` table
- `0009_add_freeWins_to_build_specs.sql` — Adds `free_wins` column
- `0010_add_cost_notes_to_templates.sql` — Adds `cost_notes` column

### 2. Seed Template Registry

```bash
cd planning-machine
npx tsx scripts/seed-registry.ts | npx wrangler d1 execute planning-primary --remote --command=-
```

Seeds 32+ templates (22 CF official + 5 BIBLE + 5+ community)

### 3. Seed CF Capabilities

```bash
npx tsx scripts/seed-capabilities.ts | npx wrangler d1 execute planning-primary --remote --command=-
```

Seeds 16 Cloudflare products with pricing and free tier metadata.

### 4. Verify Seed Counts

```bash
cd services/planning-machine
npx wrangler d1 execute planning-primary --remote --command="SELECT COUNT(*) AS c FROM template_registry"
npx wrangler d1 execute planning-primary --remote --command="SELECT COUNT(*) AS c FROM cf_capabilities"
```

Expected:

- `template_registry`: >= 32 rows
- `cf_capabilities`: >= 16 rows

---

## Cost Estimation Methodology

The Architecture Advisor estimates monthly costs at three levels:

**Bootstrap** ($0-20/mo): MVP with first users

- Free tiers sufficient
- Minimal Workers requests
- Light D1 usage
- No premium bindings (DO, Workflows)

**Growth** ($20-100/mo): Product-market fit

- Free tiers exceeded
- Moderate Workers traffic (1-10M req/mo)
- Paid bindings may be needed (DO for real-time, Workflows for orchestration)
- R2/KV for caching

**Scale** ($100+/mo): Growing user base

- High Workers traffic (10M+ req/mo)
- Multiple premium bindings
- Heavy D1 writes
- Durable Objects with many instances

**Cost Notes**: Some templates have caveats (e.g., "Cost depends on AI model choice") stored in `cost_notes` field.

---

## Motion Design Tiers

The Architecture Advisor selects frontend animation quality based on revenue potential:

| Tier           | Use Case                        | Examples                                |
| -------------- | ------------------------------- | --------------------------------------- |
| `none`         | API-only projects               | No frontend                             |
| `basic`        | Simple apps, MVPs, low-revenue  | CSS transitions only                    |
| `premium`      | SaaS, moderate revenue          | Motion library, spring physics, stagger |
| `linear-grade` | Flagship products, high revenue | Full Motion, gestures, glass morphism   |

---

## Integration with Workflow

The Architecture Advisor runs as a **post-pipeline step** in the Planning Workflow:

1. User creates planning run
2. 18-phase pipeline executes
3. After validation phase completes → **Architecture Advisor runs** (if `config.generateBuildSpec !== false`)
4. BuildSpec persisted to `build_specs` table
5. Webhook event `build_spec_generated` emitted
6. Workflow marks run as `completed`

**Gating**: `event.payload.config?.generateBuildSpec !== false` (default: enabled)

**Non-blocking**: If Architecture Advisor fails, workflow still completes successfully.

---

## Future: Scaffold Generator

**Next Phase** (not yet implemented):

The Scaffold Generator will:

1. Read BuildSpec from `build_specs` table
2. Generate project structure:
   - Drizzle schema from `dataModel`
   - Hono routes from `apiRoutes`
   - React Router pages from `frontend.pages`
   - Durable Object classes from `agents`
3. Inject free wins (Turnstile, Analytics Engine)
4. Generate `wrangler.jsonc` with bindings
5. Create `BOOTSTRAP.md` with setup instructions
6. Output to `C:\dev\projects\{slug}-{timestamp}\`

**Command**: `npm run plan:scaffold --run-id=<RUN_ID>`

---

## Troubleshooting

### BuildSpec not generating

1. **Check migrations**:

   ```bash
   cd services/planning-machine
   npx wrangler d1 migrations list planning-primary --remote
   ```

   Should show migrations 0007-0010 applied.

2. **Check tables exist**:

   ```bash
   npx wrangler d1 execute planning-primary --remote --command="SELECT COUNT(*) FROM build_specs"
   ```

3. **Check run status**:

   ```bash
   curl https://gateway.erlvinc.com/api/planning/runs/<RUN_ID> -H "Authorization: Bearer <TOKEN>"
   ```

   Status must be `completed`.

4. **Check workflow config**:
   Ensure `generateBuildSpec` is not explicitly set to `false` in run creation payload.

### Template registry empty

Run seed script:

```bash
cd planning-machine
npx tsx scripts/seed-registry.ts | npx wrangler d1 execute planning-primary --remote --command=-
```

### Architecture Advisor fails

Check logs in Cloudflare dashboard:

```
Workers & Pages > foundation-planning-machine > Logs (Real-time)
```

Look for `[ArchitectureAdvisorAgent]` errors.

---

## Related Documentation

- `../BIBLE.md` — Cloudflare Agent Engineering Bible
- `../templates/` — 5 agent implementation blueprints
- `../patterns/DURABLE_OBJECTS.md` — DO + hibernation patterns
- `../patterns/WORKFLOWS.md` — Durable execution patterns
- `../patterns/AI_AND_VECTORS.md` — RAG pipeline patterns
- `./PLANNING_MACHINE.md` — 18-phase pipeline documentation
