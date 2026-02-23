/**
 * Cost Tracking System
 *
 * Monitors and tracks costs across all Cloudflare services:
 * - Workers AI (token usage)
 * - D1 Database (read/write operations)
 * - R2 Storage (storage + bandwidth)
 * - Vectorize (queries + storage)
 * - Workers compute time
 */

// ============================================================================
// TYPES
// ============================================================================

export type CostCategory =
  | 'ai_tokens'
  | 'd1_operations'
  | 'r2_storage'
  | 'r2_bandwidth'
  | 'vectorize_queries'
  | 'vectorize_storage'
  | 'workers_compute'
  | 'kv_operations';

export interface CostEntry {
  id: string;
  category: CostCategory;
  timestamp: number;
  units: number; // Tokens, operations, bytes, etc.
  estimatedCost: number; // USD
  metadata: {
    modelName?: string; // For AI tokens
    operationType?: 'read' | 'write'; // For D1/KV
    artifactId?: string;
    runId?: string;
    phase?: string;
    [key: string]: unknown;
  };
}

export interface CostSummary {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: number;
  endTime: number;
  totalCost: number; // USD
  breakdown: Record<CostCategory, number>; // USD per category
  topCostDrivers: Array<{
    category: CostCategory;
    cost: number;
    percentage: number;
  }>;
  projectedMonthlyCost: number;
}

export interface UsageMetrics {
  aiTokens: {
    total: number;
    byModel: Record<string, number>;
    cost: number;
  };
  d1Operations: {
    reads: number;
    writes: number;
    cost: number;
  };
  r2: {
    storageBytes: number;
    bandwidthBytes: number;
    cost: number;
  };
  vectorize: {
    queries: number;
    dimensionsStored: number;
    cost: number;
  };
  workers: {
    requests: number;
    cpuTimeMs: number;
    cost: number;
  };
}

// ============================================================================
// PRICING (as of 2024 - update periodically)
// ============================================================================

const PRICING = {
  // Workers AI (per 1K tokens)
  ai: {
    '@cf/meta/llama-3-8b-instruct': 0.00005, // $0.05 per 1M tokens
    '@cf/mistral/mistral-7b-instruct': 0.00005,
    '@cf/anthropic/claude-3-haiku': 0.00025, // $0.25 per 1M tokens (input)
    '@cf/baai/bge-small-en-v1.5': 0.00001, // Embeddings
  },

  // D1 Database
  d1: {
    read: 1.0 / 1_000_000, // $1 per 1M reads
    write: 1.0 / 100_000, // $1 per 100K writes
    storage: 5.0 / (1024 * 1024 * 1024), // $5/GB/month (pro-rated)
  },

  // R2 Storage
  r2: {
    storage: 0.015 / (1024 * 1024 * 1024), // $0.015/GB/month
    classAOperations: 4.50 / 1_000_000, // $4.50 per 1M (writes, list)
    classBOperations: 0.36 / 1_000_000, // $0.36 per 1M (reads)
  },

  // Vectorize
  vectorize: {
    query: 0.04 / 1_000_000, // $0.04 per 1M queries
    storage: 0.04 / 1_000_000, // $0.04 per 1M dimensions stored/month
  },

  // Workers
  workers: {
    request: 0.15 / 1_000_000, // $0.15 per 1M requests
    cpuTime: 0.02 / 1_000_000, // $0.02 per 1M CPU milliseconds
  },

  // KV
  kv: {
    read: 0.50 / 10_000_000, // $0.50 per 10M reads
    write: 5.00 / 1_000_000, // $5.00 per 1M writes
    delete: 5.00 / 1_000_000, // $5.00 per 1M deletes
    list: 5.00 / 1_000_000, // $5.00 per 1M lists
    storage: 0.50 / (1024 * 1024 * 1024), // $0.50/GB/month
  },
};

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate cost for AI token usage
 */
export function calculateAiCost(modelName: string, tokens: number): number {
  const rate = PRICING.ai[modelName as keyof typeof PRICING.ai] || 0.0001; // Default rate
  return (tokens / 1000) * rate;
}

/**
 * Calculate cost for D1 operations
 */
export function calculateD1Cost(reads: number, writes: number): number {
  return reads * PRICING.d1.read + writes * PRICING.d1.write;
}

/**
 * Calculate cost for R2 operations
 */
export function calculateR2Cost(
  storageBytes: number,
  bandwidthBytes: number,
  writes: number,
  reads: number
): number {
  const storageCost = storageBytes * PRICING.r2.storage;
  const writeCost = writes * PRICING.r2.classAOperations;
  const readCost = reads * PRICING.r2.classBOperations;

  return storageCost + writeCost + readCost;
}

/**
 * Calculate cost for Vectorize usage
 */
export function calculateVectorizeCost(queries: number, dimensionsStored: number): number {
  return queries * PRICING.vectorize.query + dimensionsStored * PRICING.vectorize.storage;
}

/**
 * Calculate cost for Workers usage
 */
export function calculateWorkersCost(requests: number, cpuTimeMs: number): number {
  return requests * PRICING.workers.request + cpuTimeMs * PRICING.workers.cpuTime;
}

/**
 * Calculate cost for KV operations
 */
export function calculateKVCost(
  reads: number,
  writes: number,
  deletes: number,
  lists: number
): number {
  return (
    reads * PRICING.kv.read +
    writes * PRICING.kv.write +
    deletes * PRICING.kv.delete +
    lists * PRICING.kv.list
  );
}

// ============================================================================
// COST TRACKING
// ============================================================================

/**
 * Record cost entry to database
 */
export async function recordCost(db: D1Database, entry: Omit<CostEntry, 'id'>): Promise<string> {
  const id = crypto.randomUUID();

  await db
    .prepare(
      `
    INSERT INTO cost_tracking (id, category, timestamp, units, estimated_cost, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      id,
      entry.category,
      entry.timestamp,
      entry.units,
      entry.estimatedCost,
      JSON.stringify(entry.metadata)
    )
    .run();

  return id;
}

/**
 * Track AI token usage
 */
export async function trackAiTokens(
  db: D1Database,
  modelName: string,
  tokens: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const cost = calculateAiCost(modelName, tokens);

  await recordCost(db, {
    category: 'ai_tokens',
    timestamp: Date.now(),
    units: tokens,
    estimatedCost: cost,
    metadata: {
      modelName,
      ...metadata,
    },
  });
}

/**
 * Track D1 database operations
 */
export async function trackD1Operations(
  db: D1Database,
  operationType: 'read' | 'write',
  count: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const cost =
    operationType === 'read'
      ? count * PRICING.d1.read
      : count * PRICING.d1.write;

  await recordCost(db, {
    category: 'd1_operations',
    timestamp: Date.now(),
    units: count,
    estimatedCost: cost,
    metadata: {
      operationType,
      ...metadata,
    },
  });
}

/**
 * Track R2 storage operations
 */
export async function trackR2Operations(
  db: D1Database,
  bytes: number,
  operationType: 'storage' | 'bandwidth',
  metadata?: Record<string, unknown>
): Promise<void> {
  const category = operationType === 'storage' ? 'r2_storage' : 'r2_bandwidth';
  const cost = bytes * PRICING.r2.storage;

  await recordCost(db, {
    category,
    timestamp: Date.now(),
    units: bytes,
    estimatedCost: cost,
    metadata,
  });
}

/**
 * Track Vectorize queries
 */
export async function trackVectorizeQuery(
  db: D1Database,
  metadata?: Record<string, unknown>
): Promise<void> {
  const cost = PRICING.vectorize.query;

  await recordCost(db, {
    category: 'vectorize_queries',
    timestamp: Date.now(),
    units: 1,
    estimatedCost: cost,
    metadata,
  });
}

/**
 * Track Workers compute time
 */
export async function trackWorkersCompute(
  db: D1Database,
  cpuTimeMs: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const cost = cpuTimeMs * PRICING.workers.cpuTime;

  await recordCost(db, {
    category: 'workers_compute',
    timestamp: Date.now(),
    units: cpuTimeMs,
    estimatedCost: cost,
    metadata,
  });
}

// ============================================================================
// COST REPORTING
// ============================================================================

/**
 * Get cost summary for a time period
 */
export async function getCostSummary(
  db: D1Database,
  startTime: number,
  endTime: number
): Promise<CostSummary> {
  const result = await db
    .prepare(
      `
    SELECT
      category,
      SUM(estimated_cost) as total_cost,
      SUM(units) as total_units,
      COUNT(*) as entry_count
    FROM cost_tracking
    WHERE timestamp >= ? AND timestamp <= ?
    GROUP BY category
  `
    )
    .bind(startTime, endTime)
    .all();

  const breakdown: Record<CostCategory, number> = {
    ai_tokens: 0,
    d1_operations: 0,
    r2_storage: 0,
    r2_bandwidth: 0,
    vectorize_queries: 0,
    vectorize_storage: 0,
    workers_compute: 0,
    kv_operations: 0,
  };

  let totalCost = 0;

  if (result.results) {
    for (const row of result.results as any[]) {
      breakdown[row.category as CostCategory] = row.total_cost;
      totalCost += row.total_cost;
    }
  }

  // Calculate top cost drivers
  const topCostDrivers = Object.entries(breakdown)
    .map(([category, cost]) => ({
      category: category as CostCategory,
      cost,
      percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // Project monthly cost based on current period
  const periodDurationMs = endTime - startTime;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const projectedMonthlyCost = (totalCost / periodDurationMs) * monthMs;

  // Determine period type
  const durationHours = periodDurationMs / (60 * 60 * 1000);
  let period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily';
  if (durationHours <= 1) period = 'hourly';
  else if (durationHours <= 24) period = 'daily';
  else if (durationHours <= 168) period = 'weekly';
  else period = 'monthly';

  return {
    period,
    startTime,
    endTime,
    totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimals
    breakdown,
    topCostDrivers,
    projectedMonthlyCost: Math.round(projectedMonthlyCost * 100) / 100,
  };
}

/**
 * Get detailed usage metrics
 */
export async function getUsageMetrics(
  db: D1Database,
  startTime: number,
  endTime: number
): Promise<UsageMetrics> {
  // AI Tokens
  const aiResult = await db
    .prepare(
      `
    SELECT
      metadata,
      SUM(units) as total_tokens,
      SUM(estimated_cost) as total_cost
    FROM cost_tracking
    WHERE category = 'ai_tokens'
    AND timestamp >= ? AND timestamp <= ?
    GROUP BY metadata
  `
    )
    .bind(startTime, endTime)
    .all();

  const byModel: Record<string, number> = {};
  let totalAiTokens = 0;
  let totalAiCost = 0;

  if (aiResult.results) {
    for (const row of aiResult.results as any[]) {
      const metadata = JSON.parse(row.metadata);
      const modelName = metadata.modelName || 'unknown';
      byModel[modelName] = (byModel[modelName] || 0) + row.total_tokens;
      totalAiTokens += row.total_tokens;
      totalAiCost += row.total_cost;
    }
  }

  // D1 Operations
  const d1Result = await db
    .prepare(
      `
    SELECT
      metadata,
      SUM(units) as total_operations,
      SUM(estimated_cost) as total_cost
    FROM cost_tracking
    WHERE category = 'd1_operations'
    AND timestamp >= ? AND timestamp <= ?
    GROUP BY metadata
  `
    )
    .bind(startTime, endTime)
    .all();

  let d1Reads = 0;
  let d1Writes = 0;
  let d1Cost = 0;

  if (d1Result.results) {
    for (const row of d1Result.results as any[]) {
      const metadata = JSON.parse(row.metadata);
      if (metadata.operationType === 'read') {
        d1Reads += row.total_operations;
      } else {
        d1Writes += row.total_operations;
      }
      d1Cost += row.total_cost;
    }
  }

  // R2 Storage
  const r2Result = await db
    .prepare(
      `
    SELECT
      category,
      SUM(units) as total_bytes,
      SUM(estimated_cost) as total_cost
    FROM cost_tracking
    WHERE category IN ('r2_storage', 'r2_bandwidth')
    AND timestamp >= ? AND timestamp <= ?
    GROUP BY category
  `
    )
    .bind(startTime, endTime)
    .all();

  let r2StorageBytes = 0;
  let r2BandwidthBytes = 0;
  let r2Cost = 0;

  if (r2Result.results) {
    for (const row of r2Result.results as any[]) {
      if (row.category === 'r2_storage') {
        r2StorageBytes = row.total_bytes;
      } else {
        r2BandwidthBytes = row.total_bytes;
      }
      r2Cost += row.total_cost;
    }
  }

  // Vectorize
  const vectorizeResult = await db
    .prepare(
      `
    SELECT
      SUM(units) as total_queries,
      SUM(estimated_cost) as total_cost
    FROM cost_tracking
    WHERE category = 'vectorize_queries'
    AND timestamp >= ? AND timestamp <= ?
  `
    )
    .bind(startTime, endTime)
    .first();

  const vectorizeQueries = (vectorizeResult as any)?.total_queries || 0;
  const vectorizeCost = (vectorizeResult as any)?.total_cost || 0;

  // Workers
  const workersResult = await db
    .prepare(
      `
    SELECT
      SUM(units) as total_cpu_ms,
      SUM(estimated_cost) as total_cost,
      COUNT(*) as total_requests
    FROM cost_tracking
    WHERE category = 'workers_compute'
    AND timestamp >= ? AND timestamp <= ?
  `
    )
    .bind(startTime, endTime)
    .first();

  const workersCpuMs = (workersResult as any)?.total_cpu_ms || 0;
  const workersRequests = (workersResult as any)?.total_requests || 0;
  const workersCost = (workersResult as any)?.total_cost || 0;

  return {
    aiTokens: {
      total: totalAiTokens,
      byModel,
      cost: Math.round(totalAiCost * 10000) / 10000,
    },
    d1Operations: {
      reads: d1Reads,
      writes: d1Writes,
      cost: Math.round(d1Cost * 10000) / 10000,
    },
    r2: {
      storageBytes: r2StorageBytes,
      bandwidthBytes: r2BandwidthBytes,
      cost: Math.round(r2Cost * 10000) / 10000,
    },
    vectorize: {
      queries: vectorizeQueries,
      dimensionsStored: 0, // Would need separate tracking
      cost: Math.round(vectorizeCost * 10000) / 10000,
    },
    workers: {
      requests: workersRequests,
      cpuTimeMs: workersCpuMs,
      cost: Math.round(workersCost * 10000) / 10000,
    },
  };
}

/**
 * Get cost trends over time
 */
export async function getCostTrends(
  db: D1Database,
  days: number = 30
): Promise<Array<{ date: string; cost: number }>> {
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  const result = await db
    .prepare(
      `
    SELECT
      DATE(timestamp / 1000, 'unixepoch') as date,
      SUM(estimated_cost) as daily_cost
    FROM cost_tracking
    WHERE timestamp >= ? AND timestamp <= ?
    GROUP BY date
    ORDER BY date ASC
  `
    )
    .bind(startTime, endTime)
    .all();

  if (!result.results) return [];

  return result.results.map((row: any) => ({
    date: row.date,
    cost: Math.round(row.daily_cost * 10000) / 10000,
  }));
}

/**
 * Get cost breakdown by artifact/run
 */
export async function getCostByArtifact(
  db: D1Database,
  artifactId: string
): Promise<{ totalCost: number; breakdown: Record<CostCategory, number> }> {
  const result = await db
    .prepare(
      `
    SELECT
      category,
      SUM(estimated_cost) as total_cost
    FROM cost_tracking
    WHERE metadata LIKE ?
    GROUP BY category
  `
    )
    .bind(`%"artifactId":"${artifactId}"%`)
    .all();

  const breakdown: Record<CostCategory, number> = {
    ai_tokens: 0,
    d1_operations: 0,
    r2_storage: 0,
    r2_bandwidth: 0,
    vectorize_queries: 0,
    vectorize_storage: 0,
    workers_compute: 0,
    kv_operations: 0,
  };

  let totalCost = 0;

  if (result.results) {
    for (const row of result.results as any[]) {
      breakdown[row.category as CostCategory] = row.total_cost;
      totalCost += row.total_cost;
    }
  }

  return {
    totalCost: Math.round(totalCost * 10000) / 10000,
    breakdown,
  };
}
