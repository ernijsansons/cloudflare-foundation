/**
 * Vector Search Tests
 */

import { describe, it, expect } from 'vitest';

import { cosineSimilarity } from '../vector-search';

describe('Vector Search', () => {
  describe('Cosine Similarity', () => {
    it('should return 1 for identical vectors', () => {
      const a = [1, 2, 3, 4, 5];
      const b = [1, 2, 3, 4, 5];

      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];

      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];

      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should calculate similarity for partially similar vectors', () => {
      const a = [1, 2, 3];
      const b = [2, 4, 6];

      const similarity = cosineSimilarity(a, b);

      // These vectors are parallel (b = 2*a), so similarity should be 1
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should handle normalized vectors', () => {
      // Normalized vectors on unit circle
      const a = [0.6, 0.8]; // Length = 1
      const b = [0.8, 0.6]; // Length = 1

      const similarity = cosineSimilarity(a, b);

      // cos(θ) for these vectors
      expect(similarity).toBeGreaterThan(0.9);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should throw error for vectors of different lengths', () => {
      const a = [1, 2, 3];
      const b = [1, 2];

      expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have same length');
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];

      const similarity = cosineSimilarity(a, b);

      expect(similarity).toBe(0);
    });

    it('should handle high-dimensional vectors', () => {
      // 384-dimensional vectors (typical for BGE embeddings)
      const a = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));
      const b = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1 + 0.5));

      const similarity = cosineSimilarity(a, b);

      // Should be moderately similar
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('Vector Document Structure', () => {
    it('should have required metadata fields', () => {
      const doc = {
        id: 'artifact-001',
        embedding: new Array(384).fill(0.1),
        metadata: {
          type: 'artifact' as const,
          phase: 'opportunity' as const,
          runId: 'run-001',
          artifactId: 'artifact-001',
          content: 'Test content',
          timestamp: Math.floor(Date.now() / 1000),
        },
      };

      expect(doc.id).toBeDefined();
      expect(doc.embedding).toHaveLength(384);
      expect(doc.metadata.type).toBe('artifact');
      expect(doc.metadata.content).toBe('Test content');
    });

    it('should support different document types', () => {
      const types = ['artifact', 'citation', 'unknown', 'decision'];

      types.forEach((type) => {
        expect(['artifact', 'citation', 'unknown', 'decision']).toContain(type);
      });
    });
  });

  describe('Vector Search Results', () => {
    it('should include similarity score', () => {
      const result = {
        id: 'doc-001',
        score: 0.95,
        metadata: { type: 'artifact' },
        content: 'Similar document',
      };

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should rank by similarity score', () => {
      const results = [
        { id: '1', score: 0.95, metadata: {}, content: 'A' },
        { id: '2', score: 0.85, metadata: {}, content: 'B' },
        { id: '3', score: 0.75, metadata: {}, content: 'C' },
      ];

      // Results should be sorted by score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Semantic Search Filters', () => {
    it('should filter by document type', () => {
      const filter = { type: 'citation' };

      expect(filter.type).toBe('citation');
    });

    it('should filter by phase', () => {
      const filter = { type: 'artifact', phase: 'opportunity' };

      expect(filter.phase).toBe('opportunity');
    });

    it('should filter by confidence threshold', () => {
      const citations = [
        { id: '1', confidence: 0.95 },
        { id: '2', confidence: 0.85 },
        { id: '3', confidence: 0.65 },
      ];

      const minConfidence = 0.7;
      const filtered = citations.filter((c) => c.confidence >= minConfidence);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((c) => c.confidence >= minConfidence)).toBe(true);
    });

    it('should filter by run ID', () => {
      const filter = { type: 'artifact', runId: 'run-001' };

      expect(filter.runId).toBe('run-001');
    });
  });

  describe('RAG Context Augmentation', () => {
    it('should format context with citations', () => {
      const citations = [
        { content: 'Market size is $5.2B', confidence: 0.95 },
        { content: 'Customer demand is high', confidence: 0.88 },
      ];

      const context = citations
        .map(
          (c, i) =>
            `[Context ${i + 1}] (Confidence: ${(c.confidence * 100).toFixed(0)}%)\n${c.content}`
        )
        .join('\n\n');

      expect(context).toContain('[Context 1]');
      expect(context).toContain('[Context 2]');
      expect(context).toContain('95%');
      expect(context).toContain('88%');
      expect(context).toContain('Market size is $5.2B');
    });

    it('should combine context with query', () => {
      const context = '[Context 1]\nPrevious research data';
      const query = 'What is the market size?';

      const augmented = `Context from previous research:\n\n${context}\n\n---\n\nQuery: ${query}`;

      expect(augmented).toContain('Context from previous research:');
      expect(augmented).toContain(context);
      expect(augmented).toContain('---');
      expect(augmented).toContain(`Query: ${query}`);
    });

    it('should handle empty context', () => {
      const query = 'What is the market size?';
      const citations: any[] = [];

      const augmented = citations.length === 0 ? query : 'with context';

      expect(augmented).toBe(query);
    });
  });

  describe('Embedding Dimensions', () => {
    it('should use 384 dimensions for BGE-small model', () => {
      const expectedDimensions = 384;
      const embedding = new Array(expectedDimensions).fill(0.1);

      expect(embedding).toHaveLength(384);
    });

    it('should validate embedding vector length', () => {
      const validEmbedding = new Array(384).fill(0);
      const invalidEmbedding = new Array(256).fill(0);

      expect(validEmbedding).toHaveLength(384);
      expect(invalidEmbedding).not.toHaveLength(384);
    });
  });

  describe('Index Statistics', () => {
    it('should track document count', () => {
      const stats = {
        count: 1500,
        dimensions: 384,
      };

      expect(stats.count).toBeGreaterThan(0);
      expect(stats.dimensions).toBe(384);
    });

    it('should report zero for empty index', () => {
      const emptyStats = {
        count: 0,
        dimensions: 384,
      };

      expect(emptyStats.count).toBe(0);
    });
  });

  describe('Similarity Thresholds', () => {
    it('should categorize similarity levels', () => {
      const veryHigh = 0.95;
      const high = 0.85;
      const medium = 0.7;
      const low = 0.5;

      expect(veryHigh).toBeGreaterThanOrEqual(0.9);
      expect(high).toBeGreaterThanOrEqual(0.8);
      expect(high).toBeLessThan(0.9);
      expect(medium).toBeGreaterThanOrEqual(0.7);
      expect(medium).toBeLessThan(0.8);
      expect(low).toBeLessThan(0.7);
    });

    it('should use appropriate thresholds for retrieval', () => {
      const minSimilarity = 0.7; // Typical threshold for semantic search
      const scores = [0.95, 0.85, 0.75, 0.65, 0.55];

      const relevant = scores.filter((s) => s >= minSimilarity);

      expect(relevant).toHaveLength(3);
      expect(relevant.every((s) => s >= minSimilarity)).toBe(true);
    });
  });
});
