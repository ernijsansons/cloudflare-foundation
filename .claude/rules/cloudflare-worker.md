---
paths:
  - "services/**/*.ts"
  - "workers/**/*.ts"
---

# Cloudflare Worker Rules

## Framework & Routing
- Use Hono v4 for all routing
- Export default { fetch } from Hono app
- Use ctx.executionCtx.waitUntil() for non-blocking async

## Input Validation
- Validate all input with Zod schemas
- Return structured errors: { error: string, code: number }
- Use middleware for common validation patterns

## Database (D1)
- ALWAYS use parameterized queries with .bind()
- NEVER use string concatenation for SQL
- Use Drizzle ORM for type safety

## Security
- Rate limit public endpoints via KV or TenantRateLimiter DO
- CORS: Use origin callback, never wildcard cors()
- Auth: Validate context tokens via middleware
- Secrets: wrangler secret put, never in config

## Error Handling
- Consistent error shapes across all routes
- Include correlation ID in error responses
- Log errors with structured logger

## Performance
- Use KV for caching, D1 for truth
- Batch D1 operations where possible
- Keep CPU time under 30ms for hot paths
