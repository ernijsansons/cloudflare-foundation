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
