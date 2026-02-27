# Factory Full Audit Prompt (Claude Code)

Use this prompt with Claude Code after fixes are complete.

---

## Prompt

```text
You are Claude Code with MCP access (Cloudflare + local repo). Run a strict, evidence-first FULL AUDIT for Factory production readiness.

IMPORTANT MODE
- Audit-only mode.
- Do NOT edit code or docs.
- Do NOT deploy.
- Do NOT seed data.
- Do NOT run destructive git operations.
- If something is unverified, mark it explicitly as UNVERIFIED.
- Every claim must include command evidence or file/line evidence.

PROJECT
- Repo: C:\dev\.cloudflare\cloudflare-foundation-dev
- Date baseline: 2026-02-27
- Staging gateway (known good): https://foundation-gateway-staging.ernijs-ansons.workers.dev
- Production workers.dev gateway: https://foundation-gateway-production.ernijs-ansons.workers.dev
- Intended production custom domain: https://gateway.erlvinc.com
- Staging Pages URL: https://staging.erlvinc-dashboard.pages.dev
- Production Pages URL pattern: https://<deployment-id>.erlvinc-dashboard.pages.dev
- Intended production dashboard domain: https://dashboard.erlvinc.com

KNOWN PREVIOUS GAPS TO RE-VERIFY
1) Production smoke/deploy scripts used gateway.erlvinc.com and could fail if DNS is not live.
2) Production DB had build_specs=0, preventing deterministic /build-specs/:runId 200 verification.
3) scripts/deploy-factory-production.sh was untracked.
4) docs had stale staging domains and hardcoded slug/runId examples.
5) UI wrangler binding risk: production-only binding in services/ui/wrangler.jsonc.
6) Security doc inconsistency: CORS marked both "needs verification" and "done".
7) Launch report claimed traffic ramping documented without concrete ramp plan section.

MISSION
Determine if Factory is truly production-ready now, after fixes. Provide GO / GO WITH CONDITIONS / NO-GO with hard evidence.

MANDATORY AUDIT CHECKS

A) Runtime Reachability and Routing
- Check DNS resolution for:
  - gateway.erlvinc.com
  - dashboard.erlvinc.com
  - foundation-gateway-production.ernijs-ansons.workers.dev
- Check HTTP reachability for:
  - /health on workers.dev and custom domain
  - /factory page on dashboard domain and pages.dev deployment
- If custom domain fails but workers.dev works, classify as DOMAIN GAP, not service outage.

B) Endpoint Verification Matrix (Data-Driven)
Verify these endpoints with status expectations:
1. GET /api/public/factory/templates -> 200
2. GET /api/public/factory/templates/:slug (dynamic slug from list) -> 200
3. GET /api/public/factory/templates/nonexistent-template -> 404
4. GET /api/public/factory/capabilities -> 200
5. GET /api/public/factory/capabilities/free -> 200
6. GET /api/public/factory/build-specs -> 200
7. GET /api/public/factory/build-specs/:runId (dynamic runId from list) -> 200

Rules:
- Do not use hardcoded slug or runId.
- If rate limited, capture:
  - HTTP 429
  - Retry-After
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
- If a check cannot be completed due rate limit or missing data, mark UNVERIFIED with reason.

C) Deterministic Data Readiness (D1)
Run remote D1 checks (via planning-machine wrangler config, production env) and report counts:
- template_registry
- cf_capabilities
- planning_runs
- build_specs

If build_specs == 0:
- mark build-spec detail 200 path as NOT PROVEN
- classify as production verification blocker unless explicitly accepted as a condition.

D) Script Readiness
Audit:
- scripts/smoke-test-factory.sh
- scripts/deploy-factory-staging.sh
- scripts/deploy-factory-production.sh

Verify:
- shebang present
- set -euo pipefail present
- production/staging URLs are accurate and resilient
- no brittle hardcoded data assumptions for detail endpoints
- dependency preflights in smoke script
- summary counters are accurate

E) Docs Correctness and Truthfulness
Audit:
- docs/FACTORY_DEPLOYMENT_CHECKLIST.md
- docs/FACTORY_ROLLBACK_PROCEDURES.md
- docs/FACTORY_LOAD_TESTING.md
- docs/FACTORY_MONITORING.md
- docs/FACTORY_SECURITY_AUDIT.md
- docs/FACTORY_LAUNCH_REPORT.md

Check for:
- stale domains
- hardcoded slug/runId examples where dynamic guidance is required
- wrangler command correctness
- CORS status consistency in security doc
- concrete traffic ramp strategy existence
- broken relative markdown links
- TODO/TBD/PLACEHOLDER text in audited files

F) Config and Isolation Risk
- Validate services/ui/wrangler.jsonc binding strategy for staging vs production safety.
- Validate gateway/planning-machine wrangler env blocks for obvious non-inherited resource warnings.
- Flag any config that can cause staging to point to production unintentionally.

G) Git Hygiene
- Run git status --short.
- Confirm scripts/deploy-factory-production.sh is tracked.
- Report any untracked/dirty state relevant to launch artifacts.

REQUIRED COMMAND EVIDENCE
- Include exact commands executed (in order).
- Include key output lines only.
- Include line-referenced file evidence for every finding.

OUTPUT FORMAT (STRICT)

1) Executive Verdict
- PERFECT?: Yes/No
- Decision: GO | GO WITH CONDITIONS | NO-GO
- Confidence: High | Medium | Low

2) Evidence Snapshot
- DNS results
- Endpoint status matrix
- D1 table counts
- Smoke script outcomes (staging/prod, if executable)

3) Critical Findings (Blocking)
- Numbered list with:
  - Impact
  - Evidence (command output or file:line)
  - Exact required fix

4) Major Findings (Non-blocking but urgent)

5) Minor Findings

6) Verification Questions (Answer all 10)
1. Are all required docs present and complete?
2. Are staging and production scripts executable and functional?
3. Is security posture still 0 high/critical?
4. Does launch report still recommend GO and remain factually correct?
5. Can production deployment be executed from docs/scripts alone?
6. Are all factory endpoints covered in monitoring/testing docs and scripts?
7. Is rollback clear and immediately actionable?
8. Are wrangler commands accurate for current project config?
9. Are links/references valid?
10. Any TODO/TBD/placeholder text left in audited files?

7) Production-Verification Gaps
- Explicitly list anything UNVERIFIED with reason.

8) 24-Hour Closure Checklist
- Ordered, operator-executable list to reach full GO status.

9) Final One-Line Decision
- Single sentence only.

SUCCESS CRITERIA FOR "PERFECT = YES"
- No critical findings
- No unverified critical endpoint path
- Production domain and workers.dev validation both clean (or approved fallback documented)
- Deterministic build-spec detail 200 proven in production
- Docs and scripts aligned with reality
```

---

## Usage

1. Copy the prompt block above.
2. Paste into Claude Code.
3. Require strict output format exactly.
4. Do not accept summary-only replies without command/file evidence.

