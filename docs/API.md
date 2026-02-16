# API Reference

Complete API documentation for Cloudflare Foundation v2.5.

## Base URLs

- **Development:** `http://127.0.0.1:8788` (gateway), `http://127.0.0.1:8787` (planning-machine)
- **Production:** Your deployed worker URL

## Authentication

All `/api/*` routes (except public routes) require authentication via:
- Bearer token in `Authorization` header
- Session cookie

## Planning Machine API

### Runs

#### List Runs
```http
GET /api/planning/runs
```

Query Parameters:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 100 | Max items to return |
| offset | number | 0 | Pagination offset |
| status | string | - | Filter by status (running/completed/killed) |

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "idea": "Original idea text",
      "refined_idea": "Refined opportunity",
      "status": "running|completed|killed",
      "current_phase": "opportunity|customer-intel|...",
      "mode": "local|cloud",
      "pivot_count": 0,
      "kill_verdict": null,
      "package_key": null,
      "created_at": 1700000000,
      "updated_at": 1700000000
    }
  ]
}
```

#### Create Run
```http
POST /api/planning/runs
```

Request Body:
```json
{
  "idea": "Your business idea",
  "mode": "local|cloud",
  "requireReview": false
}
```

Response:
```json
{
  "id": "uuid",
  "status": "running",
  "mode": "local",
  "created_at": 1700000000
}
```

#### Get Run
```http
GET /api/planning/runs/:id
```

Response: Full run object with all fields.

#### Get Run Phases
```http
GET /api/planning/runs/:id/phases
```

Response:
```json
{
  "items": [
    {
      "phase": "opportunity",
      "status": "completed",
      "version": 1,
      "review_verdict": "ACCEPT",
      "overall_score": 4.2,
      "created_at": 1700000000
    }
  ]
}
```

#### Cancel Run
```http
POST /api/planning/runs/:id/cancel
```

Response:
```json
{
  "cancelled": true,
  "id": "uuid"
}
```

#### Delete Run
```http
DELETE /api/planning/runs/:id
```

Response:
```json
{
  "deleted": true,
  "id": "uuid"
}
```

### Artifacts

#### List Artifacts
```http
GET /api/planning/runs/:id/artifacts
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| phase | string | Filter by phase name |

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "phase": "opportunity",
      "version": 1,
      "content": { /* phase output */ },
      "review_verdict": "ACCEPT",
      "review_iterations": 1,
      "overall_score": 4.5,
      "created_at": 1700000000
    }
  ]
}
```

#### Get Artifact
```http
GET /api/planning/runs/:runId/artifacts/:artifactId
```

#### Sync Artifact (Local Mode)
```http
POST /api/planning/runs/:id/artifacts/sync
```

Request Body:
```json
{
  "phase": "opportunity",
  "content": { /* artifact content */ },
  "review_verdict": "ACCEPT",
  "review_iterations": 1,
  "overall_score": 4.5
}
```

### Parked Ideas

#### List Parked Ideas
```http
GET /api/planning/parked-ideas
```

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "idea": "Original idea",
      "refined_idea": "Refined version",
      "run_id": "uuid",
      "source_phase": "kill-test",
      "reason": "Market timing not right",
      "revisit_estimate_months": 6,
      "created_at": 1700000000
    }
  ]
}
```

#### Promote Parked Idea
```http
POST /api/planning/parked-ideas/:id/promote
```

Response:
```json
{
  "run": {
    "id": "new-uuid",
    "status": "running"
  },
  "parkedIdeaId": "uuid"
}
```

---

## Gateway API

### Health

```http
GET /health
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1700000000
}
```

### Public Routes (No Auth Required)

#### Signup
```http
POST /api/public/signup
```
Requires Turnstile token.

#### Contact
```http
POST /api/public/contact
```
Requires Turnstile token.

### Webhooks

#### List Webhooks
```http
GET /api/webhooks
```

Response:
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
      "created_at": 1700000000,
      "updated_at": 1700000000
    }
  ]
}
```

#### Create Webhook
```http
POST /api/webhooks
```

Request Body:
```json
{
  "name": "Production Webhook",
  "url": "https://example.com/webhook",
  "secret": "optional-hmac-secret",
  "events": "*"
}
```

Events format: `*` for all events, or comma-separated list like `run_started,run_completed,phase_completed`.

#### Update Webhook
```http
PATCH /api/webhooks/:id
```

Request Body:
```json
{
  "active": false,
  "name": "New Name",
  "events": "run_completed,run_killed"
}
```

#### Delete Webhook
```http
DELETE /api/webhooks/:id
```

### Workflows

#### Dispatch Workflow
```http
POST /api/workflows/:workflowName
```

Available workflows: `onboarding`, `data-pipeline`, `report`, `email-sequence`

### Data

#### Query Table
```http
GET /api/data/:table
```

Available tables: `users`, `audit_log`

### Files

#### Upload File
```http
POST /api/files/upload
Content-Type: multipart/form-data
```

Form field: `file`

### Images

#### Transform Image
```http
POST /api/images/transform
Content-Type: multipart/form-data
```

Form field: `file`

Returns transformed WebP image (256x256).

### Analytics

#### Record Event
```http
POST /api/analytics/event
```

Request Body:
```json
{
  "type": "event_type",
  "tenantId": "optional",
  "metadata": "optional string",
  "value": 0
}
```

### Admin

#### Verify Audit Chain
```http
GET /api/admin/audit-verify/:tenantId
```

Response:
```json
{
  "tenantId": "uuid",
  "chainValid": true
}
```

### Agents

#### Agent Proxy
```http
ANY /api/agents/:agentType/:agentId/*
```

Proxies requests to the agent service.

### Planning Proxy
```http
ANY /api/planning/*
```

Proxies requests to the planning-machine service.

---

## Webhook Events

When webhooks are configured, the following events are emitted:

| Event | Description | Payload |
|-------|-------------|---------|
| `run_started` | A new planning run has started | `{ runId, status, timestamp }` |
| `run_completed` | A planning run completed successfully | `{ runId, status, timestamp }` |
| `run_killed` | A planning run was killed | `{ runId, phase, status, verdict, timestamp }` |
| `phase_completed` | A phase in the pipeline completed | `{ runId, phase, status, score?, timestamp }` |
| `pivot_triggered` | A PIVOT was triggered in kill-test | `{ runId, phase, status, verdict, pivotCount, timestamp }` |

### Webhook Security

If a secret is configured, webhooks include an HMAC signature:

```
X-Webhook-Signature: sha256=<hex-signature>
X-Webhook-Event: <event-type>
X-Webhook-Timestamp: <unix-timestamp>
```

Verify by computing `HMAC-SHA256(secret, JSON.stringify(payload))` and comparing.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- `400` - Bad request / validation error
- `401` - Unauthorized
- `404` - Resource not found
- `500` - Internal server error
- `503` - Service unavailable
