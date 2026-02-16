import { cfFetch, getAccountId } from './client.js';
import { getConfig } from '../config.js';

interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface VectorizeQueryResult {
  matches: VectorizeMatch[];
  count: number;
}

interface VectorizeUpsertResult {
  mutationId: string;
}

export interface VectorMetadata {
  runId: string;
  phase: string;
  content: string;
  [key: string]: unknown;
}

/**
 * Query the Vectorize index for similar vectors.
 * Note: This requires calling the worker API since Vectorize REST API
 * doesn't support direct queries - queries must go through a Worker.
 *
 * For local mode, we call the planning-machine worker's /api/planning/context endpoint.
 */
export async function queryVectorize(
  query: string,
  runId: string,
  topK: number = 5
): Promise<Array<{ phase: string; content: string; score: number }>> {
  const config = getConfig();

  // For now, we'll use a different approach:
  // Call the deployed worker's context endpoint which handles RAG internally
  // This avoids needing to manage embeddings locally

  // If the worker is deployed, use its API
  // For local development, this would need to call the local dev server
  const workerUrl =
    process.env.PLANNING_WORKER_URL ?? 'http://127.0.0.1:8788';

  const response = await fetch(
    `${workerUrl}/api/planning/runs/${runId}/context`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, topK }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to query context: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{ phase: string; content: string; score: number }>;
  };

  return data.results ?? [];
}

/**
 * Store a vector in Vectorize.
 * Similar to query, this goes through the worker since embedding generation
 * requires Cloudflare AI which isn't available via REST API.
 */
export async function storeVector(
  runId: string,
  phase: string,
  content: string
): Promise<void> {
  const workerUrl =
    process.env.PLANNING_WORKER_URL ?? 'http://127.0.0.1:8788';

  const response = await fetch(
    `${workerUrl}/api/planning/runs/${runId}/artifacts/${phase}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: content,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to store artifact: ${error}`);
  }
}
