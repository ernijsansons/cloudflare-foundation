# Factory Feature Deployment Checklist

**Feature**: Public Factory Endpoints (Templates, Capabilities, Build Specs)
**Version**: v2.5.0
**Date**: 2026-02-27

## Pre-Deployment Verification

### Code Quality

- [x] All tests passing (133/133 gateway tests)
- [x] TypeScript compilation clean (0 errors)
- [x] Integration tests created and passing (13/13)
- [x] Audit logging implemented
- [x] API documentation complete

### Database

- [x] Migrations applied to remote database
  - [x] Migration 0013 (allow 'fallback' status in build_specs)
- [ ] Verify planning-primary database has template data seeded
- [ ] Verify planning-primary database has capability data seeded

### Environment Variables

- [x] CONTEXT_SIGNING_KEY configured (inter-service auth)
- [x] PLANNING_SERVICE binding configured
- [x] DB binding configured (foundation-primary)

### Dependencies

- [x] @eslint/js installed (devDependency)
- [x] No new production dependencies added
- [x] Package versions locked in pnpm-lock.yaml

## Staging Deployment Steps

### 1. Deploy Planning Machine Service

```bash
cd services/planning-machine
npx wrangler deploy --env staging
```

**Verify**:

- [ ] Service deployed successfully
- [ ] Health check responds: GET https://foundation-planning-machine-staging.ernijs-ansons.workers.dev/api/planning/health
- [ ] Check wrangler logs for errors

### 2. Deploy Gateway Service

```bash
cd services/gateway
npx wrangler deploy --env staging
```

**Verify**:

- [ ] Service deployed successfully
- [ ] Health check responds: GET https://foundation-gateway-staging.ernijs-ansons.workers.dev/health
- [ ] Service binding to planning-machine working
- [ ] Check wrangler logs for errors

### 3. Deploy UI Service

```bash
cd services/ui
npx wrangler pages deploy --branch staging --project-name erlvinc-dashboard
```

**Verify**:

- [ ] Pages deployment successful
- [ ] UI accessible: https://staging.erlvinc-dashboard.pages.dev
- [ ] Factory pages load without errors

**Note on UI Service Binding**:

The UI wrangler.jsonc binds to `foundation-gateway-production` for all deployments (staging and production). This is intentional:

- Staging UI tests against production API (integration testing pattern)
- For isolated staging API testing, set `GATEWAY_URL` environment variable in Pages Dashboard
- See `services/ui/wrangler.jsonc` for detailed architecture notes

## Post-Deployment Smoke Tests

**Automated Test Suite**: Run `./scripts/smoke-test-factory.sh staging` to execute the full smoke test suite (45 tests across all endpoints, security, and performance checks).

**Manual Verification** (if automated tests are unavailable):

### Factory Endpoints (Public - No Auth Required)

#### Templates

```bash
# List all templates
curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates

# Get specific template (use dynamic slug resolution)
TEMPLATE_SLUG=$(curl -s "https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates?limit=1" | jq -r '.items[0].slug')
curl "https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates/$TEMPLATE_SLUG"

# Test 404
curl -i https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates/nonexistent
# Expected: 404
```

#### Capabilities

```bash
# List all capabilities
curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/capabilities

# List free-tier only
curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/capabilities/free
```

#### Build Specs

```bash
# List build specs with pagination
curl "https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/build-specs?limit=5"

# Get specific build spec (use dynamic runId resolution)
RUN_ID=$(curl -s "https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/build-specs?limit=1" | jq -r '.buildSpecs[0].runId // empty')
if [ -n "$RUN_ID" ]; then
  curl "https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/build-specs/$RUN_ID"
else
  echo "No build specs available"
fi

# Test 404
curl -i https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/build-specs/nonexistent
# Expected: 404
```

### Audit Logging Verification

```bash
# Check audit logs were created (requires auth)
curl -H "Authorization: Bearer $STAGING_TOKEN" \
  https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/data/audit_log \
  | jq '.[] | select(.event_type | contains("factory"))'

# Expected event types:
# - factory_templates_accessed
# - factory_template_viewed
# - factory_capabilities_accessed
# - factory_capabilities_free_accessed
# - factory_build_specs_accessed
# - factory_build_spec_viewed
```

### UI Verification

- [ ] Navigate to https://staging.erlvinc-dashboard.pages.dev/factory
- [ ] Verify templates load correctly
- [ ] Verify capabilities load correctly
- [ ] Verify build specs load correctly
- [ ] Click through to template detail pages
- [ ] Click through to build spec detail pages
- [ ] Check browser console for errors (F12)

## Performance Checks

### Response Times (Target: <500ms p95)

```bash
# Measure template list endpoint
time curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates

# Measure capability list endpoint
time curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/capabilities

# Measure build spec list endpoint
time curl https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/build-specs
```

### Database Query Performance

- [ ] Check D1 analytics for slow queries (>100ms)
- [ ] Verify indexes are being used (templates, capabilities, build_specs)

## Security Verification

### Public Access (No Auth)

- [ ] Confirm no authentication required for GET /api/public/factory/\*
- [ ] Verify CORS headers present
- [ ] Confirm read-only (no POST/PUT/DELETE)

### Context Token (Inter-Service)

- [ ] Verify X-Context-Token header included in proxied requests
- [ ] Confirm JWT signature validates with CONTEXT_SIGNING_KEY
- [ ] Verify tenant_id extracted from query params

### Audit Trail

- [ ] Confirm all factory endpoint access logged
- [ ] Verify audit chain integrity (no tampering)
- [ ] Check tenant_id captured correctly (defaults to "default" for public)

## Rollback Criteria

Rollback immediately if:

- [ ] Any smoke test fails
- [ ] Health checks return non-200 status
- [ ] Error rate >1% in first hour
- [ ] Response time p95 >1000ms
- [ ] Database connection errors
- [ ] Service binding errors

## Traffic Ramping Strategy (Production)

For major releases, use gradual traffic monitoring:

### Phase 1: Canary (0-15 minutes)

1. Deploy to production with normal flow
2. Monitor for 15 minutes:
   - Error rates in Cloudflare Dashboard
   - `wrangler tail foundation-gateway-production`
   - Analytics Engine factory events

### Phase 2: Partial (15-45 minutes)

1. Cloudflare Workers automatically routes all traffic after deployment
2. Monitor for 30 minutes
3. If issues: `wrangler rollback <deployment-id>`

### Phase 3: Full (45+ minutes)

1. Monitor for 1 hour
2. Confirm all smoke tests pass
3. Full deployment complete

### Rollback Triggers

- Error rate > 1%
- P95 latency > 500ms
- Any 500 errors in factory endpoints
- Audit chain integrity failures

Note: Cloudflare Workers deployments are atomic. The built-in propagation (10-15 seconds) is sufficient for most releases without explicit traffic splitting.

---

## Production Deployment (After Staging Success)

### Pre-Production

- [ ] All staging checks passed
- [ ] No errors in staging logs (24hr soak test)
- [ ] Performance metrics acceptable
- [ ] Security audit complete

### Production Deploy

```bash
# Same steps as staging but with --env production
(cd services/planning-machine && npx wrangler deploy --env production)
(cd services/gateway && npx wrangler deploy --env production)
(cd services/ui && npx wrangler pages deploy --branch main --project-name erlvinc-dashboard)
```

### Post-Production

- [ ] Run all smoke tests against production
- [ ] Monitor error rates for 1 hour
- [ ] Check audit logs for anomalies
- [ ] Verify Analytics Engine capturing factory events

## Rollback Procedure

See [FACTORY_ROLLBACK_PROCEDURES.md](./FACTORY_ROLLBACK_PROCEDURES.md) for detailed rollback steps.

Quick rollback:

```bash
# Gateway rollback (use previous deployment ID)
(cd services/gateway && npx wrangler deployments list --env production)
(cd services/gateway && npx wrangler rollback <PREVIOUS_DEPLOYMENT_ID> --env production)

# UI rollback
(cd services/ui && npx wrangler pages deployment list --project-name erlvinc-dashboard --environment production)
# Use Cloudflare Dashboard: Pages → erlvinc-dashboard → Deployments → Rollback
# Or redeploy previous commit:
#   git checkout <PREVIOUS_COMMIT>
#   pnpm --filter foundation-ui build
#   (cd services/ui && npx wrangler pages deploy .svelte-kit/cloudflare --project-name erlvinc-dashboard --branch main --commit-hash <PREVIOUS_COMMIT>)
```

## Sign-Off

- [ ] Engineering Lead: **\*\***\_\_\_**\*\***
- [ ] DevOps: **\*\***\_\_\_**\*\***
- [ ] Product: **\*\***\_\_\_**\*\***
- [ ] QA: **\*\***\_\_\_**\*\***

**Deployment Date**: **\*\***\_\_**\*\***
**Deployed By**: **\*\***\_\_**\*\***
**Deployment Notes**: **\*\***\_\_**\*\***
