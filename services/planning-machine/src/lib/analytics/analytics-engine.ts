/**
 * Advanced Analytics Engine
 *
 * Provides advanced analytics capabilities:
 * - Anomaly detection
 * - Predictive forecasting
 * - Usage pattern analysis
 * - Performance trends
 * - Statistical insights
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSeries {
  timestamps: number[];
  values: number[];
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    timestamp: number;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  totalAnomalies: number;
  anomalyRate: number; // Percentage
}

export interface ForecastResult {
  predictions: Array<{
    timestamp: number;
    value: number;
    confidenceLower: number;
    confidenceUpper: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
}

export interface UsagePattern {
  hourlyDistribution: number[]; // 24 values
  dayOfWeekDistribution: number[]; // 7 values
  peakHours: number[];
  peakDays: number[];
  averageUsage: number;
  medianUsage: number;
  stdDeviation: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface StatisticalSummary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number | null;
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDeviation: number;
  skewness: number;
  kurtosis: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies using statistical methods (Z-score)
 */
export function detectAnomalies(
  timeSeries: TimeSeries,
  threshold = 3 // Number of standard deviations
): AnomalyDetectionResult {
  const { values } = timeSeries;

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomalies
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > threshold) {
      const deviation = value - mean;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      if (zScore > 5) severity = 'critical';
      else if (zScore > 4) severity = 'high';
      else if (zScore > 3.5) severity = 'medium';

      anomalies.push({
        timestamp: timeSeries.timestamps[i],
        value,
        expectedValue: mean,
        deviation,
        severity,
      });
    }
  }

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    anomalyRate: (anomalies.length / values.length) * 100,
  };
}

/**
 * Detect anomalies using moving average method
 */
export function detectAnomaliesMovingAverage(
  timeSeries: TimeSeries,
  windowSize = 7,
  threshold = 2
): AnomalyDetectionResult {
  const { values, timestamps } = timeSeries;
  const anomalies: AnomalyDetectionResult['anomalies'] = [];

  for (let i = windowSize; i < values.length; i++) {
    // Calculate moving average and std dev
    const window = values.slice(i - windowSize, i);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);

    const value = values[i];
    const deviation = Math.abs(value - avg);

    if (deviation > threshold * stdDev && stdDev > 0) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const zScore = deviation / stdDev;

      if (zScore > 5) severity = 'critical';
      else if (zScore > 4) severity = 'high';
      else if (zScore > 3) severity = 'medium';

      anomalies.push({
        timestamp: timestamps[i],
        value,
        expectedValue: avg,
        deviation: value - avg,
        severity,
      });
    }
  }

  return {
    anomalies,
    totalAnomalies: anomalies.length,
    anomalyRate: (anomalies.length / (values.length - windowSize)) * 100,
  };
}

// ============================================================================
// PREDICTIVE FORECASTING
// ============================================================================

/**
 * Simple linear regression forecast
 */
export function forecastLinearRegression(
  timeSeries: TimeSeries,
  periodsAhead: number
): ForecastResult {
  const { timestamps, values } = timeSeries;
  const n = values.length;

  // Normalize timestamps to indices
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  // Calculate linear regression coefficients
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate residuals for confidence interval
  const residuals = y.map((val, i) => val - (slope * x[i] + intercept));
  const mse =
    residuals.reduce((sum, res) => sum + res * res, 0) / (n - 2);
  const rmse = Math.sqrt(mse);

  // Generate predictions
  const lastTimestamp = timestamps[timestamps.length - 1];
  const timestampDiff =
    timestamps.length > 1
      ? timestamps[timestamps.length - 1] - timestamps[timestamps.length - 2]
      : 3600000; // 1 hour default

  const predictions = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const xValue = n + i - 1;
    const predictedValue = slope * xValue + intercept;
    const timestamp = lastTimestamp + i * timestampDiff;

    predictions.push({
      timestamp,
      value: Math.max(0, predictedValue), // Clamp to non-negative
      confidenceLower: Math.max(0, predictedValue - 1.96 * rmse),
      confidenceUpper: predictedValue + 1.96 * rmse,
    });
  }

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(slope) > 0.01) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }

  return {
    predictions,
    trend,
    seasonality: false, // Simple linear regression doesn't capture seasonality
  };
}

/**
 * Exponential smoothing forecast
 */
export function forecastExponentialSmoothing(
  timeSeries: TimeSeries,
  periodsAhead: number,
  alpha = 0.3
): ForecastResult {
  const { timestamps, values } = timeSeries;

  // Apply exponential smoothing
  const smoothed: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
  }

  // Calculate trend
  const recentValues = smoothed.slice(-10);
  const trend =
    recentValues.length > 1
      ? recentValues[recentValues.length - 1] - recentValues[0]
      : 0;

  // Generate predictions
  const lastValue = smoothed[smoothed.length - 1];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const timestampDiff =
    timestamps.length > 1
      ? timestamps[timestamps.length - 1] - timestamps[timestamps.length - 2]
      : 3600000;

  const predictions = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const predictedValue = lastValue + (trend / recentValues.length) * i;
    const timestamp = lastTimestamp + i * timestampDiff;

    // Estimate confidence interval based on recent variance
    const variance =
      recentValues.reduce(
        (sum, val) => sum + Math.pow(val - lastValue, 2),
        0
      ) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    predictions.push({
      timestamp,
      value: Math.max(0, predictedValue),
      confidenceLower: Math.max(0, predictedValue - 1.96 * stdDev),
      confidenceUpper: predictedValue + 1.96 * stdDev,
    });
  }

  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(trend) > 0.01) {
    trendDirection = trend > 0 ? 'increasing' : 'decreasing';
  }

  return {
    predictions,
    trend: trendDirection,
    seasonality: false,
  };
}

// ============================================================================
// USAGE PATTERN ANALYSIS
// ============================================================================

/**
 * Analyze usage patterns from timestamps
 */
export function analyzeUsagePatterns(timestamps: number[]): UsagePattern {
  const hourlyDistribution = new Array(24).fill(0);
  const dayOfWeekDistribution = new Array(7).fill(0);

  // Count by hour and day of week
  timestamps.forEach((ts) => {
    const date = new Date(ts);
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sunday

    hourlyDistribution[hour]++;
    dayOfWeekDistribution[dayOfWeek]++;
  });

  // Find peak hours (top 3)
  const hourlyPairs = hourlyDistribution.map((count, hour) => ({ hour, count }));
  hourlyPairs.sort((a, b) => b.count - a.count);
  const peakHours = hourlyPairs.slice(0, 3).map((p) => p.hour);

  // Find peak days (top 2)
  const dayPairs = dayOfWeekDistribution.map((count, day) => ({ day, count }));
  dayPairs.sort((a, b) => b.count - a.count);
  const peakDays = dayPairs.slice(0, 2).map((p) => p.day);

  // Calculate statistics
  const averageUsage = timestamps.length / Math.max(1, getUniqueDays(timestamps));

  const hourlyCounts = hourlyDistribution.filter((count) => count > 0);
  const medianUsage = getMedian(hourlyCounts);

  const mean =
    hourlyCounts.reduce((sum, count) => sum + count, 0) / hourlyCounts.length;
  const variance =
    hourlyCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
    hourlyCounts.length;
  const stdDeviation = Math.sqrt(variance);

  return {
    hourlyDistribution,
    dayOfWeekDistribution,
    peakHours,
    peakDays,
    averageUsage,
    medianUsage,
    stdDeviation,
  };
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Calculate performance metrics from response times
 */
export function calculatePerformanceMetrics(
  responseTimes: number[]
): PerformanceMetrics {
  const sorted = [...responseTimes].sort((a, b) => a - b);

  const average =
    responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  const p50 = getPercentile(sorted, 50);
  const p95 = getPercentile(sorted, 95);
  const p99 = getPercentile(sorted, 99);

  // Assume error if response time is extremely high (>30s)
  const errors = responseTimes.filter((time) => time > 30000).length;
  const errorRate = (errors / responseTimes.length) * 100;

  // Calculate throughput (requests per second)
  const throughput = responseTimes.length; // Simplified

  // Determine trend by comparing recent vs historical
  const midPoint = Math.floor(responseTimes.length / 2);
  const recentAvg =
    responseTimes
      .slice(midPoint)
      .reduce((sum, time) => sum + time, 0) /
    (responseTimes.length - midPoint);
  const historicalAvg =
    responseTimes
      .slice(0, midPoint)
      .reduce((sum, time) => sum + time, 0) / midPoint;

  let trend: 'improving' | 'degrading' | 'stable' = 'stable';
  const change = recentAvg - historicalAvg;
  if (Math.abs(change) > average * 0.1) {
    // 10% threshold
    trend = change < 0 ? 'improving' : 'degrading';
  }

  return {
    averageResponseTime: Math.round(average),
    p50ResponseTime: Math.round(p50),
    p95ResponseTime: Math.round(p95),
    p99ResponseTime: Math.round(p99),
    errorRate: Math.round(errorRate * 100) / 100,
    throughput,
    trend,
  };
}

// ============================================================================
// STATISTICAL ANALYSIS
// ============================================================================

/**
 * Calculate comprehensive statistical summary
 */
export function calculateStatistics(values: number[]): StatisticalSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;

  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  const median = getMedian(sorted);
  const mode = getMode(values);

  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  const variance =
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDeviation = Math.sqrt(variance);

  const skewness =
    values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDeviation, 3), 0) / n;
  const kurtosis =
    values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDeviation, 4), 0) / n - 3;

  const q1 = getPercentile(sorted, 25);
  const q2 = median;
  const q3 = getPercentile(sorted, 75);

  return {
    count: n,
    sum,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    mode,
    min,
    max,
    range,
    variance: Math.round(variance * 100) / 100,
    stdDeviation: Math.round(stdDeviation * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
    kurtosis: Math.round(kurtosis * 100) / 100,
    quartiles: { q1, q2, q3 },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPercentile(sortedArray: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

function getMedian(sortedArray: number[]): number {
  const mid = Math.floor(sortedArray.length / 2);
  if (sortedArray.length % 2 === 0) {
    return (sortedArray[mid - 1] + sortedArray[mid]) / 2;
  }
  return sortedArray[mid];
}

function getMode(values: number[]): number | null {
  const frequency = new Map<number, number>();

  values.forEach((val) => {
    frequency.set(val, (frequency.get(val) || 0) + 1);
  });

  let maxFreq = 0;
  let mode: number | null = null;

  frequency.forEach((freq, val) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = val;
    }
  });

  return maxFreq > 1 ? mode : null;
}

function getUniqueDays(timestamps: number[]): number {
  const days = new Set<string>();

  timestamps.forEach((ts) => {
    const date = new Date(ts);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.add(dayKey);
  });

  return days.size;
}
