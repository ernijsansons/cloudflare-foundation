/**
 * Schema Validator - Runtime validation of phase outputs
 *
 * Uses canonical phase schemas and normalizes legacy phase names so workflow,
 * docs population, and scoring all operate on the same contract.
 */

import { z } from "zod";
import {
  normalizePlanningPhase,
  type PlanningAgentPhaseName,
  type PlanningWorkflowPhaseName,
} from "@foundation/shared";
import { SectionASchema } from "../schemas/intake";
import { OpportunityOutputSchema } from "../schemas/opportunity";
import { CustomerIntelOutputSchema } from "../schemas/customer-intel";
import { MarketResearchOutputSchema } from "../schemas/market-research";
import { CompetitiveIntelOutputSchema } from "../schemas/competitive-intel";
import { KillTestOutputSchema } from "../schemas/kill-test";
import { RevenueExpansionOutputSchema } from "../schemas/revenue-expansion";
import { StrategyOutputSchema } from "../schemas/strategy";
import { BusinessModelOutputSchema } from "../schemas/business-model";
import { ProductDesignOutputSchema } from "../schemas/product-design";
import { GTMOutputSchema } from "../schemas/gtm";
import { ContentEngineOutputSchema } from "../schemas/content-engine";
import { TechArchOutputSchema } from "../schemas/tech-arch";
import { AnalyticsOutputSchema } from "../schemas/analytics";
import { LaunchExecutionOutputSchema } from "../schemas/launch-execution";
import { SynthesisOutputSchema } from "../schemas/synthesis";
import { TaskReconciliationOutputSchema } from "../schemas/task-reconciliation";

export interface ValidationResult {
  valid: boolean;
  data?: unknown;
  errors?: string[];
}

const CanonicalIntakeOutputSchema = z.object({
  sectionA: SectionASchema,
  blockers: z.array(z.string()).default([]),
  ready_to_proceed: z.boolean(),
});

const LegacyIntakeOutputSchema = z.object({
  refinedIdea: z.string().min(10),
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

const IntakeOutputSchema = z.union([CanonicalIntakeOutputSchema, LegacyIntakeOutputSchema]);

export const PHASE_SCHEMAS: Record<PlanningWorkflowPhaseName, z.ZodTypeAny> = {
  "phase-0-intake": IntakeOutputSchema,
  opportunity: OpportunityOutputSchema,
  "customer-intel": CustomerIntelOutputSchema,
  "market-research": MarketResearchOutputSchema,
  "competitive-intel": CompetitiveIntelOutputSchema,
  "kill-test": KillTestOutputSchema,
  "revenue-expansion": RevenueExpansionOutputSchema,
  strategy: StrategyOutputSchema,
  "business-model": BusinessModelOutputSchema,
  "product-design": ProductDesignOutputSchema,
  "gtm-marketing": GTMOutputSchema,
  "content-engine": ContentEngineOutputSchema,
  "tech-arch": TechArchOutputSchema,
  analytics: AnalyticsOutputSchema,
  "launch-execution": LaunchExecutionOutputSchema,
  synthesis: SynthesisOutputSchema,
  "task-reconciliation": TaskReconciliationOutputSchema,
};

const REQUIRED_FIELDS: Record<PlanningWorkflowPhaseName, string[]> = {
  "phase-0-intake": ["sectionA", "ready_to_proceed"],
  opportunity: ["refinedOpportunities"],
  "customer-intel": ["idealCustomerProfiles"],
  "market-research": ["marketSize", "citations"],
  "competitive-intel": ["competitors", "citations"],
  "kill-test": ["verdict", "reasoning"],
  "revenue-expansion": ["primaryProduct"],
  strategy: ["positioning"],
  "business-model": ["revenueModel", "pricingTiers"],
  "product-design": ["mvpScope", "draftTasks"],
  "gtm-marketing": ["draftTasks"],
  "content-engine": ["draftTasks"],
  "tech-arch": ["draftTasks"],
  analytics: ["draftTasks"],
  "launch-execution": ["draftTasks"],
  synthesis: ["executiveSummary"],
  "task-reconciliation": ["tasks", "summary"],
};

const EVIDENCE_REQUIRED_PHASES = new Set<PlanningAgentPhaseName>([
  "market-research",
  "competitive-intel",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function gatherCitations(artifact: Record<string, unknown>): Array<Record<string, unknown>> {
  const direct = artifact.citations;
  if (Array.isArray(direct)) {
    return direct.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null);
  }

  const nestedSources = Array.isArray(artifact.refinedOpportunities)
    ? artifact.refinedOpportunities.flatMap((variant) => {
        if (!variant || typeof variant !== "object") {
          return [];
        }
        const sources = (variant as Record<string, unknown>).sources;
        return Array.isArray(sources)
          ? sources.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
          : [];
      })
    : [];

  return nestedSources;
}

function validateGrounding(
  phase: PlanningWorkflowPhaseName,
  parsedOutput: unknown
): string[] {
  const output = asRecord(parsedOutput);
  if (!output) {
    return ["Artifact output is not an object."];
  }

  if (phase === "phase-0-intake" || phase === "task-reconciliation") {
    return [];
  }

  if (!EVIDENCE_REQUIRED_PHASES.has(phase as PlanningAgentPhaseName)) {
    return [];
  }

  const citations = gatherCitations(output);
  if (citations.length === 0) {
    return [`Phase '${phase}' requires at least one citation-backed claim.`];
  }

  const invalidUrls = citations.filter((citation) => {
    const url = citation.url;
    return typeof url !== "string" || !/^https?:\/\//i.test(url);
  });

  if (invalidUrls.length > 0) {
    return [`Phase '${phase}' has ${invalidUrls.length} citations with invalid URLs.`];
  }

  return [];
}

function normalizePhaseOrError(
  phase: string
): { normalized: PlanningWorkflowPhaseName | null; errors?: string[] } {
  const normalized = normalizePlanningPhase(phase);
  if (!normalized) {
    return {
      normalized: null,
      errors: [`Unknown phase '${phase}'.`],
    };
  }
  return { normalized };
}

export function validatePhaseOutput(
  phase: string,
  output: unknown
): ValidationResult {
  const normalizedPhase = normalizePhaseOrError(phase);
  if (!normalizedPhase.normalized) {
    return { valid: false, errors: normalizedPhase.errors };
  }

  const schema = PHASE_SCHEMAS[normalizedPhase.normalized];
  if (!schema) {
    return {
      valid: false,
      errors: [`No schema defined for phase '${normalizedPhase.normalized}'.`],
    };
  }

  const parsed = schema.safeParse(output);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return { valid: false, errors };
  }

  const groundingErrors = validateGrounding(normalizedPhase.normalized, parsed.data);
  if (groundingErrors.length > 0) {
    return { valid: false, errors: groundingErrors };
  }

  return { valid: true, data: parsed.data };
}

export function validateStructure(
  phase: string,
  output: unknown
): { valid: boolean; missingFields: string[] } {
  const normalizedPhase = normalizePhaseOrError(phase);
  if (!normalizedPhase.normalized) {
    return { valid: false, missingFields: ["<phase>"] };
  }

  const outputRecord = asRecord(output);
  if (!outputRecord) {
    return { valid: false, missingFields: ["<root>"] };
  }

  const required = REQUIRED_FIELDS[normalizedPhase.normalized] ?? [];
  const missingFields = required.filter((field) => !(field in outputRecord));
  return { valid: missingFields.length === 0, missingFields };
}

export function getSchemaForPhase(phase: string): z.ZodSchema | null {
  const normalized = normalizePlanningPhase(phase);
  if (!normalized) {
    return null;
  }
  return PHASE_SCHEMAS[normalized] ?? null;
}

export function getDefinedPhases(): PlanningWorkflowPhaseName[] {
  return Object.keys(PHASE_SCHEMAS) as PlanningWorkflowPhaseName[];
}

export function extractField<T = unknown>(output: unknown, fieldPath: string): T | null {
  const outputRecord = asRecord(output);
  if (!outputRecord) {
    return null;
  }

  const parts = fieldPath.split(".");
  let current: unknown = outputRecord;

  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return current as T;
}
