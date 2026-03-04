---
paths:
  - "**/auth/**"
  - "**/middleware/**"
  - "**/security/**"
---

# Security Rules

## Authentication
- JWT validation via middleware
- Context tokens signed by gateway (60s TTL)
- Downstream Workers verify token, not re-auth
- Never store credentials in code or configs

## Rate Limiting
- KV-backed rate limiting (survives DO hibernation)
- TenantRateLimiter DO for strongly consistent limits
- Never use in-memory Maps for rate limiting

## Input Validation
- Zod schemas for all external input
- Sanitize user-provided HTML
- Validate file uploads (size, type, content)

## CORS
- Use origin callback with allowlist
- NEVER use wildcard cors()
- Include credentials only for trusted origins

## Secrets Management
- Use wrangler secret put for all secrets
- Never commit secrets to git
- Never log secrets or tokens
- Rotate API keys periodically

## Audit
- SHA-256 hash chain for tamper-evident logs
- Log all auth events
- Log all sensitive data access
- Include correlation IDs in all logs

## WebSocket Security
- Validate message size (1MB max)
- Safe deserializeAttachment() with try/catch
- Rate limit messages per connection
