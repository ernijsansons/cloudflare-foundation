/**
 * Audit Logger - Tracks all operator actions
 *
 * Provides comprehensive audit trail for compliance and debugging
 */

import type {
  AuditLogEntry,
  AuditAction,
  ResourceType,
  UserWithRole,
} from '@foundation/shared';

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditContext {
  db: D1Database;
  user: UserWithRole;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditActionDetails {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Log an operator action to the audit trail
 *
 * @param context Audit context with database and user info
 * @param details Action details
 * @returns Audit log entry ID
 */
export async function logAuditAction(
  context: AuditContext,
  details: AuditActionDetails
): Promise<string> {
  const id = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  const entry: Omit<AuditLogEntry, 'timestamp'> & { timestamp: number } = {
    id,
    userId: context.user.id,
    tenantId: context.user.tenantId,
    action: details.action,
    resourceType: details.resourceType,
    resourceId: details.resourceId,
    metadata: details.metadata || {},
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    timestamp,
    success: details.success !== false,
    errorMessage: details.errorMessage,
  };

  await context.db
    .prepare(
      `INSERT INTO operator_audit_log (
        id, user_id, tenant_id, action, resource_type, resource_id,
        metadata, ip_address, user_agent, timestamp, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      entry.id,
      entry.userId,
      entry.tenantId,
      entry.action,
      entry.resourceType,
      entry.resourceId,
      JSON.stringify(entry.metadata),
      entry.ipAddress,
      entry.userAgent,
      entry.timestamp,
      entry.success ? 1 : 0,
      entry.errorMessage
    )
    .run();

  return id;
}

/**
 * Log decision approval
 */
export async function logDecisionApproval(
  context: AuditContext,
  decisionId: string,
  confidence: number,
  feedback?: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'approve',
    resourceType: 'decision',
    resourceId: decisionId,
    metadata: { confidence, feedback },
    success: true,
  });
}

/**
 * Log decision rejection
 */
export async function logDecisionRejection(
  context: AuditContext,
  decisionId: string,
  reason: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'reject',
    resourceType: 'decision',
    resourceId: decisionId,
    metadata: { reason },
    success: true,
  });
}

/**
 * Log decision revision request
 */
export async function logDecisionRevision(
  context: AuditContext,
  decisionId: string,
  instructions: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'revise',
    resourceType: 'decision',
    resourceId: decisionId,
    metadata: { instructions },
    success: true,
  });
}

/**
 * Log decision escalation
 */
export async function logDecisionEscalation(
  context: AuditContext,
  decisionId: string,
  reason: string,
  priority: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'escalate',
    resourceType: 'decision',
    resourceId: decisionId,
    metadata: { reason, priority },
    success: true,
  });
}

/**
 * Log quality score override
 */
export async function logQualityScoreOverride(
  context: AuditContext,
  artifactId: string,
  oldScore: number,
  newScore: number,
  reason: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'override',
    resourceType: 'artifact',
    resourceId: artifactId,
    metadata: { oldScore, newScore, reason },
    success: true,
  });
}

/**
 * Log run cancellation
 */
export async function logRunCancellation(
  context: AuditContext,
  runId: string,
  reason: string
): Promise<string> {
  return logAuditAction(context, {
    action: 'delete',
    resourceType: 'run',
    resourceId: runId,
    metadata: { reason },
    success: true,
  });
}

// ============================================================================
// AUDIT QUERIES
// ============================================================================

export interface AuditLogFilters {
  userId?: string;
  tenantId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  startTime?: number;
  endTime?: number;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Query audit logs with filters
 *
 * @param db Database connection
 * @param filters Query filters
 * @returns Array of audit log entries
 */
export async function queryAuditLogs(
  db: D1Database,
  filters: AuditLogFilters
): Promise<AuditLogEntry[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
  }

  if (filters.tenantId) {
    conditions.push('tenant_id = ?');
    params.push(filters.tenantId);
  }

  if (filters.action) {
    conditions.push('action = ?');
    params.push(filters.action);
  }

  if (filters.resourceType) {
    conditions.push('resource_type = ?');
    params.push(filters.resourceType);
  }

  if (filters.resourceId) {
    conditions.push('resource_id = ?');
    params.push(filters.resourceId);
  }

  if (filters.startTime) {
    conditions.push('timestamp >= ?');
    params.push(filters.startTime);
  }

  if (filters.endTime) {
    conditions.push('timestamp <= ?');
    params.push(filters.endTime);
  }

  if (filters.success !== undefined) {
    conditions.push('success = ?');
    params.push(filters.success ? 1 : 0);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  const query = `
    SELECT * FROM operator_audit_log
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;

  const result = await db
    .prepare(query)
    .bind(...params, limit, offset)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      user_id: string;
      tenant_id: string;
      action: string;
      resource_type: string;
      resource_id: string;
      metadata: string | null;
      ip_address: string | null;
      user_agent: string | null;
      timestamp: number;
      success: number;
      error_message: string | null;
    };

    return {
      id: r.id,
      userId: r.user_id,
      tenantId: r.tenant_id,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      metadata: r.metadata ? JSON.parse(r.metadata) : {},
      ipAddress: r.ip_address || undefined,
      userAgent: r.user_agent || undefined,
      timestamp: new Date(r.timestamp * 1000),
      success: r.success === 1,
      errorMessage: r.error_message || undefined,
    };
  });
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  db: D1Database,
  userId: string,
  limit = 100
): Promise<AuditLogEntry[]> {
  return queryAuditLogs(db, { userId, limit });
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  db: D1Database,
  resourceType: ResourceType,
  resourceId: string,
  limit = 100
): Promise<AuditLogEntry[]> {
  return queryAuditLogs(db, { resourceType, resourceId, limit });
}

/**
 * Get recent audit logs for a tenant
 */
export async function getTenantAuditLogs(
  db: D1Database,
  tenantId: string,
  hours = 24,
  limit = 100
): Promise<AuditLogEntry[]> {
  const startTime = Math.floor(Date.now() / 1000) - hours * 3600;
  return queryAuditLogs(db, { tenantId, startTime, limit });
}

/**
 * Get failed audit actions
 */
export async function getFailedAuditActions(
  db: D1Database,
  tenantId: string,
  limit = 50
): Promise<AuditLogEntry[]> {
  return queryAuditLogs(db, { tenantId, success: false, limit });
}

// ============================================================================
// AUDIT STATISTICS
// ============================================================================

export interface AuditStatistics {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  actionsByType: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
}

/**
 * Get audit statistics for a tenant
 *
 * @param db Database connection
 * @param tenantId Tenant ID
 * @param hours Time range in hours (default: 24)
 * @returns Audit statistics
 */
export async function getAuditStatistics(
  db: D1Database,
  tenantId: string,
  hours = 24
): Promise<AuditStatistics> {
  const startTime = Math.floor(Date.now() / 1000) - hours * 3600;

  // Get total and success counts
  const totalsResult = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM operator_audit_log
      WHERE tenant_id = ? AND timestamp >= ?`
    )
    .bind(tenantId, startTime)
    .first();

  // Get actions by type
  const actionsByTypeResult = await db
    .prepare(
      `SELECT action, COUNT(*) as count
      FROM operator_audit_log
      WHERE tenant_id = ? AND timestamp >= ?
      GROUP BY action`
    )
    .bind(tenantId, startTime)
    .all();

  // Get top users
  const topUsersResult = await db
    .prepare(
      `SELECT user_id, COUNT(*) as count
      FROM operator_audit_log
      WHERE tenant_id = ? AND timestamp >= ?
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10`
    )
    .bind(tenantId, startTime)
    .all();

  const totals = totalsResult as unknown as {
    total: number;
    successful: number;
    failed: number;
  };

  const actionsByType: Record<string, number> = {};
  actionsByTypeResult.results.forEach(
    (row: unknown) => {
      const r = row as { action: string; count: number };
      actionsByType[r.action] = r.count;
    }
  );

  const topUsers = topUsersResult.results.map((row: unknown) => {
    const r = row as { user_id: string; count: number };
    return {
      userId: r.user_id,
      count: r.count,
    };
  });

  return {
    totalActions: totals.total,
    successfulActions: totals.successful,
    failedActions: totals.failed,
    actionsByType,
    topUsers,
  };
}
