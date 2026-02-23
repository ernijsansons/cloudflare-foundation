/**
 * Escalations Management
 *
 * Handles decision escalations requiring supervisor review
 */

import type { Escalation, UserWithRole } from '@foundation/shared';

// ============================================================================
// ESCALATION CREATION
// ============================================================================

export interface EscalationInput {
  decisionId: string;
  fromOperator: UserWithRole;
  toSupervisorId?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Create an escalation
 *
 * @param db Database connection
 * @param input Escalation input
 * @returns Created escalation
 */
export async function createEscalation(
  db: D1Database,
  input: EscalationInput
): Promise<Escalation> {
  const id = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  const escalation: Omit<Escalation, 'createdAt' | 'resolvedAt'> & {
    createdAt: number;
    resolvedAt: number | null;
  } = {
    id,
    decisionId: input.decisionId,
    fromOperatorId: input.fromOperator.id,
    toSupervisorId: input.toSupervisorId,
    reason: input.reason,
    priority: input.priority,
    status: 'pending',
    createdAt: timestamp,
    resolvedAt: null,
    resolution: undefined,
  };

  await db
    .prepare(
      `INSERT INTO escalations (
        id, decision_id, from_operator_id, to_supervisor_id,
        reason, priority, status, created_at, resolved_at, resolution
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      escalation.id,
      escalation.decisionId,
      escalation.fromOperatorId,
      escalation.toSupervisorId,
      escalation.reason,
      escalation.priority,
      escalation.status,
      escalation.createdAt,
      escalation.resolvedAt,
      escalation.resolution
    )
    .run();

  return {
    ...escalation,
    createdAt: new Date(escalation.createdAt * 1000),
    resolvedAt: undefined,
  };
}

// ============================================================================
// ESCALATION UPDATES
// ============================================================================

/**
 * Assign escalation to supervisor
 */
export async function assignEscalation(
  db: D1Database,
  escalationId: string,
  supervisorId: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE escalations
      SET to_supervisor_id = ?, status = 'in_review'
      WHERE id = ?`
    )
    .bind(supervisorId, escalationId)
    .run();
}

/**
 * Resolve escalation
 */
export async function resolveEscalation(
  db: D1Database,
  escalationId: string,
  resolution: string
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `UPDATE escalations
      SET status = 'resolved', resolved_at = ?, resolution = ?
      WHERE id = ?`
    )
    .bind(timestamp, resolution, escalationId)
    .run();
}

/**
 * Reject escalation
 */
export async function rejectEscalation(
  db: D1Database,
  escalationId: string,
  reason: string
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `UPDATE escalations
      SET status = 'rejected', resolved_at = ?, resolution = ?
      WHERE id = ?`
    )
    .bind(timestamp, reason, escalationId)
    .run();
}

// ============================================================================
// ESCALATION QUERIES
// ============================================================================

/**
 * Get escalation by ID
 */
export async function getEscalationById(
  db: D1Database,
  escalationId: string
): Promise<Escalation | null> {
  const result = await db
    .prepare('SELECT * FROM escalations WHERE id = ?')
    .bind(escalationId)
    .first();

  if (!result) return null;

  const row = result as {
    id: string;
    decision_id: string;
    from_operator_id: string;
    to_supervisor_id: string | null;
    reason: string;
    priority: string;
    status: string;
    created_at: number;
    resolved_at: number | null;
    resolution: string | null;
  };

  return {
    id: row.id,
    decisionId: row.decision_id,
    fromOperatorId: row.from_operator_id,
    toSupervisorId: row.to_supervisor_id || undefined,
    reason: row.reason,
    priority: row.priority as 'low' | 'medium' | 'high' | 'urgent',
    status: row.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
    createdAt: new Date(row.created_at * 1000),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at * 1000) : undefined,
    resolution: row.resolution || undefined,
  };
}

/**
 * Get escalations for a decision
 */
export async function getEscalationsForDecision(
  db: D1Database,
  decisionId: string
): Promise<Escalation[]> {
  const result = await db
    .prepare(
      'SELECT * FROM escalations WHERE decision_id = ? ORDER BY created_at DESC'
    )
    .bind(decisionId)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      from_operator_id: string;
      to_supervisor_id: string | null;
      reason: string;
      priority: string;
      status: string;
      created_at: number;
      resolved_at: number | null;
      resolution: string | null;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      fromOperatorId: r.from_operator_id,
      toSupervisorId: r.to_supervisor_id || undefined,
      reason: r.reason,
      priority: r.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: r.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
      createdAt: new Date(r.created_at * 1000),
      resolvedAt: r.resolved_at ? new Date(r.resolved_at * 1000) : undefined,
      resolution: r.resolution || undefined,
    };
  });
}

/**
 * Get pending escalations for a supervisor
 */
export async function getPendingEscalations(
  db: D1Database,
  supervisorId?: string
): Promise<Escalation[]> {
  let query = `SELECT * FROM escalations
    WHERE status IN ('pending', 'in_review')`;
  const params: unknown[] = [];

  if (supervisorId) {
    query += ` AND (to_supervisor_id = ? OR to_supervisor_id IS NULL)`;
    params.push(supervisorId);
  }

  query += ` ORDER BY
    CASE priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    created_at ASC`;

  const result = await db.prepare(query).bind(...params).all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      from_operator_id: string;
      to_supervisor_id: string | null;
      reason: string;
      priority: string;
      status: string;
      created_at: number;
      resolved_at: number | null;
      resolution: string | null;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      fromOperatorId: r.from_operator_id,
      toSupervisorId: r.to_supervisor_id || undefined,
      reason: r.reason,
      priority: r.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: r.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
      createdAt: new Date(r.created_at * 1000),
      resolvedAt: r.resolved_at ? new Date(r.resolved_at * 1000) : undefined,
      resolution: r.resolution || undefined,
    };
  });
}

/**
 * Get escalations by operator
 */
export async function getEscalationsByOperator(
  db: D1Database,
  operatorId: string,
  limit = 50
): Promise<Escalation[]> {
  const result = await db
    .prepare(
      'SELECT * FROM escalations WHERE from_operator_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(operatorId, limit)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      from_operator_id: string;
      to_supervisor_id: string | null;
      reason: string;
      priority: string;
      status: string;
      created_at: number;
      resolved_at: number | null;
      resolution: string | null;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      fromOperatorId: r.from_operator_id,
      toSupervisorId: r.to_supervisor_id || undefined,
      reason: r.reason,
      priority: r.priority as 'low' | 'medium' | 'high' | 'urgent',
      status: r.status as 'pending' | 'in_review' | 'resolved' | 'rejected',
      createdAt: new Date(r.created_at * 1000),
      resolvedAt: r.resolved_at ? new Date(r.resolved_at * 1000) : undefined,
      resolution: r.resolution || undefined,
    };
  });
}

// ============================================================================
// ESCALATION STATISTICS
// ============================================================================

export interface EscalationStatistics {
  totalEscalations: number;
  pendingEscalations: number;
  inReviewEscalations: number;
  resolvedEscalations: number;
  rejectedEscalations: number;
  averageResolutionTime: number; // in hours
  escalationsByPriority: Record<string, number>;
}

/**
 * Get escalation statistics
 *
 * @param db Database connection
 * @param hours Time range in hours (default: 168 = 1 week)
 * @returns Escalation statistics
 */
export async function getEscalationStatistics(
  db: D1Database,
  hours = 168
): Promise<EscalationStatistics> {
  const startTime = Math.floor(Date.now() / 1000) - hours * 3600;

  // Get counts by status
  const countsResult = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM escalations
      WHERE created_at >= ?`
    )
    .bind(startTime)
    .first();

  // Get average resolution time (for resolved escalations)
  const resolutionResult = await db
    .prepare(
      `SELECT AVG(resolved_at - created_at) as avg_resolution
      FROM escalations
      WHERE status = 'resolved' AND created_at >= ?`
    )
    .bind(startTime)
    .first();

  // Get counts by priority
  const priorityResult = await db
    .prepare(
      `SELECT priority, COUNT(*) as count
      FROM escalations
      WHERE created_at >= ?
      GROUP BY priority`
    )
    .bind(startTime)
    .all();

  const counts = countsResult as unknown as {
    total: number;
    pending: number;
    in_review: number;
    resolved: number;
    rejected: number;
  };

  const resolution = resolutionResult as unknown as {
    avg_resolution: number | null;
  };

  const escalationsByPriority: Record<string, number> = {};
  priorityResult.results.forEach((row: unknown) => {
    const r = row as { priority: string; count: number };
    escalationsByPriority[r.priority] = r.count;
  });

  return {
    totalEscalations: counts.total,
    pendingEscalations: counts.pending,
    inReviewEscalations: counts.in_review,
    resolvedEscalations: counts.resolved,
    rejectedEscalations: counts.rejected,
    averageResolutionTime: resolution.avg_resolution
      ? resolution.avg_resolution / 3600
      : 0, // Convert to hours
    escalationsByPriority,
  };
}
