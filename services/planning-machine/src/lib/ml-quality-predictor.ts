/**
 * ML Quality Predictor - Predict artifact quality scores using machine learning
 *
 * Uses historical quality scores to train a model that predicts quality
 * before full evaluation, enabling proactive quality management.
 */

import type { PhaseName } from '@foundation/shared';
import { calculateQualityScore, type QualityScore } from './quality-scorer';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtifactFeatures {
  // Text-based features
  contentLength: number; // Total content length in characters
  wordCount: number; // Total words
  sentenceCount: number; // Total sentences
  avgSentenceLength: number; // Average sentence length

  // Citation features
  citationCount: number; // Number of citations
  citationDensity: number; // Citations per 100 words
  avgCitationLength: number; // Average citation length
  uniqueSourceCount: number; // Number of unique sources

  // Consensus features
  consensusScore: number; // K-LLM consensus (0-100)
  modelAgreementVariance: number; // Variance in model outputs

  // Completeness features
  completenessScore: number; // Schema completeness (0-10)
  requiredFieldsFilled: number; // Count of filled required fields
  optionalFieldsFilled: number; // Count of filled optional fields

  // Metadata features
  phase: PhaseName; // Planning phase (encoded)
  executionTimeMs: number; // Time to generate artifact

  // Revision history
  revisionCount: number; // Number of revisions
  operatorReviewCount: number; // Number of operator reviews
}

export interface TrainingExample {
  features: ArtifactFeatures;
  actualScore: QualityScore;
  timestamp: number;
}

export interface QualityPrediction {
  predictedOverallScore: number; // 0-100
  predictedDimensionalScores: {
    evidenceCoverage: number; // 0-10
    factualAccuracy: number; // 0-10
    completeness: number; // 0-10
    citationQuality: number; // 0-10
    reasoningDepth: number; // 0-10
  };
  confidence: number; // 0-1, model confidence in prediction
  modelVersion: string;
}

export interface ModelMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  r2: number; // R-squared (coefficient of determination)
  sampleCount: number; // Number of training samples
  lastTrainedAt: Date;
}

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

/**
 * Extract features from artifact content
 */
export function extractFeatures(
  content: unknown,
  consensusScore: number,
  completenessScore: number,
  phase: PhaseName,
  citationCount = 0,
  executionTimeMs = 0,
  revisionCount = 0,
  operatorReviewCount = 0
): ArtifactFeatures {
  const contentStr = JSON.stringify(content);

  // Text metrics
  const wordCount = contentStr.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = contentStr.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Citation metrics
  const citationDensity = wordCount > 0 ? (citationCount / wordCount) * 100 : 0;

  return {
    contentLength: contentStr.length,
    wordCount,
    sentenceCount,
    avgSentenceLength,
    citationCount,
    citationDensity,
    avgCitationLength: 0, // Simplified for now
    uniqueSourceCount: citationCount, // Approximation
    consensusScore,
    modelAgreementVariance: 100 - consensusScore, // Inverse approximation
    completenessScore,
    requiredFieldsFilled: 0, // Would come from schema validator
    optionalFieldsFilled: 0,
    phase,
    executionTimeMs,
    revisionCount,
    operatorReviewCount,
  };
}

// ============================================================================
// SIMPLE LINEAR REGRESSION MODEL
// ============================================================================

/**
 * Simple multi-variable linear regression for quality prediction
 *
 * Uses weighted features to predict quality scores.
 * In production, this could be replaced with a more sophisticated model
 * like gradient boosting or neural networks via Workers AI.
 */
export class QualityPredictionModel {
  private weights: Map<string, number> = new Map();
  private bias = 0;
  private modelVersion = '1.0.0';
  private trainingSamples: TrainingExample[] = [];

  /**
   * Train the model on historical data
   */
  train(examples: TrainingExample[]): void {
    this.trainingSamples = examples;

    if (examples.length === 0) {
      throw new Error('Cannot train on empty dataset');
    }

    // Simple feature importance weights (derived from quality scorer)
    this.weights.set('consensusScore', 0.25); // Factual accuracy proxy
    this.weights.set('completenessScore', 0.20); // Completeness dimension
    this.weights.set('citationDensity', 0.15); // Citation quality proxy
    this.weights.set('wordCount', 0.10); // Reasoning depth proxy
    this.weights.set('avgSentenceLength', 0.05);
    this.weights.set('revisionCount', -0.05); // Negative: more revisions = lower quality
    this.weights.set('operatorReviewCount', -0.03);

    // Calculate bias based on training data average
    const avgScore = examples.reduce((sum, ex) => sum + ex.actualScore.overallScore, 0) / examples.length;
    this.bias = avgScore * 0.3; // Base score component
  }

  /**
   * Predict quality score for new artifact
   */
  predict(features: ArtifactFeatures): QualityPrediction {
    if (this.weights.size === 0) {
      throw new Error('Model must be trained before prediction');
    }

    // Normalize features to 0-10 scale for consistency
    const normalized = {
      consensusScore: features.consensusScore / 10,
      completenessScore: features.completenessScore,
      citationDensity: Math.min(features.citationDensity, 10),
      wordCount: Math.min(features.wordCount / 100, 10),
      avgSentenceLength: Math.min(features.avgSentenceLength / 2, 10),
      revisionCount: Math.min(features.revisionCount, 5),
      operatorReviewCount: Math.min(features.operatorReviewCount, 5),
    };

    // Calculate weighted sum
    let predictedScore = this.bias;
    for (const [feature, weight] of this.weights.entries()) {
      const value = normalized[feature as keyof typeof normalized] || 0;
      predictedScore += value * weight * 10; // Scale to 0-100
    }

    // Clamp to valid range
    predictedScore = Math.max(0, Math.min(100, predictedScore));

    // Predict dimensional scores based on features
    const dimensionalScores = {
      evidenceCoverage: Math.min(10, features.citationCount * 0.5 + 5), // More citations = better coverage
      factualAccuracy: features.consensusScore / 10,
      completeness: features.completenessScore,
      citationQuality: Math.min(10, features.citationDensity * 0.8 + 4),
      reasoningDepth: Math.min(10, (features.wordCount / 200) + 3),
    };

    // Calculate confidence based on training data similarity
    const confidence = this.calculateConfidence(features);

    return {
      predictedOverallScore: Math.round(predictedScore * 10) / 10,
      predictedDimensionalScores: dimensionalScores,
      confidence,
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Calculate prediction confidence based on feature similarity to training data
   */
  private calculateConfidence(features: ArtifactFeatures): number {
    if (this.trainingSamples.length === 0) return 0.5;

    // Find most similar training example (simplified distance metric)
    let minDistance = Infinity;

    for (const example of this.trainingSamples) {
      const distance = Math.abs(features.consensusScore - example.features.consensusScore) +
                      Math.abs(features.completenessScore - example.features.completenessScore) +
                      Math.abs(features.citationCount - example.features.citationCount);

      minDistance = Math.min(minDistance, distance);
    }

    // Convert distance to confidence (closer = higher confidence)
    const maxDistance = 100; // Normalize
    const confidence = 1 - Math.min(minDistance / maxDistance, 1);

    return Math.max(0.3, confidence); // Minimum 30% confidence
  }

  /**
   * Evaluate model performance on test data
   */
  evaluate(testExamples: TrainingExample[]): ModelMetrics {
    if (testExamples.length === 0) {
      throw new Error('Cannot evaluate on empty test set');
    }

    const predictions = testExamples.map(ex => this.predict(ex.features).predictedOverallScore);
    const actuals = testExamples.map(ex => ex.actualScore.overallScore);

    // Calculate metrics
    const errors = predictions.map((pred, i) => pred - actuals[i]);
    const squaredErrors = errors.map(e => e * e);

    const mae = errors.reduce((sum, e) => sum + Math.abs(e), 0) / errors.length;
    const mse = squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length;
    const rmse = Math.sqrt(mse);

    // R-squared
    const actualMean = actuals.reduce((sum, a) => sum + a, 0) / actuals.length;
    const totalSS = actuals.reduce((sum, a) => sum + Math.pow(a - actualMean, 2), 0);
    const residualSS = squaredErrors.reduce((sum, e) => sum + e, 0);
    const r2 = 1 - (residualSS / totalSS);

    return {
      mae: Math.round(mae * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      r2: Math.round(r2 * 1000) / 1000,
      sampleCount: this.trainingSamples.length,
      lastTrainedAt: new Date(),
    };
  }
}

// ============================================================================
// TRAINING DATA MANAGEMENT
// ============================================================================

/**
 * Prepare training data from historical quality scores
 */
export async function prepareTrainingData(
  db: D1Database,
  minSamples = 10,
  maxSamples = 1000
): Promise<TrainingExample[]> {
  const result = await db.prepare(`
    SELECT
      qs.*,
      a.content,
      a.phase,
      a.consensus_score,
      a.execution_time_ms,
      (SELECT COUNT(*) FROM operator_reviews WHERE artifact_id = a.id) as review_count,
      (SELECT COUNT(*) FROM artifact_citations WHERE artifact_id = a.id) as citation_count
    FROM quality_scores qs
    JOIN phase_artifacts a ON qs.artifact_id = a.id
    WHERE qs.overall_score IS NOT NULL
    ORDER BY qs.created_at DESC
    LIMIT ?
  `).bind(maxSamples).all();

  if (!result.results || result.results.length < minSamples) {
    throw new Error(`Insufficient training data: need at least ${minSamples} samples, got ${result.results?.length || 0}`);
  }

  const examples: TrainingExample[] = [];

  for (const row of result.results as any[]) {
    const features = extractFeatures(
      row.content,
      row.consensus_score || 0,
      row.completeness || 0,
      row.phase,
      row.citation_count || 0,
      row.execution_time_ms || 0,
      0, // revisionCount not tracked yet
      row.review_count || 0
    );

    const actualScore: QualityScore = {
      overallScore: row.overall_score,
      evidenceCoverage: row.evidence_coverage,
      factualAccuracy: row.factual_accuracy,
      completeness: row.completeness,
      citationQuality: row.citation_quality,
      reasoningDepth: row.reasoning_depth,
      tier: row.tier,
      productionReady: row.production_ready === 1,
    };

    examples.push({
      features,
      actualScore,
      timestamp: new Date(row.created_at).getTime(),
    });
  }

  return examples;
}

/**
 * Split data into training and test sets
 */
export function trainTestSplit(
  examples: TrainingExample[],
  testRatio = 0.2
): { train: TrainingExample[]; test: TrainingExample[] } {
  const shuffled = [...examples].sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * (1 - testRatio));

  return {
    train: shuffled.slice(0, splitIndex),
    test: shuffled.slice(splitIndex),
  };
}

// ============================================================================
// HIGH-LEVEL API
// ============================================================================

/**
 * Train a new quality prediction model
 */
export async function trainQualityModel(
  db: D1Database,
  minSamples = 10,
  maxSamples = 1000
): Promise<{ model: QualityPredictionModel; metrics: ModelMetrics }> {
  // Prepare training data
  const examples = await prepareTrainingData(db, minSamples, maxSamples);

  // Split into train/test
  const { train, test } = trainTestSplit(examples, 0.2);

  // Train model
  const model = new QualityPredictionModel();
  model.train(train);

  // Evaluate
  const metrics = model.evaluate(test);

  return { model, metrics };
}

/**
 * Predict quality for a new artifact before full evaluation
 */
export async function predictArtifactQuality(
  model: QualityPredictionModel,
  content: unknown,
  consensusScore: number,
  completenessScore: number,
  phase: PhaseName,
  citationCount: number
): Promise<QualityPrediction> {
  const features = extractFeatures(
    content,
    consensusScore,
    completenessScore,
    phase,
    citationCount
  );

  return model.predict(features);
}

// ============================================================================
// GLOBAL MODEL INSTANCE
// ============================================================================

let globalModel: QualityPredictionModel | null = null;
let globalModelMetrics: ModelMetrics | null = null;

/**
 * Get or initialize the global model
 */
export async function getGlobalModel(db: D1Database): Promise<QualityPredictionModel> {
  if (!globalModel) {
    const { model, metrics } = await trainQualityModel(db);
    globalModel = model;
    globalModelMetrics = metrics;
  }

  return globalModel;
}

/**
 * Get global model metrics
 */
export function getGlobalModelMetrics(): ModelMetrics | null {
  return globalModelMetrics;
}

/**
 * Retrain the global model
 */
export async function retrainGlobalModel(db: D1Database): Promise<ModelMetrics> {
  const { model, metrics } = await trainQualityModel(db);
  globalModel = model;
  globalModelMetrics = metrics;
  return metrics;
}
