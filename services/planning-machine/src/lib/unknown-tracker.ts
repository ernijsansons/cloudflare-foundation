/**
 * Unknown Tracker
 *
 * Manages knowledge gaps and their resolution throughout the planning process
 */

import type {
  Unknown,
  UnknownCategory,
  UnknownPriority,
  UnknownStatus,
  Handoff,
  HandoffStatus,
} from '@foundation/shared';

// ============================================================================
// UNKNOWN MANAGEMENT
// ============================================================================

export interface CreateUnknownInput {
  runId: string;
  phaseDiscovered: string;
  category: UnknownCategory;
  priority: UnknownPriority;
  question: string;
  context?: string;
  assumptions?: string;
}

export async function createUnknown(
  db: D1Database,
  input: CreateUnknownInput
): Promise<Unknown> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO unknowns (
        id, run_id, phase_discovered, category, priority, status,
        question, context, assumptions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.runId,
      input.phaseDiscovered,
      input.category,
      input.priority,
      'open',
      input.question,
      input.context,
      input.assumptions,
      now,
      now
    )
    .run();

  return {
    id,
    ...input,
    status: 'open',
    createdAt: new Date(now * 1000),
    updatedAt: new Date(now * 1000),
  };
}

export async function answerUnknown(
  db: D1Database,
  unknownId: string,
  answer: string,
  answeredInPhase: string,
  answeredBy: string,
  confidence: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `UPDATE unknowns
      SET status = 'answered', answer = ?, answered_in_phase = ?,
          answered_at = ?, answered_by = ?, confidence = ?, updated_at = ?
      WHERE id = ?`
    )
    .bind(answer, answeredInPhase, now, answeredBy, confidence, now, unknownId)
    .run();
}

export async function getUnresolvedUnknowns(
  db: D1Database,
  runId: string,
  priorityFilter?: UnknownPriority[]
): Promise<Unknown[]> {
  let query = `SELECT * FROM unknowns
    WHERE run_id = ? AND status IN ('open', 'investigating')`;

  if (priorityFilter) {
    const placeholders = priorityFilter.map(() => '?').join(',');
    query += ` AND priority IN (${placeholders})`;
  }

  query += ` ORDER BY
    CASE priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    created_at ASC`;

  const params = priorityFilter ? [runId, ...priorityFilter] : [runId];
  const result = await db.prepare(query).bind(...params).all();

  return result.results.map(row => ({
    id: (row as any).id,
    runId: (row as any).run_id,
    phaseDiscovered: (row as any).phase_discovered,
    category: (row as any).category as UnknownCategory,
    priority: (row as any).priority as UnknownPriority,
    status: (row as any).status as UnknownStatus,
    question: (row as any).question,
    context: (row as any).context || undefined,
    assumptions: (row as any).assumptions || undefined,
    answer: (row as any).answer || undefined,
    answeredInPhase: (row as any).answered_in_phase || undefined,
    answeredAt: (row as any).answered_at ? new Date((row as any).answered_at * 1000) : undefined,
    answeredBy: (row as any).answered_by || undefined,
    confidence: (row as any).confidence || undefined,
    createdAt: new Date((row as any).created_at * 1000),
    updatedAt: new Date((row as any).updated_at * 1000),
  }));
}

// ============================================================================
// HANDOFF MANAGEMENT
// ============================================================================

export interface CreateHandoffInput {
  runId: string;
  fromPhase: string;
  toPhase: string;
  data: Record<string, unknown>;
  artifactId?: string;
  instructions?: string;
  dependencies?: string[];
}

export async function createHandoff(
  db: D1Database,
  input: CreateHandoffInput
): Promise<Handoff> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO handoffs (
        id, run_id, from_phase, to_phase, status,
        artifact_id, data, instructions, dependencies, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.runId,
      input.fromPhase,
      input.toPhase,
      'pending',
      input.artifactId,
      JSON.stringify(input.data),
      input.instructions,
      input.dependencies ? JSON.stringify(input.dependencies) : null,
      now
    )
    .run();

  return {
    id,
    runId: input.runId,
    fromPhase: input.fromPhase,
    toPhase: input.toPhase,
    status: 'pending',
    artifactId: input.artifactId,
    data: input.data,
    instructions: input.instructions,
    dependencies: input.dependencies,
    createdAt: new Date(now * 1000),
  };
}

export async function acceptHandoff(
  db: D1Database,
  handoffId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`UPDATE handoffs SET status = 'accepted', accepted_at = ? WHERE id = ?`)
    .bind(now, handoffId)
    .run();
}

export async function completeHandoff(
  db: D1Database,
  handoffId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`UPDATE handoffs SET status = 'completed', completed_at = ? WHERE id = ?`)
    .bind(now, handoffId)
    .run();
}

export async function getPendingHandoffs(
  db: D1Database,
  toPhase: string
): Promise<Handoff[]> {
  const result = await db
    .prepare(`SELECT * FROM handoffs WHERE to_phase = ? AND status = 'pending' ORDER BY created_at ASC`)
    .bind(toPhase)
    .all();

  return result.results.map(row => ({
    id: (row as any).id,
    runId: (row as any).run_id,
    fromPhase: (row as any).from_phase,
    toPhase: (row as any).to_phase,
    status: (row as any).status as HandoffStatus,
    artifactId: (row as any).artifact_id || undefined,
    data: JSON.parse((row as any).data),
    instructions: (row as any).instructions || undefined,
    dependencies: (row as any).dependencies ? JSON.parse((row as any).dependencies) : undefined,
    createdAt: new Date((row as any).created_at * 1000),
    acceptedAt: (row as any).accepted_at ? new Date((row as any).accepted_at * 1000) : undefined,
    completedAt: (row as any).completed_at ? new Date((row as any).completed_at * 1000) : undefined,
  }));
}
