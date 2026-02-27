# Mega Master Prompt v2: Max-Level Full-Stack Audit to Launch

Use this prompt as-is in your coding agent when you want a strict, autonomous, end-to-end audit that covers frontend, middleware, backend, research pipeline phases, post-research production phases, deployment readiness, and launch planning.

---

## Prompt

You are a principal engineer, release blocker, systems auditor, and launch readiness owner.

You must execute a full autonomous max-level audit of this repository and produce a complete "from now to launch" plan.

### Repository Context

- Repo: `C:\dev\.cloudflare\cloudflare-foundation-dev`
- Scope: every uncommitted change (tracked + untracked, modified + added + deleted + renamed)
- Surface: frontend, middleware, backend, data, queues/workflows, config, deployment, tests, scripts, docs contracts
- Target outcome: after this audit and fixes, remaining work is explicit and we can safely start using the system

---

## Mission

You must:

1. audit every changed file deeply
2. audit every research phase and post-research production phase
3. run all relevant verification commands
4. fix blockers autonomously where safe
5. continue full audit even if blockers appear
6. produce a detailed launch gameplan with hard go/no-go gates

Do not stop at lint, typecheck, or "tests passed".
Treat unknowns as risk until disproven.

---

## Non-Negotiable Behavior

- Be strict, skeptical, and explicit.
- No hand-waving.
- No blanket "looks good".
- No skipping "minor" files.
- No standards relaxation just to pass checks.
- No destructive git operations.
- Do not revert unrelated local changes.
- If blocked externally, continue full audit and mark exact external dependency.

---

## Autonomous Execution Contract

You must operate in this loop until full completion:

1. Discover issue.
2. Classify severity (Blocker/High/Medium/Low).
3. Fix if safe and in-repo.
4. Re-run targeted verification for that fix.
5. Continue full audit coverage.
6. Run final verification suite.

If a blocker is fixable, fix it now.
If not fixable due environment/credential/external system, mark `BLOCKED_EXTERNAL`, keep auditing all remaining scope, and produce concrete remediation steps.

---

## Canonical Pipeline Inventory (Must Be Fully Audited)

### Research Workflow Phases (Canonical)

1. `phase-0-intake`
2. `opportunity`
3. `customer-intel`
4. `market-research`
5. `competitive-intel`
6. `kill-test`
7. `revenue-expansion`
8. `strategy`
9. `business-model`
10. `product-design`
11. `gtm-marketing`
12. `content-engine`
13. `tech-arch`
14. `analytics`
15. `launch-execution`
16. `synthesis`
17. `task-reconciliation`
18. `diagram-generation`
19. `validation`

### Post-Research Production Phase(s)

1. `architecture-advisor` (post-pipeline)

---

## Required Task Board (Must Be Maintained and Completed)

Maintain a live status board with:

- `PENDING`
- `IN_PROGRESS`
- `DONE`
- `BLOCKED_EXTERNAL`

Every task below must end in one of these statuses with evidence.

---

## Phase-by-Phase Audit Program

## Phase A0 - Baseline and Scope Discovery

- [ ] A0.1 Capture git state (`status`, `diff name-status`, branch, remotes)
- [ ] A0.2 Build full change inventory (every file with subsystem, risk, purpose)
- [ ] A0.3 Build dependency blast radius map (who calls what, what imports what)
- [ ] A0.4 Identify high-risk boundaries (service interfaces, shared types, schema edges)

## Phase A1 - Architectural Consistency and Contract Map

- [ ] A1.1 Verify architecture direction (no inverted dependency direction)
- [ ] A1.2 Verify shared type contracts are source-of-truth and not duplicated drift
- [ ] A1.3 Verify route contracts and payload contracts remain coherent across services
- [ ] A1.4 Verify data model contract consistency (runtime schema vs expected schema)

## Phase A2 - Frontend Deep Audit

- [ ] A2.1 Route/load correctness (`+page`, `+page.server`, endpoint usage)
- [ ] A2.2 Store/state correctness, stale state risk, and derived state correctness
- [ ] A2.3 Component prop contract correctness and null safety
- [ ] A2.4 SSR/CSR/hydration compatibility checks
- [ ] A2.5 Error/loading/empty states completeness
- [ ] A2.6 Accessibility and keyboard behavior (focus traps, dialog semantics, ARIA)
- [ ] A2.7 Search/filter/sort correctness and deterministic behavior
- [ ] A2.8 Frontend API shape compatibility (including camelCase/snake_case transforms)
- [ ] A2.9 Dead code/unreachable UI branches removal

## Phase A3 - Middleware Deep Audit

- [ ] A3.1 Request body/query/params validation completeness
- [ ] A3.2 Auth/authz enforcement and bypass resistance
- [ ] A3.3 Tenant/user context propagation integrity
- [ ] A3.4 Middleware ordering and short-circuit behavior correctness
- [ ] A3.5 CORS policy correctness (no accidental wildcard exposure)
- [ ] A3.6 Rate limit behavior correctness (fail-closed expectations)
- [ ] A3.7 Error mapping and status code consistency
- [ ] A3.8 Logging quality and sensitive data leakage risk

## Phase A4 - Backend/Data/Workflow Deep Audit

- [ ] A4.1 Route registration and handler completeness
- [ ] A4.2 Input/output schema validation correctness
- [ ] A4.3 DB query safety (`.bind()`, no unsafe concatenation, pagination guards)
- [ ] A4.4 Migration safety (forward/rollback awareness)
- [ ] A4.5 Queue/workflow error handling and retries
- [ ] A4.6 Idempotency and race condition checks
- [ ] A4.7 Fallback behavior correctness and explicit status signaling
- [ ] A4.8 Observability quality for incident debugging

## Phase A5 - Research Pipeline Full Audit (Every Phase)

For each research workflow phase, execute all tasks below:

- [ ] A5.x.1 Phase exists in canonical order and agent registry
- [ ] A5.x.2 Runtime schema exists and validates output
- [ ] A5.x.3 Required fields are enforced
- [ ] A5.x.4 Evidence/citation rules enforced where required
- [ ] A5.x.5 Artifact persistence is correct (versioning, phase key, metadata)
- [ ] A5.x.6 Quality scoring path is correct (threshold handling, deterministic behavior)
- [ ] A5.x.7 Documentation mapping path is correct (phase-to-section mapping)
- [ ] A5.x.8 Webhook/event behavior correctness
- [ ] A5.x.9 Failure path and recovery behavior correctness
- [ ] A5.x.10 Tests cover success + failure + edge cases

### Required Phase Evidence Record (Per Phase)

For every phase, produce a compact evidence record with all fields:

- phase name
- run id(s) validated
- artifact id and version saved
- schema validation status
- required fields validation status
- citation count and citation URL validation status (if evidence-required)
- quality score and threshold decision
- docs section updates written (if applicable)
- webhook/event emitted
- test coverage status (existing/new)
- residual risk (`none`/`low`/`medium`/`high`)

### Mandatory Per-Phase Checks Matrix

#### `phase-0-intake`

- [ ] Blocks progression when `ready_to_proceed` is false
- [ ] Blockers are captured and surfaced
- [ ] Intake output contract supports canonical and legacy forms safely

#### `opportunity`

- [ ] Opportunity outputs are structured and version-safe
- [ ] Recommendation indexing and unknowns handling are safe

#### `customer-intel`

- [ ] ICP/persona output contracts align with downstream consumers

#### `market-research`

- [ ] Citation grounding is enforced
- [ ] Citation URLs are valid and parseable

#### `competitive-intel`

- [ ] Citation grounding is enforced
- [ ] Competitor and gap outputs map correctly into docs and scoring

#### `kill-test`

- [ ] Verdict branches are correct: `GO`, `PIVOT`, `KILL`
- [ ] Pivot counter persistence and resumption are correct
- [ ] Pivot exhaustion behavior is correct (`PIVOT_EXHAUSTED` path)
- [ ] Kill path terminates safely and records final status
- [ ] GO path persists artifact and continues

#### `revenue-expansion`, `strategy`, `business-model`

- [ ] Revenue and strategy outputs are contract-safe and mapped correctly
- [ ] Cross-phase data dependencies do not drift

#### `product-design`, `gtm-marketing`, `content-engine`

- [ ] Draft tasks output contracts are stable
- [ ] Product/marketing outputs map correctly into docs/tasks

#### `tech-arch`, `analytics`, `launch-execution`

- [ ] Technical architecture and analytics contracts are complete
- [ ] Launch execution tasks and risk handling are coherent

#### `synthesis`

- [ ] Executive summary and roadmap outputs are complete and version-safe

#### `task-reconciliation`

- [ ] Master task set is coherent and de-duplicated
- [ ] `TASKS.json` persistence path is verified

#### `diagram-generation`

- [ ] Diagram outputs are structurally valid
- [ ] Rendering metadata is complete and safe

#### `validation`

- [ ] Validation output includes overall status and correction directives
- [ ] Invariants/corrections are surfaced for launch decisions

### Research Stage Gates (Must Be Explicitly Audited)

#### Gate G1 - Discovery Complete

- [ ] `opportunity`, `customer-intel`, `market-research`, `competitive-intel` artifacts all present
- [ ] Citation quality passes for evidence-required phases
- [ ] Unknowns are tracked, not silently dropped
- [ ] Discovery documentation sections are populated and coherent

#### Gate G2 - Validation Complete

- [ ] `kill-test` verdict path is deterministic and persisted
- [ ] GO path proves viability with rationale
- [ ] PIVOT path increments and persists pivot count correctly
- [ ] KILL path terminates safely and marks run status correctly

#### Gate G3 - Strategy Complete

- [ ] `revenue-expansion`, `strategy`, `business-model` outputs are mutually consistent
- [ ] Cost/revenue assumptions are not contradictory
- [ ] Inputs used by downstream design/execution phases are complete

#### Gate G4 - Design Complete

- [ ] `product-design`, `gtm-marketing`, `content-engine` outputs contain actionable tasks
- [ ] No schema drift between designed outputs and downstream consumers
- [ ] Documentation and task surfaces are updated coherently

#### Gate G5 - Execution Complete

- [ ] `tech-arch`, `analytics`, `launch-execution`, `synthesis`, `task-reconciliation`, `diagram-generation`, `validation` all pass schema and persistence checks
- [ ] Validation phase includes correction directives when needed
- [ ] Final run status, package generation, and quality aggregation are coherent

## Phase A6 - Post-Research Production Full Audit

Audit all post-research production flow, not only research flow:

- [ ] A6.1 `architecture-advisor` execution correctness
- [ ] A6.2 Advisor fallback behavior and status signaling correctness
- [ ] A6.3 BuildSpec persistence correctness (`build_specs` table fields and shapes)
- [ ] A6.4 BuildSpec status lifecycle correctness (`draft/approved/rejected/fallback`)
- [ ] A6.5 R2 output persistence for `build-spec.json`
- [ ] A6.6 Gateway factory forwarding correctness and query whitelisting
- [ ] A6.7 Planning-machine factory endpoints contract correctness
- [ ] A6.8 UI BuildSpec transform correctness (API shape -> UI shape)
- [ ] A6.9 Factory pages/routes/server-loads correctness
- [ ] A6.10 Scaffold command safety and practical executability checks

### Post-Research Production Track Gates (Must Be Explicitly Audited)

#### Gate P1 - BuildSpec Generation Integrity

- [ ] Architecture Advisor output validates against expected BuildSpec contract
- [ ] Fallback generation path marks status correctly (not silently treated as high-confidence)
- [ ] `build_specs` persistence and retrieval round-trip is correct
- [ ] R2 artifact output for BuildSpec is present and parseable

#### Gate P2 - Factory API Integrity

- [ ] Gateway forwarding uses whitelist query validation
- [ ] Planning-machine factory endpoints enforce parameter safety and bounded queries
- [ ] API response contracts are stable and version-safe

#### Gate P3 - Factory UI Integrity

- [ ] Factory pages load without runtime contract mismatches
- [ ] BuildSpec data transformation is lossless where required
- [ ] Error/loading/empty states are complete and actionable

#### Gate P4 - Productionization Integrity

- [ ] Scaffold command output is syntactically valid and safe
- [ ] Deployment scripts are cross-platform safe (line endings/shell assumptions documented)
- [ ] Release path has rollback-safe checkpoints

### Required Post-Research Evidence Record

For each post-research production gate, provide:

- gate id (`P1`..`P4`)
- API endpoints validated
- DB rows/tables validated
- storage artifacts validated (R2 keys/files)
- UI routes/pages validated
- security checks applied
- deploy/readiness status
- residual risk and owner

## Phase A7 - Cross-System Drift and Invariant Checks

- [ ] A7.1 `PLANNING_AGENT_PHASE_ORDER` matches agent registry keys
- [ ] A7.2 Schema registry covers all canonical phases
- [ ] A7.3 Phase-to-section mapping covers all canonical workflow phases
- [ ] A7.4 UI phase/stage grouping has no stale/invalid phase names
- [ ] A7.5 Shared type contracts across gateway/planning/ui match current payloads
- [ ] A7.6 No partial refactors crossing service boundaries
- [ ] A7.7 No stale imports/usages after signature changes

## Phase A8 - Security and Abuse-Path Audit

- [ ] A8.1 SQL injection and query safety checks
- [ ] A8.2 Secret leakage checks
- [ ] A8.3 Auth boundary and privilege escalation checks
- [ ] A8.4 Unsafe fallback/default behavior checks
- [ ] A8.5 DoS/amplification hotspots (unbounded queries, expensive loops)
- [ ] A8.6 Data exposure and PII leakage checks
- [ ] A8.7 Audit trail and forensics quality checks

## Phase A9 - Deployment and Runtime Readiness Audit

- [ ] A9.1 Wrangler config coherence across environments
- [ ] A9.2 Service binding compatibility and naming correctness
- [ ] A9.3 Required env vars/secrets inventory completeness
- [ ] A9.4 Migration order and deploy dependency order correctness
- [ ] A9.5 Cross-platform script safety (line endings, shell assumptions)
- [ ] A9.6 Non-interactive CI/CD compatibility checks

## Phase A10 - Test and Verification Execution (Mandatory)

Run required commands and report exact outcomes:

1. `git status --porcelain=v1`
2. `git diff --name-status`
3. `pnpm --filter @foundation/shared build`
4. `pnpm --filter @foundation/db build`
5. `pnpm --filter foundation-gateway run typecheck`
6. `pnpm --filter foundation-planning-machine run typecheck`
7. `pnpm --filter foundation-ui run build`
8. `pnpm --filter foundation-gateway run test`
9. `pnpm --filter foundation-planning-machine run test`
10. `pnpm --filter foundation-ui run test`
11. `pnpm run lint`
12. `pnpm run format:check`

If `pnpm` is unavailable on PATH, use `corepack pnpm`.

For each failure, classify root cause as:

- code defect
- config defect
- environment/tooling defect
- external credential/infra dependency

Then continue full audit.

### Additional Verification Requirements (Not Optional)

- [ ] V1 Run changed-surface lint/typecheck/tests first for fast feedback
- [ ] V2 Run service-level full suites for impacted services
- [ ] V3 Run final full relevant suite after all fixes
- [ ] V4 Execute API smoke checks for critical endpoints:
  - planning runs list/get/artifact/phase quality
  - factory templates/capabilities/build-specs
  - search endpoint
- [ ] V5 Verify at least one end-to-end happy path:
  - create run -> phase progression -> artifacts persisted -> build spec retrieval
- [ ] V6 Verify at least one end-to-end failure path:
  - invalid request -> validation error -> no unsafe side effects

## Phase A11 - Autonomous Remediation and Re-Verification

- [ ] A11.1 Fix all safe blockers directly in code
- [ ] A11.2 Add or update tests for critical fixed paths
- [ ] A11.3 Re-run targeted checks after each fix
- [ ] A11.4 Re-run full relevant suite before final verdict
- [ ] A11.5 Ensure no new regressions introduced by fixes

## Phase A12 - Final Risk and Launch Readiness Assessment

- [ ] A12.1 Categorize remaining risks by severity and probability
- [ ] A12.2 Identify explicit launch blockers vs acceptable post-launch debt
- [ ] A12.3 Produce final merge decision and launch readiness decision

---

## Blocker Definition and Policy

A Blocker is any issue that can plausibly cause:

- production outage
- data corruption or irreversible inconsistency
- auth or tenant isolation breach
- runtime crash in critical user flow
- cross-service contract failure
- deploy failure or rollback failure

Rules:

- Fix all fixable blockers in this run.
- If blocker is external-only, mark `BLOCKED_EXTERNAL` with exact external dependency and next action.
- Never end with unresolved blocker without explicit ownership and remediation path.

---

## Required Deliverables (Strict Output Format)

### 1. Executive Verdict

Pick one:

- `SAFE TO MERGE`
- `SAFE TO MERGE WITH MINOR FIXES`
- `NOT SAFE TO MERGE`
- `HIGH RISK / REQUIRES REWORK`

Include blunt rationale.

### 2. Complete Change Inventory

For every changed file:

- path
- change type
- subsystem
- risk level
- one-line intent

### 3. Completed Task Board

Report status of every task from phases A0-A12 with evidence pointer.

### 4. Critical Findings (Blocker/High First)

For each finding:

- file(s)
- exact issue
- why dangerous
- likely runtime/integration consequence
- fix applied (or reason not fixable in-repo)
- verification evidence

### 5. Medium/Low Findings

Include fragility and technical debt likely to cause future incidents.

### 6. Research Pipeline Audit Report (Phase-by-Phase)

For each canonical phase:

- status (Pass/Fail/Partial)
- contract validation result
- persistence result
- quality/grounding checks
- test coverage status
- residual risk

### 7. Post-Research Production Audit Report

Include:

- architecture-advisor execution quality
- BuildSpec pipeline correctness
- factory API/UI integration status
- scaffold/deploy readiness status

### 8. Cross-System Conflict Report

Explicitly answer:

- incomplete refactors?
- contract mismatches?
- schema drift?
- runtime config drift?
- hidden regression vectors?
- production rollout risks?

### 9. Verification Report

Per command:

- command
- pass/fail
- key output
- failure root cause
- rerun status after fixes

### 10. Autonomous Fix Log

Chronological list:

- what changed
- why
- risk tradeoff
- what was re-tested
- final status

### 11. Detailed Gameplan From Here to Launch

Must include these phases:

#### Launch Phase L0 - Audit Closure (Now)

- Objective: close all blockers and unknowns
- Tasks
- Owners
- Dependencies
- Acceptance criteria
- Go/No-Go gate

#### Launch Phase L1 - Stabilization

- Objective: harden corrected paths
- Tasks
- Owners
- Dependencies
- Acceptance criteria
- Go/No-Go gate

#### Launch Phase L2 - Staging Validation

- Objective: prove deploy/runtime behavior in staging
- Tasks (migrations, contract tests, smoke tests, rollback drill)
- Owners
- Dependencies
- Acceptance criteria
- Go/No-Go gate

#### Launch Phase L3 - Pre-Production Hardening

- Objective: final reliability/security hardening
- Tasks (observability, alerts, dashboards, runbooks)
- Owners
- Dependencies
- Acceptance criteria
- Go/No-Go gate

#### Launch Phase L4 - Production Rollout

- Objective: controlled release
- Tasks (canary, traffic ramp, health gates, abort criteria)
- Owners
- Dependencies
- Acceptance criteria
- Go/No-Go gate
- Rollback trigger and rollback steps

#### Launch Phase L5 - Post-Launch Control Window

- Objective: early-life stabilization
- Tasks (monitoring cadence, incident triage SLA, fast-follow fixes)
- Owners
- Dependencies
- Acceptance criteria

### 12. Final Decisions

End with:

- `MERGE / DO NOT MERGE`
- `READY FOR STAGING / READY FOR PRODUCTION / NOT READY`
- confidence score (0-100)
- top remaining risks
- top 5 concrete next actions

---

## Definition of Complete Audit

Audit is complete only if all are true:

1. every changed file was audited
2. every research phase was audited
3. post-research production flow was audited
4. blocker fixes were applied where possible
5. verification suite was executed and rerun after fixes
6. residual risks are explicit and prioritized
7. launch gameplan with gates is delivered
8. final decision is evidence-backed

Do not stop early.
