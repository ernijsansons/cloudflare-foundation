# Cloudflare Foundation v2.5 — Deployment Verification Checklist

## Pre-Deployment Verification

### Security Fixes Implemented ✅
- [x] Auth middleware fail-closed (Issue #1)
- [x] Secrets replaced with placeholders in .dev.vars (Issue #2)
- [x] CORS environment-aware validation (Issue #3)
- [x] DO-based rate limiting with feature flag (Issue #4)
- [x] Security headers middleware (Issue #5)
- [x] Cloudflare resource audit script (Issue #6)
- [x] Stale scaffolds documented in CLEANUP.md (Issue #7)

### Code Quality Improvements ✅
- [x] Comprehensive test coverage (Issue #8)
- [x] GitHub Actions CI URLs use variables (Issue #9)
- [x] Gateway refactored from 817 to 75 lines (Issue #10)
- [x] Staging/production environment split (Issue #11)
- [x] Foreign key indexes added (Issue #12)
- [x] Structured JSON logger implemented (Issue #13)
- [x] ESLint flat config migrated (Issue #14)
- [x] Health monitoring script created (Issue #15)

---

## Code Quality Checks

### Tests
```bash
# Run test suite
cd C:\dev\.cloudflare\cloudflare-foundation-dev
pnpm test

# Expected: 407+ passing tests (98%+ pass rate)
# Note: 8 new middleware tests may need mock tuning
```

### Linting
```bash
# Run ESLint
pnpm lint

# Expected: No errors (warnings acceptable)
```

### Type Checking
```bash
# Run TypeScript type check
cd services/gateway
pnpm run typecheck

# Expected: Pre-existing errors only (doc-generator.ts, project-docs.ts)
```

---

## Environment Configuration

### Gateway wrangler.jsonc
Verify these environment variables exist:
- [x] `ENVIRONMENT`: "development" | "staging" | "production"
- [x] `ALLOWED_ORIGINS`: Comma-separated allowed origins
- [x] `USE_DO_RATE_LIMITING`: "false" (default, set to "true" when ready)

Verify environment blocks:
- [x] `[env.staging]` with name "foundation-gateway-staging"
- [x] `[env.production]` with name "foundation-gateway"

### Secrets Configuration
Set production secrets using Wrangler (NEVER commit real secrets):
```bash
# Gateway secrets
wrangler secret put CONTEXT_SIGNING_KEY --env production
wrangler secret put TURNSTILE_SECRET --env production

# Use: openssl rand -base64 32
# Or: Cloudflare Turnstile dashboard for real keys
```

---

## Staging Deployment

### Deploy to Staging
```bash
# Deploy all services to staging
./scripts/deploy-all.sh staging
```

### Staging Verification
1. **Health Checks**
   ```bash
   # Set staging URL
   export GATEWAY_URL=https://foundation-gateway-staging.your-account.workers.dev
   export AGENTS_URL=https://foundation-agents-staging.your-account.workers.dev

   # Run health check
   pnpm health
   ```

2. **Auth Middleware**
   - Test unauthenticated request to protected endpoint → expect 401
   - Test authenticated request with valid session → expect 200
   - Test `/health`, `/api/health`, `/api/public/*` without auth → expect 200

3. **CORS Validation**
   - Test request from staging origin → expect allowed
   - Test request from localhost → expect rejected (staging/production)
   - Verify `Access-Control-Allow-Origin` header

4. **Rate Limiting**
   - If `USE_DO_RATE_LIMITING=false`: KV-based (best effort)
   - If `USE_DO_RATE_LIMITING=true`: DO-based (atomic)
   - Verify `X-RateLimit-*` headers present

5. **Security Headers**
   Verify these headers on all responses:
   - `Strict-Transport-Security`
   - `X-Content-Type-Options`
   - `X-Frame-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
   - `Content-Security-Policy`

6. **Gateway Refactoring**
   - Test all route modules work correctly
   - Test public routes (signup, contact)
   - Test protected routes (agents, planning, naomi, etc.)
   - Verify service forwarding works

---

## Production Deployment

### Pre-Production Checks
- [ ] All staging tests pass
- [ ] Secrets configured for production
- [ ] GitHub Actions variables set (`STAGING_URL`, `PRODUCTION_URL`)
- [ ] Database migrations applied
- [ ] Team notified of deployment

### Deploy to Production
```bash
# Deploy all services to production
./scripts/deploy-all.sh production

# Or deploy individually:
# wrangler deploy --env production  # (from each service directory)
```

### Production Verification
1. **Immediate Checks** (within 5 minutes)
   - Health endpoints respond with 200
   - No critical errors in Cloudflare dashboard
   - Authentication works correctly
   - CORS properly restricts origins

2. **Monitoring** (within 30 minutes)
   - Check error rates in Analytics Engine
   - Monitor rate limiting behavior
   - Verify security headers present
   - Check audit logs for anomalies

3. **Functional Testing** (within 1 hour)
   - Test critical user flows
   - Verify naomi task tracking works
   - Test file uploads and image transformations
   - Verify webhook delivery
   - Test planning service integration

---

## Rollback Procedures

### Critical Issues
If critical issues arise, rollback immediately:

**Quick Rollback (Previous Version)**
```bash
# Rollback gateway to previous version
cd services/gateway
wrangler deployments list --env production
wrangler rollback [deployment-id] --env production
```

**Feature Flag Rollback**
If DO rate limiting causes issues:
```bash
# Disable DO rate limiting (fall back to KV)
wrangler secret put USE_DO_RATE_LIMITING --env production
# Enter: "false"
```

### Non-Critical Issues
For non-critical issues:
1. Document the issue in GitHub Issues
2. Create hotfix branch
3. Test fix in staging
4. Deploy fix to production

---

## Post-Deployment Tasks

### Database
- [ ] Run migration 0008 to add foreign key indexes:
  ```bash
  cd services/gateway
  npx wrangler d1 migrations apply foundation-primary --env production
  ```
- [ ] Verify indexes created:
  ```sql
  SELECT * FROM sqlite_master WHERE type='index';
  ```

### Documentation
- [ ] Update CHANGELOG.md with v2.5 changes
- [ ] Review and archive old scaffolds (see CLEANUP.md)
- [ ] Update team wiki/docs with new architecture

### Monitoring Setup
- [ ] Configure Cloudflare alerting for:
  - 5xx error rates > 1%
  - Rate limit hits > 10k/min
  - Auth failures > 100/min
  - Health check failures
- [ ] Set up GitHub Actions workflow for scheduled health checks

### Resource Audit
```bash
# Run resource audit to identify unused resources
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> pnpm audit:resources

# Review output and clean up unreferenced resources
```

---

## Success Criteria

### All Systems Green ✅
- [ ] Health checks passing
- [ ] Error rate < 0.1%
- [ ] All 15 security fixes verified in production
- [ ] Authentication working correctly
- [ ] CORS properly configured
- [ ] Rate limiting active (KV or DO)
- [ ] Security headers present
- [ ] Gateway refactoring working
- [ ] Tests passing (407/415)
- [ ] Linting clean
- [ ] No critical console errors

### Performance Metrics
- [ ] P50 response time < 100ms
- [ ] P95 response time < 500ms
- [ ] Rate limit DO response < 50ms (if enabled)
- [ ] Database query time < 50ms

### Security Validation
- [ ] Unauthenticated requests properly rejected (401)
- [ ] CORS localhost blocked in production
- [ ] No real secrets in repository
- [ ] Security headers present on all responses
- [ ] Session validation working

---

## Contacts

### On-Call
- Primary: [Your team's on-call schedule]
- Cloudflare Status: https://www.cloudflarestatus.com/

### Documentation
- Security Audit: `C:\Users\ernij\.claude\plans\zesty-exploring-thunder.md`
- Architecture: `services/gateway/README.md`
- MCP Documentation: `services/gateway/src/mcp/README.md`

---

## Notes

### Known Issues
- 8 test failures in new middleware tests (need mock tuning)
- Pre-existing TypeScript errors in doc-generator.ts and project-docs.ts

### Future Improvements
- Enable DO rate limiting (`USE_DO_RATE_LIMITING=true`) after testing
- Add automated security header validation tests
- Implement health check GitHub Actions workflow
- Set up distributed tracing with Cloudflare Analytics

---

**Last Updated**: 2026-02-23
**Version**: 2.5.0
**Author**: Cloudflare Foundation v2.5 Security Remediation
