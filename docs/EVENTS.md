# Events Documentation

## Overview

The Foundation uses an event-driven architecture with queues for asynchronous processing and webhooks for external notifications.

## Queue Events

### Audit Queue (`foundation-audit`)

Records events in the immutable audit chain.

```typescript
interface AuditEvent {
  type: string;        // Event type (e.g., "user_created", "workflow_started")
  tenantId: string;    // Tenant identifier
  payload: unknown;    // Event-specific data
}
```

**Example:**
```json
{
  "type": "workflow_dispatched",
  "tenantId": "tenant-123",
  "payload": {
    "workflowName": "onboarding",
    "instanceId": "workflow-uuid"
  }
}
```

### Notification Queue (`foundation-notifications`)

Sends notifications to users.

```typescript
interface NotificationEvent {
  type: string;                       // Notification type
  tenantId: string;                   // Target tenant
  title?: string;                     // Notification title
  message?: string;                   // Notification body
  metadata?: Record<string, unknown>; // Additional data
}
```

**Example:**
```json
{
  "type": "run_completed",
  "tenantId": "tenant-123",
  "title": "Planning Run Complete",
  "message": "Your planning run has finished successfully.",
  "metadata": {
    "runId": "run-uuid",
    "score": 85
  }
}
```

### Analytics Queue (`foundation-analytics`)

Records analytics events to Analytics Engine.

```typescript
interface AnalyticsEvent {
  event: string;                      // Event name
  tenantId?: string;                  // Optional tenant
  metadata?: Record<string, unknown>; // Event properties
  value?: number;                     // Numeric value
}
```

**Example:**
```json
{
  "event": "page_view",
  "tenantId": "tenant-123",
  "metadata": {
    "page": "/dashboard",
    "referrer": "https://google.com"
  }
}
```

### Webhook Queue (`foundation-webhooks`)

Delivers events to external webhook endpoints.

```typescript
interface WebhookEvent {
  type: string;           // Event type
  runId: string;          // Associated run ID
  phase?: string;         // Current phase (if applicable)
  status?: string;        // Run status
  verdict?: string;       // Kill test verdict (if applicable)
  score?: number | null;  // Quality score (if applicable)
  pivotCount?: number;    // Number of pivots
  timestamp: number;      // Unix timestamp
}
```

## Webhook Event Types

### run_started

Emitted when a new planning run begins.

```json
{
  "type": "run_started",
  "runId": "run-uuid",
  "status": "running",
  "timestamp": 1705312200
}
```

### phase_completed

Emitted when a planning phase completes.

```json
{
  "type": "phase_completed",
  "runId": "run-uuid",
  "phase": "opportunity",
  "status": "running",
  "timestamp": 1705312300
}
```

### run_completed

Emitted when a planning run finishes successfully.

```json
{
  "type": "run_completed",
  "runId": "run-uuid",
  "status": "completed",
  "score": 85,
  "timestamp": 1705313000
}
```

### run_killed

Emitted when a run fails the kill test.

```json
{
  "type": "run_killed",
  "runId": "run-uuid",
  "status": "killed",
  "verdict": "reject",
  "pivotCount": 2,
  "timestamp": 1705312500
}
```

### run_cancelled

Emitted when a user cancels a run.

```json
{
  "type": "run_cancelled",
  "runId": "run-uuid",
  "status": "cancelled",
  "timestamp": 1705312400
}
```

### idea_promoted

Emitted when a parked idea is promoted to a new run.

```json
{
  "type": "idea_promoted",
  "runId": "new-run-uuid",
  "status": "running",
  "timestamp": 1705312600
}
```

## Webhook Delivery

### Request Format

```http
POST /your-webhook-endpoint HTTP/1.1
Content-Type: application/json
X-Webhook-Event: run_completed
X-Webhook-Timestamp: 1705313000
X-Webhook-Signature: sha256=abc123...

{
  "type": "run_completed",
  "runId": "run-uuid",
  "status": "completed",
  "score": 85,
  "timestamp": 1705313000
}
```

### Verifying Signatures

If you configured a webhook secret, verify the HMAC signature:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expected}` === signature;
}

// In your webhook handler:
const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);

if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Event Filtering

Configure which events to receive when creating a webhook:

```json
{
  "url": "https://example.com/webhook",
  "events": "run_completed,run_killed"
}
```

Use `"*"` to receive all events.

## Analytics Engine Schema

Analytics events are written to Cloudflare Analytics Engine:

| Field | Type | Description |
|-------|------|-------------|
| `indexes[0]` | string | Tenant ID or event name |
| `indexes[1]` | string | Event type (optional) |
| `blobs[0]` | string | JSON payload |
| `doubles[0]` | number | Timestamp or value |

### Querying Analytics

Use the Analytics Engine SQL API:

```sql
SELECT
  index1 as tenant_id,
  blob1 as event_data,
  double1 as timestamp
FROM foundation_analytics
WHERE timestamp > now() - INTERVAL '7' DAY
ORDER BY timestamp DESC
LIMIT 100
```

## Audit Chain Events

Standard audit event types:

| Type | Description |
|------|-------------|
| `user_created` | New user registration |
| `user_updated` | User profile update |
| `user_deleted` | User account deletion |
| `workflow_dispatched` | Workflow started |
| `workflow_completed` | Workflow finished |
| `file_uploaded` | File upload completed |
| `webhook_created` | Webhook endpoint added |
| `webhook_deleted` | Webhook endpoint removed |
| `settings_changed` | Configuration update |

### Audit Event Structure

```typescript
interface AuditChainEntry {
  seq: number;           // Sequence number (auto-increment)
  tenant_id: string;     // Tenant identifier
  event_type: string;    // Event type
  payload: string;       // JSON-encoded payload
  previous_hash: string; // Hash of previous entry
  hash: string;          // SHA-256 hash of this entry
  created_at: number;    // Unix timestamp (seconds)
}
```

### Verifying Chain Integrity

```typescript
async function verifyAuditChain(
  db: D1Database,
  tenantId: string
): Promise<boolean> {
  const events = await db
    .prepare("SELECT * FROM audit_chain WHERE tenant_id = ? ORDER BY seq ASC")
    .bind(tenantId)
    .all();

  for (let i = 0; i < events.results.length; i++) {
    const event = events.results[i];
    const prevHash = i === 0 ? "0".repeat(64) : events.results[i - 1].hash;

    const data = `${prevHash}:${event.event_type}:${event.payload}:${event.created_at}`;
    const expectedHash = await sha256(data);

    if (event.previous_hash !== prevHash || event.hash !== expectedHash) {
      return false; // Chain broken
    }
  }

  return true;
}
```
