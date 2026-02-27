# Disaster Recovery Runbook

**Version**: 1.0.0
**Last Updated**: 2026-02-27
**Status**: Production Ready

This runbook contains literal, copy-pasteable CLI commands for disaster recovery.

---

## Table of Contents

1. [D1 Database Recovery (Point-in-Time)](#1-d1-database-recovery-point-in-time)
2. [Durable Object Migration Rollback](#2-durable-object-migration-rollback)
3. [KV Namespace Backup & Restore](#3-kv-namespace-backup--restore)
4. [Worker Rollback](#4-worker-rollback)
5. [Emergency Contacts](#5-emergency-contacts)

---

## 1. D1 Database Recovery (Point-in-Time)

### List Available Time Travel Points

```bash
# Check time travel info for foundation-primary
wrangler d1 time-travel info foundation-primary

# Check time travel info for planning-primary
wrangler d1 time-travel info planning-primary
```

### Restore to Specific Timestamp

**CRITICAL COMMAND - This restores the database to a specific point in time:**

```bash
# Restore foundation-primary to a specific timestamp
# Format: ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
wrangler d1 time-travel restore foundation-primary --timestamp="2026-02-27T10:00:00Z"

# Restore planning-primary to a specific timestamp
wrangler d1 time-travel restore planning-primary --timestamp="2026-02-27T10:00:00Z"
```

### Create Bookmark Before Risky Operations

```bash
# Create a bookmark you can restore to later
BOOKMARK=$(wrangler d1 time-travel bookmark foundation-primary)
echo "SAVE THIS BOOKMARK: $BOOKMARK"

# Restore to bookmark if operation fails
wrangler d1 time-travel restore foundation-primary --bookmark="$BOOKMARK"
```

### Export Database Backup

```bash
# Export to SQL file for off-platform backup
wrangler d1 export foundation-primary --output="backup-foundation-$(date +%Y%m%d-%H%M%S).sql"
wrangler d1 export planning-primary --output="backup-planning-$(date +%Y%m%d-%H%M%S).sql"
```

### Verify Recovery Success

```bash
# Check row counts after recovery
wrangler d1 execute foundation-primary --command="SELECT 'tenants' as tbl, COUNT(*) FROM tenants UNION ALL SELECT 'users', COUNT(*) FROM users;"

wrangler d1 execute planning-primary --command="SELECT 'planning_runs' as tbl, COUNT(*) FROM planning_runs;"
```

---

## 2. Durable Object Migration Rollback

### Understanding DO Migrations

- DO migrations are **forward-only** - there is no automatic rollback
- DO state persists independently of Worker deployments
- Rolling back the Worker does NOT roll back DO state

### Scenario: DO Migration Broke State

**Step 1: Rollback the Worker (state persists)**

```bash
# List recent deployments
wrangler deployments list foundation-agents-production

# Rollback to previous Worker version
wrangler rollback foundation-agents-production --deployment-id <PREVIOUS_DEPLOYMENT_ID>
```

**Step 2: Write Compensating Migration**

Create a new migration that undoes the problematic changes:

```typescript
// migrations/0002_rollback_bad_change.ts
export async function up(db: DurableObjectStorage) {
  // Write code to undo the problematic migration
}
```

**Step 3: Deploy Compensating Migration**

```bash
cd services/agents && wrangler deploy --env production
```

### Scenario: Need to Reset DO State Completely

**WARNING: This causes data loss for affected DOs**

```bash
# Option 1: Via Dashboard
# Dashboard → Workers → foundation-agents-production → Durable Objects → Select DO → Delete

# Option 2: Force new DO ID in code (temporary)
# Change ID derivation to force new instance:
# const doId = env.CHAT_AGENT.idFromName(`${tenantId}-v2`);
```

---

## 3. KV Namespace Backup & Restore

### Production KV Namespace IDs

| Namespace | ID |
|-----------|-----|
| CACHE_KV | `ef2305fbf6da4cffa948193efd40f40c` |
| RATE_LIMIT_KV | `1e179df285ba4817b905633ce55d6d98` |
| SESSION_KV | `c53d7df2c22c43f590f960a913113737` |

### List All Keys

```bash
# List keys in CACHE_KV
wrangler kv key list --namespace-id ef2305fbf6da4cffa948193efd40f40c

# List keys in RATE_LIMIT_KV
wrangler kv key list --namespace-id 1e179df285ba4817b905633ce55d6d98

# List keys in SESSION_KV
wrangler kv key list --namespace-id c53d7df2c22c43f590f960a913113737
```

### Export KV to JSON Backup

```bash
#!/bin/bash
NAMESPACE_ID="ef2305fbf6da4cffa948193efd40f40c"
OUTPUT="kv-backup-$(date +%Y%m%d-%H%M%S).json"

echo "[" > "$OUTPUT"
FIRST=true
for KEY in $(wrangler kv key list --namespace-id "$NAMESPACE_ID" | jq -r '.[].name'); do
  VALUE=$(wrangler kv key get --namespace-id "$NAMESPACE_ID" "$KEY" 2>/dev/null)
  [ "$FIRST" = true ] && FIRST=false || echo "," >> "$OUTPUT"
  echo "{\"key\":\"$KEY\",\"value\":\"$VALUE\"}" >> "$OUTPUT"
done
echo "]" >> "$OUTPUT"
echo "Exported to $OUTPUT"
```

### Restore KV from JSON Backup

```bash
#!/bin/bash
NAMESPACE_ID="ef2305fbf6da4cffa948193efd40f40c"
BACKUP="kv-backup-20260227-100000.json"

cat "$BACKUP" | jq -c '.[]' | while read item; do
  KEY=$(echo "$item" | jq -r '.key')
  VALUE=$(echo "$item" | jq -r '.value')
  wrangler kv key put --namespace-id "$NAMESPACE_ID" "$KEY" "$VALUE"
  echo "Restored: $KEY"
done
```

---

## 4. Worker Rollback

### List Recent Deployments

```bash
# Gateway
wrangler deployments list foundation-gateway-production

# Planning Machine
wrangler deployments list foundation-planning-machine-production

# Agents
wrangler deployments list foundation-agents-production

# Workflows
wrangler deployments list foundation-workflows-production

# Queues
wrangler deployments list foundation-queues-production

# Cron
wrangler deployments list foundation-cron-production
```

### Execute Rollback

```bash
# Rollback Gateway
wrangler rollback foundation-gateway-production --deployment-id <DEPLOYMENT_ID>

# Rollback Planning Machine
wrangler rollback foundation-planning-machine-production --deployment-id <DEPLOYMENT_ID>

# Rollback Agents (Note: DO state persists)
wrangler rollback foundation-agents-production --deployment-id <DEPLOYMENT_ID>
```

### Verify Rollback

```bash
# Health check
curl -s https://gateway.erlvinc.com/health | jq .

# Check logs for errors
wrangler tail foundation-gateway-production --format json 2>&1 | head -20
```

---

## 5. Emergency Contacts

| Role | Contact | When to Use |
|------|---------|-------------|
| On-Call Engineer | PagerDuty rotation | All incidents |
| DevOps Lead | #devops Slack | Escalation |
| Cloudflare Support | support.cloudflare.com | Platform issues |

---

## Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Gateway Worker | 5 min | 0 |
| D1 foundation-primary | 15 min | 30 min |
| D1 planning-primary | 30 min | 4 hours |
| KV namespaces | 30 min | Manual backup frequency |
| Durable Objects | 1 hour | N/A (rebuild from D1) |

---

## Post-Incident Checklist

- [ ] Document incident in #incidents
- [ ] Capture logs and metrics
- [ ] Identify root cause
- [ ] Create post-mortem
- [ ] Update this runbook if gaps found
