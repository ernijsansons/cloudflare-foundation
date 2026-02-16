# Database Schema Documentation

## Overview

The Foundation uses Cloudflare D1 (SQLite) for persistent storage. All timestamps are stored as Unix timestamps in seconds.

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

### audit_chain

Immutable audit log with cryptographic hash chain.

```sql
CREATE TABLE audit_chain (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_tenant ON audit_chain(tenant_id);
CREATE INDEX idx_audit_type ON audit_chain(event_type);
```

**Hash Chain Algorithm:**
```
data = previous_hash + ":" + event_type + ":" + payload_json + ":" + timestamp
hash = SHA-256(data)
```

### webhook_destinations

Configured webhook endpoints.

```sql
CREATE TABLE webhook_destinations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  hostname TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  events TEXT NOT NULL DEFAULT '*',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_webhook_tenant ON webhook_destinations(tenant_id);
CREATE INDEX idx_webhook_active ON webhook_destinations(active);
```

### notifications

User notifications queue.

```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  metadata TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### planning_runs

Planning workflow runs (planning-machine service).

```sql
CREATE TABLE planning_runs (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  current_phase TEXT,
  quality_score REAL,
  revenue_potential REAL,
  workflow_instance_id TEXT,
  kill_verdict TEXT,
  pivot_count INTEGER DEFAULT 0,
  package_key TEXT,
  mode TEXT DEFAULT 'cloud',
  config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_runs_status ON planning_runs(status);
CREATE INDEX idx_runs_created ON planning_runs(created_at);
```

**Status Values:**
- `running` - Workflow in progress
- `paused` - Waiting for approval
- `completed` - Successfully finished
- `killed` - Failed kill test
- `cancelled` - User cancelled
- `deleted` - Soft deleted

### planning_artifacts

Phase output artifacts.

```sql
CREATE TABLE planning_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  review_verdict TEXT,
  overall_score REAL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE INDEX idx_artifacts_run ON planning_artifacts(run_id);
CREATE INDEX idx_artifacts_phase ON planning_artifacts(run_id, phase);
```

### planning_parked_ideas

Ideas parked for future consideration.

```sql
CREATE TABLE planning_parked_ideas (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  run_id TEXT,
  source_phase TEXT,
  reason TEXT,
  artifact_summary TEXT,
  revisit_estimate_months INTEGER,
  revisit_estimate_note TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_parked_source ON planning_parked_ideas(source_phase);
```

## Migrations

Migrations are stored in `migrations/` directory:

```
migrations/
  0000_initial.sql
  0001_webhook_destinations.sql
  0002_notifications.sql
```

### Running Migrations

```bash
# Local development
wrangler d1 migrations apply DB --local

# Production
wrangler d1 migrations apply DB --remote
```

### Creating New Migrations

```bash
wrangler d1 migrations create DB "description_of_change"
```

## Data Retention

The cron service runs a daily cleanup job that removes:

1. **Audit chain entries** older than 90 days
2. **Read notifications** older than 90 days
3. **Deleted planning runs** older than 90 days

Retention period is configurable via `DATA_RETENTION_SECONDS` constant.

## Query Patterns

### Parameterized Queries

Always use parameterized queries:

```typescript
// Correct
const result = await db
  .prepare("SELECT * FROM users WHERE tenant_id = ? AND id = ?")
  .bind(tenantId, userId)
  .first();

// NEVER do this
const result = await db
  .prepare(`SELECT * FROM users WHERE id = '${userId}'`)
  .first();
```

### Pagination

```typescript
const limit = 50;
const offset = (page - 1) * limit;

const [items, count] = await Promise.all([
  db.prepare("SELECT * FROM users LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all(),
  db.prepare("SELECT COUNT(*) as total FROM users")
    .first()
]);
```

### Batch Operations

```typescript
const batch = db.batch([
  db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(id1, email1),
  db.prepare("INSERT INTO users (id, email) VALUES (?, ?)").bind(id2, email2),
]);

await batch;
```

## Indexes

Key indexes for query performance:

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| users | idx_users_tenant | tenant_id | Tenant isolation |
| audit_chain | idx_audit_tenant | tenant_id | Audit lookup |
| webhook_destinations | idx_webhook_active | active | Active webhook filtering |
| planning_runs | idx_runs_status | status | Status filtering |
| planning_runs | idx_runs_created | created_at | Recent runs listing |

## Backup & Recovery

D1 provides automatic point-in-time recovery. For manual backups:

```bash
# Export database
wrangler d1 export DB --output backup.sql

# Import database
wrangler d1 execute DB --file backup.sql
```
