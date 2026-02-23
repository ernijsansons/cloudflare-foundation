/**
 * Schema Validator Tests
 *
 * Tests for runtime schema validation of phase outputs
 */

import { describe, it, expect } from 'vitest';
import {
  validatePhaseOutput,
  validateStructure,
  getSchemaForPhase,
  getDefinedPhases,
  extractField,
} from '../schema-validator';

describe('Schema Validator', () => {
  describe('validatePhaseOutput', () => {
    it('should validate correct intake output', () => {
      const validIntake = {
        refinedIdea: 'B2B SaaS for laundromat management',
        A0_intake: {
          codename: 'PROJECT_LAUNDRY',
          thesis: 'Laundromats lack modern management tools',
          targetICP: 'Multi-location laundromat owners',
          coreDirective: 'Build AI-powered scheduling system',
        },
        A1_unknowns: [
          {
            category: 'Market',
            question: 'What is the total addressable market?',
          },
        ],
      };

      const result = validatePhaseOutput('intake', validIntake);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validIntake);
      expect(result.errors).toBeUndefined();
    });

    it('should reject intake output with missing required fields', () => {
      const invalidIntake = {
        refinedIdea: 'Short', // Too short
        A0_intake: {
          codename: 'PROJECT_LAUNDRY',
          // Missing required fields: thesis, targetICP, coreDirective
        },
        A1_unknowns: [], // Empty array is fine, just needs to be present
      };

      const result = validatePhaseOutput('intake', invalidIntake);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors!.some((e) => e.includes('refinedIdea'))).toBe(true);
    });

    it('should validate correct opportunity output', () => {
      const validOpportunity = {
        opportunities: [
          {
            title: 'AI Scheduling Platform',
            description: 'Automated scheduling for laundromats',
            targetCustomer: 'Multi-location owners',
            painPoint: 'Manual scheduling is time-consuming',
            proposedSolution: 'AI-powered scheduling engine',
            estimatedTAM: '$2.5B',
          },
        ],
        primaryOpportunity: {
          title: 'AI Scheduling Platform',
          reasoning: 'Largest market with highest urgency',
        },
      };

      const result = validatePhaseOutput('opportunity', validOpportunity);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validOpportunity);
    });

    it('should reject opportunity output with empty opportunities array', () => {
      const invalidOpportunity = {
        opportunities: [], // Must have at least one
        primaryOpportunity: {
          title: 'AI Scheduling Platform',
          reasoning: 'Largest market with highest urgency',
        },
      };

      const result = validatePhaseOutput('opportunity', invalidOpportunity);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('opportunities'))).toBe(true);
    });

    it('should validate correct kill-test output', () => {
      const validKillTest = {
        verdict: 'GO',
        reasoning:
          'Strong market validation with clear customer pain points and viable solution approach',
        risks: [
          {
            risk: 'Market adoption may be slower than expected',
            severity: 'medium',
            mitigation: 'Start with pilot customers for early validation',
          },
        ],
        confidenceScore: 0.85,
      };

      const result = validatePhaseOutput('kill-test', validKillTest);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validKillTest);
    });

    it('should reject kill-test output with invalid verdict', () => {
      const invalidKillTest = {
        verdict: 'MAYBE', // Invalid enum value
        reasoning: 'Strong market validation',
        risks: [],
        confidenceScore: 0.85,
      };

      const result = validatePhaseOutput('kill-test', invalidKillTest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('verdict'))).toBe(true);
    });

    it('should reject kill-test output with short reasoning', () => {
      const invalidKillTest = {
        verdict: 'GO',
        reasoning: 'Good', // Too short (< 50 chars)
        risks: [],
        confidenceScore: 0.85,
      };

      const result = validatePhaseOutput('kill-test', invalidKillTest);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('reasoning'))).toBe(true);
    });

    it('should validate correct strategy output', () => {
      const validStrategy = {
        strategicPillars: [
          {
            pillar: 'Customer Success',
            description: 'Ensure customer satisfaction',
            keyInitiatives: ['Onboarding program', 'Support system'],
          },
          {
            pillar: 'Product Excellence',
            description: 'Build best-in-class product',
            keyInitiatives: ['Feature development', 'Quality assurance'],
          },
          {
            pillar: 'Market Leadership',
            description: 'Establish market presence',
            keyInitiatives: ['Brand building', 'Thought leadership'],
          },
        ],
        positioningStatement: 'The leading AI-powered platform for laundromat management',
        valuePropositions: [
          'Save 20 hours per week on scheduling',
          'Increase revenue by 15% through optimization',
        ],
      };

      const result = validatePhaseOutput('strategy', validStrategy);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validStrategy);
    });

    it('should reject strategy output with fewer than 3 pillars', () => {
      const invalidStrategy = {
        strategicPillars: [
          {
            pillar: 'Customer Success',
            description: 'Ensure customer satisfaction',
            keyInitiatives: ['Onboarding'],
          },
          {
            pillar: 'Product Excellence',
            description: 'Build best-in-class product',
            keyInitiatives: ['Development'],
          },
        ], // Only 2 pillars, need at least 3
        positioningStatement: 'The leading platform',
        valuePropositions: ['Save time'],
      };

      const result = validatePhaseOutput('strategy', invalidStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('strategicPillars'))).toBe(true);
    });

    it('should validate correct product-design output', () => {
      const validProductDesign = {
        features: [
          {
            name: 'AI Scheduling',
            description: 'Automated scheduling engine',
            priority: 'p0',
            effort: 'l',
          },
        ],
        mvpFeatures: ['AI Scheduling', 'Dashboard'],
        userWorkflows: [
          {
            workflow: 'Schedule maintenance',
            steps: ['Select location', 'Choose time', 'Confirm'],
          },
        ],
      };

      const result = validatePhaseOutput('product-design', validProductDesign);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validProductDesign);
    });

    it('should reject product-design output with invalid priority', () => {
      const invalidProductDesign = {
        features: [
          {
            name: 'AI Scheduling',
            description: 'Automated scheduling engine',
            priority: 'critical', // Invalid enum value
            effort: 'l',
          },
        ],
        mvpFeatures: ['AI Scheduling'],
        userWorkflows: [],
      };

      const result = validatePhaseOutput('product-design', invalidProductDesign);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('priority'))).toBe(true);
    });

    it('should reject product-design output with invalid effort', () => {
      const invalidProductDesign = {
        features: [
          {
            name: 'AI Scheduling',
            description: 'Automated scheduling engine',
            priority: 'p0',
            effort: 'huge', // Invalid enum value
          },
        ],
        mvpFeatures: ['AI Scheduling'],
        userWorkflows: [],
      };

      const result = validatePhaseOutput('product-design', invalidProductDesign);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('effort'))).toBe(true);
    });

    it('should validate correct task-reconciliation output', () => {
      const validTaskReconciliation = {
        tasks: [
          {
            id: 'task-001',
            title: 'Setup authentication system',
            type: 'feature',
            category: 'backend',
            priority: 'p0',
            effort: 'l',
            buildPhase: 0,
            naomiPrompt: 'Create authentication system using JWT tokens with refresh mechanism, including user registration, login, logout, token refresh, and password reset functionality.',
            dependencies: [],
          },
        ],
        marketingTasks: [
          {
            id: 'marketing-001',
            title: 'Create landing page',
            type: 'content',
          },
        ],
        summary: {
          totalTasks: 1,
          byCategory: {
            backend: 1,
          },
          byPriority: {
            p0: 1,
          },
          criticalPath: ['task-001'],
        },
      };

      const result = validatePhaseOutput('task-reconciliation', validTaskReconciliation);

      if (!result.valid) {
        console.error('Validation errors:', result.errors);
      }
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validTaskReconciliation);
    });

    it('should reject task-reconciliation with invalid buildPhase', () => {
      const invalidTaskReconciliation = {
        tasks: [
          {
            id: 'task-001',
            title: 'Setup authentication',
            type: 'feature',
            category: 'backend',
            priority: 'p0',
            effort: 'l',
            buildPhase: 15, // > 10, invalid
            naomiPrompt: 'Create authentication system...',
            dependencies: [],
          },
        ],
        marketingTasks: [],
        summary: {
          totalTasks: 1,
          byCategory: {},
          byPriority: {},
          criticalPath: [],
        },
      };

      const result = validatePhaseOutput('task-reconciliation', invalidTaskReconciliation);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('buildPhase'))).toBe(true);
    });

    it('should reject task-reconciliation with short naomiPrompt', () => {
      const invalidTaskReconciliation = {
        tasks: [
          {
            id: 'task-001',
            title: 'Setup authentication',
            type: 'feature',
            category: 'backend',
            priority: 'p0',
            effort: 'l',
            buildPhase: 0,
            naomiPrompt: 'Short prompt', // < 100 chars
            dependencies: [],
          },
        ],
        marketingTasks: [],
        summary: {
          totalTasks: 1,
          byCategory: {},
          byPriority: {},
          criticalPath: [],
        },
      };

      const result = validatePhaseOutput('task-reconciliation', invalidTaskReconciliation);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('naomiPrompt'))).toBe(true);
    });

    it('should return error for unknown phase', () => {
      const result = validatePhaseOutput('unknown-phase' as any, {});

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('No schema defined for phase');
    });
  });

  describe('validateStructure', () => {
    it('should validate correct intake structure', () => {
      const validIntake = {
        refinedIdea: 'B2B SaaS',
        A0_intake: {},
        A1_unknowns: [],
      };

      const result = validateStructure('intake', validIntake);

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should detect missing fields in intake', () => {
      const invalidIntake = {
        refinedIdea: 'B2B SaaS',
        // Missing A0_intake and A1_unknowns
      };

      const result = validateStructure('intake', invalidIntake);

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('A0_intake');
      expect(result.missingFields).toContain('A1_unknowns');
    });

    it('should validate correct opportunity structure', () => {
      const validOpportunity = {
        opportunities: [],
        primaryOpportunity: {},
      };

      const result = validateStructure('opportunity', validOpportunity);

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should detect missing fields in opportunity', () => {
      const invalidOpportunity = {
        opportunities: [],
        // Missing primaryOpportunity
      };

      const result = validateStructure('opportunity', invalidOpportunity);

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('primaryOpportunity');
    });

    it('should return invalid for non-object input', () => {
      const result = validateStructure('intake', 'not an object');

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('<root>');
    });

    it('should return invalid for null input', () => {
      const result = validateStructure('intake', null);

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('<root>');
    });
  });

  describe('getSchemaForPhase', () => {
    it('should return schema for valid phase', () => {
      const schema = getSchemaForPhase('intake');

      expect(schema).toBeDefined();
      expect(schema).not.toBeNull();
    });

    it('should return null for unknown phase', () => {
      const schema = getSchemaForPhase('unknown-phase' as any);

      expect(schema).toBeNull();
    });
  });

  describe('getDefinedPhases', () => {
    it('should return all defined phases', () => {
      const phases = getDefinedPhases();

      expect(phases).toContain('intake');
      expect(phases).toContain('opportunity');
      expect(phases).toContain('customer-intel');
      expect(phases).toContain('market-research');
      expect(phases).toContain('competitive-intel');
      expect(phases).toContain('kill-test');
      expect(phases).toContain('strategy');
      expect(phases).toContain('product-design');
      expect(phases).toContain('tech-arch');
      expect(phases).toContain('synthesis');
      expect(phases).toContain('task-reconciliation');
      expect(phases.length).toBeGreaterThanOrEqual(11);
    });
  });

  describe('extractField', () => {
    it('should extract top-level field', () => {
      const data = {
        refinedIdea: 'B2B SaaS',
        A0_intake: {},
      };

      const result = extractField(data, 'refinedIdea');

      expect(result).toBe('B2B SaaS');
    });

    it('should extract nested field', () => {
      const data = {
        A0_intake: {
          codename: 'PROJECT_LAUNDRY',
          thesis: 'Laundromats need tools',
        },
      };

      const result = extractField(data, 'A0_intake.codename');

      expect(result).toBe('PROJECT_LAUNDRY');
    });

    it('should extract deeply nested field', () => {
      const data = {
        artifact: {
          version: 2,
          content: {
            primaryOpportunity: {
              title: 'AI Platform',
            },
          },
        },
      };

      const result = extractField(data, 'artifact.content.primaryOpportunity.title');

      expect(result).toBe('AI Platform');
    });

    it('should return null for non-existent field', () => {
      const data = {
        refinedIdea: 'B2B SaaS',
      };

      const result = extractField(data, 'nonExistent');

      expect(result).toBeNull();
    });

    it('should return null for non-existent nested field', () => {
      const data = {
        A0_intake: {
          codename: 'PROJECT_LAUNDRY',
        },
      };

      const result = extractField(data, 'A0_intake.nonExistent');

      expect(result).toBeNull();
    });

    it('should return null for non-object input', () => {
      const result = extractField('not an object', 'field');

      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = extractField(null, 'field');

      expect(result).toBeNull();
    });

    it('should handle array access in path', () => {
      const data = {
        opportunities: [
          { title: 'First' },
          { title: 'Second' },
        ],
      };

      const result = extractField(data, 'opportunities');

      expect(result).toEqual([
        { title: 'First' },
        { title: 'Second' },
      ]);
    });
  });
});
