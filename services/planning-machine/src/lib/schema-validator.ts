/**
 * Schema Validator - Runtime validation of phase outputs
 *
 * Validates phase artifacts against Zod schemas to prevent malformed data
 * from corrupting the pipeline. Provides clear error messages for debugging.
 */

import { z } from 'zod';
import type { PhaseName } from '@foundation/shared/ontology';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  data?: unknown;
  errors?: string[];
}

// ============================================================================
// PHASE OUTPUT SCHEMAS
// ============================================================================

/**
 * Intake Phase Output Schema
 */
const IntakeOutputSchema = z.object({
  refinedIdea: z.string().min(10, 'Refined idea must be at least 10 characters'),
  A0_intake: z.object({
    codename: z.string(),
    thesis: z.string(),
    targetICP: z.string(),
    coreDirective: z.string(),
  }),
  A1_unknowns: z.array(
    z.object({
      category: z.string(),
      question: z.string(),
    })
  ),
});

/**
 * Opportunity Phase Output Schema
 */
const OpportunityOutputSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      targetCustomer: z.string(),
      painPoint: z.string(),
      proposedSolution: z.string(),
      estimatedTAM: z.string().optional(),
    })
  ).min(1, 'At least one opportunity required'),
  primaryOpportunity: z.object({
    title: z.string(),
    reasoning: z.string(),
  }),
});

/**
 * Customer Intel Phase Output Schema
 */
const CustomerIntelOutputSchema = z.object({
  customerSegments: z.array(
    z.object({
      segment: z.string(),
      size: z.string(),
      characteristics: z.array(z.string()),
      painPoints: z.array(z.string()),
      jobsToBeDone: z.array(z.string()),
    })
  ).min(1),
  primarySegment: z.object({
    segment: z.string(),
    reasoning: z.string(),
  }),
});

/**
 * Market Research Phase Output Schema
 */
const MarketResearchOutputSchema = z.object({
  TAM: z.object({
    value: z.string(),
    source: z.string(),
    methodology: z.string(),
  }),
  SAM: z.object({
    value: z.string(),
    source: z.string(),
  }),
  SOM: z.object({
    value: z.string(),
    reasoning: z.string(),
  }),
  trends: z.array(
    z.object({
      trend: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
      evidence: z.string(),
    })
  ),
  growthDrivers: z.array(z.string()),
});

/**
 * Competitive Intel Phase Output Schema
 */
const CompetitiveIntelOutputSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      positioning: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      pricing: z.string().optional(),
    })
  ),
  competitiveLandscape: z.object({
    marketLeaders: z.array(z.string()),
    gaps: z.array(z.string()),
    differentiationOpportunities: z.array(z.string()),
  }),
});

/**
 * Kill Test Phase Output Schema
 */
const KillTestOutputSchema = z.object({
  verdict: z.enum(['GO', 'KILL', 'PIVOT']),
  reasoning: z.string().min(50, 'Reasoning must be at least 50 characters'),
  risks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(['high', 'medium', 'low']),
      mitigation: z.string(),
    })
  ),
  confidenceScore: z.number().min(0).max(1),
});

/**
 * Strategy Phase Output Schema
 */
const StrategyOutputSchema = z.object({
  strategicPillars: z.array(
    z.object({
      pillar: z.string(),
      description: z.string(),
      keyInitiatives: z.array(z.string()),
    })
  ).min(3, 'At least 3 strategic pillars required'),
  positioningStatement: z.string(),
  valuePropositions: z.array(z.string()),
});

/**
 * Product Design Phase Output Schema
 */
const ProductDesignOutputSchema = z.object({
  features: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priority: z.enum(['p0', 'p1', 'p2', 'p3']),
      effort: z.enum(['xs', 's', 'm', 'l', 'xl']),
    })
  ).min(1),
  mvpFeatures: z.array(z.string()),
  userWorkflows: z.array(
    z.object({
      workflow: z.string(),
      steps: z.array(z.string()),
    })
  ),
});

/**
 * Tech Architecture Phase Output Schema
 */
const TechArchOutputSchema = z.object({
  systemArchitecture: z.object({
    components: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        responsibility: z.string(),
      })
    ),
    dataFlow: z.string(),
  }),
  techStack: z.object({
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    hosting: z.string(),
  }),
  integrations: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      api: z.string().optional(),
    })
  ),
});

/**
 * Synthesis Phase Output Schema
 */
const SynthesisOutputSchema = z.object({
  executiveSummary: z.string().min(100),
  businessPlan: z.object({
    problem: z.string(),
    solution: z.string(),
    market: z.string(),
    competition: z.string(),
    strategy: z.string(),
    product: z.string(),
    technology: z.string(),
  }),
  keyMetrics: z.array(
    z.object({
      metric: z.string(),
      target: z.string(),
      timeline: z.string(),
    })
  ),
});

/**
 * Task Reconciliation Phase Output Schema
 */
const TaskReconciliationOutputSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      category: z.string(),
      priority: z.enum(['p0', 'p1', 'p2', 'p3']),
      effort: z.enum(['xs', 's', 'm', 'l', 'xl']),
      buildPhase: z.number().int().min(0).max(10),
      naomiPrompt: z.string().min(100),
      dependencies: z.array(z.string()),
    })
  ).min(1, 'At least one task required'),
  marketingTasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
  })),
  summary: z.object({
    totalTasks: z.number(),
    byCategory: z.record(z.string(), z.number()),
    byPriority: z.record(z.string(), z.number()),
    criticalPath: z.array(z.string()),
  }),
});

// ============================================================================
// SCHEMA REGISTRY
// ============================================================================

/**
 * Map of phase names to their Zod schemas
 *
 * Each phase has a corresponding schema that validates the expected output structure.
 */
const SCHEMA_REGISTRY: Record<PhaseName, z.ZodSchema> = {
  intake: IntakeOutputSchema,
  opportunity: OpportunityOutputSchema,
  'customer-intel': CustomerIntelOutputSchema,
  'market-research': MarketResearchOutputSchema,
  'competitive-intel': CompetitiveIntelOutputSchema,
  'kill-test': KillTestOutputSchema,
  'revenue-expansion': z.object({
    revenueStreams: z.array(z.object({ name: z.string(), description: z.string() })),
  }), // Simplified for brevity
  strategy: StrategyOutputSchema,
  'business-model': z.object({
    canvas: z.record(z.string(), z.string()),
  }), // Simplified
  'product-design': ProductDesignOutputSchema,
  gtm: z.object({
    channels: z.array(z.string()),
    strategy: z.string(),
  }), // Simplified
  'content-engine': z.object({
    contentTypes: z.array(z.string()),
  }), // Simplified
  'tech-arch': TechArchOutputSchema,
  analytics: z.object({
    kpis: z.array(z.object({ name: z.string(), target: z.string() })),
  }), // Simplified
  'launch-execution': z.object({
    timeline: z.array(z.object({ phase: z.string(), duration: z.string() })),
  }), // Simplified
  synthesis: SynthesisOutputSchema,
  'task-reconciliation': TaskReconciliationOutputSchema,
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate phase output against its schema
 *
 * @param phase Phase name (e.g., "opportunity", "kill-test")
 * @param output Raw output from agent
 * @returns ValidationResult with valid flag and parsed data or errors
 */
export function validatePhaseOutput(
  phase: PhaseName,
  output: unknown
): ValidationResult {
  const schema = SCHEMA_REGISTRY[phase];

  if (!schema) {
    return {
      valid: false,
      errors: [`No schema defined for phase: ${phase}`],
    };
  }

  const result = schema.safeParse(output);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });

    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    data: result.data,
  };
}

/**
 * Validate all required fields are present
 *
 * Quick structural validation without full schema parsing
 */
export function validateStructure(
  phase: PhaseName,
  output: unknown
): { valid: boolean; missingFields: string[] } {
  if (typeof output !== 'object' || output === null) {
    return { valid: false, missingFields: ['<root>'] };
  }

  // Define required top-level fields per phase
  const requiredFields: Record<PhaseName, string[]> = {
    intake: ['refinedIdea', 'A0_intake', 'A1_unknowns'],
    opportunity: ['opportunities', 'primaryOpportunity'],
    'customer-intel': ['customerSegments', 'primarySegment'],
    'market-research': ['TAM', 'SAM', 'SOM', 'trends'],
    'competitive-intel': ['competitors', 'competitiveLandscape'],
    'kill-test': ['verdict', 'reasoning', 'risks'],
    'revenue-expansion': ['revenueStreams'],
    strategy: ['strategicPillars', 'positioningStatement'],
    'business-model': ['canvas'],
    'product-design': ['features', 'mvpFeatures'],
    gtm: ['channels', 'strategy'],
    'content-engine': ['contentTypes'],
    'tech-arch': ['systemArchitecture', 'techStack'],
    analytics: ['kpis'],
    'launch-execution': ['timeline'],
    synthesis: ['executiveSummary', 'businessPlan'],
    'task-reconciliation': ['tasks', 'summary'],
  };

  const required = requiredFields[phase] || [];
  const outputObj = output as Record<string, unknown>;
  const missingFields = required.filter((field) => !(field in outputObj));

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get schema for a phase (for documentation/debugging)
 */
export function getSchemaForPhase(phase: PhaseName): z.ZodSchema | null {
  return SCHEMA_REGISTRY[phase] || null;
}

/**
 * List all phases with schemas defined
 */
export function getDefinedPhases(): PhaseName[] {
  return Object.keys(SCHEMA_REGISTRY) as PhaseName[];
}

/**
 * Validate and extract specific field
 *
 * Useful for extracting a single field without full validation
 */
export function extractField<T = unknown>(
  output: unknown,
  fieldPath: string
): T | null {
  if (typeof output !== 'object' || output === null) {
    return null;
  }

  const parts = fieldPath.split('.');
  let current: any = output;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current as T;
}
