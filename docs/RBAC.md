# RBAC (Role-Based Access Control)

## Overview

The RBAC system provides fine-grained access control for operator actions in the Palantir AIP-inspired architecture. It implements a hierarchical role system with comprehensive audit logging.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     RBAC Components                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │   Roles      │   │  Permissions │   │    Audit     │   │
│  │              │   │              │   │              │   │
│  │ - operator   │──▶│ - decision:* │──▶│ - Log all    │   │
│  │ - supervisor │   │ - artifact:* │   │   actions    │   │
│  │ - admin      │   │ - user:*     │   │ - Track      │   │
│  │              │   │ - system:*   │   │   failures   │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Roles

### Role Hierarchy

```
admin
  └── supervisor
        └── operator
```

### Operator
**Description**: Reviews AI-generated decisions and artifacts

**Permissions**:
- `decision:view` - View decision details
- `decision:approve` - Approve AI decisions
- `decision:reject` - Reject AI decisions
- `decision:revise` - Request decision revisions
- `decision:escalate` - Escalate to supervisor
- `artifact:view` - View phase artifacts
- `quality:view` - View quality scores
- `run:view` - View planning run status
- `audit:view` - View audit logs

**Use Cases**:
- Daily decision review and approval
- Quality control of AI outputs
- Escalating complex decisions

### Supervisor
**Description**: Oversees operators, resolves escalations, manages quality

**Permissions**:
- All operator permissions, plus:
- `artifact:edit` - Edit artifacts
- `quality:edit` - Edit quality scores
- `quality:override` - Override automated quality assessments
- `run:pause` - Pause planning runs
- `run:resume` - Resume paused runs
- `run:cancel` - Cancel planning runs
- `audit:export` - Export audit reports
- `user:view` - View user information

**Use Cases**:
- Resolving escalated decisions
- Overriding quality scores when necessary
- Managing team performance
- Handling edge cases

### Admin
**Description**: Full system access, manages users and system configuration

**Permissions**:
- All supervisor permissions, plus:
- `artifact:delete` - Delete artifacts
- `run:create` - Create planning runs
- `user:create` - Create new users
- `user:edit` - Edit user information
- `user:delete` - Delete users
- `user:assign_role` - Assign roles to users
- `system:configure` - Configure system settings
- `system:monitor` - Monitor system health

**Use Cases**:
- User management
- System configuration
- High-level oversight
- Emergency interventions

## Permission System

### Permission Naming Convention

Permissions follow the pattern: `resource:action`

**Resources**:
- `decision` - AI-generated decisions
- `artifact` - Phase artifacts
- `quality` - Quality scores
- `run` - Planning runs
- `user` - User accounts
- `audit` - Audit logs
- `system` - System configuration

**Actions**:
- `view` - Read access
- `create` - Create new resources
- `edit` - Modify existing resources
- `delete` - Remove resources
- `approve` / `reject` / `revise` / `escalate` - Decision-specific actions
- `override` - Override automated assessments
- `configure` - Configure settings
- `monitor` - Monitor performance

### Permission Checking

```typescript
import { hasPermission, requirePermission } from '@/lib/rbac';

// Check permission (non-throwing)
const result = hasPermission(user, 'decision:approve');
if (!result.allowed) {
  console.error(result.reason);
}

// Require permission (throws PermissionError)
try {
  requirePermission(user, 'artifact:edit');
  // Proceed with action
} catch (error) {
  // Handle permission denied
}
```

### Action Context

For more complex permission checks including tenant isolation:

```typescript
import { canPerformAction } from '@/lib/rbac';

const context: ActionContext = {
  userId: user.id,
  tenantId: user.tenantId,
  action: 'decision:approve',
  resourceId: 'decision-001',
};

const result = canPerformAction(context, user);
```

## Operator Reviews

### Review Actions

1. **Approve** - Accept AI decision and proceed
2. **Reject** - Decline decision entirely
3. **Revise** - Request changes with specific instructions
4. **Escalate** - Forward to supervisor for review

### Creating a Review

```typescript
import { createOperatorReview } from '@/lib/operator-reviews';

const review = await createOperatorReview(db, auditContext, {
  decisionId: 'decision-001',
  operator: currentUser,
  action: 'approve',
  confidence: 85,
  feedback: 'Decision is well-reasoned and supported by evidence',
});
```

### Review Confidence Scores

- **0-39**: Very Low - Significant concerns
- **40-59**: Low - Multiple issues identified
- **60-74**: Medium - Some minor concerns
- **75-89**: High - Confident with minor reservations
- **90-100**: Very High - Fully confident

### Review Statistics

```typescript
import { getReviewStatistics } from '@/lib/operator-reviews';

const stats = await getReviewStatistics(db, 24); // Last 24 hours

console.log(stats);
// {
//   totalReviews: 150,
//   approvals: 120,
//   rejections: 10,
//   revisions: 15,
//   escalations: 5,
//   averageConfidence: 82.5,
//   reviewsByOperator: [...]
// }
```

## Escalations

### Escalation Priorities

- **urgent** - Requires immediate attention (SLA: 1 hour)
- **high** - Important but not critical (SLA: 4 hours)
- **medium** - Standard escalation (SLA: 24 hours)
- **low** - Low priority (SLA: 72 hours)

### Escalation Workflow

```
┌──────────────┐
│   Operator   │
│  Escalates   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Pending    │◀─── Supervisor not yet assigned
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  In Review   │◀─── Supervisor assigned and reviewing
└──────┬───────┘
       │
       ├──────▶ ┌──────────────┐
       │        │   Resolved   │◀─── Supervisor provides resolution
       │        └──────────────┘
       │
       └──────▶ ┌──────────────┐
                │   Rejected   │◀─── Supervisor rejects escalation
                └──────────────┘
```

### Creating an Escalation

```typescript
import { createEscalation } from '@/lib/escalations';

const escalation = await createEscalation(db, {
  decisionId: 'decision-001',
  fromOperator: operatorUser,
  toSupervisorId: 'supervisor-001', // Optional
  reason: 'Complex decision with conflicting evidence requires expert review',
  priority: 'high',
});
```

### Resolving an Escalation

```typescript
import { resolveEscalation } from '@/lib/escalations';

await resolveEscalation(
  db,
  escalationId,
  'Reviewed evidence and confirmed decision is sound. Approved with minor modifications.'
);
```

## Audit Logging

### Automatic Logging

All operator actions are automatically logged with:
- User ID and tenant ID
- Action type and resource
- Timestamp and IP address
- Success/failure status
- Metadata (confidence, feedback, etc.)

### Log Entry Structure

```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}
```

### Querying Audit Logs

```typescript
import { queryAuditLogs } from '@/lib/audit-logger';

// Get recent logs for a user
const userLogs = await queryAuditLogs(db, {
  userId: 'user-001',
  startTime: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
  limit: 100,
});

// Get logs for a specific decision
const decisionLogs = await queryAuditLogs(db, {
  resourceType: 'decision',
  resourceId: 'decision-001',
});

// Get failed actions
const failedLogs = await queryAuditLogs(db, {
  tenantId: 'tenant-001',
  success: false,
  limit: 50,
});
```

### Audit Statistics

```typescript
import { getAuditStatistics } from '@/lib/audit-logger';

const stats = await getAuditStatistics(db, 'tenant-001', 24);

console.log(stats);
// {
//   totalActions: 500,
//   successfulActions: 485,
//   failedActions: 15,
//   actionsByType: {
//     approve: 250,
//     reject: 50,
//     revise: 100,
//     escalate: 25,
//     ...
//   },
//   topUsers: [
//     { userId: 'user-001', count: 150 },
//     { userId: 'user-002', count: 100 },
//     ...
//   ]
// }
```

## Database Schema

### Tables

#### `users` (updated)
```sql
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'operator';
```

#### `operator_reviews`
```sql
CREATE TABLE operator_reviews (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  action TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  feedback TEXT,
  revision_instructions TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `escalations`
```sql
CREATE TABLE escalations (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  from_operator_id TEXT NOT NULL,
  to_supervisor_id TEXT,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolution TEXT,
  FOREIGN KEY (from_operator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### `operator_audit_log`
```sql
CREATE TABLE operator_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp INTEGER NOT NULL,
  success INTEGER NOT NULL,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Integration

### Middleware Example

```typescript
import { requirePermission } from '@/lib/rbac';

app.post('/api/decisions/:id/approve', async (c) => {
  const user = c.get('user'); // From auth middleware

  // Check permission
  requirePermission(user, 'decision:approve');

  // Proceed with approval
  // ...
});
```

### Role-Based Routes

```typescript
import { requireRoleLevel } from '@/lib/rbac';

app.get('/api/admin/users', async (c) => {
  const user = c.get('user');

  // Require admin or supervisor
  requireRoleLevel(user.role, 'supervisor');

  // Return users
  // ...
});
```

## Security Considerations

### Tenant Isolation
All permission checks enforce tenant isolation. Users can only access resources within their own tenant.

### Audit Trail
All actions are logged for compliance and debugging. Audit logs cannot be modified or deleted.

### Role Assignment
Only admins can assign roles. Role changes are logged in the audit trail.

### Permission Escalation
Permission checks use a whitelist approach. Unknown permissions are denied by default.

## Best Practices

### 1. Always Check Permissions
Never assume a user has permission. Always check before performing sensitive actions.

### 2. Use Meaningful Confidence Scores
Confidence scores should reflect genuine uncertainty, not just a number to pass validation.

### 3. Provide Clear Feedback
When rejecting or requesting revisions, provide specific, actionable feedback.

### 4. Escalate Appropriately
Reserve escalations for truly complex or uncertain decisions. Don't over-escalate.

### 5. Review Audit Logs
Regularly review audit logs to identify patterns and potential issues.

## Monitoring & Metrics

### Key Metrics

- **Review Velocity**: Reviews per hour/day
- **Approval Rate**: % of decisions approved
- **Escalation Rate**: % of decisions escalated
- **Average Confidence**: Mean confidence score
- **Resolution Time**: Time from escalation to resolution

### Dashboard Queries

```typescript
// Review velocity
SELECT COUNT(*) / 24.0 as reviews_per_hour
FROM operator_reviews
WHERE created_at >= unixepoch('now', '-24 hours');

// Approval rate
SELECT
  (SUM(CASE WHEN action = 'approve' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as approval_rate
FROM operator_reviews;

// Escalation rate
SELECT
  (SUM(CASE WHEN action = 'escalate' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as escalation_rate
FROM operator_reviews;
```

## Testing

Run RBAC tests:
```bash
cd services/planning-machine
npm test -- rbac.test.ts
```

Expected output:
```
✓ src/lib/__tests__/rbac.test.ts (34 tests) 12ms

Test Files  1 passed (1)
Tests  34 passed (34)
```

## Migration

To apply RBAC migration:
```bash
wrangler d1 execute foundation-primary --local --file=packages/db/migrations/0004_rbac_operator_actions.sql
```

## References

- [Ontology Documentation](./ONTOLOGY.md)
- [API Documentation](./API.md)
- [Quality Scoring](./QUALITY_SCORING.md)
- [Palantir AIP Gap Analysis](./PALANTIR_AIP_INSPIRED_GAP_ANALYSIS.md)
