# Deployment Runbook: Naomi + Athena Agent Integration

**Version**: 1.0
**Date**: 2026-03-05

---

## Prerequisites

**Wrangler Invocation Strategy**:
- Use `npx wrangler` or `corepack pnpm exec wrangler` if wrangler is not in PATH
- All secret commands use stdin syntax (`echo "value" | wrangler secret put`) for non-interactive execution
- Run commands from `services/gateway/` directory unless otherwise noted

---

## Pre-Deployment Checklist

- [ ] Gateway typecheck passes: `corepack pnpm --filter foundation-gateway typecheck`
- [ ] Gateway tests pass: `corepack pnpm --filter foundation-gateway test`
- [ ] UI build succeeds: `corepack pnpm --filter foundation-ui build`
- [ ] Service Bindings verified in wrangler.jsonc
- [ ] Secrets prepared (see Environment Variables section)

---

## Environment Variables

### Required Secrets

```bash
# Set ATHENA_ADMIN_SECRET (required for Athena API auth)
# Use stdin for non-interactive execution:
echo "$ATHENA_ADMIN_SECRET" | wrangler secret put ATHENA_ADMIN_SECRET --env production

# Optional: Override Naomi defaults (use stdin syntax)
echo "global" | wrangler secret put NAOMI_TENANT_ID --env production
echo "naomi" | wrangler secret put NAOMI_BUSINESS_ID --env production
```

### Feature Flags (in wrangler.jsonc vars)

| Flag | Default | Description |
|------|---------|-------------|
| `AGENTS_NAOMI_ENABLED` | `"true"` | Enable Naomi agent integration |
| `AGENTS_ATHENA_ENABLED` | `"false"` | Enable Athena agent integration |

---

## Deployment Steps

### 1. Deploy to Staging

```bash
cd services/gateway
wrangler deploy --env staging
```

**Expected Output**:
```
Uploaded foundation-gateway-staging
Published foundation-gateway-staging
  https://gateway-staging.erlvinc.workers.dev
```

### 2. Test Staging

```bash
# Test agents endpoint
curl "https://gateway-staging.erlvinc.workers.dev/api/public/dashboard/agents?source=all"

# Expected: JSON with agents array and sources status
```

### 3. Deploy to Production

```bash
# Record current deployment version for potential rollback
wrangler deployments list --env production

# Deploy
wrangler deploy --env production
```

### 4. Verify Production

```bash
# Test production endpoint
curl "https://gateway.erlvinc.com/api/public/dashboard/agents?source=all"

# Verify response structure
{
  "agents": [...],
  "sources": {
    "naomi": { "enabled": true, "healthy": true/false, "count": N },
    "athena": { "enabled": true/false, "healthy": true/false, "count": N }
  }
}
```

### 5. Enable Athena (Optional)

After verifying Naomi integration works:

```bash
# AGENTS_* flags are environment VARIABLES, not secrets.
# To change them, edit wrangler.jsonc and redeploy:

# 1. Edit services/gateway/wrangler.jsonc
#    Change env.production.vars.AGENTS_ATHENA_ENABLED from "false" to "true"

# 2. Redeploy
cd services/gateway
npx wrangler deploy --env production
```

---

## UI Deployment

```bash
cd services/ui
wrangler pages deploy

# Verify
open https://dashboard.erlvinc.com/agents
```

---

## Rollback Procedures

### Quick Disable (Requires Redeploy)

**Note**: `AGENTS_*` are environment variables defined in `wrangler.jsonc`, NOT secrets.
To disable them, you must edit the config and redeploy.

```bash
# 1. Edit services/gateway/wrangler.jsonc
#    Set env.production.vars.AGENTS_NAOMI_ENABLED = "false"
#    Set env.production.vars.AGENTS_ATHENA_ENABLED = "false"

# 2. Redeploy
cd services/gateway
npx wrangler deploy --env production
```

**Alternative: Full code rollback** (see below) reverts to previous deployment including config.

### Full Gateway Rollback

```bash
# List deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --version <previous-version-id> --env production
```

### UI Rollback

```bash
# List Pages deployments
wrangler pages deployment list

# Rollback
wrangler pages deployment rollback <previous-deployment-id>
```

---

## Troubleshooting

### Issue: Agents endpoint returns empty array

**Possible Causes**:
1. Feature flags disabled
2. Service Binding not resolving
3. Upstream service returning errors

**Debug Steps**:
```bash
# Check response for error details
curl -v "https://gateway.erlvinc.com/api/public/dashboard/agents?source=naomi"

# Look for sources.naomi.error in response
```

### Issue: 500 error on agents endpoint

**Possible Causes**:
1. TypeScript error in new code
2. Missing environment variable

**Debug Steps**:
```bash
# Check Worker logs
wrangler tail foundation-gateway-production
```

### Issue: Athena returns 401

**Cause**: `ATHENA_ADMIN_SECRET` not set or incorrect

**Fix**:
```bash
echo "$ATHENA_ADMIN_SECRET" | wrangler secret put ATHENA_ADMIN_SECRET --env production
```

### Issue: Naomi returns oracle_error

**Cause**: Naomi Oracle Durable Object needs data seeding

**Fix**: Seed Naomi Oracle with agent data (separate process)

---

## Monitoring

### Real-time Logs

```bash
wrangler tail foundation-gateway-production
```

### Key Metrics to Watch

- Request latency to `/api/public/dashboard/agents`
- Error rate on agent endpoints
- Service Binding response times

---

## Post-Deployment Verification

- [ ] `/agents` page loads in browser
- [ ] Agent list shows cards (even if empty)
- [ ] Source tabs work (All, Naomi, Athena)
- [ ] Agent detail pages load (`/agents/naomi/[id]`, `/agents/athena/[id]`)
- [ ] Error states display correctly when service unavailable

---

## Contacts

- **Gateway Issues**: Check `services/gateway/` logs
- **Naomi Issues**: Check `naomi-oracle-cloudflare` worker
- **Athena Issues**: Check `athena-core` worker
