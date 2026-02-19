# NEXT_STEPS Audit Master

**Date:** 2026-02-16  
**Repo:** `c:\dev\.cloudflare\cloudflare-foundation-dev`  
**Reference evaluated:** `C:\dev\.cloudflare\NEXT_STEPS.md`  
**Latest commit referenced by user:** `9bac49c` (`Security hardening, test infrastructure, and documentation`)

---

## Executive Summary

`NEXT_STEPS.md` was directionally useful but is now **partially outdated** and in places **mis-targeted** (it references `cli-scaffold-test/...` paths, not only active repo paths).  

Current state is better than that document suggests, but the codebase is **not ship-ready yet**.

### What was correct in the approach
- Security hardening focus (auth/cors/upload/json parsing) is still the right top-level approach.
- Infrastructure setup + config validation scripts are the right deployment pattern.
- Documentation expansion was absolutely correct and has progressed substantially.

### What was missed / stale
- At least one **active compile blocker** is currently present.
- Testing is still not wired as an executable repo gate (`pnpm test` fails because no script exists).
- Several old P0 claims are already fixed and should not stay on the critical list.
- The plan source file (`NEXT_STEPS.md`) is outside repo and includes stale path assumptions.

---

## Verified Current State

## Build / Typecheck / Test status

- `npx pnpm run typecheck:workers` => **FAILS**
  - Error:
    - `services/cron typecheck: src/jobs/cleanup.ts(6,40): error TS2307: Cannot find module '../../gateway/src/constants'`
- `npx pnpm run build` => **does not complete cleanly** because it runs `typecheck:workers` as part of build, and that typecheck currently fails.
- `npx pnpm run test` => **FAILS immediately**
  - Error: `ERR_PNPM_NO_SCRIPT Missing script: test`
- Lint diagnostics => no editor lint errors returned, but this does not supersede failing TypeScript CLI checks.

## Working tree status

Repository is currently dirty (modified + untracked files present).  
This is not inherently wrong during development, but it is a release-process risk unless triaged before branch cut.

---

## Was `NEXT_STEPS.md` the correct way to approach?

### Short answer
**Partially yes, but not as-is.**  

### Detailed assessment
1. **Security-first ordering** was right.
2. **Claims needed re-validation** before execution (many were already fixed).
3. **File-path targeting was off** in multiple places (`cli-scaffold-test/...` references).
4. **Current hard blockers were under-emphasized** (compile-break in cron, missing runnable test gate).

### What should have been done differently
- Step 1 should have been: **fresh code-state audit first**, then regenerate a current prioritized list.
- Step 2 should have been: enforce **green typecheck/build** before claiming completion.
- Step 3 should have been: define **single source of truth inside repo** (`NEXT_STEPS_AUDIT_MASTER.md`) and deprecate stale external plan docs.

---

## Reconciliation of `NEXT_STEPS.md` P0 Claims vs Reality

| Claim in `NEXT_STEPS.md` | Current Reality | Status |
|---|---|---|
| Silent auth suppression | Auth middleware now fails closed with logged error + 401 | Fixed |
| Unsafe CORS allow-all | CORS now has whitelist behavior with localhost dev allowance | Fixed |
| Missing upload validation | Upload route still uses raw `file.name` and lacks strict size/type/sanitize guard | Open |
| JSON parsing unhandled | Most routes wrapped; public signup/contact still parse JSON without route-level malformed payload handling | Partially fixed |
| Placeholder IDs in wrangler | Placeholders still present in multiple services (template-safe, deploy-unsafe until replaced) | Open |
| Planning DB missing in setup | `setup-all.sh` creates both `foundation-primary` and `planning-primary`; docs still need tighter alignment | Partially fixed |

---

## Confirmed Issues, Gaps, and Errors (Current)

## P0 (Must fix before claiming ship-ready)

1. **TypeScript compile blocker in cron**
   - File: `services/cron/src/jobs/cleanup.ts`
   - Problem: cross-service import:
     - `import { DATA_RETENTION_SECONDS } from "../../gateway/src/constants";`
   - Impact: `typecheck:workers` fails.
   - Corrective action:
     - Move shared constants to a shared package (recommended) OR define local cron constant.

2. **Upload endpoint hardening incomplete**
   - File: `services/gateway/src/index.ts` (`/api/files/upload`)
   - Missing:
     - strict max size check
     - explicit MIME allow-list enforcement
     - filename sanitization before key construction
   - Impact: abuse and security risk in real deployment.

3. **Deploy config placeholders still present**
   - Files:
     - `services/gateway/wrangler.jsonc`
     - `services/agents/wrangler.jsonc`
     - `services/planning-machine/wrangler.jsonc`
     - `services/workflows/wrangler.jsonc`
     - `services/queues/wrangler.jsonc`
   - Pattern: `KV_ID_HERE`, `D1_ID_HERE`
   - Impact: remote deploy not production-ready until resolved.

## P1 (High priority)

4. **Public JSON route handling still brittle**
   - File: `services/gateway/src/index.ts`
   - Routes:
     - `/api/public/signup`
     - `/api/public/contact`
   - Problem: `await c.req.json()` called without route-level malformed-payload handling.

5. **No executable root test gate**
   - File: `package.json`
   - Problem: no `test` script.
   - Impact: CI/dev cannot run a standard test command.

6. **Very limited active test coverage**
   - Current test files concentrated in gateway utility/schema scope.
   - Critical flows (planning workflow, queue consumers, cron jobs, agents) remain largely untested.

7. **Plan/document drift risk**
   - `NEXT_STEPS.md` is outside repo and partially stale.
   - Need one in-repo operational plan and an owner process to keep it updated.

## P2 (Medium priority)

8. **Svelte accessibility/state warnings in UI build output**
   - Examples observed around `TopBar.svelte`, `CreateModal.svelte`, run detail page.
   - Not release-blocking by itself but should be triaged.

9. **Dirty branch artifact hygiene**
   - Mixed modified/untracked artifacts (screenshots/temp files) should be explicitly included/excluded before release.

10. **Validation/deploy docs still need explicit operator flow**
   - Scripts exist (`setup-all.sh`, `validate-config.sh`, `deploy-all.sh`) but operational runbook should tightly describe exact order, rollback, and verification.

---

## Security Gaps and Mitigation Plan

1. **Upload endpoint hardening**
   - Add:
     - max-size check (413)
     - strict MIME whitelist (415)
     - filename sanitization
     - optional virus-scan queue handoff

2. **Public route JSON handling**
   - Wrap parsing for `/api/public/signup` and `/api/public/contact` with malformed JSON handling (`400`).

3. **Config placeholder risk**
   - Keep placeholders for template use, but enforce:
     - `validate-config.sh` as mandatory pre-deploy gate
     - documented procedure to write generated IDs back into service wrangler files.

---

## Infrastructure and Deploy Readiness Checklist

Before production deploy, all must be true:

- [ ] `npx pnpm run typecheck:workers` passes
- [ ] `npx pnpm run build` passes
- [ ] `npx pnpm run test` exists and passes
- [ ] `bash scripts/validate-config.sh` passes with zero errors
- [ ] Placeholder IDs replaced for target environment
- [ ] `foundation-primary` and `planning-primary` created and migrated
- [ ] Smoke checks pass on deployed `/health` and `/api/health` routes

---

## Testing Roadmap (Minimum Gate to Ship)

## Phase A (immediate)
- Add root scripts:
  - `test`
  - `test:watch`
  - `test:coverage`
- Ensure current tests run via root command.

## Phase B (critical-path coverage)
- Add tests for:
  - gateway public routes malformed JSON behavior
  - gateway file upload validation path
  - cron cleanup job logic (with local constants/shared import fix)
  - queue consumer notification/webhook behavior (happy path + failures)

## Phase C (confidence hardening)
- Planning workflow regression tests:
  - pivot loops
  - kill-test verdict handling
  - run completion transitions
- Minimal smoke integration test script in CI.

---

## Documentation Reconciliation Strategy

Create one authoritative sequence:

1. `NEXT_STEPS_AUDIT_MASTER.md` (this file) — current truth and priorities.
2. `docs/DEPLOYMENT.md` — operator steps, preflight, migration, verify.
3. `docs/CONFIG.md` — placeholders, required secrets, and ID mapping.

Deprecate older stale operational plans by adding a clear note and forward pointer.

---

## 7-Day Execution Plan

### Day 1 (Stabilize)
- Fix cron import/type blocker.
- Add root `test` scripts.
- Re-run typecheck/build to green baseline.

### Day 2 (Security hardening)
- Harden `/api/files/upload`.
- Add JSON parse guards for public routes.
- Add tests for those routes.

### Day 3 (Infra readiness)
- Validate config/placeholders flow end-to-end using setup + validate scripts.
- Document exact operator flow in `docs/DEPLOYMENT.md`.

### Day 4 (Queue/Cron confidence)
- Add tests for queue consumers (notifications/webhooks) and cron cleanup logic.

### Day 5 (Planning critical paths)
- Add regression tests for planning API key flows (`runs`, `cancel`, `delete`, `phases`, `promote`).

### Day 6 (UI warnings + polish)
- Triage and resolve highest-impact accessibility/state warnings.

### Day 7 (Release readiness)
- Run full verification checklist.
- Clean working tree artifacts.
- Cut release candidate branch.

---

## Exit Criteria (Definition of Ship-Ready)

All criteria must pass:

1. **Build quality**
   - `typecheck:workers` clean
   - root build clean
2. **Security**
   - file upload validation enforced
   - public JSON parse handling safe
3. **Deployability**
   - no unresolved placeholder IDs for target env
   - migrations applied to both databases
4. **Testing**
   - root `pnpm test` exists and passes
   - critical path tests present and green
5. **Operations**
   - validated deploy script flow
   - health endpoints checked post-deploy
6. **Documentation**
   - docs updated and internally consistent

---

## Verification Commands

```bash
# 1) Type safety
npx pnpm run typecheck:workers

# 2) Build
npx pnpm run build

# 3) Tests (after adding script)
npx pnpm run test

# 4) Config validation
bash scripts/validate-config.sh

# 5) Health smoke checks (local or deployed)
curl -s http://127.0.0.1:8788/health
curl -s http://127.0.0.1:8788/api/health
curl -s http://127.0.0.1:8788/api/planning/health
```

---

## Immediate Next Actions (Ordered)

1. Fix cron compile blocker in `services/cron/src/jobs/cleanup.ts`.
2. Harden upload endpoint in `services/gateway/src/index.ts`.
3. Add malformed JSON handling for public routes in `services/gateway/src/index.ts`.
4. Add root `test` script and wire current tests.
5. Re-run verification commands and update this document with final pass/fail.

