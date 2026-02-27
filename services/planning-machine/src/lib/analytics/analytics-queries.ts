/**
 * Analytics Database Queries
 *
 * Provides database queries for analytics engine
 */

import {
  detectAnomalies,
  forecastLinearRegression,
  analyzeUsagePatterns,
  calculatePerformanceMetrics,
  calculateStatistics,
  type TimeSeries,
  type AnomalyDetectionResult,
  type ForecastResult,
  type UsagePattern,
  type PerformanceMetrics,
  type StatisticalSummary,
} from './analytics-engine';

// ============================================================================
// QUALITY SCORE ANALYTICS
// ============================================================================

/**
 * Get quality score time series
 */
export async function getQualityScoreTimeSeries(
  db: D1Database,
  days = 30
): Promise<TimeSeries> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT created_at as timestamp, overall_score as value
    FROM quality_scores
    WHERE created_at > ?
    ORDER BY created_at ASC
  `
    )
    .bind(startTime)
    .all();

  const timestamps: number[] = [];
  const values: number[] = [];

  if (result.results) {
    result.results.forEach((row: any) => {
      timestamps.push(row.timestamp);
      values.push(row.value);
    });
  }

  return { timestamps, values };
}

/**
 * Detect quality score anomalies
 */
export async function detectQualityAnomalies(
  db: D1Database,
  days = 30,
  threshold = 3
): Promise<AnomalyDetectionResult> {
  const timeSeries = await getQualityScoreTimeSeries(db, days);
  return detectAnomalies(timeSeries, threshold);
}

/**
 * Forecast future quality scores
 */
export async function forecastQualityScores(
  db: D1Database,
  historicalDays = 30,
  forecastDays = 7
): Promise<ForecastResult> {
  const timeSeries = await getQualityScoreTimeSeries(db, historicalDays);
  return forecastLinearRegression(timeSeries, forecastDays);
}

/**
 * Get quality score statistics by phase
 */
export async function getQualityStatsByPhase(
  db: D1Database,
  phase: string,
  days = 30
): Promise<StatisticalSummary> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT qs.overall_score
    FROM quality_scores qs
    JOIN phase_artifacts pa ON qs.artifact_id = pa.id
    WHERE pa.phase = ?
    AND qs.created_at > ?
  `
    )
    .bind(phase, startTime)
    .all();

  const values = (result.results || []).map((row: any) => row.overall_score);

  if (values.length === 0) {
    // Return empty statistics
    return {
      count: 0,
      sum: 0,
      mean: 0,
      median: 0,
      mode: null,
      min: 0,
      max: 0,
      range: 0,
      variance: 0,
      stdDeviation: 0,
      skewness: 0,
      kurtosis: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 },
    };
  }

  return calculateStatistics(values);
}

// ============================================================================
// COST ANALYTICS
// ============================================================================

/**
 * Get cost time series
 */
export async function getCostTimeSeries(
  db: D1Database,
  days = 30,
  category?: string
): Promise<TimeSeries> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  let query = `
    SELECT DATE(timestamp / 1000, 'unixepoch') as date, SUM(estimated_cost) as value
    FROM cost_tracking
    WHERE timestamp > ?
  `;

  const params: any[] = [startTime];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' GROUP BY date ORDER BY date ASC';

  const result = await db.prepare(query).bind(...params).all();

  const timestamps: number[] = [];
  const values: number[] = [];

  if (result.results) {
    result.results.forEach((row: any) => {
      const date = new Date(row.date);
      timestamps.push(date.getTime());
      values.push(row.value);
    });
  }

  return { timestamps, values };
}

/**
 * Detect cost anomalies
 */
export async function detectCostAnomalies(
  db: D1Database,
  days = 30,
  category?: string
): Promise<AnomalyDetectionResult> {
  const timeSeries = await getCostTimeSeries(db, days, category);
  return detectAnomalies(timeSeries);
}

/**
 * Forecast future costs
 */
export async function forecastCosts(
  db: D1Database,
  historicalDays = 30,
  forecastDays = 7,
  category?: string
): Promise<ForecastResult> {
  const timeSeries = await getCostTimeSeries(db, historicalDays, category);
  return forecastLinearRegression(timeSeries, forecastDays);
}

/**
 * Get cost statistics by category
 */
export async function getCostStatsByCategory(
  db: D1Database,
  days = 30
): Promise<Record<string, StatisticalSummary>> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT category, estimated_cost
    FROM cost_tracking
    WHERE timestamp > ?
  `
    )
    .bind(startTime)
    .all();

  const byCategory: Record<string, number[]> = {};

  if (result.results) {
    result.results.forEach((row: any) => {
      if (!byCategory[row.category]) {
        byCategory[row.category] = [];
      }
      byCategory[row.category].push(row.estimated_cost);
    });
  }

  const stats: Record<string, StatisticalSummary> = {};

  for (const [category, values] of Object.entries(byCategory)) {
    stats[category] = calculateStatistics(values);
  }

  return stats;
}

// ============================================================================
// USAGE ANALYTICS
// ============================================================================

/**
 * Get artifact creation usage patterns
 */
export async function getArtifactUsagePatterns(
  db: D1Database,
  days = 30
): Promise<UsagePattern> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT created_at
    FROM phase_artifacts
    WHERE created_at > ?
  `
    )
    .bind(startTime)
    .all();

  const timestamps = (result.results || []).map((row: any) => row.created_at);

  return analyzeUsagePatterns(timestamps);
}

/**
 * Get operator activity patterns
 */
export async function getOperatorActivityPatterns(
  db: D1Database,
  days = 30
): Promise<UsagePattern> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT timestamp
    FROM operator_audit_log
    WHERE timestamp > ?
  `
    )
    .bind(startTime)
    .all();

  const timestamps = (result.results || []).map((row: any) => row.timestamp);

  return analyzeUsagePatterns(timestamps);
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

/**
 * Get execution time performance metrics
 */
export async function getExecutionTimeMetrics(
  db: D1Database,
  phase?: string,
  days = 30
): Promise<PerformanceMetrics> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  let query = `
    SELECT execution_time_ms
    FROM phase_artifacts
    WHERE created_at > ?
    AND execution_time_ms IS NOT NULL
  `;

  const params: any[] = [startTime];

  if (phase) {
    query += ' AND phase = ?';
    params.push(phase);
  }

  const result = await db.prepare(query).bind(...params).all();

  const responseTimes = (result.results || []).map(
    (row: any) => row.execution_time_ms
  );

  if (responseTimes.length === 0) {
    return {
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      trend: 'stable',
    };
  }

  return calculatePerformanceMetrics(responseTimes);
}

/**
 * Get consensus performance by model
 */
export async function getConsensusPerformanceByModel(
  db: D1Database,
  days = 30
): Promise<Record<string, PerformanceMetrics>> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT model_name, duration_ms
    FROM consensus_model_results
    WHERE timestamp > ?
  `
    )
    .bind(startTime)
    .all();

  const byModel: Record<string, number[]> = {};

  if (result.results) {
    result.results.forEach((row: any) => {
      if (!byModel[row.model_name]) {
        byModel[row.model_name] = [];
      }
      byModel[row.model_name].push(row.duration_ms);
    });
  }

  const metrics: Record<string, PerformanceMetrics> = {};

  for (const [model, times] of Object.entries(byModel)) {
    metrics[model] = calculatePerformanceMetrics(times);
  }

  return metrics;
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

/**
 * Get overall system health trends
 */
export async function getSystemHealthTrends(
  db: D1Database,
  days = 30
): Promise<{
  qualityTrend: 'improving' | 'degrading' | 'stable';
  costTrend: 'increasing' | 'decreasing' | 'stable';
  performanceTrend: 'improving' | 'degrading' | 'stable';
  usageTrend: 'increasing' | 'decreasing' | 'stable';
}> {
  // Quality trend
  const qualityForecast = await forecastQualityScores(db, days, 7);

  // Cost trend
  const costForecast = await forecastCosts(db, days, 7);

  // Performance trend
  const performanceMetrics = await getExecutionTimeMetrics(db, undefined, days);

  // Usage trend (based on artifact creation)
  const usageTimeSeries = await getArtifactUsageTimeSeries(db, days);
  const usageForecast = forecastLinearRegression(usageTimeSeries, 7);

  return {
    qualityTrend: qualityForecast.trend === 'increasing' ? 'improving' : qualityForecast.trend === 'decreasing' ? 'degrading' : 'stable',
    costTrend: costForecast.trend,
    performanceTrend: performanceMetrics.trend,
    usageTrend: usageForecast.trend,
  };
}

/**
 * Get artifact creation time series
 */
async function getArtifactUsageTimeSeries(
  db: D1Database,
  days: number
): Promise<TimeSeries> {
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT DATE(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
    FROM phase_artifacts
    WHERE created_at > ?
    GROUP BY date
    ORDER BY date ASC
  `
    )
    .bind(startTime)
    .all();

  const timestamps: number[] = [];
  const values: number[] = [];

  if (result.results) {
    result.results.forEach((row: any) => {
      const date = new Date(row.date);
      timestamps.push(date.getTime());
      values.push(row.count);
    });
  }

  return { timestamps, values };
}

// ============================================================================
// INSIGHTS & RECOMMENDATIONS
// ============================================================================

/**
 * Generate automated insights
 */
export async function generateInsights(
  db: D1Database,
  days = 30
): Promise<Array<{ type: string; severity: string; message: string; recommendation: string }>> {
  const insights: Array<{
    type: string;
    severity: string;
    message: string;
    recommendation: string;
  }> = [];

  // Check for quality anomalies
  const qualityAnomalies = await detectQualityAnomalies(db, days);
  if (qualityAnomalies.anomalyRate > 10) {
    insights.push({
      type: 'quality',
      severity: 'high',
      message: `High quality score anomaly rate detected: ${qualityAnomalies.anomalyRate.toFixed(1)}%`,
      recommendation:
        'Review recent artifacts with unusual quality scores. Consider adjusting quality thresholds or investigating data quality issues.',
    });
  }

  // Check for cost spikes
  const costAnomalies = await detectCostAnomalies(db, days);
  if (costAnomalies.totalAnomalies > 0) {
    const criticalAnomalies = costAnomalies.anomalies.filter(
      (a) => a.severity === 'critical' || a.severity === 'high'
    );
    if (criticalAnomalies.length > 0) {
      insights.push({
        type: 'cost',
        severity: 'high',
        message: `${criticalAnomalies.length} significant cost spikes detected in the last ${days} days`,
        recommendation:
          'Review cost tracking data for unusual patterns. Consider implementing cost budgets or alerts for specific categories.',
      });
    }
  }

  // Check for performance degradation
  const performanceMetrics = await getExecutionTimeMetrics(db, undefined, days);
  if (performanceMetrics.trend === 'degrading') {
    insights.push({
      type: 'performance',
      severity: 'medium',
      message: `Performance degrading: average response time ${performanceMetrics.averageResponseTime}ms (P95: ${performanceMetrics.p95ResponseTime}ms)`,
      recommendation:
        'Investigate slow queries, optimize database indexes, or consider caching strategies.',
    });
  }

  // Check usage patterns
  const usagePatterns = await getArtifactUsagePatterns(db, days);
  if (usagePatterns.stdDeviation > usagePatterns.averageUsage * 0.5) {
    insights.push({
      type: 'usage',
      severity: 'low',
      message: 'High variability in usage patterns detected',
      recommendation:
        'Usage is inconsistent. Consider implementing resource scaling based on predicted demand.',
    });
  }

  return insights;
}
