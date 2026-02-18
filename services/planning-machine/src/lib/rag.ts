/**
 * RAG — embed artifacts, store in Vectorize, retrieve for later phases
 */

import { runEmbedding } from "./model-router";

const BGE_DIMENSIONS = 768;

export interface RAGDocument {
  id: string;
  runId: string;
  phase: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export async function embedAndStore(
  ai: Ai,
  vectorIndex: VectorizeIndex | undefined,
  db: D1Database,
  doc: RAGDocument
): Promise<void> {
  if (!vectorIndex) return;

  const text = doc.content.length > 8000 ? doc.content.slice(0, 8000) : doc.content;
  const embedding = await runEmbedding(ai, text);

  if (embedding.length !== BGE_DIMENSIONS) {
    console.warn(`Embedding dimension mismatch: expected ${BGE_DIMENSIONS}, got ${embedding.length}`);
    return;
  }

  const id = `planning:${doc.runId}:${doc.phase}`;
  await vectorIndex.upsert([
    {
      id,
      values: embedding,
      metadata: {
        runId: doc.runId,
        phase: doc.phase,
        content: text.slice(0, 1000),
        ...doc.metadata,
      },
    },
  ]);

  await db.prepare(
    `INSERT INTO planning_memory (run_id, category, content, embedding_id, created_at) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(doc.runId, doc.phase, text.slice(0, 2000), id, Math.floor(Date.now() / 1000))
    .run();
}

export async function queryRelevant(
  ai: Ai,
  vectorIndex: VectorizeIndex | undefined,
  runId: string,
  query: string,
  topK: number = 5
): Promise<Array<{ phase: string; content: string; score: number }>> {
  if (!vectorIndex) return [];

  const queryEmbedding = await runEmbedding(ai, query);

  // Request more results to account for post-filtering by runId
  // Vectorize doesn't support metadata filtering in the query itself
  const requestedK = topK * 5;
  const results = await vectorIndex.query(queryEmbedding, {
    topK: requestedK,
    returnMetadata: "all",
  });

  const matches = "matches" in results ? (results as { matches: Array<{ metadata?: Record<string, unknown>; score?: number }> }).matches : [];

  // Filter by runId for run isolation - critical to prevent cross-run data leakage
  // This is a post-query filter since Vectorize doesn't support metadata filtering
  const filteredMatches = matches.filter((m) => m.metadata?.runId === runId);

  // Log warning if we couldn't get enough results after filtering
  if (filteredMatches.length < topK && filteredMatches.length < matches.length) {
    console.warn(
      `RAG: Post-filter isolation reduced results from ${matches.length} to ${filteredMatches.length} for runId ${runId}. ` +
      `Requested ${topK}, got ${filteredMatches.length}. Consider if cross-run leakage is acceptable or implement index-level isolation.`
    );
  }

  return filteredMatches.slice(0, topK).map((m) => ({
    phase: (m.metadata?.phase as string) ?? "unknown",
    content: (m.metadata?.content as string) ?? "",
    score: m.score ?? 0,
  }));
}

export async function getContextForPhase(
  ai: Ai,
  vectorIndex: VectorizeIndex | undefined,
  runId: string,
  currentPhase: string,
  priorOutputs: Record<string, unknown>
): Promise<string> {
  const phasesToQuery = Object.keys(priorOutputs).filter((p) => p !== currentPhase);
  if (phasesToQuery.length === 0) return "";

  const query = JSON.stringify(priorOutputs).slice(0, 500);
  const results = await queryRelevant(ai, vectorIndex, runId, query, 8);

  if (results.length === 0) return "";

  return results
    .map((r) => `[${r.phase}]: ${r.content.slice(0, 500)}`)
    .join("\n\n");
}
