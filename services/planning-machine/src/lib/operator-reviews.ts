/**
 * Operator Reviews - Database queries and management
 *
 * Handles operator decision reviews, approvals, rejections, and revisions
 */

import type { OperatorReview, UserWithRole } from '@foundation/shared';

import type { AuditContext } from './audit-logger';
import {
  logDecisionApproval,
  logDecisionRejection,
  logDecisionRevision,
  logDecisionEscalation,
} from './audit-logger';

// ============================================================================
// REVIEW CREATION
// ============================================================================

export interface ReviewInput {
  decisionId: string;
  operator: UserWithRole;
  action: 'approve' | 'reject' | 'revise' | 'escalate';
  confidence: number;
  feedback?: string;
  revisionInstructions?: string;
}

/**
 * Create an operator review
 *
 * @param db Database connection
 * @param auditContext Audit context for logging
 * @param input Review input
 * @returns Created review
 */
export async function createOperatorReview(
  db: D1Database,
  auditContext: AuditContext,
  input: ReviewInput
): Promise<OperatorReview> {
  const id = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  const review: Omit<OperatorReview, 'timestamp'> & { timestamp: number } = {
    id,
    decisionId: input.decisionId,
    operatorId: input.operator.id,
    operatorRole: input.operator.role,
    action: input.action,
    confidence: input.confidence,
    feedback: input.feedback,
    revisionInstructions: input.revisionInstructions,
    timestamp,
  };

  // Insert review
  await db
    .prepare(
      `INSERT INTO operator_reviews (
        id, decision_id, operator_id, operator_role,
        action, confidence, feedback, revision_instructions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      review.id,
      review.decisionId,
      review.operatorId,
      review.operatorRole,
      review.action,
      review.confidence,
      review.feedback,
      review.revisionInstructions,
      review.timestamp
    )
    .run();

  // Log to audit trail
  switch (input.action) {
    case 'approve':
      await logDecisionApproval(
        auditContext,
        input.decisionId,
        input.confidence,
        input.feedback
      );
      break;
    case 'reject':
      await logDecisionRejection(
        auditContext,
        input.decisionId,
        input.feedback || 'No reason provided'
      );
      break;
    case 'revise':
      await logDecisionRevision(
        auditContext,
        input.decisionId,
        input.revisionInstructions || 'No instructions provided'
      );
      break;
    case 'escalate':
      await logDecisionEscalation(
        auditContext,
        input.decisionId,
        input.feedback || 'No reason provided',
        'medium' // Default priority
      );
      break;
  }

  return {
    ...review,
    timestamp: new Date(review.timestamp * 1000),
  };
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

/**
 * Get review by ID
 */
export async function getReviewById(
  db: D1Database,
  reviewId: string
): Promise<OperatorReview | null> {
  const result = await db
    .prepare('SELECT * FROM operator_reviews WHERE id = ?')
    .bind(reviewId)
    .first();

  if (!result) return null;

  const row = result as {
    id: string;
    decision_id: string;
    operator_id: string;
    operator_role: string;
    action: string;
    confidence: number;
    feedback: string | null;
    revision_instructions: string | null;
    created_at: number;
  };

  return {
    id: row.id,
    decisionId: row.decision_id,
    operatorId: row.operator_id,
    operatorRole: row.operator_role as 'admin' | 'supervisor' | 'operator',
    action: row.action as 'approve' | 'reject' | 'revise' | 'escalate',
    confidence: row.confidence,
    feedback: row.feedback || undefined,
    revisionInstructions: row.revision_instructions || undefined,
    timestamp: new Date(row.created_at * 1000),
  };
}

/**
 * Get reviews for a decision
 */
export async function getReviewsForDecision(
  db: D1Database,
  decisionId: string
): Promise<OperatorReview[]> {
  const result = await db
    .prepare(
      'SELECT * FROM operator_reviews WHERE decision_id = ? ORDER BY created_at DESC'
    )
    .bind(decisionId)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      operator_id: string;
      operator_role: string;
      action: string;
      confidence: number;
      feedback: string | null;
      revision_instructions: string | null;
      created_at: number;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      operatorId: r.operator_id,
      operatorRole: r.operator_role as 'admin' | 'supervisor' | 'operator',
      action: r.action as 'approve' | 'reject' | 'revise' | 'escalate',
      confidence: r.confidence,
      feedback: r.feedback || undefined,
      revisionInstructions: r.revision_instructions || undefined,
      timestamp: new Date(r.created_at * 1000),
    };
  });
}

/**
 * Get reviews by operator
 */
export async function getReviewsByOperator(
  db: D1Database,
  operatorId: string,
  limit = 50
): Promise<OperatorReview[]> {
  const result = await db
    .prepare(
      'SELECT * FROM operator_reviews WHERE operator_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(operatorId, limit)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      operator_id: string;
      operator_role: string;
      action: string;
      confidence: number;
      feedback: string | null;
      revision_instructions: string | null;
      created_at: number;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      operatorId: r.operator_id,
      operatorRole: r.operator_role as 'admin' | 'supervisor' | 'operator',
      action: r.action as 'approve' | 'reject' | 'revise' | 'escalate',
      confidence: r.confidence,
      feedback: r.feedback || undefined,
      revisionInstructions: r.revision_instructions || undefined,
      timestamp: new Date(r.created_at * 1000),
    };
  });
}

/**
 * Get reviews by action type
 */
export async function getReviewsByAction(
  db: D1Database,
  action: 'approve' | 'reject' | 'revise' | 'escalate',
  limit = 50
): Promise<OperatorReview[]> {
  const result = await db
    .prepare(
      'SELECT * FROM operator_reviews WHERE action = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(action, limit)
    .all();

  return result.results.map((row: unknown) => {
    const r = row as {
      id: string;
      decision_id: string;
      operator_id: string;
      operator_role: string;
      action: string;
      confidence: number;
      feedback: string | null;
      revision_instructions: string | null;
      created_at: number;
    };

    return {
      id: r.id,
      decisionId: r.decision_id,
      operatorId: r.operator_id,
      operatorRole: r.operator_role as 'admin' | 'supervisor' | 'operator',
      action: r.action as 'approve' | 'reject' | 'revise' | 'escalate',
      confidence: r.confidence,
      feedback: r.feedback || undefined,
      revisionInstructions: r.revision_instructions || undefined,
      timestamp: new Date(r.created_at * 1000),
    };
  });
}

// ============================================================================
// REVIEW STATISTICS
// ============================================================================

export interface ReviewStatistics {
  totalReviews: number;
  approvals: number;
  rejections: number;
  revisions: number;
  escalations: number;
  averageConfidence: number;
  reviewsByOperator: Array<{ operatorId: string; count: number }>;
}

/**
 * Get review statistics
 *
 * @param db Database connection
 * @param hours Time range in hours (default: 24)
 * @returns Review statistics
 */
export async function getReviewStatistics(
  db: D1Database,
  hours = 24
): Promise<ReviewStatistics> {
  const startTime = Math.floor(Date.now() / 1000) - hours * 3600;

  // Get counts by action
  const countsResult = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN action = 'approve' THEN 1 ELSE 0 END) as approvals,
        SUM(CASE WHEN action = 'reject' THEN 1 ELSE 0 END) as rejections,
        SUM(CASE WHEN action = 'revise' THEN 1 ELSE 0 END) as revisions,
        SUM(CASE WHEN action = 'escalate' THEN 1 ELSE 0 END) as escalations,
        AVG(confidence) as avg_confidence
      FROM operator_reviews
      WHERE created_at >= ?`
    )
    .bind(startTime)
    .first();

  // Get reviews by operator
  const operatorResult = await db
    .prepare(
      `SELECT operator_id, COUNT(*) as count
      FROM operator_reviews
      WHERE created_at >= ?
      GROUP BY operator_id
      ORDER BY count DESC`
    )
    .bind(startTime)
    .all();

  const counts = countsResult as unknown as {
    total: number;
    approvals: number;
    rejections: number;
    revisions: number;
    escalations: number;
    avg_confidence: number;
  };

  const reviewsByOperator = operatorResult.results.map((row: unknown) => {
    const r = row as { operator_id: string; count: number };
    return {
      operatorId: r.operator_id,
      count: r.count,
    };
  });

  return {
    totalReviews: counts.total,
    approvals: counts.approvals,
    rejections: counts.rejections,
    revisions: counts.revisions,
    escalations: counts.escalations,
    averageConfidence: counts.avg_confidence,
    reviewsByOperator,
  };
}
