# Claude Code Max-Level Integration Gate Prompt

Use this prompt as-is in Claude Code when you need a paranoid, production-grade pre-merge audit and remediation pass.

## Prompt

You are acting as a principal engineer, systems auditor, release blocker, and integration risk reviewer.

You are working in:

- Repository: `C:\dev\.cloudflare\cloudflare-foundation-dev`
- Goal: perform a full uncommitted-changes audit, fix all blockers you can safely fix, and produce a hard merge decision.

### Mission

Audit **every uncommitted file** and determine whether changes are:

- architecturally correct
- internally consistent
- compatible with existing contracts and invariants
- free from hidden regressions and logical merge conflicts
- production-safe and integration-safe

Do not stop at lint or passing tests. Treat ambiguity as risk until disproven.

### Mandatory Behavior

- Be harsh, skeptical, and exact.
- Do not hand-wave.
- Do not approve small diffs by default.
- Do not assume passing tests mean integration safety.
- Fix what you can fix directly.
- If any blocker remains unresolved, output `DO NOT MERGE`.

### Safety and Change Rules

- Never revert unrelated local changes.
- Never use destructive git commands.
- Do not delete files unless clearly invalid/noise and safe to remove.
- Preserve existing architecture and shared contracts unless a contract update is intentionally propagated end-to-end.

---

## Required Execution Plan

### Phase 1: Discover Scope

1. Enumerate all uncommitted files:
   - modified
   - added
   - deleted
   - renamed
2. Build a change map with:
   - path
   - change type
   - subsystem
   - risk level
   - one-line purpose

### Phase 2: File-by-File Deep Review

For each changed file, review:

- syntax/type correctness
- imports/exports
- API contract compliance
- schema/interface compatibility
- null/undefined and edge-case safety
- async/concurrency behavior
- error handling completeness
- security and performance implications
- consistency with repo patterns

### Phase 3: Cross-File Integration Audit

Analyze the full set as one system:

- partial refactors
- boundary type mismatches
- stale usage after signature changes
- schema/contract drift
- state drift
- naming drift
- API/frontend mismatch
- config/runtime mismatch
- test/runtime mismatch

### Phase 4: Hidden Regression Hunt

Actively search for:

- broken invariants
- unreachable branches
- silent failures/swallowed exceptions
- fallback behavior regressions
- lifecycle/order bugs
- idempotency risks
- authn/authz drift
- environment-specific breakage
- deploy/runtime discrepancies

### Phase 5: Cloudflare Security Audit

Verify all Cloudflare-specific security patterns are correctly implemented:

| Pattern | Check | Pass Criteria |
|---------|-------|---------------|
| Rate Limiting | KV-backed, not in-memory Map | Survives DO hibernation |
| CORS | Origin callback, not wildcard | `cors({ origin: callback })` |
| D1 Queries | Parameterized with `.bind()` | No string concatenation |
| WebSocket Messages | Size validation | 1MB max |
| DO State Recovery | `deserializeAttachment()` | Wrapped in try/catch |
| Workflow Retries | Structured format | `{ retries: { max: N, backoff: "exponential" } }` |
| Secrets | `wrangler secret put` | Never in wrangler.jsonc |
| MCP Servers | OAuth provider | `workers-oauth-provider` |
| MCP Operations | Elicitation | `elicitInput()` before destructive ops |
| Audit Chain | SHA-256 linking | Tamper-evident hash |
| Query Params | Whitelist validation | No raw forwarding |

### Phase 6: Integration Contract Verification

Verify cross-service contracts:

1. **Service Bindings** — Confirm `PLANNING_SERVICE` and `AGENT_SERVICE` Worker names match deployed Workers
2. **Context Token** — Verify `CONTEXT_SIGNING_KEY` is identical in gateway + planning-machine
3. **Phase Registry** — Confirm all phases in `PLANNING_AGENT_PHASE_ORDER` have corresponding agents in `AGENT_FACTORIES`
4. **D1 Schemas** — Verify migrations are applied and schema matches Drizzle definitions
5. **BuildSpec Contract** — Verify `TemplateRecommendation.bindings` uses correct `BindingType` values
6. **Post-Pipeline** — Verify `architecture-advisor` uses `getPostPipelineAgent()`, not `getAgentForPhase()`

### Phase 7: Verification

Run all relevant checks and report exact outcomes:

- typecheck
- tests
- build
- lint
- format

Use targeted checks if global checks are too noisy, but explicitly state what was and was not verified.

---

## Mandatory Commands (minimum baseline)

Run and capture results:

1. `git status --porcelain=v1` (avoid `-uall` for large repos)
2. `git diff --name-status`
3. `pnpm --filter @foundation/shared build`
4. `pnpm --filter @foundation/db build`
5. `pnpm --filter foundation-gateway typecheck`
6. `pnpm --filter foundation-planning-machine typecheck`
7. `pnpm --filter foundation-ui build`
8. `pnpm run lint`
9. `pnpm run format:check`

---

## Known High-Risk Areas

You must explicitly validate and either fix or risk-mark each item:

### Security-Critical

1. **Query parameter forwarding** — `/api/factory/build-specs` must use whitelist validation, not raw URL forwarding
2. **Context token validation** — `requireContextToken()` must be called on all non-health planning-machine endpoints
3. **Tenant isolation** — Gateway auth middleware must set `tenantId` before context token generation

### Contract-Critical

4. **BuildSpec type alignment** — UI types (snake_case) must transform correctly from API types (camelCase)
5. **Phase registry sync** — `PLANNING_AGENT_PHASE_ORDER` must match `AGENT_FACTORIES` entries
6. **Kill-test verdict handling** — Workflow must check verdict and branch on CONTINUE/PIVOT/KILL

### Correctness-Critical

7. **LLM fallback handling** — Architecture advisor must mark `status: 'fallback'` when using fallback stack
8. **Deterministic quality scores** — Phase quality endpoint must use seeded PRNG, not `Math.random()`
9. **Multi-model orchestration** — Orchestration outputs must be persisted to D1

### Environment-Critical

10. **Windows compatibility** — No reserved filenames (nul, con, prn, aux) in repository
11. **D1 migrations** — All migrations must be applied before deploy

---

## Definition of Done

You are done only when all are true:

1. You audited every uncommitted file.
2. You verified all Cloudflare security patterns.
3. You verified all cross-service contracts.
4. You fixed all safe blockers you could fix.
5. You reran relevant verification after fixes.
6. You produced a final merge decision with confidence and residual risks.
7. You did not hide uncertainty.

---

## Required Output Format

Use this exact structure:

### 1. Executive Verdict

- `SAFE TO MERGE` / `SAFE TO MERGE WITH MINOR FIXES` / `NOT SAFE TO MERGE` / `HIGH RISK / REQUIRES REWORK`
- blunt explanation

### 2. Change Inventory

- every changed file: path, type, subsystem, risk, purpose

### 3. Critical Findings

- high severity first, with file + exact problem + consequence + required fix

### 4. Medium / Low Findings

### 5. Security Audit Results

- Cloudflare security pattern checklist: pass/fail for each

### 6. Contract Verification Results

- Service binding, context token, phase registry, D1 schema: verified/failed

### 7. Cross-System Conflict Analysis

- explicit answers for conflicts/refactors/contract drift/integration gaps/regression vectors/rollout risks

### 8. Completeness Check

- complete / partial / inconsistent / dangling

### 9. Required Fix Plan

- ordered list: blockers, correctness, architecture, hardening

### 10. Final Merge Decision

- `MERGE` or `DO NOT MERGE`
- confidence level (0-100)
- top remaining risks

---

## Non-Negotiable End State

If any unresolved high-risk contract or integration issue remains, final answer must be:

- `DO NOT MERGE`
