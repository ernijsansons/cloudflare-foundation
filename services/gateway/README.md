# Gateway Service

API Gateway for Cloudflare Foundation v2.5. Built with Hono framework on Cloudflare Workers.

## Overview

The gateway provides:
- Centralized API routing
- Authentication and authorization
- Rate limiting
- CORS handling
- Tenant isolation
- Audit logging
- Service proxying

## Middleware Stack

Requests flow through middleware in order:

```
Request
   │
   ▼
┌────────────────┐
│     CORS       │  Allow cross-origin requests
└───────┬────────┘
        ▼
┌────────────────┐
│  Correlation   │  Add X-Correlation-ID header
└───────┬────────┘
        ▼
┌────────────────┐
│  Rate Limit    │  Tenant-scoped rate limiting
└───────┬────────┘
        ▼
┌────────────────┐
│   Turnstile    │  (public routes only)
└───────┬────────┘
        ▼
┌────────────────┐
│     Auth       │  JWT/Session validation
└───────┬────────┘
        ▼
┌────────────────┐
│    Tenant      │  Extract/validate tenant
└───────┬────────┘
        ▼
┌────────────────┐
│ Context Token  │  Sign context for services
└───────┬────────┘
        ▼
   Route Handler
```

## Routes

### Public Routes (no auth)
- `GET /health` - Health check
- `GET /api/health` - API health check
- `POST /api/public/signup` - User signup (Turnstile protected)
- `POST /api/public/contact` - Contact form (Turnstile protected)
- `GET /api/public/projects/:projectId/docs` - Read-only project documentation (no auth required)
- `GET /api/public/planning/runs` - List planning runs (no auth required)
- `GET /api/public/planning/runs/:id` - Get planning run detail (no auth required)
- `GET /api/public/projects` - List projects (no auth required)
- `GET /api/public/projects/:id` - Get project detail (no auth required)
- `GET /api/public/factory/templates` - List Cloudflare templates (no auth required)
- `GET /api/public/factory/capabilities` - List CF capabilities (no auth required)

### Authenticated Routes
- `GET /api/webhooks` - List webhook destinations
- `POST /api/webhooks` - Create webhook destination
- `PATCH /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/workflows/:name` - Dispatch workflow
- `GET /api/data/:table` - Query data table
- `POST /api/files/upload` - Upload file to R2
- `POST /api/images/transform` - Transform image
- `POST /api/analytics/event` - Record analytics event
- `GET /api/admin/audit-verify/:tenantId` - Verify audit chain

### Naomi API (Execution Task Tracking)
- `POST /api/naomi/tasks` - Create task (run_id, repo_url)
- `GET /api/naomi/tasks` - List tasks (?status, ?run_id)
- `GET /api/naomi/tasks/:id` - Task detail + logs
- `POST /api/naomi/tasks/:id/claim` - Orchestrator claims task
- `POST /api/naomi/tasks/:id/progress` - Report progress
- `POST /api/naomi/tasks/:id/logs` - Append log line

See [NAOMI_DEPLOYMENT.md](../../docs/NAOMI_DEPLOYMENT.md) for full details.

### Proxy Routes
- `/api/agents/*` → Agent service
- `/api/planning/*` → Planning Machine service

## Environment Bindings

```jsonc
{
  "d1_databases": [{ "binding": "DB", "database_id": "..." }],
  "r2_buckets": [{ "binding": "FILES", "bucket_name": "..." }],
  "kv_namespaces": [{ "binding": "KV", "id": "..." }],
  "services": [
    { "binding": "AGENT_SERVICE", "service": "foundation-agents" },
    { "binding": "PLANNING_SERVICE", "service": "planning-machine" }
  ],
  "queues": {
    "producers": [
      { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" },
      { "binding": "ANALYTICS_QUEUE", "queue": "foundation-analytics" },
      { "binding": "WEBHOOK_QUEUE", "queue": "foundation-webhooks" }
    ]
  },
  "analytics_engine_datasets": [
    { "binding": "ANALYTICS", "dataset": "foundation_analytics" }
  ]
}
```

## Local Development

```bash
# From project root
pnpm run dev

# Gateway runs at http://127.0.0.1:8788

# Test health
curl http://127.0.0.1:8788/health

# Test authenticated endpoint (need valid JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:8788/api/webhooks
```

## Migrations

D1 migrations are in `migrations/`:

```bash
# Apply migrations locally
pnpm wrangler d1 migrations apply foundation-db --local

# Apply to production
pnpm wrangler d1 migrations apply foundation-db --remote
```

## Adding Routes

```typescript
// In src/index.ts

// Public route (before auth middleware)
app.post("/api/public/my-route", turnstileMiddleware(), async (c) => {
  // Handle request
});

// Authenticated route (after auth middleware applies via /api/* pattern)
app.get("/api/my-resource", async (c) => {
  const tenantId = c.get("tenantId");
  // Handle request with tenant context
});
```

## Adding Middleware

1. Create `src/middleware/my-middleware.ts`
2. Import and apply in `src/index.ts`:
   ```typescript
   app.use("*", myMiddleware());  // Global
   app.use("/api/specific/*", myMiddleware());  // Route-specific
   ```

## Security Notes

- All `/api/*` routes require authentication **except** `/api/public/*` which are read-only
- Public read endpoints (`/api/public/*`) allow unauthenticated access for read-only data (project docs, planning runs, templates)
- Protected write endpoints remain at `/api/projects/*` (requires authentication)
- Turnstile protects public form submissions
- Context tokens are signed JWTs for service-to-service auth
- Audit chain provides tamper-evident logging
- Rate limiting is per-tenant using Durable Objects
