import { cfFetch, getAccountId, getDatabaseId } from './client.js';

interface D1QueryResult {
  results: Array<Record<string, unknown>>;
  success: boolean;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

interface BatchStatement {
  sql: string;
  params?: unknown[];
}

/**
 * Execute a single D1 query
 */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const accountId = getAccountId();
  const databaseId = getDatabaseId();

  const result = await cfFetch<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    }
  );

  // D1 returns an array of results, one per statement
  return (result[0]?.results ?? []) as T[];
}

/**
 * Execute a single D1 statement (INSERT/UPDATE/DELETE)
 */
export async function d1Execute(
  sql: string,
  params: unknown[] = []
): Promise<{ changes: number; lastRowId: number }> {
  const accountId = getAccountId();
  const databaseId = getDatabaseId();

  const result = await cfFetch<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    }
  );

  const meta = result[0]?.meta;
  return {
    changes: meta?.changes ?? 0,
    lastRowId: meta?.last_row_id ?? 0,
  };
}

/**
 * Execute multiple statements in a single batch request.
 * This is more efficient than multiple individual requests.
 * Note: Each statement is executed in order, not in a transaction.
 */
export async function d1Batch(
  statements: BatchStatement[]
): Promise<D1QueryResult[]> {
  if (statements.length === 0) {
    return [];
  }

  const accountId = getAccountId();
  const databaseId = getDatabaseId();

  // D1 batch endpoint expects an array of {sql, params} objects
  const result = await cfFetch<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: JSON.stringify(statements),
    }
  );

  return result;
}

/**
 * Execute multiple queries in a batch and return all results
 */
export async function d1BatchQuery<T = Record<string, unknown>>(
  statements: BatchStatement[]
): Promise<T[][]> {
  const results = await d1Batch(statements);
  return results.map((r) => (r.results ?? []) as T[]);
}

/**
 * Execute multiple statements in a batch and return summary
 */
export async function d1BatchExecute(
  statements: BatchStatement[]
): Promise<Array<{ changes: number; lastRowId: number }>> {
  const results = await d1Batch(statements);
  return results.map((r) => ({
    changes: r.meta?.changes ?? 0,
    lastRowId: r.meta?.last_row_id ?? 0,
  }));
}

/**
 * Helper to create a batch statement
 */
export function stmt(sql: string, params: unknown[] = []): BatchStatement {
  return { sql, params };
}

// Planning-specific queries

export interface PlanningRun {
  id: string;
  idea: string;
  refined_idea: string | null;
  status: string;
  current_phase: string | null;
  config: string | null;
  quality_score: number | null;
  revenue_potential: string | null;
  workflow_instance_id: string | null;
  kill_verdict: string | null;
  pivot_count: number;
  package_key: string | null;
  mode: string;
  created_at: number;
  updated_at: number;
}

export interface PlanningArtifact {
  id: string;
  run_id: string;
  phase: string;
  version: number;
  content: string;
  review_verdict: string | null;
  review_feedback: string | null;
  review_iterations: number;
  overall_score: number | null;
  created_at: number;
}

export async function createRun(
  id: string,
  idea: string,
  mode: 'local' | 'cloud' = 'local'
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await d1Execute(
    `INSERT INTO planning_runs (id, idea, status, mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, idea, 'running', mode, now, now]
  );
}

export async function getRun(id: string): Promise<PlanningRun | null> {
  const results = await d1Query<PlanningRun>(
    `SELECT * FROM planning_runs WHERE id = ?`,
    [id]
  );
  return results[0] ?? null;
}

export async function listRuns(
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<{ runs: PlanningRun[]; total: number }> {
  const { status, limit = 50, offset = 0 } = options;

  let countSql = 'SELECT COUNT(*) as count FROM planning_runs';
  let listSql =
    'SELECT * FROM planning_runs ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const countParams: unknown[] = [];
  const listParams: unknown[] = [limit, offset];

  if (status) {
    countSql += ' WHERE status = ?';
    listSql =
      'SELECT * FROM planning_runs WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
    countParams.push(status);
    listParams.unshift(status);
  }

  const [countResult] = await d1Query<{ count: number }>(countSql, countParams);
  const runs = await d1Query<PlanningRun>(listSql, listParams);

  return {
    runs,
    total: countResult?.count ?? 0,
  };
}

export async function updateRunPhase(id: string, phase: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await d1Execute(
    `UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?`,
    [phase, now, id]
  );
}

export async function updateRunStatus(
  id: string,
  status: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await d1Execute(
    `UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?`,
    [status, now, id]
  );
}

export async function storeArtifact(
  id: string,
  runId: string,
  phase: string,
  content: unknown
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const contentJson = JSON.stringify(content);

  // Check for existing version
  const existing = await d1Query<{ version: number }>(
    `SELECT MAX(version) as version FROM planning_artifacts WHERE run_id = ? AND phase = ?`,
    [runId, phase]
  );
  const version = (existing[0]?.version ?? 0) + 1;

  await d1Execute(
    `INSERT INTO planning_artifacts (id, run_id, phase, version, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, runId, phase, version, contentJson, now]
  );
}

export async function getArtifact(
  runId: string,
  phase: string
): Promise<PlanningArtifact | null> {
  const results = await d1Query<PlanningArtifact>(
    `SELECT * FROM planning_artifacts WHERE run_id = ? AND phase = ? ORDER BY version DESC LIMIT 1`,
    [runId, phase]
  );
  return results[0] ?? null;
}

export async function getAllArtifacts(
  runId: string
): Promise<PlanningArtifact[]> {
  return d1Query<PlanningArtifact>(
    `SELECT * FROM planning_artifacts WHERE run_id = ? ORDER BY created_at ASC`,
    [runId]
  );
}
