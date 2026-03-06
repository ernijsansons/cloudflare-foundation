# Risk Register — Agent Integration

**Created**: 2026-03-05 21:55:00 CST
**Updated**: 2026-03-05 22:57:00 CST (20-Phase Audit Session)
**Status**: COMPLETE - All risks documented or resolved

---

## Documentation Contradictions Matrix

| # | File | Contradiction | Severity | Fix Task | Status |
|---|------|---------------|----------|----------|--------|
| 1 | INTEGRATION_AUDIT_PHASE1.md:27 | Gate B shows "133 tests (Phase 1 baseline)" | MEDIUM | Historical context is correct | ✅ RESOLVED |
| 2 | INTEGRATION_AUDIT_PHASE1.md:328 | Gate B shows "247 tests passed (final)" | MEDIUM | Current state documented | ✅ RESOLVED |
| 3 | INTEGRATION_AUDIT_PHASE1.md:365 | Version registry shows "247 total" | MEDIUM | Already correct | ✅ RESOLVED |
| 4 | INTEGRATION_AUDIT_PHASE1.md:240 | Production version `f02f11c3-774c-40ee-b7e2-189600075af7` | HIGH | Already correct | ✅ RESOLVED |
| 5 | DEPLOY_RUNBOOK_AGENTS.md | All secret commands use stdin syntax | MEDIUM | Already correct | ✅ RESOLVED |
| 6 | DEPLOY_RUNBOOK_AGENTS.md | All 7 secret commands verified | MEDIUM | Already correct | ✅ RESOLVED |

---

## Test Count Evolution (Verified)

| Phase | Test Count | Date | Change |
|-------|------------|------|--------|
| Phase 1 baseline | 133 | 2026-03-05 | Initial integration |
| Phase 2 expansion | 242 | 2026-03-05 | +109 agent-specific tests |
| HTTP 200 error tests | 244 | 2026-03-06 | +2 fetchNaomiAgents tests |
| fetchNaomiAgentById tests | 247 | 2026-03-06 | +3 error body tests |
| **Current verified** | **247** | 2026-03-05 21:53 CST | Latest gate run |

---

## Deployment Version History

| Date | Version ID | Status | Notes |
|------|------------|--------|-------|
| 2026-03-05 | `d8ed4b98-cd82-44c0-8685-44b42e03d0ce` | SUPERSEDED | Initial deployment |
| 2026-03-05 | `db0e3858-2653-4ef0-abd3-ae3832748946` | STAGING | Staging environment |
| 2026-03-06 | `f02f11c3-774c-40ee-b7e2-189600075af7` | **CURRENT PRODUCTION** | HTTP 404 fix deployed |

---

## Residual Risks

| # | Risk | Severity | Likelihood | Impact | Mitigation | Owner | Status |
|---|------|----------|------------|--------|------------|-------|--------|
| R1 | Naomi Oracle returns unexpected format | LOW | LOW | MEDIUM | Error body detection covers common patterns | Gateway | MITIGATED |
| R2 | Feature flag race during deploy | LOW | LOW | LOW | Quick disable via secrets | Ops | MITIGATED |
| R3 | Athena secret not configured | MEDIUM | LOW | HIGH | Clear error message + auth 401 handling | Ops | DOCUMENTED |
| R4 | Service binding account mismatch | LOW | LOW | HIGH | Fallback to direct HTTPS documented | Ops | DOCUMENTED |
| R5 | Naomi data not seeded | LOW | HIGH | LOW | Empty array is valid, not error | Data | ACCEPTABLE |
| R6 | Stale docs cause confusion | MEDIUM | MEDIUM | LOW | Cleanup session complete | Docs | RESOLVED |

---

## Operational Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| O1 | Rollback command syntax invalid | LOW | Commands verified with stdin syntax |
| O2 | Feature flag takes time to propagate | LOW | Instant via Cloudflare secrets API |
| O3 | No monitoring alerts | MEDIUM | Manual `wrangler tail` documented |

---

## Security Risks

| # | Risk | Severity | Status |
|---|------|----------|--------|
| S1 | Secrets in UI code | HIGH | VERIFIED CLEAN (grep search) |
| S2 | Secrets logged to console | HIGH | VERIFIED CLEAN (no secret patterns in logs) |
| S3 | Auth bypass via header injection | LOW | Bearer token required for Athena |

---
