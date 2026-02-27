# Factory Fix Mode Prompt (Claude Code)

Use this prompt after the full audit identifies gaps.  
This is execution mode (not audit mode): Claude must fix, validate, and report.

---

## Prompt

```text
You are Claude Code with MCP access (Cloudflare + local repo). Execute FIX MODE autonomously end-to-end.

PROJECT
- Repo: C:\dev\.cloudflare\cloudflare-foundation-dev
- Date baseline: 2026-02-27
- Staging gateway: https://foundation-gateway-staging.ernijs-ansons.workers.dev
- Production workers.dev gateway: https://foundation-gateway-production.ernijs-ansons.workers.dev
- Intended production custom domain: https://gateway.erlvinc.com
- Staging dashboard: https://staging.erlvinc-dashboard.pages.dev
- Intended production dashboard: https://dashboard.erlvinc.com

INPUT
- You have the latest full audit report.
- Treat every Critical finding as mandatory.
- Treat every UNVERIFIED critical path as mandatory to resolve or explicitly block with one concrete blocker.

MISSION
Fix all actionable issues, redeploy as needed, and provide hard proof that Factory is fully verified.
Do not stop at partial fixes.

RULES
- You may edit files, run commands, deploy, and seed deterministic data if needed.
- Keep changes minimal and production-safe.
- Do not revert unrelated repository changes.
- Use current Wrangler syntax only.
- Prefer `npx wrangler`.
- For endpoint detail tests, use dynamic IDs (no hardcoded slug/runId assumptions).
- If rate limiting blocks verification, use paced verification with Retry-After handling and provide evidence.
- If DNS/custom domains are not live, verify via workers.dev and classify domain state explicitly.

MANDATORY FIX TARGETS

1) Production smoke/deploy URL resiliency
- Ensure scripts handle production verification when custom domain is unavailable.
- Must support workers.dev fallback or equivalent robust strategy.

2) Deterministic build-spec detail verification
- Ensure at least one valid production runId can be verified with `/api/public/factory/build-specs/:runId -> 200`.
- If data missing, seed minimal idempotent valid production data based on real schema (inspect migrations first).

3) Script hygiene
- Ensure `scripts/deploy-factory-production.sh` is tracked and production-ready.
- Ensure smoke summary counters and exit codes are accurate.

4) Documentation alignment
- Remove stale domain examples where incorrect.
- Replace brittle hardcoded examples with dynamic guidance where required.
- Align security CORS status statements.
- Add concrete traffic ramp strategy (percent/time windows + rollback triggers).
- Ensure links are valid and no TODO/TBD/PLACEHOLDER remains in launch-critical docs.

5) Config safety
- Ensure staging/prod bindings are isolated and cannot accidentally cross-route.
- Address wrangler env non-inheritance risks where launch-critical.

DEPLOY + VERIFY SEQUENCE (MUST EXECUTE)

1. Preflight
- `npx wrangler whoami`
- `git status --short`
- verify dependencies needed by scripts

2. Implement fixes
- edit scripts/config/docs as needed
- create/adjust seed scripts if deterministic verification requires it

3. Validate locally
- lint/typecheck/tests relevant to changed areas

4. Deploy
- deploy affected services in safe order
- re-run deployment scripts if they are the canonical path

5. Smoke + direct checks
- run full staging smoke
- run production smoke
- run explicit endpoint matrix checks (dynamic slug/runId)

6. Data proof
- provide D1 counts for:
  - template_registry
  - cf_capabilities
  - planning_runs
  - build_specs

7. Domain proof
- provide DNS + HTTP evidence for custom domains and workers.dev endpoints

REQUIRED FINAL OUTPUT FORMAT (STRICT)

1) `Changes Made`
- exact files changed with line-level summary

2) `Root Causes Fixed`
- map each audit finding -> exact fix

3) `Commands Executed`
- exact commands in order

4) `Deployment Evidence`
- worker/pages deploy success lines
- versions/IDs
- final active URLs

5) `Smoke Evidence`
- staging and production totals: run/pass/fail
- dynamic slug used
- dynamic runId used
- proof build-spec detail 200 passed

6) `Endpoint Status Matrix`
- each endpoint + final HTTP code + environment

7) `Data Readiness Evidence`
- D1 table counts (template_registry, cf_capabilities, planning_runs, build_specs)

8) `Domain/DNS Evidence`
- nslookup + HTTP status for gateway and dashboard domains
- clear statement if custom domain still pending

9) `Residual Risks`
- anything not fully resolved, with impact and owner action

10) `Final Verdict`
- `FULLY VERIFIED` or `BLOCKED`
- if BLOCKED: one concrete blocker only
```

---

## Usage

1. Run full audit prompt first.
2. Paste this Fix Mode prompt into Claude Code.
3. Require the strict output format.
4. Reject completion without deployment + smoke + endpoint matrix evidence.

