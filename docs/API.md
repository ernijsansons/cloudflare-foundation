# Foundation API Reference

## Base URL

All API endpoints are served from the gateway service.

- Local: `http://localhost:8787`
- Production: `https://api.your-domain.com`

## Authentication

Most endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Public endpoints (prefixed with `/api/public/`) require Turnstile verification instead.

## Health Endpoints

### GET /health

Deep health check for the gateway service.

**Response:**
```json
{
  "status": "ok" | "degraded",
  "service": "foundation-gateway",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "db": true,
    "kv": true,
    "r2": true
  }
}
```

**Status Codes:**
- `200` - All checks passed
- `503` - One or more checks failed (degraded)

---

## Public Endpoints

### POST /api/public/signup

Create a new user account.

**Headers:**
- `CF-Turnstile-Token`: Cloudflare Turnstile verification token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "created": true
}
```

### POST /api/public/contact

Submit a contact form.

**Headers:**
- `CF-Turnstile-Token`: Cloudflare Turnstile verification token

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello..."
}
```

### GET /api/public/factory/templates

List all available Cloudflare project templates.

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "api", "frontend")
- `framework` (optional): Filter by framework (e.g., "hono", "react")
- `maxComplexity` (optional): Maximum complexity score (1-5)
- `includeDeprecated` (optional): Include deprecated templates (default: false)
- `tenant_id` (optional): Tenant identifier for audit logging

**Response:**
```json
{
  "items": [
    {
      "id": "1",
      "slug": "cloudflare-workers-api",
      "name": "Cloudflare Workers API",
      "description": "Simple API template",
      "category": "api",
      "framework": "hono",
      "source": "cloudflare",
      "complexity": 2,
      "estimatedCostLow": 0,
      "estimatedCostMid": 5,
      "estimatedCostHigh": 20,
      "bindings": ["d1_databases"],
      "tags": ["api", "rest"],
      "deprecated": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 32
}
```

### GET /api/public/factory/templates/:slug

Get details for a specific template.

**Path Parameters:**
- `slug`: Template slug identifier

**Response:**
```json
{
  "id": "1",
  "slug": "cloudflare-workers-api",
  "name": "Cloudflare Workers API",
  "description": "Simple API template",
  "category": "api",
  "framework": "hono",
  "source": "cloudflare",
  "complexity": 2,
  "estimatedCostLow": 0,
  "estimatedCostMid": 5,
  "estimatedCostHigh": 20,
  "bindings": ["d1_databases"],
  "tags": ["api", "rest"],
  "deprecated": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200` - Template found
- `404` - Template not found

### GET /api/public/factory/capabilities

List all available Cloudflare platform capabilities.

**Response:**
```json
{
  "items": [
    {
      "id": "1",
      "slug": "d1",
      "name": "D1 Database",
      "description": "SQLite database",
      "bindingType": "d1_databases",
      "hasFreeQuota": true,
      "freeQuota": "5M reads/day, 5GB storage",
      "paidPricing": "$0.75/M reads",
      "bestFor": ["structured-data", "relational"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 15
}
```

### GET /api/public/factory/capabilities/free

List only capabilities with free tier quotas.

**Response:** Same as `/factory/capabilities` but filtered for free tier only.

### GET /api/public/factory/build-specs

List architecture build specifications from planning runs.

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status ("draft", "approved", "rejected", "fallback")
- `tenant_id` (optional): Tenant identifier for audit logging

**Response:**
```json
{
  "buildSpecs": [
    {
      "id": "spec-1",
      "runId": "run-123",
      "recommended": {
        "slug": "cloudflare-workers-api",
        "name": "Cloudflare Workers API",
        "score": 95,
        "reasoning": "Best fit for API project",
        "bindings": [],
        "estimatedCost": { "bootstrap": 0, "growth": 5, "scale": 20 },
        "motionTier": "none",
        "complexity": 2,
        "tradeoffs": []
      },
      "alternatives": [],
      "dataModel": { "tables": [], "indexes": [], "migrations": [] },
      "apiRoutes": [],
      "frontend": null,
      "agents": [],
      "freeWins": [],
      "growthPath": null,
      "scaffoldCommand": "npm create cloudflare@latest",
      "totalEstimatedMonthlyCost": { "bootstrap": 0, "growth": 5, "scale": 20 },
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

### GET /api/public/factory/build-specs/:runId

Get architecture build specification for a specific planning run.

**Path Parameters:**
- `runId`: Planning run identifier

**Response:** Single BuildSpec object (same structure as array item above)

**Status Codes:**
- `200` - Build spec found
- `404` - Build spec not found for this run

---

## Data Endpoints

### GET /api/data/:table

Retrieve data from an allowed table.

**Allowed Tables:** `users`, `audit_log`

**Response:**
```json
[
  { "id": "...", "tenant_id": "...", ... }
]
```

---

## File Uploads

### POST /api/files/upload

Upload a file to R2 storage.

**Request:** `multipart/form-data` with `file` field

**Constraints:**
- Max file size: 10MB
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`, `text/csv`, `application/json`

**Response:**
```json
{
  "key": "tenants/{tenantId}/uploads/{timestamp}-{filename}",
  "size": 1024
}
```

**Error Responses:**
- `400` - No file provided
- `413` - File too large
- `415` - File type not allowed

### POST /api/images/transform

Transform an image (resize, format conversion).

**Request:** `multipart/form-data` with `file` field

**Response:** Transformed image as `image/webp`

---

## Workflow Endpoints

### POST /api/workflows/:workflowName

Start a workflow instance.

**Available Workflows:**
- `onboarding` - Tenant onboarding flow
- `data-pipeline` - Data processing pipeline
- `report` - Report generation
- `email-sequence` - Email sequence automation

**Request Body:**
```json
{
  "param1": "value1",
  "param2": "value2"
}
```

**Response:**
```json
{
  "instanceId": "workflow-instance-uuid",
  "status": "started"
}
```

---

## Agent Endpoints

### ALL /api/agents/:agentType/:agentId/*

Proxy requests to agent Durable Objects.

**Agent Types:**
- `chat` - Chat agent
- `task` - Task agent
- `tenant` - Tenant agent
- `session` - Session agent

---

## Webhook Management

### GET /api/webhooks

List webhook destinations for the current tenant.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "My Webhook",
      "hostname": "example.com",
      "url": "https://example.com/webhook",
      "active": 1,
      "events": "*",
      "created_at": 1705312200
    }
  ]
}
```

### POST /api/webhooks

Create a new webhook destination.

**Request Body:**
```json
{
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "secret": "optional-hmac-secret-min-16-chars",
  "events": "run_completed,phase_completed"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Webhook",
  "hostname": "example.com",
  "url": "https://example.com/webhook",
  "active": 1,
  "events": "run_completed,phase_completed",
  "created_at": 1705312200
}
```

### DELETE /api/webhooks/:id

Delete a webhook destination.

**Response:**
```json
{
  "deleted": true
}
```

### PATCH /api/webhooks/:id

Update a webhook destination.

**Request Body:**
```json
{
  "active": false,
  "name": "Updated Name",
  "events": "*"
}
```

---

## Analytics

### POST /api/analytics/event

Record an analytics event.

**Request Body:**
```json
{
  "type": "page_view",
  "tenantId": "tenant-123",
  "metadata": "additional-info",
  "value": 1
}
```

**Response:**
```json
{
  "recorded": true
}
```

---

## Naomi API (Execution Task Tracking)

For Naomi OpenClaw orchestration. All endpoints require authentication. Tenant isolation applied.

### POST /api/naomi/tasks

Create a new execution task.

**Request Body:**
```json
{
  "run_id": "run_xxx",
  "repo_url": "https://github.com/org/repo",
  "agent": "claude"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| run_id | string | yes | Planning run ID |
| repo_url | string | yes | Repository URL (must be valid) |
| agent | string | no | Agent to use (default: claude) |

**Response:**
```json
{
  "id": "naomi_xxx",
  "run_id": "run_xxx",
  "repo_url": "https://github.com/org/repo",
  "status": "pending",
  "created_at": 1234567890
}
```

Emits `task_assigned` webhook event.

### GET /api/naomi/tasks

List tasks. Filter by tenant.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: pending, running, completed, failed |
| run_id | string | Filter by planning run |
| limit | number | Max results (default 50, max 100) |

**Response:**
```json
{
  "items": [
    {
      "id": "naomi_xxx",
      "run_id": "run_xxx",
      "repo_url": "https://...",
      "agent": "claude",
      "status": "running",
      "phase": "implement",
      "created_at": 1234567890
    }
  ]
}
```

### GET /api/naomi/tasks/:id

Get task detail with execution logs.

**Response:**
```json
{
  "id": "naomi_xxx",
  "run_id": "run_xxx",
  "repo_url": "https://...",
  "status": "running",
  "phase": "implement",
  "claimed_at": 1234567890,
  "logs": [
    {
      "id": 1,
      "phase": "spec",
      "level": "info",
      "message": "Scaffolding complete",
      "created_at": 1234567890
    }
  ]
}
```

### POST /api/naomi/tasks/:id/claim

Orchestrator claims a pending task. Acquires repo lock.

**Request Body:**
```json
{
  "vm_id": "vm-001"
}
```

**Response:**
```json
{
  "id": "naomi_xxx",
  "status": "running",
  "run_id": "run_xxx",
  "repo_url": "https://...",
  "claimed_at": 1234567890
}
```

**Status Codes:**
- `409` - Task not pending, or repo locked by another task

### POST /api/naomi/tasks/:id/progress

Report task progress.

**Request Body:**
```json
{
  "phase": "implement",
  "status": "running",
  "error": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| phase | string | Current phase |
| status | string | running, review, completed, failed |
| error | string | Error message if failed |

### POST /api/naomi/tasks/:id/logs

Append execution log line.

**Request Body:**
```json
{
  "message": "Running tests...",
  "phase": "test",
  "level": "info"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | yes | Log message |
| phase | string | no | Phase context |
| level | string | no | info, warn, error (default: info) |

---

## Admin Endpoints

### GET /api/admin/audit-verify/:tenantId

Verify the integrity of the audit chain for a tenant.

**Response:**
```json
{
  "tenantId": "tenant-123",
  "chainValid": true
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Optional additional details"
}
```

**Common Status Codes:**
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `413` - Payload too large
- `415` - Unsupported media type
- `429` - Rate limited
- `500` - Internal server error
- `503` - Service unavailable
