# EXECUTION MASTER: Full Audit, Fix, and Elevation

> **For:** Claude Code  
> **Project:** `c:\dev\.cloudflare\cloudflare-foundation-dev` (Cloudflare Foundation v2.5)  
> **Goal:** Full codebase audit, fix all broken logic, connect all layers, implement Jira AI Labs, elevate to production quality.  
> **Knowledge base:** `C:\dev\.cloudflare\` (INDEX.md, BIBLE.md, patterns/, templates/)

---

## PHASE 0: UNDERSTAND THE PROJECT

This is a **monorepo template** for production-grade agentic apps on Cloudflare. It has:

- **UI** (SvelteKit + Cloudflare adapter) at `services/ui/`
- **Gateway** (Hono on Workers) at `services/gateway/`
- **Planning Machine** (Workers + Workflows + D1 + Vectorize) at `services/planning-machine/`
- **Agents** (Durable Objects + MCP) at `services/agents/`
- **Workflows** (Cloudflare Workflows) at `services/workflows/`
- **Queues** (Queue consumers) at `services/queues/`
- **Cron** (Scheduled triggers) at `services/cron/`
- **Packages**: `@foundation/shared`, `@foundation/db`, `foundation-cli`, `foundation-plan`

**Request flow:** Browser → SvelteKit UI → GATEWAY service binding → Gateway (Hono) → PLANNING_SERVICE / AGENT_SERVICE bindings → Workers

**Dev command:** `pnpm run dev` (builds all, runs wrangler dev on port 8788 with all workers)

---

## PHASE 1: BACKEND AUDIT AND FIXES

### 1.1 Planning Workflow — CRITICAL BUGS

**File:** `services/planning-machine/src/workflows/planning-workflow.ts`

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | **Version hardcoded to 1** (artifact INSERT always uses `version: 1`) | HIGH | Query `SELECT MAX(version) FROM planning_artifacts WHERE run_id=? AND phase=?` before insert, use `max+1` |
| 2 | **Kill-test step key reuse** — PIVOT resets loop but `step.do("phase-kill-test")` returns cached result | HIGH | Use `phase-kill-test-v${pivotCount}` as step key. Apply same pattern to ALL phase step keys inside pivot loop |
| 3 | **PIVOT exhausted falls through** — when `pivotCount >= 3` and verdict=PIVOT, code continues as if GO | HIGH | Add explicit branch: set status=killed, kill_verdict=PIVOT_EXHAUSTED, return early |
| 4 | **refined_idea never persisted** — updated in memory but never written to `planning_runs.refined_idea` | MEDIUM | After opportunity phase updates refinedIdea, run `UPDATE planning_runs SET refined_idea=? WHERE id=?` |
| 5 | **REVISE verdict ignored** — reviewer returns REVISE but workflow only handles REJECT | MEDIUM | When verdict=REVISE: re-run agent with feedback in context (max 2 iterations), re-review, then tiebreaker if still REVISE |
| 6 | **priorOutputs has undefined values after PIVOT** — `Object.keys(priorOutputs).length > 0` is misleading | LOW | After clearing phases on PIVOT, use `delete priorOutputs[key]` instead of setting `= undefined` |
| 7 | **Non-atomic DB operations** — artifact insert + run update not in transaction | LOW | Use D1 batch: `env.DB.batch([stmt1, stmt2])` |
| 8 | **Missing error recovery** — if workflow crashes mid-phase, no resume | LOW | Store intermediate state in D1 for resume |

### 1.2 RAG — BUGS

**File:** `services/planning-machine/src/lib/rag.ts`

| # | Bug | Fix |
|---|-----|-----|
| 1 | **No run isolation** — `queryRelevant` returns results from ALL runs | Filter `matches` by `m.metadata?.runId === runId` after query |
| 2 | **Poor query quality** — `JSON.stringify(priorOutputs).slice(0, 500)` is a bad query | Build a natural language query: `"Context for ${currentPhase} phase of idea: ${idea}"` |
| 3 | **Content truncation inconsistency** — embeds 8000 chars, stores 1000 in metadata, 2000 in D1 | Standardize: embed first 4000, store 2000 in both metadata and D1 |
| 4 | **Silent failures** — embedding failures return without error | Add console.error and propagate errors |

### 1.3 Reviewer — BUGS

**File:** `services/planning-machine/src/lib/reviewer.ts`

| # | Bug | Fix |
|---|-----|-----|
| 1 | **Fragile JSON parsing** — `response.match(/\{[\s\S]*\}/)` can match wrong braces | Use `JSON.parse` with try/catch, then try regex as fallback |
| 2 | **No score validation** — scores not checked to be 0-10 | Clamp scores: `Math.max(0, Math.min(10, score))` |
| 3 | **Missing overall_score calculation** — referenced in workflow but not computed in reviewer | Add: `overallScore = Object.values(scores).reduce((a,b) => a+b, 0) / Object.values(scores).length` |

### 1.4 Model Router — BUGS

**File:** `services/planning-machine/src/lib/model-router.ts`

| # | Bug | Fix |
|---|-----|-----|
| 1 | **Simplistic message formatting** — `messagesToPrompt` doesn't handle chat template | Use proper chat format: `<s>[INST] {system}\n{user} [/INST]` for Mistral, or just pass messages array if model supports it |
| 2 | **No error handling** — `ai.run()` can throw | Wrap in try/catch, return meaningful error |
| 3 | **No retry** — transient API failures cause phase failure | Add 1 retry with 2s delay |

### 1.5 Planning Machine API — MISSING FEATURES

**File:** `services/planning-machine/src/index.ts`

| # | Missing | Implementation |
|---|---------|---------------|
| 1 | **GET /api/planning/runs** (list runs) | Already exists but verify: query params `limit`, `status`, `offset`; return `{ items, total?, hasMore }` |
| 2 | **GET /api/planning/runs/:id/phases** | Return per-phase status derived from artifacts and current_phase |
| 3 | **POST /api/planning/runs/:id/cancel** | Update status to "cancelled", stop workflow if possible |
| 4 | **DELETE /api/planning/runs/:id** | Delete run + artifacts + parked ideas |
| 5 | **Hardcoded `runId: "test"` in agent endpoints** | Generate real UUID or accept from body |
| 6 | **No input validation** | Validate idea length (min 10 chars), phase names, run IDs |
| 7 | **Inconsistent error format** | Standardize: `{ error: { code: string, message: string } }` |

### 1.6 Agent Registry — IMPROVEMENTS

**File:** `services/planning-machine/src/agents/registry.ts`

| # | Issue | Fix |
|---|-------|-----|
| 1 | Phase name mismatch: registry has `"gtm-marketing"` but some code uses `"gtm"` | Verify all references use `"gtm-marketing"` consistently |
| 2 | `getPhasesBeforeKillTest` and `getPhasesAfterKillTest` are hardcoded | Derive from `PHASE_ORDER.indexOf("kill-test")` |
| 3 | Missing STAGES constant | Add: `STAGES = [{ id: "discovery", label: "Discovery", phases: [...] }, ...]` for UI Kanban |

### 1.7 Base Agent — IMPROVEMENTS

**File:** `services/planning-machine/src/agents/base-agent.ts`

| # | Issue | Fix |
|---|-------|-----|
| 1 | No schema validation on output | Add: `getOutputSchema()` returns Zod schema, validate in `run()` |
| 2 | Context prompt can be huge | Truncate `priorOutputs` per phase to 2000 chars |
| 3 | No timeout | Add max 60s timeout per agent run |

---

## PHASE 2: GATEWAY AUDIT AND FIXES

**File:** `services/gateway/src/index.ts`

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | **Planning route doesn't forward request body** | HIGH | Change to: `c.env.PLANNING_SERVICE.fetch(new Request(url.toString(), { method: c.req.method, headers: c.req.raw.headers, body: c.req.raw.body }))` |
| 2 | **SQL interpolation in /api/data/:table** | MEDIUM | Even with ALLOWED_TABLES check, use parameterized approach or template literal with validated value |
| 3 | **No error handling on service fetches** | MEDIUM | Wrap in try/catch, return 502 on service errors |
| 4 | **approvePhase is a stub** | LOW | Document or implement |

### 2.1 Auth Middleware — GAPS

**File:** `services/gateway/src/middleware/auth.ts`

| # | Issue | Fix |
|---|-------|-----|
| 1 | Always allows requests (no rejection) | For dev this is fine; add `// TODO: enforce auth in production` comment |
| 2 | Silent error swallowing | Add `console.error` in catch block |
| 3 | No session expiration check | Check `session.exp` if present |

### 2.2 Context Token — BUG

**File:** `services/gateway/src/middleware/context-token.ts`

| # | Bug | Fix |
|---|-----|-----|
| 1 | Uses `btoa()` which doesn't handle UTF-8 | Use `btoa(encodeURIComponent(json))` or proper base64url encoding |

### 2.3 Rate Limit — IMPROVEMENTS

**File:** `services/gateway/src/middleware/rate-limit.ts`

| # | Issue | Fix |
|---|-------|-----|
| 1 | Race condition on read-modify-write | Use D1 or Durable Objects for atomic operations (acceptable for now with KV) |
| 2 | No rate limit headers | Add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

### 2.4 CORS — IMPROVEMENT

**File:** `services/gateway/src/middleware/cors.ts`

| # | Issue | Fix |
|---|-------|-----|
| 1 | Allows all origins | Add env var for allowed origins; default to `*` in dev |

### 2.5 Audit Chain — BUG

**File:** `services/gateway/src/lib/audit-chain.ts`

| # | Bug | Fix |
|---|-----|-----|
| 1 | Missing sequence number in INSERT | Calculate seq from MAX(seq) + 1 or use auto-increment |

---

## PHASE 3: UI AUDIT AND FIXES

### 3.1 Existing Components (verify and fix)

The UI already has these components (from prior Claude Code session):
- `lib/components/AppShell.svelte` — app shell with TopBar + Sidebar
- `lib/components/Sidebar.svelte` — vertical nav
- `lib/components/TopBar.svelte` — top bar with ERLV Inc branding
- `lib/components/SubNav.svelte` — horizontal tabs (Idea | Research | Production)
- `lib/components/CreateModal.svelte` — create new run/idea
- `lib/components/Kanban.svelte` — Kanban board
- `lib/components/KanbanColumn.svelte` — column
- `lib/components/KanbanCard.svelte` — card
- `lib/components/CardDetailPanel.svelte` — slide-over detail
- `lib/components/PhaseTimeline.svelte` — phase tabs (1-15)
- `lib/components/PhaseDetail.svelte` — phase documentation + artifacts
- `lib/components/ArtifactViewer.svelte` — JSON viewer
- `lib/components/Badge.svelte` — status badges

**Audit each component:**
1. Read the file, check for errors
2. Verify props and data flow
3. Verify API calls are correct (use `platform.env.GATEWAY.fetch(...)` pattern)
4. Fix broken imports or missing dependencies
5. Ensure consistent styling with `app.css` design tokens

### 3.2 Existing Routes (verify and fix)

| Route | File | Audit |
|-------|------|-------|
| `/` | `+page.svelte` | Should redirect to `/dashboard` |
| `/dashboard` | `dashboard/+page.svelte` | Should show overview, quick stats, recent runs |
| `/ai-labs` | `ai-labs/+page.server.ts` | Should redirect to `/ai-labs/research` |
| `/ai-labs/idea` | `ai-labs/idea/+page.svelte` | Idea Kanban — verify API calls |
| `/ai-labs/research` | `ai-labs/research/+page.svelte` | Research Kanban — verify API calls |
| `/ai-labs/research/runs/[id]` | `ai-labs/research/runs/[id]/+page.svelte` | Run detail — verify API calls |
| `/ai-labs/production` | `ai-labs/production/+page.svelte` | Placeholder — verify renders |
| `/ai-labs/parked-ideas` | `ai-labs/parked-ideas/+page.svelte` | Parked ideas table — verify API calls |
| `/agents` | `agents/+page.svelte` | Agents view — verify renders |
| `/portfolio` | `portfolio/+page.svelte` | Portfolio view — verify renders |
| `/chat` | `chat/+page.svelte` | WebSocket chat — **FIX URL construction** |

### 3.3 Critical UI Fixes

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | **Chat WebSocket URL wrong** | `chat/+page.svelte` | Fix URL to `${protocol}//${location.host}/api/agents/chat-agent/${agentName}` |
| 2 | **Server loaders may hardcode localhost** | Various `+page.server.ts` | Use `platform.env.GATEWAY.fetch('https://_/api/...')` exclusively, never `127.0.0.1` |
| 3 | **Missing error handling in loaders** | Various `+page.server.ts` | Add try/catch, return `{ error }` to page |
| 4 | **No loading states** | Various `+page.svelte` | Add loading indicators while data fetches |
| 5 | **Date formatting** | Parked ideas | Check if timestamps are seconds or milliseconds before multiplying by 1000 |

### 3.4 API Data Flow (verify each route)

For EVERY `+page.server.ts` that fetches data:
1. Verify it uses `platform.env.GATEWAY.fetch('https://_/api/planning/...')`
2. Verify the API endpoint exists in the Planning Machine
3. Verify the Gateway routes `/api/planning/*` to PLANNING_SERVICE
4. Verify the response shape matches what the page expects
5. Fix any mismatches

---

## PHASE 4: CONNECTIVITY VERIFICATION

### 4.1 Full request trace (must work for each)

**Trace 1: Research Kanban loads runs**
```
Browser GET /ai-labs/research
→ SvelteKit renders page
→ +page.server.ts load() runs
→ platform.env.GATEWAY.fetch('https://_/api/planning/runs?limit=50')
→ Gateway receives GET /api/planning/runs
→ app.all("/api/planning/*") matches
→ PLANNING_SERVICE.fetch(request) forwards
→ Planning Machine handleRuns() → listRuns()
→ Returns { items: [...], hasMore }
→ load() returns { runs }
→ Page renders Kanban with run cards
```

**Trace 2: Create new run**
```
Browser clicks "Create" → modal opens → submits idea
→ POST /api/planning/runs with { idea: "..." }
→ SvelteKit api/[...path] catches → proxies to Gateway
→ Gateway /api/planning/* → PLANNING_SERVICE.fetch()
→ Planning Machine createRun() → inserts to D1 → starts workflow
→ Returns { id, status: "running" }
→ UI refreshes run list
```

**Trace 3: Run detail loads phases**
```
Browser GET /ai-labs/research/runs/abc123
→ +page.server.ts load() runs
→ Fetch run: platform.env.GATEWAY.fetch('https://_/api/planning/runs/abc123')
→ Fetch artifacts per phase (or single endpoint)
→ Returns run data + phase data
→ Page renders PhaseTimeline + PhaseDetail
```

**Trace 4: Parked ideas**
```
Browser GET /ai-labs/parked-ideas (or /ai-labs/idea)
→ +page.server.ts load()
→ platform.env.GATEWAY.fetch('https://_/api/planning/parked-ideas')
→ Gateway → Planning Machine → getParkedIdeas()
→ Returns { items: [...] }
→ Page renders table/cards
```

**For EACH trace:** walk through the actual code, verify every step works, fix gaps.

### 4.2 Binding verification

Run these checks:
1. `services/ui/wrangler.jsonc` has `"services": [{ "binding": "GATEWAY", "service": "foundation-gateway" }]`
2. `services/gateway/wrangler.jsonc` has `"services": [{ "binding": "PLANNING_SERVICE", "service": "foundation-planning-machine" }]`
3. `services/gateway/src/types.ts` has `PLANNING_SERVICE?: Fetcher` in Env
4. `services/ui/src/app.d.ts` has `GATEWAY: Fetcher` in Platform.env

### 4.3 Migration verification

Run: `npx wrangler d1 migrations apply planning-primary --local` from `services/planning-machine/`
Verify tables: `planning_runs`, `planning_artifacts`, `planning_sources`, `planning_memory`, `planning_quality`, `planning_parked_ideas`

---

## PHASE 5: MISSING DOCUMENTATION

### 5.1 Files to create/update

| File | What | Status |
|------|------|--------|
| `docs/ARCHITECTURE.md` | Full architecture with diagrams | EXISTS but only 15 lines — expand |
| `docs/EXTENDING.md` | How to add agents, phases, routes | EXISTS but only 4 lines — expand |
| `docs/DEPLOYMENT.md` | Full deployment guide | EXISTS at 82 lines — verify and update |
| `docs/API.md` | Planning Machine API reference | MISSING — create |
| `docs/PHASES.md` | All 15 planning phases documented | MISSING — create from `phase-docs.ts` |
| `services/planning-machine/README.md` | Planning machine docs | EXISTS — verify |
| `README.md` | Main project README | EXISTS — update with new nav structure |

### 5.2 Architecture doc should include

- Service diagram (UI → Gateway → Planning Machine / Agents / Workflows)
- Request flow diagrams
- D1 schema (both databases)
- Phase pipeline diagram
- Nav structure (Dashboard, AI Labs, Agents, Portfolio)

### 5.3 API doc should include

Every endpoint in the Planning Machine:
- Method, path, query params, body schema, response schema, error codes
- Example requests/responses

---

## PHASE 6: ELEVATION (PRODUCTION QUALITY)

### 6.1 Error handling standardization

**Standard error response format:**
```json
{ "error": { "code": "NOT_FOUND", "message": "Run not found" } }
```

Apply to: every endpoint in Planning Machine, every middleware error in Gateway, every loader error in UI.

### 6.2 Type safety

- Fix all `as any` and `as unknown` casts
- Add Zod validation on API inputs
- Add proper generics to BaseAgent
- Export shared types from `@foundation/shared`

### 6.3 Logging and observability

- Add `console.error` with context to every catch block
- Add correlation ID to all logs
- Add phase timing to workflow (store start_time, end_time per phase)

### 6.4 Testing foundations

- Add health check test: `GET /api/health` returns 200
- Add planning smoke test: create run, check status
- Add UI smoke test: each route returns 200

---

## EXECUTION ORDER

**Do these in order. Verify each before proceeding to next.**

```
PHASE 1: Backend fixes (workflow, RAG, reviewer, model-router, API)
         ↓
PHASE 2: Gateway fixes (request forwarding, error handling, middleware)
         ↓
PHASE 3: UI fixes (loaders, components, chat WebSocket, loading states)
         ↓
PHASE 4: Connectivity verification (trace each flow, fix gaps)
         ↓
PHASE 5: Documentation (architecture, API, phases, README)
         ↓
PHASE 6: Elevation (error handling, types, logging)
```

### Per-phase verification

After each phase, run:
```bash
# Build
npx pnpm run build

# Typecheck
npx pnpm run typecheck:workers

# Dev
npx pnpm run dev

# Test endpoints
curl -s http://127.0.0.1:8788/api/health
curl -s http://127.0.0.1:8788/api/planning/health
curl -s http://127.0.0.1:8788/api/planning/runs
curl -s http://127.0.0.1:8788/api/planning/parked-ideas

# Test pages (should return 200)
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/dashboard
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/ai-labs/research
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/ai-labs/idea
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/agents
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/portfolio
```

---

## SUCCESS CRITERIA

- [ ] No typecheck errors (`pnpm run build` succeeds)
- [ ] All API endpoints return correct responses
- [ ] All UI pages render without errors
- [ ] Create Run flow works end-to-end
- [ ] Research Kanban shows runs from API
- [ ] Run detail shows phase timeline with artifacts
- [ ] Idea page shows parked ideas
- [ ] Sidebar navigation works: Dashboard, AI Labs, Agents, Portfolio
- [ ] AI Labs sub-nav works: Idea | Research | Production
- [ ] Chat page connects to agent WebSocket
- [ ] Documentation is complete and accurate
- [ ] All middleware chain works: CORS → correlation → rate limit → auth → tenant → context token → route handler

---

## FILE REFERENCE

| Layer | Key files |
|-------|-----------|
| **Planning workflow** | `services/planning-machine/src/workflows/planning-workflow.ts` |
| **Planning API** | `services/planning-machine/src/index.ts` |
| **RAG** | `services/planning-machine/src/lib/rag.ts` |
| **Reviewer** | `services/planning-machine/src/lib/reviewer.ts` |
| **Model router** | `services/planning-machine/src/lib/model-router.ts` |
| **Agent registry** | `services/planning-machine/src/agents/registry.ts` |
| **Base agent** | `services/planning-machine/src/agents/base-agent.ts` |
| **Gateway routes** | `services/gateway/src/index.ts` |
| **Gateway types** | `services/gateway/src/types.ts` |
| **All middleware** | `services/gateway/src/middleware/*.ts` |
| **Audit chain** | `services/gateway/src/lib/audit-chain.ts` |
| **UI layout** | `services/ui/src/routes/+layout.svelte` |
| **UI app shell** | `services/ui/src/lib/components/AppShell.svelte` |
| **UI sidebar** | `services/ui/src/lib/components/Sidebar.svelte` |
| **UI top bar** | `services/ui/src/lib/components/TopBar.svelte` |
| **UI Kanban** | `services/ui/src/lib/components/Kanban.svelte`, `KanbanColumn.svelte`, `KanbanCard.svelte` |
| **UI detail panel** | `services/ui/src/lib/components/CardDetailPanel.svelte` |
| **UI phase timeline** | `services/ui/src/lib/components/PhaseTimeline.svelte` |
| **UI phase detail** | `services/ui/src/lib/components/PhaseDetail.svelte` |
| **UI create modal** | `services/ui/src/lib/components/CreateModal.svelte` |
| **UI API proxy** | `services/ui/src/routes/api/[...path]/+server.ts` |
| **UI types** | `services/ui/src/app.d.ts`, `src/lib/types/index.ts` |
| **UI CSS** | `services/ui/src/app.css` |
| **AI Labs research** | `services/ui/src/routes/ai-labs/research/+page.svelte`, `+page.server.ts` |
| **AI Labs idea** | `services/ui/src/routes/ai-labs/idea/+page.svelte`, `+page.server.ts` |
| **AI Labs run detail** | `services/ui/src/routes/ai-labs/research/runs/[id]/+page.svelte`, `+page.server.ts` |
| **AI Labs parked** | `services/ui/src/routes/ai-labs/parked-ideas/+page.svelte`, `+page.server.ts` |
| **Chat** | `services/ui/src/routes/chat/+page.svelte` |
| **Dashboard** | `services/ui/src/routes/dashboard/+page.svelte` |
| **Phase docs** | `services/ui/src/lib/data/phase-docs.ts` |
| **UI wrangler** | `services/ui/wrangler.jsonc` |
| **Gateway wrangler** | `services/gateway/wrangler.jsonc` |
| **Planning wrangler** | `services/planning-machine/wrangler.jsonc` |
| **Migrations** | `services/planning-machine/migrations/0000-0004.sql`, `services/gateway/migrations/0000_init.sql` |
