# Claude Code Execution Playbook (Token-Efficient)

> Purpose: Execute the remaining critical work in this repo with minimal token burn.  
> Repo: `c:\dev\.cloudflare\cloudflare-foundation-dev`  
> Mode: deterministic, no exploratory loops, no broad re-audits unless a gate fails.

---

## 0) Operating Rules (Save Tokens)

1. Do **not** re-audit the full codebase.
2. Do **not** propose alternatives unless a step fails.
3. Do **only** the steps below, in order.
4. After each phase, run the exact verification command(s).
5. If a command fails, fix only the direct blocker and continue.
6. Keep output compact: changed files, why, verification result.

---

## 1) Known Current Gaps (Already Verified)

### P0
- Typecheck blocker in cron:
  - `services/cron/src/jobs/cleanup.ts`
  - Invalid cross-service import: `../../gateway/src/constants`
- Upload hardening incomplete:
  - `services/gateway/src/index.ts` (`POST /api/files/upload`)
  - Missing size/type/filename sanitation guardrails

### P1
- Public JSON parsing hardening incomplete:
  - `services/gateway/src/index.ts`
  - `/api/public/signup` and `/api/public/contact`
- Root `test` script missing:
  - `package.json`

### P2
- Placeholder IDs in wrangler configs remain (template-safe, deploy-unsafe if not replaced)
- UI accessibility warnings exist (non-blocking for this pass)

---

## 2) Execution Plan (Do Exactly This)

## Phase A — Unblock Typecheck

### A1. Fix cron constant dependency
Edit:
- `services/cron/src/jobs/cleanup.ts`

Action:
- Remove import from gateway constants.
- Define local constant in cron job (same value currently intended):  
  `const DATA_RETENTION_SECONDS = 90 * 24 * 60 * 60;`
- Use local constant as default parameter.

Rationale:
- Services must not import each other’s source files directly.

Verify:
```bash
npx pnpm run typecheck:workers
```

Expected:
- No `TS2307` from `services/cron/src/jobs/cleanup.ts`.

---

## Phase B — Security Hardening (Gateway)

Edit:
- `services/gateway/src/index.ts`

### B1. Harden `/api/files/upload`
In route handler:
- Enforce max size (10 MB).
- Enforce MIME allow-list.
- Sanitize filename before key construction.

Use existing constants if already available in gateway constants file.  
If not imported yet, import them from:
- `services/gateway/src/constants.ts`

Required checks:
- if `file.size > MAX_FILE_SIZE` => `413`
- if unsupported `file.type` => `415`
- sanitize `file.name` to safe chars only, cap length

### B2. Guard malformed JSON for public routes
Routes:
- `/api/public/signup`
- `/api/public/contact`

Wrap `await c.req.json()` in route-level `try/catch`; return `400` on malformed JSON.

Verify:
```bash
npx pnpm run typecheck:workers
npx pnpm run build
```

Expected:
- typecheck passes
- build reaches completion or only known Windows lock issue without code compile/type errors

---

## Phase C — Testing Entry Point (Minimum Viable)

Edit:
- `package.json` (root)

Add scripts:
- `"test": "vitest run"`
- `"test:watch": "vitest"`
- `"test:coverage": "vitest run --coverage"`

Do not add new framework unless missing at root and required to run existing tests.

Verify:
```bash
npx pnpm run test
```

Expected:
- command exists and executes test runner
- capture pass/fail summary

---

## Phase D — Config & Deploy Readiness Gate

Run:
```bash
bash scripts/validate-config.sh
```

Interpretation:
- If placeholders found: report as expected template behavior + deployment action required.
- Do not remove placeholders blindly unless explicitly targeting one concrete environment.

Also run quick health command checks (if local dev stack running):
```bash
curl -s http://127.0.0.1:8788/health
curl -s http://127.0.0.1:8788/api/health
curl -s http://127.0.0.1:8788/api/planning/health
```

---

## 3) Required Output Format (Final Response)

Return exactly:

1. **Changed files** (bullet list)
2. **Why each change was made** (one line per file)
3. **Verification results**
   - `typecheck:workers`: pass/fail
   - `build`: pass/fail (+ note if Windows lock only)
   - `test`: pass/fail
   - `validate-config`: pass/fail + placeholder summary
4. **Remaining known non-blockers** (if any)
5. **Ship-readiness status**
   - `READY` or `NOT READY`
   - If not ready: top 3 blockers only

Keep this final summary concise and deterministic.

---

## 4) Guardrails

- Do not edit plan files under `.cursor/plans/`.
- Do not force-push or rewrite git history.
- Do not change architecture scope in this run.
- Do not introduce new large features; this is a stabilization + readiness pass.

---

## 5) Optional Phase (Only If All Above Pass)

If all required gates pass, perform a **small cleanup pass**:
- Remove obvious temp artifacts accidentally tracked (if safe and user-approved).
- Add one short note to docs referencing this execution playbook:
  - `README.md` -> “Execution Playbook: `CLAUDE_ORCHESTRATOR_EXECUTION.md`”

Skip optional phase if any required gate fails.

