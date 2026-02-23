/**
 * Vector Search - Semantic search using Cloudflare Vectorize
 *
 * Provides semantic similarity search for artifacts, citations, and knowledge
 */

import type { PhaseName } from '@foundation/shared';

// ============================================================================
// TYPES
// ============================================================================

export interface VectorSearchResult {
  id: string;
  score: number; // Cosine similarity (0-1)
  metadata: Record<string, unknown>;
  content: string;
}

export interface EmbeddingInput {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: {
    type: 'artifact' | 'citation' | 'unknown' | 'decision';
    phase?: PhaseName;
    runId?: string;
    artifactId?: string;
    content: string;
    timestamp: number;
    [key: string]: unknown;
  };
}

// ============================================================================
// VECTOR OPERATIONS
// ============================================================================

/**
 * Generate text embedding using Cloudflare Workers AI
 *
 * @param ai Workers AI binding
 * @param text Text to embed
 * @returns Embedding vector (384 dimensions for @cf/baai/bge-small-en-v1.5)
 */
export async function generateEmbedding(
  ai: Ai,
  text: string
): Promise<number[]> {
  const response = await ai.run('@cf/baai/bge-small-en-v1.5', {
    text: [text],
  });

  // @ts-expect-error - AI response typing
  return response.data[0] as number[];
}

/**
 * Insert document into vector index
 *
 * @param vectorize Vectorize index binding
 * @param document Document to insert
 */
export async function insertVector(
  vectorize: VectorizeIndex,
  document: VectorDocument
): Promise<void> {
  await vectorize.upsert([
    {
      id: document.id,
      values: document.embedding,
      metadata: document.metadata,
    },
  ]);
}

/**
 * Batch insert documents into vector index
 *
 * @param vectorize Vectorize index binding
 * @param documents Documents to insert
 */
export async function insertVectorBatch(
  vectorize: VectorizeIndex,
  documents: VectorDocument[]
): Promise<void> {
  const vectors = documents.map((doc) => ({
    id: doc.id,
    values: doc.embedding,
    metadata: doc.metadata,
  }));

  await vectorize.upsert(vectors);
}

/**
 * Semantic search for similar documents
 *
 * @param vectorize Vectorize index binding
 * @param queryEmbedding Query embedding vector
 * @param topK Number of results to return
 * @param filter Metadata filter
 * @returns Similar documents with scores
 */
export async function semanticSearch(
  vectorize: VectorizeIndex,
  queryEmbedding: number[],
  topK = 10,
  filter?: Record<string, unknown>
): Promise<VectorSearchResult[]> {
  const results = await vectorize.query(queryEmbedding, {
    topK,
    filter,
    returnMetadata: true,
  });

  return results.matches.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata || {},
    content: (match.metadata?.content as string) || '',
  }));
}

/**
 * Search for documents by text query
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param query Text query
 * @param topK Number of results
 * @param filter Metadata filter
 * @returns Similar documents
 */
export async function searchByText(
  ai: Ai,
  vectorize: VectorizeIndex,
  query: string,
  topK = 10,
  filter?: Record<string, unknown>
): Promise<VectorSearchResult[]> {
  const embedding = await generateEmbedding(ai, query);
  return semanticSearch(vectorize, embedding, topK, filter);
}

// ============================================================================
// ARTIFACT INDEXING
// ============================================================================

/**
 * Index a phase artifact for semantic search
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param artifactId Artifact ID
 * @param phase Phase name
 * @param runId Planning run ID
 * @param content Artifact content (JSON stringified)
 */
export async function indexArtifact(
  ai: Ai,
  vectorize: VectorizeIndex,
  artifactId: string,
  phase: PhaseName,
  runId: string,
  content: unknown
): Promise<void> {
  const contentStr = JSON.stringify(content);
  const embedding = await generateEmbedding(ai, contentStr);

  const document: VectorDocument = {
    id: artifactId,
    embedding,
    metadata: {
      type: 'artifact',
      phase,
      runId,
      artifactId,
      content: contentStr,
      timestamp: Math.floor(Date.now() / 1000),
    },
  };

  await insertVector(vectorize, document);
}

/**
 * Index a citation for semantic search
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param citationId Citation ID
 * @param passage Citation text
 * @param artifactId Source artifact ID
 * @param confidence Citation confidence
 */
export async function indexCitation(
  ai: Ai,
  vectorize: VectorizeIndex,
  citationId: string,
  passage: string,
  artifactId: string,
  confidence: number
): Promise<void> {
  const embedding = await generateEmbedding(ai, passage);

  const document: VectorDocument = {
    id: citationId,
    embedding,
    metadata: {
      type: 'citation',
      artifactId,
      content: passage,
      confidence,
      timestamp: Math.floor(Date.now() / 1000),
    },
  };

  await insertVector(vectorize, document);
}

// ============================================================================
// SEMANTIC SIMILARITY
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity (0-1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Find semantically similar artifacts
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param referenceArtifactId Reference artifact to compare against
 * @param topK Number of similar artifacts to return
 * @returns Similar artifacts with similarity scores
 */
export async function findSimilarArtifacts(
  ai: Ai,
  vectorize: VectorizeIndex,
  referenceArtifactId: string,
  topK = 5
): Promise<VectorSearchResult[]> {
  // Get reference artifact embedding
  const refResult = await vectorize.getByIds([referenceArtifactId]);
  if (refResult.length === 0) {
    throw new Error(`Artifact ${referenceArtifactId} not found in vector index`);
  }

  const refVector = refResult[0].values;

  // Search for similar artifacts
  return semanticSearch(vectorize, refVector, topK + 1, {
    type: 'artifact',
  }).then((results) =>
    // Exclude the reference artifact itself
    results.filter((r) => r.id !== referenceArtifactId).slice(0, topK)
  );
}

// ============================================================================
// CITATION RETRIEVAL
// ============================================================================

/**
 * Retrieve relevant citations for a query
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param query Query text
 * @param topK Number of citations to retrieve
 * @param minConfidence Minimum citation confidence
 * @returns Relevant citations
 */
export async function retrieveRelevantCitations(
  ai: Ai,
  vectorize: VectorizeIndex,
  query: string,
  topK = 5,
  minConfidence = 0.7
): Promise<VectorSearchResult[]> {
  const results = await searchByText(ai, vectorize, query, topK * 2, {
    type: 'citation',
  });

  // Filter by confidence and limit results
  return results
    .filter((r) => (r.metadata.confidence as number) >= minConfidence)
    .slice(0, topK);
}

/**
 * Augment query with retrieved context (RAG)
 *
 * @param ai Workers AI binding
 * @param vectorize Vectorize index binding
 * @param query User query
 * @param topK Number of context items to retrieve
 * @returns Augmented prompt with context
 */
export async function augmentQueryWithContext(
  ai: Ai,
  vectorize: VectorizeIndex,
  query: string,
  topK = 3
): Promise<string> {
  const citations = await retrieveRelevantCitations(ai, vectorize, query, topK);

  if (citations.length === 0) {
    return query;
  }

  const context = citations
    .map(
      (c, i) =>
        `[Context ${i + 1}] (Confidence: ${((c.metadata.confidence as number) * 100).toFixed(0)}%)\n${c.content}`
    )
    .join('\n\n');

  return `Context from previous research:\n\n${context}\n\n---\n\nQuery: ${query}`;
}

// ============================================================================
// INDEX MANAGEMENT
// ============================================================================

/**
 * Delete document from vector index
 *
 * @param vectorize Vectorize index binding
 * @param documentId Document ID to delete
 */
export async function deleteVector(
  vectorize: VectorizeIndex,
  documentId: string
): Promise<void> {
  await vectorize.deleteByIds([documentId]);
}

/**
 * Delete multiple documents from vector index
 *
 * @param vectorize Vectorize index binding
 * @param documentIds Document IDs to delete
 */
export async function deleteVectorBatch(
  vectorize: VectorizeIndex,
  documentIds: string[]
): Promise<void> {
  await vectorize.deleteByIds(documentIds);
}

/**
 * Get index statistics
 *
 * @param vectorize Vectorize index binding
 * @returns Index statistics
 */
export async function getIndexStats(
  vectorize: VectorizeIndex
): Promise<{ count: number; dimensions: number }> {
  const info = await vectorize.describe();
  return {
    count: info.count || 0,
    dimensions: info.dimensions || 384,
  };
}
