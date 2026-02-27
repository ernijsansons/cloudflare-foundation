# Secret Rotation Playbook

**Version**: 1.0.0
**Status**: ACTIVE
**Last Rotation**: N/A (Initial Setup)

---

## Overview

This playbook defines procedures for rotating all secrets used by the Foundation platform. Secret rotation should occur:

1. **Quarterly**: Routine rotation (all secrets)
2. **Immediately**: On suspected compromise
3. **On Departure**: When team member with access leaves

---

## Secret Inventory

| Secret | Service | Storage | Rotation Frequency |
|--------|---------|---------|-------------------|
| `CLOUDFLARE_API_TOKEN` | CI/CD | GitHub Secrets | Quarterly |
| `CLOUDFLARE_ACCOUNT_ID` | CI/CD | GitHub Secrets | Never (not sensitive) |
| `ANTHROPIC_API_KEY` | Workers AI | Wrangler Secrets | Quarterly |
| `OPENAI_API_KEY` | Workers AI | Wrangler Secrets | Quarterly |
| `STRIPE_SECRET_KEY` | Billing | Wrangler Secrets | Quarterly |
| `DATABASE_URL` | Hyperdrive | Wrangler Secrets | On compromise |
| `JWT_SECRET` | Auth | Wrangler Secrets | Quarterly |

---

## Rotation Procedures

### 1. CLOUDFLARE_API_TOKEN

**Risk Level**: CRITICAL
**Access**: All Cloudflare resources

#### Steps

1. **Create New Token**
   ```bash
   # Go to: https://dash.cloudflare.com/profile/api-tokens
   # Click: Create Token
   # Use template: Edit Cloudflare Workers
   # Add permissions:
   #   - Account > Cloudflare Workers > Edit
   #   - Account > D1 > Edit
   #   - Account > Workers KV Storage > Edit
   #   - Account > Workers R2 Storage > Edit
   #   - Zone > Workers Routes > Edit
   ```

2. **Update GitHub Secrets**
   ```bash
   # Go to: GitHub Repo > Settings > Secrets and variables > Actions
   # Update: CLOUDFLARE_API_TOKEN
   ```

3. **Update Wrangler Secrets (All Environments)**
   ```bash
   # Staging
   cd services/gateway
   echo "NEW_TOKEN" | npx wrangler secret put CLOUDFLARE_API_TOKEN --env staging

   cd services/agents
   echo "NEW_TOKEN" | npx wrangler secret put CLOUDFLARE_API_TOKEN --env staging

   # Production (if applicable)
   # echo "NEW_TOKEN" | npx wrangler secret put CLOUDFLARE_API_TOKEN --env production
   ```

4. **Verify**
   ```bash
   # Run a deployment test
   npx wrangler deploy --dry-run --env staging
   ```

5. **Revoke Old Token**
   ```bash
   # Go to: https://dash.cloudflare.com/profile/api-tokens
   # Find the old token > Revoke
   ```

6. **Update Rotation Log**
   ```markdown
   | Date | Secret | Rotated By | Reason |
   |------|--------|------------|--------|
   | YYYY-MM-DD | CLOUDFLARE_API_TOKEN | @username | Quarterly |
   ```

---

### 2. ANTHROPIC_API_KEY

**Risk Level**: HIGH
**Access**: Claude API

#### Steps

1. **Create New Key**
   ```bash
   # Go to: https://console.anthropic.com/settings/keys
   # Click: Create Key
   # Name: foundation-platform-YYYYMMDD
   ```

2. **Update Wrangler Secrets**
   ```bash
   cd services/agents
   echo "NEW_KEY" | npx wrangler secret put ANTHROPIC_API_KEY --env staging
   echo "NEW_KEY" | npx wrangler secret put ANTHROPIC_API_KEY --env production
   ```

3. **Verify**
   ```bash
   curl -X POST https://foundation-gateway-staging.erlvinc.workers.dev/api/agents/chat/test-rotation \
     -H "Content-Type: application/json" \
     -d '{"message":"API key rotation test"}'
   ```

4. **Revoke Old Key**
   ```bash
   # Go to: https://console.anthropic.com/settings/keys
   # Find old key > Delete
   ```

---

### 3. STRIPE_SECRET_KEY

**Risk Level**: CRITICAL
**Access**: Payment processing

#### Steps

1. **Roll Key (Stripe Feature)**
   ```bash
   # Go to: https://dashboard.stripe.com/apikeys
   # Click: Roll key
   # This creates new key and keeps old active for 24 hours
   ```

2. **Update Wrangler Secrets**
   ```bash
   cd services/gateway
   echo "NEW_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env staging
   echo "NEW_KEY" | npx wrangler secret put STRIPE_SECRET_KEY --env production
   ```

3. **Verify Webhooks**
   ```bash
   # Go to: https://dashboard.stripe.com/webhooks
   # Verify all endpoints are receiving events
   ```

4. **Old Key Auto-Expires**
   - Stripe automatically expires the old key after 24 hours

---

### 4. JWT_SECRET

**Risk Level**: HIGH
**Access**: Session authentication

#### Steps

1. **Generate New Secret**
   ```bash
   # Generate cryptographically secure secret
   openssl rand -base64 64 | tr -d '\n' > /tmp/jwt_secret
   ```

2. **Update Wrangler Secrets**
   ```bash
   cd services/gateway
   cat /tmp/jwt_secret | npx wrangler secret put JWT_SECRET --env staging
   cat /tmp/jwt_secret | npx wrangler secret put JWT_SECRET --env production
   ```

3. **Invalidate Existing Sessions**
   ```bash
   # All existing JWTs will become invalid
   # Users will need to re-authenticate
   # Consider scheduling during low-traffic window
   ```

4. **Clean Up**
   ```bash
   rm /tmp/jwt_secret
   ```

---

## Emergency Rotation (Compromise Response)

### Immediate Actions

1. **Assess Scope**
   - Which secrets were potentially exposed?
   - What systems do they access?
   - Is there evidence of unauthorized access?

2. **Rotate All Potentially Compromised Secrets**
   ```bash
   # Run full rotation for affected services
   ./scripts/rotate-all-secrets.sh --emergency
   ```

3. **Audit Access Logs**
   ```bash
   # Check Cloudflare Analytics
   # Dashboard > Analytics > Security Events

   # Check D1 audit log
   npx wrangler d1 execute foundation-primary-staging --remote \
     --command="SELECT * FROM audit_log WHERE created_at > datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 100;"
   ```

4. **Notify Stakeholders**
   - Security team
   - Affected users (if data was accessed)
   - Legal/compliance (if required)

5. **Post-Incident Review**
   - Document timeline
   - Identify root cause
   - Implement preventive measures

---

## Automation Script

```bash
#!/bin/bash
# scripts/rotate-all-secrets.sh

set -euo pipefail

EMERGENCY="${1:-}"

echo "=== Foundation Secret Rotation ==="

if [[ "$EMERGENCY" == "--emergency" ]]; then
  echo "⚠️  EMERGENCY MODE: Rotating all secrets immediately"
  SKIP_CONFIRM=true
else
  echo "📋 Routine rotation"
  read -p "Continue with rotation? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Cloudflare API Token
echo "1/4: CLOUDFLARE_API_TOKEN"
echo "   → Manual rotation required (see playbook)"

# Anthropic API Key
echo "2/4: ANTHROPIC_API_KEY"
echo "   → Manual rotation required (see playbook)"

# Stripe Secret Key
echo "3/4: STRIPE_SECRET_KEY"
echo "   → Use Stripe Dashboard roll feature"

# JWT Secret
echo "4/4: JWT_SECRET"
if [[ "$EMERGENCY" == "--emergency" ]]; then
  NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  echo "$NEW_SECRET" | npx wrangler secret put JWT_SECRET --env staging
  echo "   ✅ Rotated (staging)"
else
  echo "   → Schedule rotation during maintenance window"
fi

echo ""
echo "=== Rotation Complete ==="
echo "Update the rotation log in docs/SECRET_ROTATION_PLAYBOOK.md"
```

---

## Rotation Log

| Date | Secret | Environment | Rotated By | Reason | Ticket |
|------|--------|-------------|------------|--------|--------|
| 2026-02-27 | Initial Setup | All | Claude | Platform initialization | N/A |

---

## Compliance

### SOC 2 Requirements

- **CC6.1**: Secrets rotated at least quarterly
- **CC6.6**: Access revoked within 24 hours of departure
- **CC7.2**: Incident response for compromised credentials

### Audit Evidence

Store rotation evidence in:
- `docs/compliance/rotation-evidence/YYYY-MM-DD-SECRET_NAME.md`
- Include: Timestamp, rotator, verification screenshot

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Security Lead | ops@erlvinc.com | Slack #security |
| Platform Lead | ops@erlvinc.com | Slack #platform |
| Emergency | on-call rotation | PagerDuty |
