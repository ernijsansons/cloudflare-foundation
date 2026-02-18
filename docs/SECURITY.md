# Security Documentation

## Overview

The Foundation implements multiple layers of security to protect your application and user data.

## Authentication

### JWT Tokens

- Tokens are signed using HMAC-SHA256 with `CONTEXT_SIGNING_KEY`
- Default expiration: 30 minutes
- Tokens include: `sub` (user ID), `tid` (tenant ID), `iat` (issued at), `exp` (expiration)

### Session Management

- Sessions are stored in KV with automatic expiration
- Session tokens are cryptographically secure (using `crypto.randomUUID()`)

### Error Handling

Authentication failures are handled securely:
- All auth errors result in a `401 Unauthorized` response
- Error details are logged but not exposed to clients
- System fails closed (denies access on error)

## Rate Limiting

### IP-Based Rate Limiting (KV)

- Window: 60 seconds
- Max requests: 60 per window
- Applies to all routes via middleware

### Tenant-Based Rate Limiting (Durable Objects)

- Window: 60 seconds
- Max requests: 100 per window
- Uses atomic operations to prevent race conditions
- Bounded request history (max 1000 entries)

## CORS Configuration

CORS is configured with a whitelist approach:

```typescript
const ALLOWED_ORIGINS = [
  "https://yourdomain.com",
  "https://app.yourdomain.com",
  "http://localhost:5173", // Development only
];
```

Cross-origin requests from non-whitelisted origins are blocked.

## File Upload Security

### Size Limits

- Maximum file size: 10MB
- Request body size limit: 10MB

### Content Type Validation

Allowed file types:
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`, `text/csv`, `application/json`

Executable files and other dangerous types are rejected.

### Filename Sanitization

Filenames are sanitized to prevent:
- Path traversal attacks (`../../../etc/passwd`)
- Special character injection
- Excessively long filenames

Sanitization rules:
1. Only alphanumeric characters, dots, underscores, and hyphens allowed
2. Double dots removed to prevent traversal
3. Maximum length: 255 characters

## Turnstile Integration

Public endpoints are protected by Cloudflare Turnstile:

- Token verification with 5-second timeout
- Tokens are validated against the Turnstile API
- Invalid or expired tokens result in `403 Forbidden`

## Webhook Security

### SSRF Protection

- Webhook URLs are validated against registered hostnames
- URL hostname must match the registered hostname
- Invalid URLs are rejected

### HMAC Signatures

Webhook payloads are signed when a secret is configured:

```
X-Webhook-Signature: sha256=<hex-encoded-hmac>
```

Verify signatures before processing webhooks:

```typescript
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"]
);

const isValid = await crypto.subtle.verify(
  "HMAC",
  key,
  signature,
  new TextEncoder().encode(payload)
);
```

## Audit Chain

All sensitive operations are recorded in an immutable audit chain:

- Each event is cryptographically linked to the previous
- SHA-256 hashes ensure tamper detection
- Chain integrity can be verified with `/api/admin/audit-verify/:tenantId`

## SQL Injection Prevention

### Parameterized Queries

All database queries use parameterized statements:

```typescript
// SAFE - parameterized
await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();

// NEVER do this
// await db.prepare(`SELECT * FROM users WHERE id = '${userId}'`).first();
```

### Table Whitelist

Dynamic table access uses explicit query maps:

```typescript
const TABLE_QUERIES: Record<string, string> = {
  users: "SELECT * FROM users WHERE tenant_id = ? LIMIT 100",
  audit_log: "SELECT * FROM audit_log WHERE tenant_id = ? LIMIT 100",
};
```

## Input Validation

All inputs are validated using Zod schemas:

```typescript
const AnalyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  tenantId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  value: z.number().optional(),
});
```

Invalid inputs return `400 Bad Request` with validation errors.

## Environment Secrets

Required secrets (never commit to source control):

| Secret | Description |
|--------|-------------|
| `CONTEXT_SIGNING_KEY` | JWT signing key (min 32 bytes, base64) |
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret key |

Generate a secure signing key:
```bash
openssl rand -base64 32
```

## Security Headers

Recommended security headers for production:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Best Practices

1. **Rotate secrets regularly** - Change `CONTEXT_SIGNING_KEY` periodically
2. **Monitor audit logs** - Review audit chain for suspicious activity
3. **Enable all protections** - Don't disable security middleware in production
4. **Keep dependencies updated** - Regularly update npm packages
5. **Use HTTPS only** - Never expose HTTP endpoints in production
6. **Limit API keys** - Use scoped, rotatable API keys
7. **Implement IP allowlisting** - Restrict admin endpoints by IP when possible
