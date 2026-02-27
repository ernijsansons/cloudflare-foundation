# Factory Feature Rollback Procedures

**Version**: 2.5.0
**Last Updated**: 2026-02-27
**Feature**: Public Factory Endpoints

## When to Rollback

Execute rollback immediately if any of the following occur:

### Automatic Rollback Triggers
- Error rate >1% in first hour
- Response time p95 >1000ms
- Health check failures
- Database connection errors (>5% failed queries)
- Service binding errors
- Authentication/authorization failures

### Manual Rollback Triggers
- Security vulnerability discovered
- Data integrity issues
- Critical bug affecting user experience
- Performance degradation (>20% slower than baseline)
- Excessive costs (>200% of expected)

## Rollback Decision Tree

```
Is the issue affecting users?
├─ YES → How severe?
│  ├─ Critical (data loss, security) → ROLLBACK IMMEDIATELY
│  ├─ High (errors, failures) → ROLLBACK within 15 minutes
│  └─ Medium (performance, UX) → Fix forward if possible, otherwise ROLLBACK
└─ NO → Monitor closely, fix forward if safe
```

## Pre-Rollback Checklist

Before executing rollback:

- [ ] Capture current deployment state
  ```bash
  (cd services/gateway && wrangler deployments list --env production)
  (cd services/planning-machine && wrangler deployments list --env production)
  (cd services/ui && wrangler pages deployment list --project-name erlvinc-dashboard --environment production)
  ```

- [ ] Export logs for analysis
  ```bash
  wrangler tail foundation-gateway-production --format json > rollback-logs-gateway.json
  wrangler tail foundation-planning-machine-production --format json > rollback-logs-planning.json
  ```

- [ ] Screenshot Analytics Engine dashboard
- [ ] Document incident in incident log
- [ ] Notify team in #incidents Slack channel

## Rollback Procedures

### Method 1: Wrangler Deployment Rollback (Recommended)

#### 1. Roll back Gateway Service

```bash
# List recent deployments
(cd services/gateway && wrangler deployments list --env production)

# Note the deployment ID from before factory deployment (e.g., ########-####-####-####-############)
# Rollback to that deployment
(cd services/gateway && wrangler rollback <PREVIOUS_DEPLOYMENT_ID> --env production)

# Verify rollback
curl https://gateway.erlvinc.com/health
```

**Expected**: Gateway should respond but `/api/public/factory/*` endpoints return 404.

#### 2. Roll back Planning Machine Service

```bash
# List recent deployments
(cd services/planning-machine && wrangler deployments list --env production)

# Rollback to deployment before factory changes
(cd services/planning-machine && wrangler rollback <PREVIOUS_DEPLOYMENT_ID> --env production)

# Verify rollback
curl https://planning.internal/api/planning/health
# (This requires service binding access, check logs instead)
wrangler tail foundation-planning-machine-production --format pretty
```

#### 3. Roll back UI Service (Pages)

**IMPORTANT**: Cloudflare Pages does not have a `wrangler pages deployment rollback` CLI command. Use one of these methods:

**Method A: Cloudflare Dashboard (Recommended for Production)**
1. Navigate to Cloudflare Dashboard → Pages → erlvinc-dashboard
2. Click "Deployments" tab
3. Find the previous working deployment (before the problematic one)
4. Click the "..." menu next to that deployment
5. Select "Rollback to this deployment"
6. Confirm the rollback

**Method B: Redeploy Previous Git Commit (CLI-based)**
```bash
# Check out the previous working commit first
git checkout <PREVIOUS_COMMIT_HASH>
pnpm --filter foundation-ui build

# Deploy the built artifacts for that commit
(cd services/ui && npx wrangler pages deploy .svelte-kit/cloudflare --project-name erlvinc-dashboard --branch main --commit-hash <PREVIOUS_COMMIT_HASH>)

# Verify rollback
curl https://dashboard.erlvinc.com/factory

# Return to main branch after verification
git checkout main
```

**Method C: Redeploy Build Artifacts (If Available)**
```bash
# If you have the previous build directory saved
cd services/ui/.svelte-kit/cloudflare
npx wrangler pages deploy . --project-name erlvinc-dashboard

# Verify rollback
curl https://dashboard.erlvinc.com/factory
```

**Expected**: Factory page returns previous version or 404 (depending on rollback target).

### Method 2: Git Revert + Redeploy

If wrangler rollback fails:

#### 1. Identify commits to revert

```bash
# List recent commits
git log --oneline -10

# Identify factory-related commits:
# - aeaf375 feat(gateway): Phase L1 stabilization
# - c65b3ce fix: resolve dashboard 429 errors and empty factory data
# (and any others)
```

#### 2. Create revert branch

```bash
# Create rollback branch
git checkout -b rollback-factory-$(date +%Y%m%d)

# Revert commits in reverse order (newest first)
git revert aeaf375
git revert c65b3ce
# (revert other factory commits)

# Resolve conflicts if any
git status
# Fix conflicts, then:
git add .
git revert --continue
```

#### 3. Redeploy reverted code

```bash
# Build to verify
pnpm run build

# Run tests
(cd services/gateway && pnpm test)

# Deploy to production
(cd services/planning-machine && npx wrangler deploy --env production)
(cd services/gateway && npx wrangler deploy --env production)
(cd services/ui && npx wrangler pages deploy --branch main --project-name erlvinc-dashboard)
```

### Method 3: Manual Code Removal (Emergency)

If both above methods fail:

#### 1. Remove factory routes from gateway

```bash
cd services/gateway/src/routes
```

Edit `public.ts`:
- Remove all `/factory/*` route handlers (lines 662-728)
- Remove `import { appendAuditEvent }` if not used elsewhere

#### 2. Commit and deploy

```bash
(cd services/gateway && git add src/routes/public.ts)
git commit -m "emergency: remove factory endpoints"
(cd services/gateway && npx wrangler deploy --env production)
```

#### 3. Remove factory UI pages

```bash
cd services/ui/src/routes
rm -rf factory/
```

Commit and deploy:
```bash
git add -A
git commit -m "emergency: remove factory UI pages"
(cd services/ui && npx wrangler pages deploy --branch main --project-name erlvinc-dashboard)
```

## Post-Rollback Verification

After rollback, verify:

### 1. Health Checks

```bash
# Gateway health
curl https://gateway.erlvinc.com/health
# Expected: {"status": "ok", ...}

# Factory endpoints should 404
curl -I https://gateway.erlvinc.com/api/public/factory/templates
# Expected: HTTP/1.1 404 Not Found
```

### 2. Core Functionality

```bash
# Test other endpoints still work
curl https://gateway.erlvinc.com/api/planning/runs
# Should still work (requires auth)

# Test UI dashboard
curl https://dashboard.erlvinc.com/dashboard
# Should load normally
```

### 3. Monitor Error Rates

```bash
# Check for errors
wrangler tail foundation-gateway-production --status error
# Should see no new errors

# Check Analytics Engine
# Navigate to Cloudflare dashboard → Analytics Engine
# Verify error rate drops to baseline
```

### 4. Verify Audit Logs

Factory endpoint access should stop appearing in audit logs:

```bash
# Query recent audit logs
curl -H "Authorization: Bearer $TOKEN" \
  https://gateway.erlvinc.com/api/data/audit_log \
  | jq '.[] | select(.event_type | contains("factory"))'

# Expected: No new factory events after rollback timestamp
```

## Database Rollback (If Needed)

If factory deployment included database changes:

### Migration 0013 Rollback

```sql
-- Only needed if build_spec 'fallback' status is problematic
-- Revert build_specs table to old schema

-- Backup first
.backup backups/pre-rollback-0013-$(date +%Y%m%d).db

-- Create new table with old schema (without 'fallback' status)
CREATE TABLE build_specs_old (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  recommended TEXT NOT NULL DEFAULT '{}',
  alternatives TEXT NOT NULL DEFAULT '[]',
  data_model TEXT NOT NULL DEFAULT '{}',
  api_routes TEXT NOT NULL DEFAULT '[]',
  frontend TEXT,
  agents TEXT NOT NULL DEFAULT '[]',
  growth_path TEXT,
  scaffold_command TEXT NOT NULL DEFAULT '',
  total_cost TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  -- Note: 'fallback' removed from CHECK constraint
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  free_wins TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (run_id) REFERENCES planning_runs(id) ON DELETE CASCADE
);

-- Copy data (any 'fallback' status rows will fail CHECK constraint)
INSERT INTO build_specs_old SELECT * FROM build_specs WHERE status != 'fallback';

-- Swap tables
DROP TABLE build_specs;
ALTER TABLE build_specs_old RENAME TO build_specs;

-- Recreate indexes
CREATE INDEX idx_build_specs_run ON build_specs(run_id);
CREATE INDEX idx_build_specs_status ON build_specs(status);
CREATE INDEX idx_build_specs_free_wins ON build_specs((json_array_length(free_wins) > 0));
```

**Apply via wrangler**:
```bash
cd services/planning-machine
npx wrangler d1 execute planning-primary --remote --file=migrations/rollback-0013.sql
```

## Communication Templates

### Incident Notification (Slack)

```
🚨 INCIDENT: Rolling back Factory Feature

Severity: HIGH
Status: Rollback in progress
Impact: Factory endpoints returning errors, initiating rollback

Timeline:
- [TIME] Issue detected: [DESCRIPTION]
- [TIME] Rollback initiated
- [TIME] Rollback complete (expected)

Actions:
1. Rolling back gateway service
2. Rolling back planning-machine service
3. Rolling back UI Pages

ETA: 10-15 minutes

Incident lead: [NAME]
```

### Rollback Complete (Slack)

```
✅ RESOLVED: Factory Feature Rollback Complete

Status: Rolled back successfully
Current state: Factory endpoints disabled, core functionality restored

Verification:
✓ Health checks passing
✓ Error rate returned to baseline
✓ Core endpoints functioning
✓ UI stable

Next steps:
- RCA (Root Cause Analysis) scheduled for [DATE]
- Fix in progress
- Re-deployment planned after fix verification

Incident lead: [NAME]
Incident log: [LINK]
```

## Rollback Drill Procedure

Practice rollback quarterly to ensure team readiness:

### Staging Rollback Drill

1. Deploy factory to staging
2. Wait 5 minutes
3. Simulate failure condition
4. Execute rollback procedure
5. Verify rollback success
6. Document drill results
7. Identify improvements

**Drill checklist**:
- [ ] Team knows where rollback docs are
- [ ] Team can access wrangler CLI
- [ ] Team can list deployments
- [ ] Team can execute rollback command
- [ ] Team can verify rollback success
- [ ] Rollback completes in <15 minutes

## Lessons Learned Template

After any rollback, document:

```markdown
# Factory Rollback Post-Mortem

**Date**: [DATE]
**Duration**: [START] - [END]
**Severity**: [CRITICAL|HIGH|MEDIUM]

## What Happened
[Brief description of the incident]

## Root Cause
[Technical root cause]

## Timeline
- [TIME]: Deployed factory feature
- [TIME]: Issue detected
- [TIME]: Rollback decision made
- [TIME]: Rollback initiated
- [TIME]: Rollback complete
- [TIME]: Service restored

## Impact
- Users affected: [NUMBER/PERCENTAGE]
- Duration: [MINUTES]
- Services impacted: [LIST]

## What Went Well
- [Item 1]
- [Item 2]

## What Could Be Improved
- [Item 1]
- [Item 2]

## Action Items
- [ ] [Action 1] - Owner: [NAME] - Due: [DATE]
- [ ] [Action 2] - Owner: [NAME] - Due: [DATE]

## Prevention
[How to prevent this in the future]
```

## Rollback Checklist

Print and use during rollback:

```
FACTORY ROLLBACK CHECKLIST

Pre-Rollback:
[ ] Capture deployment IDs
[ ] Export logs
[ ] Screenshot analytics
[ ] Document incident
[ ] Notify team

Rollback Execution:
[ ] Roll back gateway (deployment ID: ________)
[ ] Roll back planning-machine (deployment ID: ________)
[ ] Roll back UI Pages (deployment ID: ________)
[ ] Wait 2 minutes for propagation

Post-Rollback Verification:
[ ] Health checks passing
[ ] Factory endpoints return 404
[ ] Core functionality working
[ ] Error rate at baseline
[ ] Smoke tests passing

Communication:
[ ] Update incident channel
[ ] Notify stakeholders
[ ] Schedule post-mortem

Sign-off:
Rolled back by: _______________
Date/Time: _______________
Verified by: _______________
```

## Support Contacts

**NOTE**: Update these contacts before production deployment.

- **On-call Engineer**: PagerDuty rotation (configure at https://pagerduty.com)
- **DevOps Lead**: #devops Slack channel or devops@erlvinc.com
- **Engineering Manager**: #engineering-leads Slack channel
- **Cloudflare Support**: https://dash.cloudflare.com/support (Enterprise plan required)

## Related Documents

- [FACTORY_DEPLOYMENT_CHECKLIST.md](./FACTORY_DEPLOYMENT_CHECKLIST.md)
- [PRE_EXISTING_ISSUES.md](./PRE_EXISTING_ISSUES.md)
- [API.md](./API.md)
