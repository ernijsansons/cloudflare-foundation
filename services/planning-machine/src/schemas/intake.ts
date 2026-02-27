/**
 * Phase 0 Intake Schemas — COMPREHENSIVE A0-A7 BULLETPROOF AGENTIC Template
 *
 * Captured before Phase 1 runs. Injected into ALL subsequent phase system prompts
 * to prevent constraint violations and assumption divergence.
 *
 * Implements the full intake form from the BULLETPROOF AGENTIC template:
 * - A0.1-A0.7: Comprehensive intake form
 * - A1: Required unknowns
 * - A2: Global invariants
 */

import { z } from "zod";

// ============================================================================
// LEGACY INTAKE (Preserved for backward compatibility)
// ============================================================================

export const LegacyIntakeSchema = z.object({
  /** The raw product idea as entered by the user */
  idea: z.string().min(1),

  /** Tech stack constraints — defaults to Cloudflare-native */
  techStack: z.string().default(
    "Cloudflare-native (Workers, D1, KV, R2, Queues, Durable Objects, SvelteKit)"
  ),

  /** Team composition — affects task sizing and parallelization */
  teamSize: z.string().default("1-2 engineers + AI agents (Naomi)"),

  /** Budget stage — affects tooling and third-party API choices */
  budgetRange: z.enum(["bootstrap", "seed", "series-a", "growth"]).default("bootstrap"),

  /** Target MVP date — used in launch execution phase */
  mvpTargetDate: z.string().nullish(),

  /** Already-integrated services that must be supported */
  existingIntegrations: z.array(z.string()).default([]),

  /** Technologies/approaches explicitly excluded */
  mustAvoid: z.array(z.string()).default([]),

  /** Compliance requirements that affect architecture */
  complianceRequirements: z.array(z.string()).default([]),

  /** Deployment target */
  deploymentTarget: z.string().default(
    "Cloudflare Pages (SvelteKit SSR) + Workers (API) + D1 (database)"
  ),

  /** Primary monetization model — affects business-model and revenue-expansion phases */
  monetizationModel: z.enum([
    "subscription",
    "usage-based",
    "one-time",
    "freemium",
    "marketplace",
    "open-source-commercial",
    "unknown",
  ]).default("unknown"),

  /** Geographic focus — affects regulatory and market research */
  targetGeography: z.array(z.string()).default(["global"]),

  /**
   * Custom context the user wants injected into every phase.
   * E.g., "This is a B2B tool targeting enterprise security teams."
   */
  additionalContext: z.string().nullish(),
});

export type LegacyIntake = z.infer<typeof LegacyIntakeSchema>;

// ============================================================================
// A0.1: Concept
// ============================================================================

export const IntakeConceptSchema = z.object({
  codename: z.string().min(1, "Codename required"),
  thesis: z.string().min(10, "Thesis must be at least 10 characters"),
  target_icp: z.string().min(5, "Target ICP required"),
  core_directive: z.string().min(10, "Core directive must be specific"),
  why_now: z.string().min(5, "Why now trigger required"),
});

// ============================================================================
// A0.2: Outcome Unit
// ============================================================================

export const OutcomeUnitSchema = z.object({
  definition: z.string().min(10, "Outcome definition must be specific and measurable"),
  proof_artifact: z.string().min(5, "Proof artifact required"),
  time_to_first_outcome: z.string().min(2, "Time target required"),
  frequency: z.string().min(2, "Frequency required"),
  current_cost: z.string().min(3, "Current cost required"),
});

// ============================================================================
// A0.3: Agentic Execution
// ============================================================================

export const AgenticExecutionSchema = z.object({
  allowed_actions: z.array(z.string()).min(1, "At least one allowed action required"),
  forbidden_actions: z.array(z.string()).min(1, "Forbidden actions must be explicitly defined"),
  hitl_threshold: z.array(z.string()).min(1, "HITL thresholds must be defined"),
  required_integrations: z.array(z.string()),
  external_side_effects: z.array(z.string()),
});

// ============================================================================
// A0.4: Data & Trust
// ============================================================================

export const InputSourceSchema = z.object({
  source: z.string(),
  licensing: z.string(),
});

export const DataTrustSchema = z.object({
  input_sources: z.array(InputSourceSchema).min(1, "At least one input source required"),
  output_data_types: z.array(z.string()).min(1, "Output data types required"),
  data_sensitivity: z.enum(["public", "internal", "confidential", "financial", "pii", "health"]),
  retention_requirements: z.string().min(5, "Retention requirements must be specified"),
  ground_truth: z.string().min(10, "Ground truth definition required"),
});

// ============================================================================
// A0.5: Constraints
// ============================================================================

export const ConstraintsSchema = z.object({
  budget_cap: z.string().min(2, "Budget cap required"),
  timeline: z.string().min(3, "Timeline required"),
  geography: z.string().min(2, "Geography required"),
  compliance_bar: z.enum(["bootstrap", "SOC2-ready", "regulated"]),
  performance_bar: z.string().min(5, "Performance requirements required"),
});

// ============================================================================
// A0.6: Monetization
// ============================================================================

export const MonetizationSchema = z.object({
  who_pays: z.string().min(3, "Payer must be specified"),
  pricing_anchor: z.string().min(5, "Pricing anchor required"),
  sales_motion: z.enum(["self-serve", "sales-led", "hybrid"]),
  value_metric: z.string().min(5, "Value metric required"),
});

// ============================================================================
// A0.7: Success & Kill Switches
// ============================================================================

export const SuccessKillSwitchesSchema = z.object({
  north_star: z.string().min(5, "North star metric required"),
  supporting_metrics: z.array(z.string()).min(1, "Supporting metrics required"),
  kill_conditions: z.array(z.string()).length(3, "Exactly 3 kill conditions required"),
  "30_day_done": z.string().min(10, "30-day done criteria required"),
  "90_day_done": z.string().min(10, "90-day done criteria required"),
});

// ============================================================================
// A0: Complete Intake Form
// ============================================================================

export const IntakeFormSchema = z.object({
  concept: IntakeConceptSchema,
  outcome_unit: OutcomeUnitSchema,
  agentic_execution: AgenticExecutionSchema,
  data_trust: DataTrustSchema,
  constraints: ConstraintsSchema,
  monetization: MonetizationSchema,
  success_kill_switches: SuccessKillSwitchesSchema,
});

// ============================================================================
// A1: Required Unknowns
// ============================================================================

export const UnknownsSchema = z.object({
  core_directive: z.union([z.literal("RESOLVED"), z.literal("UNKNOWN"), z.string().min(10)]),
  hitl_threshold: z.union([z.literal("RESOLVED"), z.literal("UNKNOWN"), z.string().min(10)]),
  tooling_data_gravity: z.union([z.literal("RESOLVED"), z.literal("UNKNOWN"), z.string().min(10)]),
  memory_horizon: z.union([z.literal("RESOLVED"), z.literal("UNKNOWN"), z.string().min(5)]),
  verification_standard: z.union([z.literal("RESOLVED"), z.literal("UNKNOWN"), z.string().min(10)]),
});

// ============================================================================
// A2: Global Invariants
// ============================================================================

export const GlobalInvariantsSchema = z.object({
  no_raw_destructive_ops: z.literal(true, { errorMap: () => ({ message: "Must confirm no raw destructive ops" }) }),
  idempotent_side_effects: z.literal(true, { errorMap: () => ({ message: "Must confirm idempotent side effects" }) }),
  auditable_receipts: z.literal(true, { errorMap: () => ({ message: "Must confirm auditable receipts" }) }),
  llm_gateway: z.string().min(1, "LLM gateway must be specified"),
  fail_closed: z.literal(true, { errorMap: () => ({ message: "Must confirm fail-closed behavior" }) }),
});

// ============================================================================
// Section A: Complete Schema
// ============================================================================

export const SectionASchema = z.object({
  A0_intake: IntakeFormSchema,
  A1_unknowns: UnknownsSchema,
  A2_invariants: GlobalInvariantsSchema,
});

// ============================================================================
// Combined Intake Schema (Legacy + Comprehensive)
// ============================================================================

export const IntakeSchema = LegacyIntakeSchema.merge(
  z.object({
    /** Comprehensive A0-A7 intake form (optional for backward compatibility) */
    comprehensive: SectionASchema.optional(),
  })
);

export type Intake = z.infer<typeof IntakeSchema>;
export type SectionA = z.infer<typeof SectionASchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate Section A and return validation errors
 */
export function validateSectionA(data: unknown): { success: boolean; errors?: string[]; data?: SectionA } {
  const result = SectionASchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  return { success: false, errors };
}

/**
 * Check if all critical unknowns are resolved
 */
export function areUnknownsResolved(unknowns: z.infer<typeof UnknownsSchema>): boolean {
  const values = Object.values(unknowns);
  return values.every((v) => v !== "UNKNOWN");
}

/**
 * Get list of unresolved unknowns
 */
export function getUnresolvedUnknowns(unknowns: z.infer<typeof UnknownsSchema>): string[] {
  return Object.entries(unknowns)
    .filter(([_, value]) => value === "UNKNOWN")
    .map(([key, _]) => key);
}

/**
 * Calculate intake form completeness (0-100)
 */
export function calculateIntakeCompleteness(sectionA: Partial<SectionA>): number {
  let totalFields = 0;
  let completedFields = 0;

  // Check A0 intake form
  if (sectionA.A0_intake) {
    const subsections = [
      sectionA.A0_intake.concept,
      sectionA.A0_intake.outcome_unit,
      sectionA.A0_intake.agentic_execution,
      sectionA.A0_intake.data_trust,
      sectionA.A0_intake.constraints,
      sectionA.A0_intake.monetization,
      sectionA.A0_intake.success_kill_switches,
    ];

    for (const subsection of subsections) {
      if (subsection) {
        const fields = Object.values(subsection);
        totalFields += fields.length;
        completedFields += fields.filter((v) => {
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === "string") return v.length > 0;
          if (typeof v === "boolean") return true;
          return !!v;
        }).length;
      }
    }
  }

  // Check A1 unknowns (resolved counts as complete)
  if (sectionA.A1_unknowns) {
    totalFields += 5;
    completedFields += Object.values(sectionA.A1_unknowns).filter((v) => v !== "UNKNOWN").length;
  }

  // Check A2 invariants
  if (sectionA.A2_invariants) {
    totalFields += 5;
    completedFields += Object.values(sectionA.A2_invariants).filter((v) => !!v).length;
  }

  if (totalFields === 0) return 0;
  return Math.floor((completedFields / totalFields) * 100);
}

/**
 * Format intake as a prompt section to inject into agent system prompts.
 * This ensures all agents operate within the same constraints.
 */
export function formatIntakeContext(intake: Intake): string {
  let context = `
=== PROJECT INTAKE CONSTRAINTS (ALL DECISIONS MUST RESPECT THESE) ===

Tech Stack: ${intake.techStack}
Team: ${intake.teamSize}
Budget Stage: ${intake.budgetRange}
MVP Target: ${intake.mvpTargetDate ?? "ASAP"}
Deployment: ${intake.deploymentTarget}
Monetization Model: ${intake.monetizationModel}
Target Geography: ${intake.targetGeography.join(", ")}
${intake.existingIntegrations.length > 0 ? `Existing Integrations: ${intake.existingIntegrations.join(", ")}` : ""}
${intake.mustAvoid.length > 0 ? `MUST AVOID: ${intake.mustAvoid.join(", ")}` : ""}
${intake.complianceRequirements.length > 0 ? `Compliance: ${intake.complianceRequirements.join(", ")}` : ""}
${intake.additionalContext ? `Additional Context: ${intake.additionalContext}` : ""}

CONSTRAINT ENFORCEMENT:
- Never recommend technologies in the MUST AVOID list
- All tooling must be appropriate for ${intake.budgetRange} budget stage
- Prefer Cloudflare-native services over external paid APIs unless justified
- All tasks must be completable by ${intake.teamSize}
- Architecture must support deployment to ${intake.deploymentTarget}
`.trim();

  // Add comprehensive intake if available
  if (intake.comprehensive) {
    context += `\n\n=== COMPREHENSIVE PROJECT INTAKE (SECTION A) ===

Core Directive: ${intake.comprehensive.A0_intake.concept.core_directive}
Target ICP: ${intake.comprehensive.A0_intake.concept.target_icp}
Outcome Definition: ${intake.comprehensive.A0_intake.outcome_unit.definition}
Proof Artifact: ${intake.comprehensive.A0_intake.outcome_unit.proof_artifact}

Allowed Actions: ${intake.comprehensive.A0_intake.agentic_execution.allowed_actions.join(", ")}
Forbidden Actions: ${intake.comprehensive.A0_intake.agentic_execution.forbidden_actions.join(", ")}
HITL Threshold: ${intake.comprehensive.A0_intake.agentic_execution.hitl_threshold.join(", ")}

Data Sensitivity: ${intake.comprehensive.A0_intake.data_trust.data_sensitivity}
Ground Truth: ${intake.comprehensive.A0_intake.data_trust.ground_truth}

Budget Cap: ${intake.comprehensive.A0_intake.constraints.budget_cap}
Performance Bar: ${intake.comprehensive.A0_intake.constraints.performance_bar}

North Star Metric: ${intake.comprehensive.A0_intake.success_kill_switches.north_star}
Kill Conditions: ${intake.comprehensive.A0_intake.success_kill_switches.kill_conditions.join(" | ")}

=== END COMPREHENSIVE INTAKE ===`;
  }

  return context;
}

// Export types
export type IntakeConcept = z.infer<typeof IntakeConceptSchema>;
export type OutcomeUnit = z.infer<typeof OutcomeUnitSchema>;
export type AgenticExecution = z.infer<typeof AgenticExecutionSchema>;
export type DataTrust = z.infer<typeof DataTrustSchema>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
export type Monetization = z.infer<typeof MonetizationSchema>;
export type SuccessKillSwitches = z.infer<typeof SuccessKillSwitchesSchema>;
export type IntakeForm = z.infer<typeof IntakeFormSchema>;
export type Unknowns = z.infer<typeof UnknownsSchema>;
export type GlobalInvariants = z.infer<typeof GlobalInvariantsSchema>;

