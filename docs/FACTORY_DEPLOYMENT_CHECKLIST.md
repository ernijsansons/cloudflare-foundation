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
- [ ] Health check responds: GET https://planning-staging.erlvinc.com/api/planning/health
- [ ] Check wrangler logs for errors

### 2. Deploy Gateway Service
```bash
cd services/gateway
npx wrangler deploy --env staging
```

**Verify**:
- [ ] Service deployed successfully
- [ ] Health check responds: GET https://gateway-staging.erlvinc.com/health
- [ ] Service binding to planning-machine working
- [ ] Check wrangler logs for errors

### 3. Deploy UI Service
```bash
cd services/ui
npx wrangler pages deploy --branch staging --project-name erlvinc-dashboard
```

**Verify**:
- [ ] Pages deployment successful
- [ ] UI accessible: https://dashboard-staging.erlvinc.com
- [ ] Factory pages load without errors

## Post-Deployment Smoke Tests

**Automated Test Suite**: Run `./scripts/smoke-test-factory.sh staging` to execute the full smoke test suite (45 tests across all endpoints, security, and performance checks).

**Manual Verification** (if automated tests are unavailable):

### Factory Endpoints (Public - No Auth Required)

#### Templates
```bash
# List all templates
curl https://gateway-staging.erlvinc.com/api/public/factory/templates

# Get specific template
curl https://gateway-staging.erlvinc.com/api/public/factory/templates/cloudflare-workers-api

# Test 404
curl -i https://gateway-staging.erlvinc.com/api/public/factory/templates/nonexistent
# Expected: 404
```

#### Capabilities
```bash
# List all capabilities
curl https://gateway-staging.erlvinc.com/api/public/factory/capabilities

# List free-tier only
curl https://gateway-staging.erlvinc.com/api/public/factory/capabilities/free
```

#### Build Specs
```bash
# List build specs with pagination
curl "https://gateway-staging.erlvinc.com/api/public/factory/build-specs?limit=5"

# Get specific build spec (use real runId from staging)
curl https://gateway-staging.erlvinc.com/api/public/factory/build-specs/run-123

# Test 404
curl -i https://gateway-staging.erlvinc.com/api/public/factory/build-specs/nonexistent
# Expected: 404
```

### Audit Logging Verification
```bash
# Check audit logs were created (requires auth)
curl -H "Authorization: Bearer $STAGING_TOKEN" \
  https://gateway-staging.erlvinc.com/api/data/audit_log \
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
- [ ] Navigate to https://dashboard-staging.erlvinc.com/factory
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
time curl https://gateway-staging.erlvinc.com/api/public/factory/templates

# Measure capability list endpoint
time curl https://gateway-staging.erlvinc.com/api/public/factory/capabilities

# Measure build spec list endpoint
time curl https://gateway-staging.erlvinc.com/api/public/factory/build-specs
```

### Database Query Performance
- [ ] Check D1 analytics for slow queries (>100ms)
- [ ] Verify indexes are being used (templates, capabilities, build_specs)

## Security Verification

### Public Access (No Auth)
- [ ] Confirm no authentication required for GET /api/public/factory/*
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

- [ ] Engineering Lead: _______________
- [ ] DevOps: _______________
- [ ] Product: _______________
- [ ] QA: _______________

**Deployment Date**: ______________
**Deployed By**: ______________
**Deployment Notes**: ______________
