/**
 * Phase 0 Intake Schema — captured before Phase 1 runs.
 * Injected into ALL subsequent phase system prompts to prevent
 * constraint violations and assumption divergence.
 */

import { z } from "zod";

export const IntakeSchema = z.object({
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

export type Intake = z.infer<typeof IntakeSchema>;

/**
 * Format intake as a prompt section to inject into agent system prompts.
 * This ensures all agents operate within the same constraints.
 */
export function formatIntakeContext(intake: Intake): string {
  return `
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

=== END INTAKE CONSTRAINTS ===
`.trim();
}
