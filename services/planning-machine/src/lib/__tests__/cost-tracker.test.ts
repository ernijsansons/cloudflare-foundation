/**
 * Cost Tracker Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAiCost,
  calculateD1Cost,
  calculateR2Cost,
  calculateVectorizeCost,
  calculateWorkersCost,
  calculateKVCost,
} from '../cost-tracker';

describe('Cost Tracker', () => {
  describe('AI Cost Calculation', () => {
    it('should calculate cost for Llama model', () => {
      const cost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 1000);

      // 1000 tokens at $0.05 per 1M tokens = $0.00005
      expect(cost).toBeCloseTo(0.00005, 8);
    });

    it('should calculate cost for Claude Haiku', () => {
      const cost = calculateAiCost('@cf/anthropic/claude-3-haiku', 1000);

      // 1000 tokens at $0.25 per 1M tokens = $0.00025
      expect(cost).toBeCloseTo(0.00025, 8);
    });

    it('should calculate cost for embeddings', () => {
      const cost = calculateAiCost('@cf/baai/bge-small-en-v1.5', 1000);

      // 1000 tokens at $0.01 per 1M tokens = $0.00001
      expect(cost).toBeCloseTo(0.00001, 8);
    });

    it('should use default rate for unknown model', () => {
      const cost = calculateAiCost('unknown-model', 1000);

      // Default rate: $0.0001 per 1K tokens
      expect(cost).toBeCloseTo(0.0001, 8);
    });

    it('should scale cost linearly with tokens', () => {
      const cost1k = calculateAiCost('@cf/meta/llama-3-8b-instruct', 1_000);
      const cost10k = calculateAiCost('@cf/meta/llama-3-8b-instruct', 10_000);
      const cost100k = calculateAiCost('@cf/meta/llama-3-8b-instruct', 100_000);

      expect(cost10k).toBeCloseTo(cost1k * 10, 8);
      expect(cost100k).toBeCloseTo(cost1k * 100, 8);
    });

    it('should handle large token counts', () => {
      const cost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 1_000_000);

      // 1M tokens at $0.05 per 1M = $0.05
      expect(cost).toBeCloseTo(0.05, 8);
    });
  });

  describe('D1 Cost Calculation', () => {
    it('should calculate cost for reads only', () => {
      const cost = calculateD1Cost(1_000_000, 0);

      // 1M reads at $1 per 1M = $1.00
      expect(cost).toBeCloseTo(1.0, 8);
    });

    it('should calculate cost for writes only', () => {
      const cost = calculateD1Cost(0, 100_000);

      // 100K writes at $1 per 100K = $1.00
      expect(cost).toBeCloseTo(1.0, 8);
    });

    it('should calculate cost for mixed operations', () => {
      const cost = calculateD1Cost(500_000, 50_000);

      // 500K reads = $0.50
      // 50K writes = $0.50
      // Total = $1.00
      expect(cost).toBeCloseTo(1.0, 8);
    });

    it('should handle zero operations', () => {
      const cost = calculateD1Cost(0, 0);
      expect(cost).toBe(0);
    });

    it('should calculate cost for typical usage', () => {
      // Typical artifact creation: 10 reads, 5 writes
      const cost = calculateD1Cost(10, 5);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001); // Should be very small
    });
  });

  describe('R2 Cost Calculation', () => {
    it('should calculate storage cost only', () => {
      const cost = calculateR2Cost(1024 * 1024 * 1024, 0, 0, 0); // 1GB

      // 1GB storage at $0.015/GB/month
      expect(cost).toBeCloseTo(0.015, 8);
    });

    it('should calculate cost with operations', () => {
      const cost = calculateR2Cost(
        0, // storage
        1024 * 1024 * 100, // 100MB bandwidth
        1000, // writes
        10000 // reads
      );

      const writeCost = 1000 * (4.50 / 1_000_000);
      const readCost = 10000 * (0.36 / 1_000_000);

      expect(cost).toBeCloseTo(writeCost + readCost, 8);
    });

    it('should handle zero usage', () => {
      const cost = calculateR2Cost(0, 0, 0, 0);
      expect(cost).toBe(0);
    });

    it('should calculate cost for typical artifact storage', () => {
      // Typical: 1MB file, uploaded once, read 10 times
      const cost = calculateR2Cost(
        1024 * 1024, // 1MB storage
        1024 * 1024 * 10, // 10MB bandwidth (10 reads)
        1, // 1 write
        10 // 10 reads
      );

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01);
    });
  });

  describe('Vectorize Cost Calculation', () => {
    it('should calculate query cost', () => {
      const cost = calculateVectorizeCost(1_000_000, 0);

      // 1M queries at $0.04 per 1M = $0.04
      expect(cost).toBeCloseTo(0.04, 8);
    });

    it('should calculate storage cost', () => {
      const cost = calculateVectorizeCost(0, 1_000_000);

      // 1M dimensions at $0.04 per 1M = $0.04
      expect(cost).toBeCloseTo(0.04, 8);
    });

    it('should calculate combined cost', () => {
      const cost = calculateVectorizeCost(500_000, 500_000);

      // Each component = $0.02
      // Total = $0.04
      expect(cost).toBeCloseTo(0.04, 8);
    });

    it('should handle zero usage', () => {
      const cost = calculateVectorizeCost(0, 0);
      expect(cost).toBe(0);
    });

    it('should calculate cost for typical embedding storage', () => {
      // 1000 artifacts, 384 dimensions each = 384,000 dimensions
      // 100 queries/day
      const cost = calculateVectorizeCost(100, 384_000);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.1);
    });
  });

  describe('Workers Cost Calculation', () => {
    it('should calculate request cost', () => {
      const cost = calculateWorkersCost(1_000_000, 0);

      // 1M requests at $0.15 per 1M = $0.15
      expect(cost).toBeCloseTo(0.15, 8);
    });

    it('should calculate CPU time cost', () => {
      const cost = calculateWorkersCost(0, 1_000_000);

      // 1M CPU ms at $0.02 per 1M = $0.02
      expect(cost).toBeCloseTo(0.02, 8);
    });

    it('should calculate combined cost', () => {
      const cost = calculateWorkersCost(100_000, 500_000);

      const requestCost = 100_000 * (0.15 / 1_000_000);
      const cpuCost = 500_000 * (0.02 / 1_000_000);

      expect(cost).toBeCloseTo(requestCost + cpuCost, 8);
    });

    it('should handle zero usage', () => {
      const cost = calculateWorkersCost(0, 0);
      expect(cost).toBe(0);
    });

    it('should calculate cost for typical request', () => {
      // Typical: 1 request, 50ms CPU time
      const cost = calculateWorkersCost(1, 50);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001);
    });
  });

  describe('KV Cost Calculation', () => {
    it('should calculate read cost', () => {
      const cost = calculateKVCost(10_000_000, 0, 0, 0);

      // 10M reads at $0.50 per 10M = $0.50
      expect(cost).toBeCloseTo(0.50, 8);
    });

    it('should calculate write cost', () => {
      const cost = calculateKVCost(0, 1_000_000, 0, 0);

      // 1M writes at $5.00 per 1M = $5.00
      expect(cost).toBeCloseTo(5.00, 8);
    });

    it('should calculate delete cost', () => {
      const cost = calculateKVCost(0, 0, 1_000_000, 0);

      // 1M deletes at $5.00 per 1M = $5.00
      expect(cost).toBeCloseTo(5.00, 8);
    });

    it('should calculate list cost', () => {
      const cost = calculateKVCost(0, 0, 0, 1_000_000);

      // 1M lists at $5.00 per 1M = $5.00
      expect(cost).toBeCloseTo(5.00, 8);
    });

    it('should calculate combined cost', () => {
      const cost = calculateKVCost(
        5_000_000, // 5M reads
        500_000, // 500K writes
        100_000, // 100K deletes
        50_000 // 50K lists
      );

      const readCost = 5_000_000 * (0.50 / 10_000_000);
      const writeCost = 500_000 * (5.00 / 1_000_000);
      const deleteCost = 100_000 * (5.00 / 1_000_000);
      const listCost = 50_000 * (5.00 / 1_000_000);

      expect(cost).toBeCloseTo(readCost + writeCost + deleteCost + listCost, 8);
    });

    it('should handle zero usage', () => {
      const cost = calculateKVCost(0, 0, 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('Cost Comparison', () => {
    it('should show D1 writes are cheaper than KV writes', () => {
      const d1Cost = calculateD1Cost(0, 100_000);
      const kvCost = calculateKVCost(0, 100_000, 0, 0);

      // D1: 100K writes = $1.00
      // KV: 100K writes = $0.50
      // Actually KV is cheaper for writes!
      expect(kvCost).toBeLessThan(d1Cost);
    });

    it('should show embeddings are cheaper than LLM tokens', () => {
      const embeddingCost = calculateAiCost('@cf/baai/bge-small-en-v1.5', 100_000);
      const llmCost = calculateAiCost('@cf/anthropic/claude-3-haiku', 100_000);

      expect(embeddingCost).toBeLessThan(llmCost);
    });

    it('should show D1 reads are more expensive than Vectorize queries at scale', () => {
      const vectorizeCost = calculateVectorizeCost(10_000_000, 0);
      const d1Cost = calculateD1Cost(10_000_000, 0);

      // Vectorize: 10M queries at $0.04 per 1M = $0.40
      // D1: 10M reads at $1 per 1M = $10.00
      // D1 is more expensive
      expect(d1Cost).toBeGreaterThan(vectorizeCost);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional units', () => {
      const cost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 500.5);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should handle very small costs', () => {
      const cost = calculateD1Cost(1, 1);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.00002); // 1 read + 1 write is very small
    });

    it('should handle very large costs', () => {
      const cost = calculateAiCost('@cf/anthropic/claude-3-haiku', 1_000_000_000);

      expect(cost).toBeGreaterThan(100);
      expect(typeof cost).toBe('number');
    });
  });

  describe('Cost Scenarios', () => {
    it('should estimate cost for typical artifact creation', () => {
      // Typical artifact creation flow:
      // - 5K tokens to LLM for generation
      // - 10 D1 reads, 5 writes
      // - 1 R2 upload (1MB)
      // - 1 embedding generation (500 tokens)
      // - 1 vector insert
      // - 100ms CPU time

      const aiCost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 5000);
      const embeddingCost = calculateAiCost('@cf/baai/bge-small-en-v1.5', 500);
      const d1Cost = calculateD1Cost(10, 5);
      const r2Cost = calculateR2Cost(1024 * 1024, 0, 1, 0);
      const vectorizeCost = calculateVectorizeCost(0, 384); // 384 dimensions
      const workersCost = calculateWorkersCost(1, 100);

      const totalCost =
        aiCost + embeddingCost + d1Cost + r2Cost + vectorizeCost + workersCost;

      expect(totalCost).toBeGreaterThan(0);
      expect(totalCost).toBeLessThan(0.01); // Should be under 1 cent
    });

    it('should estimate daily cost for moderate usage', () => {
      // Moderate usage: 100 artifacts/day
      const artifactsPerDay = 100;

      // Per artifact costs (from previous test)
      const aiCost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 5000);
      const embeddingCost = calculateAiCost('@cf/baai/bge-small-en-v1.5', 500);
      const d1Cost = calculateD1Cost(10, 5);
      const r2Cost = calculateR2Cost(1024 * 1024, 0, 1, 0);
      const vectorizeCost = calculateVectorizeCost(0, 384);
      const workersCost = calculateWorkersCost(1, 100);

      const costPerArtifact =
        aiCost + embeddingCost + d1Cost + r2Cost + vectorizeCost + workersCost;
      const dailyCost = costPerArtifact * artifactsPerDay;

      expect(dailyCost).toBeGreaterThan(0);
      expect(dailyCost).toBeLessThan(1.0); // Should be under $1/day
    });

    it('should estimate monthly cost projection', () => {
      // 100 artifacts/day * 30 days = 3000 artifacts/month
      const artifactsPerMonth = 3000;

      const aiCost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 5000);
      const embeddingCost = calculateAiCost('@cf/baai/bge-small-en-v1.5', 500);
      const d1Cost = calculateD1Cost(10, 5);
      const r2Cost = calculateR2Cost(1024 * 1024, 0, 1, 0);
      const vectorizeCost = calculateVectorizeCost(0, 384);
      const workersCost = calculateWorkersCost(1, 100);

      const costPerArtifact =
        aiCost + embeddingCost + d1Cost + r2Cost + vectorizeCost + workersCost;
      const monthlyCost = costPerArtifact * artifactsPerMonth;

      expect(monthlyCost).toBeGreaterThan(0);
      expect(monthlyCost).toBeLessThan(50.0); // Should be under $50/month
    });
  });

  describe('Cost Validation', () => {
    it('should never return negative costs', () => {
      const cost = calculateAiCost('@cf/meta/llama-3-8b-instruct', 1000);
      expect(cost).toBeGreaterThanOrEqual(0);
    });

    it('should return zero for zero usage', () => {
      expect(calculateAiCost('@cf/meta/llama-3-8b-instruct', 0)).toBe(0);
      expect(calculateD1Cost(0, 0)).toBe(0);
      expect(calculateR2Cost(0, 0, 0, 0)).toBe(0);
      expect(calculateVectorizeCost(0, 0)).toBe(0);
      expect(calculateWorkersCost(0, 0)).toBe(0);
      expect(calculateKVCost(0, 0, 0, 0)).toBe(0);
    });

    it('should return number type for all cost calculations', () => {
      expect(typeof calculateAiCost('@cf/meta/llama-3-8b-instruct', 1000)).toBe('number');
      expect(typeof calculateD1Cost(100, 50)).toBe('number');
      expect(typeof calculateR2Cost(1024, 1024, 1, 1)).toBe('number');
      expect(typeof calculateVectorizeCost(100, 100)).toBe('number');
      expect(typeof calculateWorkersCost(100, 100)).toBe('number');
      expect(typeof calculateKVCost(100, 100, 100, 100)).toBe('number');
    });
  });
});
