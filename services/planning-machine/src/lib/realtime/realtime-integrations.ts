/**
 * Realtime Integrations
 *
 * Connects backend operations to the realtime system
 * Automatically broadcasts events when artifacts, quality scores, etc. change
 */

import type { PhaseName } from '@foundation/shared';
import { broadcastRealtimeEvent, type RealtimeEvent } from './websocket-coordinator';

// ============================================================================
// ARTIFACT EVENTS
// ============================================================================

/**
 * Broadcast artifact creation
 */
export async function broadcastArtifactCreated(
  env: any,
  artifactId: string,
  phase: PhaseName,
  runId: string,
  content: unknown
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'artifact.created',
    timestamp: Date.now(),
    data: {
      artifactId,
      phase,
      runId,
      preview: getContentPreview(content),
    },
    channel: 'global',
  });

  // Also broadcast to artifact-specific channel
  await broadcastRealtimeEvent(env, {
    type: 'artifact.created',
    timestamp: Date.now(),
    data: {
      artifactId,
      phase,
      runId,
      content,
    },
    channel: artifactId,
  });
}

/**
 * Broadcast artifact update
 */
export async function broadcastArtifactUpdated(
  env: any,
  artifactId: string,
  updates: unknown
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'artifact.updated',
    timestamp: Date.now(),
    data: {
      artifactId,
      updates,
    },
    channel: artifactId,
  });
}

/**
 * Broadcast artifact completion
 */
export async function broadcastArtifactCompleted(
  env: any,
  artifactId: string,
  qualityScore: number,
  phase: PhaseName
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'artifact.completed',
    timestamp: Date.now(),
    data: {
      artifactId,
      qualityScore,
      phase,
      productionReady: qualityScore >= 85,
    },
    channel: 'global',
  });

  await broadcastRealtimeEvent(env, {
    type: 'artifact.completed',
    timestamp: Date.now(),
    data: {
      artifactId,
      qualityScore,
      phase,
    },
    channel: artifactId,
  });
}

// ============================================================================
// QUALITY EVENTS
// ============================================================================

/**
 * Broadcast quality score update
 */
export async function broadcastQualityUpdated(
  env: any,
  artifactId: string,
  qualityScore: {
    overallScore: number;
    evidenceCoverage: number;
    factualAccuracy: number;
    completeness: number;
    citationQuality: number;
    reasoningDepth: number;
    tier: string;
    productionReady: boolean;
  }
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'quality.updated',
    timestamp: Date.now(),
    data: {
      artifactId,
      ...qualityScore,
    },
    channel: artifactId,
  });

  // Also broadcast to global if production ready status changed
  if (qualityScore.productionReady) {
    await broadcastRealtimeEvent(env, {
      type: 'quality.updated',
      timestamp: Date.now(),
      data: {
        artifactId,
        overallScore: qualityScore.overallScore,
        productionReady: true,
      },
      channel: 'global',
    });
  }
}

// ============================================================================
// REVIEW EVENTS
// ============================================================================

/**
 * Broadcast review submission
 */
export async function broadcastReviewSubmitted(
  env: any,
  reviewId: string,
  artifactId: string,
  action: 'approve' | 'reject' | 'revise' | 'escalate',
  operatorId: string,
  operatorName: string
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'review.submitted',
    timestamp: Date.now(),
    data: {
      reviewId,
      artifactId,
      action,
      operatorId,
      operatorName,
    },
    channel: artifactId,
  });

  // Broadcast to global for escalations
  if (action === 'escalate') {
    await broadcastRealtimeEvent(env, {
      type: 'review.submitted',
      timestamp: Date.now(),
      data: {
        reviewId,
        artifactId,
        action,
        operatorName,
      },
      channel: 'global',
    });
  }
}

// ============================================================================
// ESCALATION EVENTS
// ============================================================================

/**
 * Broadcast escalation creation
 */
export async function broadcastEscalationCreated(
  env: any,
  escalationId: string,
  artifactId: string,
  priority: 'urgent' | 'high' | 'medium' | 'low',
  reason: string
): Promise<void> {
  await broadcastRealtimeEvent(env, {
    type: 'escalation.created',
    timestamp: Date.now(),
    data: {
      escalationId,
      artifactId,
      priority,
      reason,
    },
    channel: 'global',
  });

  await broadcastRealtimeEvent(env, {
    type: 'escalation.created',
    timestamp: Date.now(),
    data: {
      escalationId,
      priority,
      reason,
    },
    channel: artifactId,
  });
}

// ============================================================================
// COST EVENTS
// ============================================================================

/**
 * Broadcast cost update (throttled to avoid spam)
 */
let lastCostBroadcast = 0;
const COST_BROADCAST_THROTTLE = 5000; // 5 seconds

export async function broadcastCostUpdated(
  env: any,
  summary: {
    totalCost: number;
    topCategories: Array<{ category: string; cost: number }>;
    projectedMonthly: number;
  }
): Promise<void> {
  const now = Date.now();

  // Throttle broadcasts
  if (now - lastCostBroadcast < COST_BROADCAST_THROTTLE) {
    return;
  }

  lastCostBroadcast = now;

  await broadcastRealtimeEvent(env, {
    type: 'cost.updated',
    timestamp: now,
    data: summary,
    channel: 'global',
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get preview of content (first 200 chars)
 */
function getContentPreview(content: unknown): string {
  const str = JSON.stringify(content);
  return str.length > 200 ? str.substring(0, 200) + '...' : str;
}

/**
 * Batch broadcast multiple events
 */
export async function broadcastBatch(
  env: any,
  events: Array<RealtimeEvent & { channel?: string }>
): Promise<void> {
  await Promise.all(events.map((event) => broadcastRealtimeEvent(env, event)));
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/**
 * Wrap artifact creation to include realtime broadcast
 */
export async function createArtifactWithRealtimeBroadcast(
  env: any,
  db: D1Database,
  artifactId: string,
  phase: PhaseName,
  runId: string,
  content: unknown,
  createFn: () => Promise<void>
): Promise<void> {
  // Execute the creation
  await createFn();

  // Broadcast the event
  await broadcastArtifactCreated(env, artifactId, phase, runId, content);
}

/**
 * Wrap quality scoring to include realtime broadcast
 */
export async function scoreQualityWithRealtimeBroadcast(
  env: any,
  artifactId: string,
  scoreFn: () => Promise<any>
): Promise<any> {
  // Execute scoring
  const qualityScore = await scoreFn();

  // Broadcast the update
  await broadcastQualityUpdated(env, artifactId, qualityScore);

  return qualityScore;
}

/**
 * Wrap review submission to include realtime broadcast
 */
export async function submitReviewWithRealtimeBroadcast(
  env: any,
  reviewId: string,
  artifactId: string,
  action: 'approve' | 'reject' | 'revise' | 'escalate',
  operatorId: string,
  operatorName: string,
  submitFn: () => Promise<void>
): Promise<void> {
  // Submit review
  await submitFn();

  // Broadcast the event
  await broadcastReviewSubmitted(env, reviewId, artifactId, action, operatorId, operatorName);
}

// ============================================================================
// LIVE DASHBOARD DATA
// ============================================================================

/**
 * Get live dashboard metrics
 */
export async function getLiveDashboardMetrics(env: any, db: D1Database) {
  // Get recent artifacts
  const recentArtifacts = await db
    .prepare(
      `
    SELECT id, phase, created_at, status
    FROM phase_artifacts
    WHERE created_at > ?
    ORDER BY created_at DESC
    LIMIT 10
  `
    )
    .bind(Date.now() - 3600000) // Last hour
    .all();

  // Get active operators (from presence)
  const activeOperators = await db
    .prepare(
      `
    SELECT COUNT(DISTINCT operator_id) as count
    FROM operator_audit_log
    WHERE timestamp > ?
  `
    )
    .bind(Date.now() - 300000) // Last 5 minutes
    .first();

  // Get cost in last hour
  const recentCost = await db
    .prepare(
      `
    SELECT SUM(estimated_cost) as total
    FROM cost_tracking
    WHERE timestamp > ?
  `
    )
    .bind(Date.now() - 3600000)
    .first();

  return {
    recentArtifacts: recentArtifacts.results || [],
    activeOperators: (activeOperators as any)?.count || 0,
    hourlyCost: (recentCost as any)?.total || 0,
    timestamp: Date.now(),
  };
}

/**
 * Broadcast live metrics update
 */
export async function broadcastLiveMetrics(env: any, db: D1Database): Promise<void> {
  const metrics = await getLiveDashboardMetrics(env, db);

  await broadcastRealtimeEvent(env, {
    type: 'heartbeat',
    timestamp: Date.now(),
    data: {
      type: 'dashboard_metrics',
      ...metrics,
    },
    channel: 'global',
  });
}

/**
 * Start broadcasting live metrics (call from cron or background task)
 */
export function startLiveMetricsBroadcast(
  env: any,
  db: D1Database,
  intervalMs = 10000
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    broadcastLiveMetrics(env, db).catch((error) => {
      console.error('Error broadcasting live metrics:', error);
    });
  }, intervalMs);
}
