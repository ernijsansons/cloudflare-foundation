/**
 * Automated Phase Artifact Evaluation
 *
 * Automatically evaluates artifacts and flags low-quality ones for human review
 */

import {
  scoreArtifact,
  getQualityTier,
  meetsProductionQuality,
  type ScoringContext,
  type QualityScore,
} from './quality-scorer';

// ============================================================================
// EVALUATION THRESHOLDS
// ============================================================================

/**
 * Quality thresholds for automatic evaluation
 */
export const QUALITY_THRESHOLDS = {
  // Production quality: 85+ (no review required)
  PRODUCTION: 85,

  // Acceptable quality: 70-84 (flag for review if consensus low)
  ACCEPTABLE: 70,

  // Poor quality: 50-69 (always flag for review)
  POOR: 50,

  // Critical quality: <50 (block and require revision)
  CRITICAL: 50,
} as const;

/**
 * Consensus thresholds for review triggers
 */
export const CONSENSUS_THRESHOLDS = {
  // High consensus: 90%+ (trust automated scoring)
  HIGH: 0.9,

  // Medium consensus: 70-89% (review if quality < 85)
  MEDIUM: 0.7,

  // Low consensus: <70% (always review)
  LOW: 0.7,
} as const;

// ============================================================================
// EVALUATION RESULT TYPES
// ============================================================================

export type ReviewAction =
  | 'none' // No review needed
  | 'optional' // Review recommended but not required
  | 'required' // Review required before proceeding
  | 'blocked'; // Artifact blocked, must be revised

export interface EvaluationResult {
  score: QualityScore;
  reviewAction: ReviewAction;
  reasons: string[];
  recommendations: string[];
  autoApproved: boolean;
}

export interface ReviewTrigger {
  triggered: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// ARTIFACT EVALUATION
// ============================================================================

/**
 * Evaluate an artifact and determine if it needs human review
 *
 * @param context Scoring context with artifact and metadata
 * @returns Evaluation result with review action
 */
export function evaluateArtifact(context: ScoringContext): EvaluationResult {
  // Calculate quality score
  const score = scoreArtifact(context);
  const tier = getQualityTier(score.overall);

  // Determine review action
  const triggers = checkReviewTriggers(context, score);
  const reviewAction = determineReviewAction(score, triggers);

  // Generate reasons and recommendations
  const reasons = generateReasons(score, triggers);
  const recommendations = generateRecommendations(score, tier, triggers);

  // Auto-approve if meets production quality and no triggers
  const autoApproved =
    meetsProductionQuality(score) && reviewAction === 'none';

  return {
    score,
    reviewAction,
    reasons,
    recommendations,
    autoApproved,
  };
}

/**
 * Check for review triggers
 */
function checkReviewTriggers(
  context: ScoringContext,
  score: QualityScore
): ReviewTrigger[] {
  const triggers: ReviewTrigger[] = [];

  // Trigger 1: Low overall score
  if (score.overall < QUALITY_THRESHOLDS.POOR) {
    triggers.push({
      triggered: true,
      reason: `Overall score ${score.overall} is below poor threshold (${QUALITY_THRESHOLDS.POOR})`,
      severity: 'critical',
    });
  } else if (score.overall < QUALITY_THRESHOLDS.ACCEPTABLE) {
    triggers.push({
      triggered: true,
      reason: `Overall score ${score.overall} is below acceptable threshold (${QUALITY_THRESHOLDS.ACCEPTABLE})`,
      severity: 'high',
    });
  }

  // Trigger 2: Low consensus
  const consensusScore = context.orchestration?.consensusScore;
  if (consensusScore !== undefined && consensusScore < CONSENSUS_THRESHOLDS.LOW) {
    triggers.push({
      triggered: true,
      reason: `Model consensus ${(consensusScore * 100).toFixed(0)}% is below threshold (${CONSENSUS_THRESHOLDS.LOW * 100}%)`,
      severity: 'high',
    });
  }

  // Trigger 3: Low dimensional scores
  for (const dim of score.dimensions) {
    if (dim.score < 5.0) {
      triggers.push({
        triggered: true,
        reason: `${dim.dimension} score ${dim.score.toFixed(1)} is critically low`,
        severity: 'critical',
      });
    } else if (dim.score < 7.0) {
      triggers.push({
        triggered: true,
        reason: `${dim.dimension} score ${dim.score.toFixed(1)} is below acceptable`,
        severity: 'medium',
      });
    }
  }

  // Trigger 4: Missing evidence
  const evidenceDim = score.dimensions.find(
    (d) => d.dimension === 'evidence_coverage'
  );
  if (evidenceDim && evidenceDim.score === 0) {
    triggers.push({
      triggered: true,
      reason: 'No citations found - claims lack evidentiary support',
      severity: 'critical',
    });
  }

  // Trigger 5: Hallucination risk (low consensus + low factual accuracy)
  const accuracyDim = score.dimensions.find(
    (d) => d.dimension === 'factual_accuracy'
  );
  if (
    consensusScore !== undefined &&
    consensusScore < 0.6 &&
    accuracyDim &&
    accuracyDim.score < 5.0
  ) {
    triggers.push({
      triggered: true,
      reason: 'High hallucination risk detected (low consensus + low accuracy)',
      severity: 'critical',
    });
  }

  // Trigger 6: Schema validation failures
  const completenessDim = score.dimensions.find(
    (d) => d.dimension === 'completeness'
  );
  if (completenessDim && completenessDim.score < 7.0) {
    triggers.push({
      triggered: true,
      reason: 'Schema validation issues detected',
      severity: 'high',
    });
  }

  return triggers;
}

/**
 * Determine review action based on score and triggers
 */
function determineReviewAction(
  score: QualityScore,
  triggers: ReviewTrigger[]
): ReviewAction {
  // Critical triggers = blocked
  const hasCriticalTrigger = triggers.some((t) => t.severity === 'critical');
  if (hasCriticalTrigger) {
    return 'blocked';
  }

  // High severity triggers = required review
  const hasHighTrigger = triggers.some((t) => t.severity === 'high');
  if (hasHighTrigger) {
    return 'required';
  }

  // Medium triggers OR score below production = optional review
  const hasMediumTrigger = triggers.some((t) => t.severity === 'medium');
  if (hasMediumTrigger || score.overall < QUALITY_THRESHOLDS.PRODUCTION) {
    return 'optional';
  }

  // No triggers and high quality = no review needed
  return 'none';
}

/**
 * Generate human-readable reasons for review action
 */
function generateReasons(
  score: QualityScore,
  triggers: ReviewTrigger[]
): string[] {
  const reasons: string[] = [];

  // Overall quality tier
  const tier = getQualityTier(score.overall);
  reasons.push(
    `Overall quality: ${tier.toUpperCase()} (${score.overall}/100)`
  );

  // Triggered reasons
  triggers.forEach((trigger) => {
    reasons.push(`[${trigger.severity.toUpperCase()}] ${trigger.reason}`);
  });

  // Add dimensional feedback
  score.dimensions.forEach((dim) => {
    if (dim.feedback) {
      reasons.push(`${dim.dimension}: ${dim.feedback}`);
    }
  });

  return reasons;
}

/**
 * Generate recommendations for improvement
 */
function generateRecommendations(
  score: QualityScore,
  tier: string,
  triggers: ReviewTrigger[]
): string[] {
  const recommendations: string[] = [];

  // Critical quality recommendations
  if (tier === 'critical' || tier === 'poor') {
    recommendations.push(
      'Artifact quality is below acceptable standards and requires significant revision'
    );
    recommendations.push(
      'Consider regenerating with additional context or different prompt strategy'
    );
  }

  // Evidence coverage recommendations
  const evidenceDim = score.dimensions.find(
    (d) => d.dimension === 'evidence_coverage'
  );
  if (evidenceDim && evidenceDim.score < 7.0) {
    recommendations.push(
      'Add more citations to support claims (target: 1 citation per major claim)'
    );
    recommendations.push(
      'Include source attribution for all factual assertions'
    );
  }

  // Consensus recommendations
  const hasConsensusIssue = triggers.some((t) =>
    t.reason.includes('consensus')
  );
  if (hasConsensusIssue) {
    recommendations.push(
      'Models disagreed significantly - review wild ideas for insights'
    );
    recommendations.push(
      'Consider running additional models to increase consensus confidence'
    );
  }

  // Completeness recommendations
  const completenessDim = score.dimensions.find(
    (d) => d.dimension === 'completeness'
  );
  if (completenessDim && completenessDim.score < 9.0) {
    recommendations.push('Ensure all required fields are fully populated');
    recommendations.push('Check schema validation errors for missing data');
  }

  // Reasoning depth recommendations
  const reasoningDim = score.dimensions.find(
    (d) => d.dimension === 'reasoning_depth'
  );
  if (reasoningDim && reasoningDim.score < 7.0) {
    recommendations.push('Add more detailed reasoning and analysis');
    recommendations.push('Explain the "why" behind decisions, not just the "what"');
  }

  return recommendations;
}

// ============================================================================
// BATCH EVALUATION
// ============================================================================

export interface BatchEvaluationResult {
  total: number;
  autoApproved: number;
  flaggedForReview: number;
  blocked: number;
  results: EvaluationResult[];
}

/**
 * Evaluate multiple artifacts in batch
 *
 * @param contexts Array of scoring contexts
 * @returns Batch evaluation result
 */
export function evaluateArtifactBatch(
  contexts: ScoringContext[]
): BatchEvaluationResult {
  const results = contexts.map((ctx) => evaluateArtifact(ctx));

  return {
    total: results.length,
    autoApproved: results.filter((r) => r.autoApproved).length,
    flaggedForReview: results.filter(
      (r) => r.reviewAction === 'optional' || r.reviewAction === 'required'
    ).length,
    blocked: results.filter((r) => r.reviewAction === 'blocked').length,
    results,
  };
}

// ============================================================================
// EVALUATION SUMMARY
// ============================================================================

/**
 * Generate evaluation summary report
 */
export function generateEvaluationReport(result: EvaluationResult): string {
  const lines: string[] = [];

  lines.push('# Artifact Evaluation Report');
  lines.push('');
  lines.push(`**Overall Score**: ${result.score.overall}/100 (${getQualityTier(result.score.overall).toUpperCase()})`);
  lines.push(`**Review Action**: ${result.reviewAction.toUpperCase()}`);
  lines.push(`**Auto-Approved**: ${result.autoApproved ? 'Yes' : 'No'}`);
  lines.push('');

  lines.push('## Dimensional Scores');
  lines.push('');
  result.score.dimensions.forEach((dim) => {
    const bar = '█'.repeat(Math.floor(dim.score)) + '░'.repeat(10 - Math.floor(dim.score));
    lines.push(`  ${dim.dimension.padEnd(20)} ${bar} ${dim.score.toFixed(1)}/10`);
  });
  lines.push('');

  if (result.reasons.length > 0) {
    lines.push('## Evaluation Reasons');
    lines.push('');
    result.reasons.forEach((reason) => {
      lines.push(`- ${reason}`);
    });
    lines.push('');
  }

  if (result.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    result.recommendations.forEach((rec) => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
