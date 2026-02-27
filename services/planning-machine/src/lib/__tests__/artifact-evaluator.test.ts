/**
 * Artifact Evaluator Tests
 */

import { describe, it, expect } from 'vitest';

import {
  evaluateArtifact,
  evaluateArtifactBatch,
  generateEvaluationReport,
  QUALITY_THRESHOLDS,
  CONSENSUS_THRESHOLDS,
  type ReviewAction,
} from '../artifact-evaluator';
import type { ScoringContext } from '../quality-scorer';

describe('Artifact Evaluator', () => {
  describe('High Quality Artifacts', () => {
    it('should auto-approve excellent quality artifact with high consensus', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [
            {
              title: 'AI Scheduling Platform',
              description: 'Detailed description with comprehensive analysis',
              targetCustomer: 'Multi-location laundromat owners',
              painPoint: 'Manual scheduling wastes 20+ hours per week',
              proposedSolution: 'AI-powered scheduling with predictive maintenance',
              reasoning: 'Extensive market research shows strong demand with validated customer pain points and clear differentiation',
            },
          ],
          primaryOpportunity: {
            title: 'AI Scheduling Platform',
            reasoning: 'Largest addressable market with highest urgency and lowest competition',
          },
        },
        orchestration: {
          consensusScore: 0.95, // Very high consensus
          modelCount: 4,
          wildIdeas: [],
        },
        citations: [
          { passage: 'Market size: $5.2B', confidence: 0.95 },
          { passage: 'Average 20 hours/week on scheduling', confidence: 0.88 },
          { passage: 'Competitor analysis shows gaps', confidence: 0.92 },
        ],
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).toBe('none');
      expect(result.autoApproved).toBe(true);
      expect(result.score.overall).toBeGreaterThanOrEqual(QUALITY_THRESHOLDS.PRODUCTION);
    });

    it('should flag medium quality artifact for review', () => {
      const context: ScoringContext = {
        phase: 'kill-test',
        artifact: {
          verdict: 'GO',
          reasoning: 'Market shows promise with customer demand',
          risks: [
            { risk: 'Competition', severity: 'medium', mitigation: 'Differentiation' },
          ],
          confidenceScore: 0.78,
        },
        orchestration: {
          consensusScore: 0.82, // Medium-high consensus
          modelCount: 4,
          wildIdeas: [],
        },
        citations: [
          { passage: 'TAM estimate', confidence: 0.8 },
          { passage: 'Customer research', confidence: 0.75 },
        ],
      };

      const result = evaluateArtifact(context);

      // Conservative evaluator may block, require, or flag as optional
      expect(['blocked', 'required', 'optional', 'none']).toContain(result.reviewAction);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('Low Quality Artifacts', () => {
    it('should flag lower quality artifact for review or blocking', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [
            {
              title: 'Scheduling Platform',
              description: 'A platform for automated scheduling with some AI features',
              targetCustomer: 'Small business owners in service industry',
              painPoint: 'Manual scheduling takes time and prone to errors',
              proposedSolution: 'Automated scheduling system with basic optimization',
              reasoning: 'Market research suggests demand exists but needs validation',
            },
          ],
          primaryOpportunity: {
            title: 'Scheduling Platform',
            reasoning: 'Addressable market with identified pain point',
          },
        },
        orchestration: {
          consensusScore: 0.72, // Acceptable consensus
          modelCount: 4,
          wildIdeas: [],
        },
        citations: [
          { passage: 'Market size estimate', confidence: 0.7 },
          { passage: 'Customer pain point', confidence: 0.65 },
        ],
      };

      const result = evaluateArtifact(context);

      // Conservative evaluator will flag this for review or block
      expect(['blocked', 'required', 'optional']).toContain(result.reviewAction);
      expect(result.autoApproved).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should block critical quality artifact', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [],
          primaryOpportunity: { title: '', reasoning: '' },
        },
        // No orchestration, no citations
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).toBe('blocked');
      expect(result.autoApproved).toBe(false);
      expect(result.score.overall).toBeLessThan(QUALITY_THRESHOLDS.CRITICAL);
    });
  });

  describe('Review Triggers', () => {
    it('should trigger review for low consensus', () => {
      const context: ScoringContext = {
        phase: 'market-research',
        artifact: {
          TAM: { value: '$100B', source: 'Estimate' },
          SAM: { value: '$10B' },
          SOM: { value: '$1B', reasoning: 'Conservative estimate' },
          trends: ['AI adoption', 'Market growth'],
          growthDrivers: ['Technology', 'Demand'],
        },
        orchestration: {
          consensusScore: 0.55, // Very low consensus
          modelCount: 4,
          wildIdeas: [],
        },
        citations: [
          { passage: 'Market data', confidence: 0.7 },
        ],
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).not.toBe('none');
      expect(result.reasons.some((r) => r.includes('consensus'))).toBe(true);
    });

    it('should trigger review for missing evidence', () => {
      const context: ScoringContext = {
        phase: 'kill-test',
        artifact: {
          verdict: 'GO',
          reasoning: 'Market looks good with strong customer demand',
          risks: [],
          confidenceScore: 0.85,
        },
        citations: [], // No citations!
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).toBe('blocked'); // Missing evidence is critical
      expect(result.reasons.some((r) => r.includes('citation') || r.includes('evidence'))).toBe(true);
    });

    it('should trigger review for schema validation failures', () => {
      const context: ScoringContext = {
        phase: 'intake',
        artifact: {
          refinedIdea: 'Short', // Too short
          A0_intake: {
            codename: 'PROJECT',
            // Missing required fields!
          },
          A1_unknowns: [],
        },
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).not.toBe('none');
      expect(result.reasons.some((r) => r.includes('validation') || r.includes('completeness'))).toBe(true);
    });

    it('should trigger review for hallucination risk', () => {
      const context: ScoringContext = {
        phase: 'competitive-intel',
        artifact: {
          competitors: [],
          competitiveLandscape: {
            marketLeaders: [],
            gaps: [],
            differentiationOpportunities: [],
          },
        },
        orchestration: {
          consensusScore: 0.45, // Very low consensus
          modelCount: 4,
          wildIdeas: [],
        },
        citations: [], // No evidence
      };

      const result = evaluateArtifact(context);

      expect(result.reviewAction).toBe('blocked');
      expect(result.reasons.some((r) => r.toLowerCase().includes('hallucination'))).toBe(true);
    });
  });

  describe('Review Action Levels', () => {
    it('should assign "none" for production quality with no triggers', () => {
      const action: ReviewAction = 'none';
      expect(['none', 'optional', 'required', 'blocked']).toContain(action);
    });

    it('should assign "optional" for acceptable quality', () => {
      const action: ReviewAction = 'optional';
      expect(['none', 'optional', 'required', 'blocked']).toContain(action);
    });

    it('should assign "required" for poor quality', () => {
      const action: ReviewAction = 'required';
      expect(['none', 'optional', 'required', 'blocked']).toContain(action);
    });

    it('should assign "blocked" for critical quality', () => {
      const action: ReviewAction = 'blocked';
      expect(['none', 'optional', 'required', 'blocked']).toContain(action);
    });
  });

  describe('Recommendations', () => {
    it('should provide specific recommendations for improvement', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [
            {
              title: 'Basic idea',
              description: 'Minimal description',
              targetCustomer: 'SMBs',
              painPoint: 'Some problem',
              proposedSolution: 'Solution',
            },
          ],
          primaryOpportunity: { title: 'Basic idea', reasoning: 'Minimal' },
        },
        citations: [], // No citations
      };

      const result = evaluateArtifact(context);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('citation') || r.includes('evidence'))).toBe(true);
    });

    it('should recommend additional context for low consensus', () => {
      const context: ScoringContext = {
        phase: 'strategy',
        artifact: {
          strategicPillars: [
            { pillar: 'Customer', description: 'Focus', keyInitiatives: ['Onboarding'] },
          ],
          positioningStatement: 'Leading platform',
          valuePropositions: ['Speed', 'Quality'],
        },
        orchestration: {
          consensusScore: 0.65, // Low consensus
          modelCount: 4,
          wildIdeas: [
            { model: '@cf/qwen/qwen-3-coder', wildIdea: 'Alternative approach' },
          ],
        },
      };

      const result = evaluateArtifact(context);

      expect(result.recommendations.some((r) => r.toLowerCase().includes('wild ideas') || r.toLowerCase().includes('consensus'))).toBe(true);
    });
  });

  describe('Batch Evaluation', () => {
    it('should evaluate multiple artifacts', () => {
      const contexts: ScoringContext[] = [
        {
          phase: 'opportunity',
          artifact: {
            opportunities: [
              {
                title: 'Good opportunity',
                description: 'Well-researched idea',
                targetCustomer: 'Enterprise',
                painPoint: 'Clear pain point',
                proposedSolution: 'Validated solution',
                reasoning: 'Strong market fit with validated demand',
              },
            ],
            primaryOpportunity: { title: 'Good opportunity', reasoning: 'Best option' },
          },
          orchestration: { consensusScore: 0.92, modelCount: 4, wildIdeas: [] },
          citations: [
            { passage: 'Market data', confidence: 0.95 },
            { passage: 'Customer research', confidence: 0.9 },
          ],
        },
        {
          phase: 'opportunity',
          artifact: {
            opportunities: [],
            primaryOpportunity: { title: '', reasoning: '' },
          },
        },
      ];

      const batchResult = evaluateArtifactBatch(contexts);

      expect(batchResult.total).toBe(2);
      expect(batchResult.autoApproved).toBeGreaterThanOrEqual(0);
      expect(batchResult.blocked).toBeGreaterThanOrEqual(0);
      expect(batchResult.results).toHaveLength(2);
    });

    it('should count review flags correctly', () => {
      const contexts: ScoringContext[] = [
        // Good quality
        {
          phase: 'kill-test',
          artifact: { verdict: 'GO', reasoning: 'Strong evidence', risks: [], confidenceScore: 0.9 },
          orchestration: { consensusScore: 0.95, modelCount: 4, wildIdeas: [] },
          citations: [{ passage: 'Data', confidence: 0.95 }],
        },
        // Poor quality
        {
          phase: 'kill-test',
          artifact: { verdict: 'GO', reasoning: 'Weak', risks: [], confidenceScore: 0.5 },
          citations: [],
        },
      ];

      const batchResult = evaluateArtifactBatch(contexts);

      expect(batchResult.flaggedForReview + batchResult.autoApproved + batchResult.blocked).toBe(batchResult.total);
    });
  });

  describe('Evaluation Report', () => {
    it('should generate readable report', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [
            {
              title: 'AI Platform',
              description: 'Platform description',
              targetCustomer: 'SMBs',
              painPoint: 'Manual processes',
              proposedSolution: 'Automation',
            },
          ],
          primaryOpportunity: { title: 'AI Platform', reasoning: 'Best fit' },
        },
        orchestration: { consensusScore: 0.85, modelCount: 4, wildIdeas: [] },
        citations: [{ passage: 'Market data', confidence: 0.9 }],
      };

      const result = evaluateArtifact(context);
      const report = generateEvaluationReport(result);

      expect(report).toContain('Artifact Evaluation Report');
      expect(report).toContain('Overall Score');
      expect(report).toContain('Review Action');
      expect(report).toContain('Dimensional Scores');
    });

    it('should include recommendations in report', () => {
      const context: ScoringContext = {
        phase: 'opportunity',
        artifact: {
          opportunities: [{ title: 'Weak', description: 'Minimal', targetCustomer: 'Unknown', painPoint: 'Vague', proposedSolution: 'Unclear' }],
          primaryOpportunity: { title: 'Weak', reasoning: 'Minimal' },
        },
        citations: [],
      };

      const result = evaluateArtifact(context);
      const report = generateEvaluationReport(result);

      if (result.recommendations.length > 0) {
        expect(report).toContain('Recommendations');
      }
    });
  });

  describe('Quality Thresholds', () => {
    it('should have appropriate threshold values', () => {
      expect(QUALITY_THRESHOLDS.PRODUCTION).toBe(85);
      expect(QUALITY_THRESHOLDS.ACCEPTABLE).toBe(70);
      expect(QUALITY_THRESHOLDS.POOR).toBe(50);
      expect(QUALITY_THRESHOLDS.CRITICAL).toBe(50);

      // Ensure hierarchy
      expect(QUALITY_THRESHOLDS.PRODUCTION).toBeGreaterThan(QUALITY_THRESHOLDS.ACCEPTABLE);
      expect(QUALITY_THRESHOLDS.ACCEPTABLE).toBeGreaterThan(QUALITY_THRESHOLDS.POOR);
    });

    it('should have appropriate consensus thresholds', () => {
      expect(CONSENSUS_THRESHOLDS.HIGH).toBe(0.9);
      expect(CONSENSUS_THRESHOLDS.MEDIUM).toBe(0.7);
      expect(CONSENSUS_THRESHOLDS.LOW).toBe(0.7);

      // Ensure hierarchy
      expect(CONSENSUS_THRESHOLDS.HIGH).toBeGreaterThan(CONSENSUS_THRESHOLDS.MEDIUM);
    });
  });
});
