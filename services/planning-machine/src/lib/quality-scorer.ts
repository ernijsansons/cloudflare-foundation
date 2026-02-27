/**
 * Quality Scorer - Multi-dimensional Artifact Quality Assessment
 *
 * Implements 5-dimensional quality scoring for phase artifacts:
 * 1. Evidence Coverage (30%) - Claims backed by citations
 * 2. Factual Accuracy (25%) - Verifiable facts, no hallucinations
 * 3. Completeness (20%) - All required fields populated
 * 4. Citation Quality (15%) - Source credibility and relevance
 * 5. Reasoning Depth (10%) - Logical coherence and insight
 *
 * Score: 0-100 (weighted average)
 * Target: 85+ for production artifacts
 */

import { validatePhaseOutput } from './schema-validator';

// ============================================================================
// TYPES
// ============================================================================

export interface QualityScore {
  overall: number; // 0-100
  overallScore?: number; // Backward-compatible alias
  dimensions: QualityDimension[];
  evaluator: 'automated' | 'operator' | 'hybrid';
  evaluatorId?: string;
  timestamp: number;
  feedback?: string;
  evidenceCoverage?: number;
  factualAccuracy?: number;
  completeness?: number;
  citationQuality?: number;
  reasoningDepth?: number;
  tier?: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  productionReady?: boolean;
}

export interface QualityDimension {
  dimension: DimensionName;
  score: number; // 0-10
  weight: number; // percentage
  feedback?: string;
  automated: boolean;
}

export type DimensionName =
  | 'evidence_coverage'
  | 'factual_accuracy'
  | 'completeness'
  | 'citation_quality'
  | 'reasoning_depth';

export interface ScoringContext {
  phase: string;
  artifact: unknown;
  orchestration?: {
    consensusScore: number;
    modelCount: number;
    wildIdeas: Array<{ model: string; wildIdea: string }>;
  };
  ragContext?: string;
  citations?: Array<{
    passage: string;
    confidence: number;
    sourceArtifactId?: string;
  }>;
}

// ============================================================================
// DIMENSION WEIGHTS
// ============================================================================

const DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  evidence_coverage: 0.3, // 30%
  factual_accuracy: 0.25, // 25%
  completeness: 0.2, // 20%
  citation_quality: 0.15, // 15%
  reasoning_depth: 0.1, // 10%
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate overall quality score for an artifact
 *
 * @param context Artifact and supporting evidence
 * @returns Quality score with dimensional breakdown
 */
export function scoreArtifact(context: ScoringContext): QualityScore {
  const dimensions: QualityDimension[] = [
    scoreEvidenceCoverage(context),
    scoreFactualAccuracy(context),
    scoreCompleteness(context),
    scoreCitationQuality(context),
    scoreReasoningDepth(context),
  ];

  // Calculate weighted average
  const overall = dimensions.reduce(
    (sum, dim) => sum + dim.score * dim.weight * 10,
    0
  );

  const roundedOverall = Math.round(overall);
  const byDimension = Object.fromEntries(
    dimensions.map((dimension) => [dimension.dimension, dimension.score])
  ) as Record<DimensionName, number>;
  const tier = getQualityTier(roundedOverall);
  const productionReady = roundedOverall >= 85;

  return {
    overall: roundedOverall,
    overallScore: roundedOverall,
    dimensions,
    evaluator: 'automated',
    timestamp: Math.floor(Date.now() / 1000),
    evidenceCoverage: byDimension.evidence_coverage,
    factualAccuracy: byDimension.factual_accuracy,
    completeness: byDimension.completeness,
    citationQuality: byDimension.citation_quality,
    reasoningDepth: byDimension.reasoning_depth,
    tier,
    productionReady,
  };
}

export function calculateQualityScore(context: ScoringContext): QualityScore {
  return scoreArtifact(context);
}

/**
 * Evidence Coverage (30%) - Claims backed by citations
 *
 * Measures how well claims are supported by evidence:
 * - 10: Every claim has citation with high confidence
 * - 7-9: Most claims cited, some gaps
 * - 4-6: Half of claims cited
 * - 1-3: Few claims cited
 * - 0: No citations
 */
function scoreEvidenceCoverage(context: ScoringContext): QualityDimension {
  const { artifact, citations = [] } = context;

  if (citations.length === 0) {
    return {
      dimension: 'evidence_coverage',
      score: 0,
      weight: DIMENSION_WEIGHTS.evidence_coverage,
      feedback: 'No citations found',
      automated: true,
    };
  }

  // Estimate claim count from artifact size
  const artifactText = JSON.stringify(artifact);
  const estimatedClaims = Math.ceil(artifactText.length / 200); // ~1 claim per 200 chars

  // Calculate coverage ratio
  const coverageRatio = Math.min(citations.length / estimatedClaims, 1.0);

  // Calculate average citation confidence
  const avgConfidence =
    citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length;

  // Score formula: 70% coverage ratio + 30% confidence
  const score = coverageRatio * 7 + avgConfidence * 3;

  let feedback = '';
  if (score >= 9) feedback = 'Excellent evidence coverage';
  else if (score >= 7) feedback = 'Good evidence coverage, minor gaps';
  else if (score >= 5) feedback = 'Adequate coverage, needs improvement';
  else if (score >= 3) feedback = 'Weak evidence coverage';
  else feedback = 'Insufficient evidence';

  return {
    dimension: 'evidence_coverage',
    score: Math.round(score * 10) / 10,
    weight: DIMENSION_WEIGHTS.evidence_coverage,
    feedback,
    automated: true,
  };
}

/**
 * Factual Accuracy (25%) - Verifiable facts, no hallucinations
 *
 * Uses consensus score as proxy for factual accuracy:
 * - High consensus (>0.9) suggests models agree on facts
 * - Low consensus (<0.7) suggests potential hallucinations
 *
 * Future: Could integrate fact-checking API
 */
function scoreFactualAccuracy(context: ScoringContext): QualityDimension {
  const { orchestration } = context;

  if (!orchestration) {
    // Single-model path: assume moderate accuracy
    return {
      dimension: 'factual_accuracy',
      score: 7.0,
      weight: DIMENSION_WEIGHTS.factual_accuracy,
      feedback: 'Single model output (no consensus data)',
      automated: true,
    };
  }

  const { consensusScore } = orchestration;

  // Map consensus to accuracy score
  // High consensus = high likelihood of factual accuracy
  let score: number;
  let feedback: string;

  if (consensusScore >= 0.9) {
    score = 9.5;
    feedback = 'Very high model consensus (>90%)';
  } else if (consensusScore >= 0.8) {
    score = 8.5;
    feedback = 'High model consensus (80-90%)';
  } else if (consensusScore >= 0.7) {
    score = 7.0;
    feedback = 'Moderate consensus (70-80%)';
  } else if (consensusScore >= 0.6) {
    score = 5.5;
    feedback = 'Low consensus (60-70%) - verify facts';
  } else {
    score = 3.0;
    feedback = 'Very low consensus (<60%) - high hallucination risk';
  }

  return {
    dimension: 'factual_accuracy',
    score,
    weight: DIMENSION_WEIGHTS.factual_accuracy,
    feedback,
    automated: true,
  };
}

/**
 * Completeness (20%) - All required fields populated
 *
 * Validates artifact against phase schema:
 * - 10: Perfect schema match, all fields populated
 * - 7-9: Minor optional fields missing
 * - 4-6: Some required fields missing
 * - 1-3: Many required fields missing
 * - 0: Validation failed completely
 */
function scoreCompleteness(context: ScoringContext): QualityDimension {
  const { phase, artifact } = context;

  // Validate against schema
  const validation = validatePhaseOutput(phase, artifact);

  if (!validation.valid) {
    const errorCount = validation.errors?.length || 0;
    const score = Math.max(0, 10 - errorCount * 4); // -4 points per error

    return {
      dimension: 'completeness',
      score,
      weight: DIMENSION_WEIGHTS.completeness,
      feedback: `${errorCount} validation errors: ${validation.errors?.join(', ') || 'unknown'}`,
      automated: true,
    };
  }

  // Passed validation - check field density
  const artifactObj = artifact as Record<string, unknown>;
  const totalFields = countFields(artifactObj);
  const populatedFields = countPopulatedFields(artifactObj);

  const densityRatio = populatedFields / (totalFields || 1);

  let score: number;
  let feedback: string;

  if (densityRatio >= 0.95) {
    score = 10;
    feedback = 'All fields populated';
  } else if (densityRatio >= 0.85) {
    score = 8.5;
    feedback = 'Most fields populated';
  } else if (densityRatio >= 0.7) {
    score = 7.0;
    feedback = 'Adequate field coverage';
  } else {
    score = 5.0;
    feedback = `Only ${Math.round(densityRatio * 100)}% fields populated`;
  }

  return {
    dimension: 'completeness',
    score,
    weight: DIMENSION_WEIGHTS.completeness,
    feedback,
    automated: true,
  };
}

/**
 * Citation Quality (15%) - Source credibility and relevance
 *
 * Assesses quality of citations:
 * - High confidence (>0.9) from prior phases = excellent
 * - Medium confidence (0.7-0.9) = good
 * - Low confidence (<0.7) = questionable
 */
function scoreCitationQuality(context: ScoringContext): QualityDimension {
  const { citations = [] } = context;

  if (citations.length === 0) {
    return {
      dimension: 'citation_quality',
      score: 5.0, // Neutral if no citations
      weight: DIMENSION_WEIGHTS.citation_quality,
      feedback: 'No citations to assess',
      automated: true,
    };
  }

  // Calculate average confidence
  const avgConfidence =
    citations.reduce((sum, c) => sum + c.confidence, 0) / citations.length;

  // Count high-quality citations (>0.8 confidence)
  const highQualityCount = citations.filter((c) => c.confidence > 0.8).length;
  const highQualityRatio = highQualityCount / citations.length;

  // Score: 60% average confidence + 40% high-quality ratio
  const score = avgConfidence * 6 + highQualityRatio * 4;

  let feedback = '';
  if (score >= 8.5) feedback = 'Excellent citation quality';
  else if (score >= 7) feedback = 'Good citation quality';
  else if (score >= 5) feedback = 'Adequate citation quality';
  else feedback = 'Weak citation quality';

  return {
    dimension: 'citation_quality',
    score: Math.round(score * 10) / 10,
    weight: DIMENSION_WEIGHTS.citation_quality,
    feedback,
    automated: true,
  };
}

/**
 * Reasoning Depth (10%) - Logical coherence and insight
 *
 * Heuristic-based assessment of reasoning quality:
 * - Presence of "reasoning" fields
 * - Length of reasoning (longer = more detailed)
 * - Wild ideas (indicates divergent thinking)
 */
function scoreReasoningDepth(context: ScoringContext): QualityDimension {
  const { artifact, orchestration } = context;

  let score = 5.0; // Base score
  let feedback = 'Moderate reasoning depth';

  // Check for reasoning fields
  const artifactText = JSON.stringify(artifact).toLowerCase();
  const hasReasoning = artifactText.includes('reasoning');
  const hasAnalysis = artifactText.includes('analysis');
  const hasInsight = artifactText.includes('insight');

  if (hasReasoning) score += 1.5;
  if (hasAnalysis) score += 1.0;
  if (hasInsight) score += 0.5;

  // Check reasoning length (longer = more detailed)
  const reasoningMatch = artifactText.match(/"reasoning":\s*"([^"]+)"/);
  if (reasoningMatch && reasoningMatch[1].length > 200) {
    score += 1.0;
  }

  // Wild ideas indicate divergent thinking
  if (orchestration?.wildIdeas && orchestration.wildIdeas.length > 0) {
    score += 1.0;
    feedback = 'Good reasoning with wild ideas explored';
  }

  // Cap at 10
  score = Math.min(score, 10);

  if (score >= 8.5) feedback = 'Excellent reasoning depth';
  else if (score >= 7) feedback = 'Good reasoning depth';
  else if (score < 5) feedback = 'Shallow reasoning';

  return {
    dimension: 'reasoning_depth',
    score: Math.round(score * 10) / 10,
    weight: DIMENSION_WEIGHTS.reasoning_depth,
    feedback,
    automated: true,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Count total fields in object (recursive)
 */
function countFields(obj: Record<string, unknown>, depth = 0): number {
  if (depth > 3) return 0; // Prevent deep recursion

  let count = 0;
  for (const value of Object.values(obj)) {
    count++;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      count += countFields(value as Record<string, unknown>, depth + 1);
    }
  }
  return count;
}

/**
 * Count populated fields (non-null, non-empty)
 */
function countPopulatedFields(obj: Record<string, unknown>, depth = 0): number {
  if (depth > 3) return 0;

  let count = 0;
  for (const value of Object.values(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      count++;
      if (typeof value === 'object' && !Array.isArray(value)) {
        count += countPopulatedFields(value as Record<string, unknown>, depth + 1);
      }
    }
  }
  return count;
}

/**
 * Get quality tier from score
 */
export function getQualityTier(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
  if (score >= 90) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 70) return 'acceptable';
  if (score >= 50) return 'poor';
  return 'critical';
}

/**
 * Check if artifact meets production quality threshold
 */
export function meetsProductionQuality(score: QualityScore): boolean {
  const value = score.overallScore ?? score.overall;
  return value >= 85;
}

/**
 * Generate quality report
 */
export function generateQualityReport(score: QualityScore): string {
  const value = score.overallScore ?? score.overall;
  const tier = getQualityTier(value);
  const lines: string[] = [];

  lines.push(`Quality Score: ${value}/100 (${tier.toUpperCase()})`);
  lines.push('');
  lines.push('Dimensional Breakdown:');

  for (const dim of score.dimensions) {
    const percentage = Math.round(dim.score * 10);
    const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    lines.push(`  ${dim.dimension.padEnd(20)} ${bar} ${dim.score.toFixed(1)}/10 (${Math.round(dim.weight * 100)}%)`);
    if (dim.feedback) {
      lines.push(`    → ${dim.feedback}`);
    }
  }

  lines.push('');
  lines.push(`Evaluated: ${new Date(score.timestamp * 1000).toISOString()}`);
  lines.push(`Evaluator: ${score.evaluator}`);

  if (!meetsProductionQuality(score)) {
    lines.push('');
    lines.push('⚠️  Does not meet production quality threshold (85+)');
  }

  return lines.join('\n');
}
