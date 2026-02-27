/**
 * Ontology Schemas and Quality Scoring
 *
 * Defines the schemas and quality scoring functions for planning phases.
 * Uses PhaseName from planning-phases.ts as the canonical source.
 */

import type { PhaseName } from "./planning-phases";

/**
 * Schema definitions for each phase
 * These define the structure and validation rules for each phase's output
 */
export const PHASE_SCHEMAS: Partial<Record<PhaseName, unknown>> = {
  opportunity: {
    type: "object",
    required: ["opportunity_score", "market_fit"],
  },
  "market-research": {
    type: "object",
    required: ["market_size", "growth_rate", "trends"],
  },
  "competitive-intel": {
    type: "object",
    required: ["competitors", "positioning", "differentiation"],
  },
  "customer-intel": {
    type: "object",
    required: ["target_personas", "pain_points", "buying_behavior"],
  },
  "kill-test": {
    type: "object",
    required: ["verdict", "blockers", "recommendation"],
  },
  strategy: {
    type: "object",
    required: ["vision", "mission", "strategic_pillars"],
  },
  "business-model": {
    type: "object",
    required: ["revenue_streams", "cost_structure", "value_proposition"],
  },
  "revenue-expansion": {
    type: "object",
    required: ["pricing_model", "expansion_opportunities"],
  },
  "product-design": {
    type: "object",
    required: ["features", "user_flows", "design_principles"],
  },
  "tech-arch": {
    type: "object",
    required: ["architecture", "technology_stack", "scalability"],
  },
  "gtm-marketing": {
    type: "object",
    required: ["channels", "tactics", "timeline"],
  },
  "content-engine": {
    type: "object",
    required: ["content_strategy", "channels", "cadence"],
  },
  analytics: {
    type: "object",
    required: ["kpis", "metrics", "tracking_plan"],
  },
  "launch-execution": {
    type: "object",
    required: ["milestones", "timeline", "dependencies"],
  },
  synthesis: {
    type: "object",
    required: ["executive_summary", "key_findings", "recommendations"],
  },
  "task-reconciliation": {
    type: "object",
    required: ["tasks", "status"],
  },
};

/**
 * Calculate quality score for phase output against its schema
 * @param data - The phase output data
 * @param schema - The expected schema
 * @returns Quality score from 0-100
 */
export function calculateQualityScore(data: unknown, schema: unknown): number {
  if (!data || typeof data !== "object") {
    return 0;
  }

  const schemaObj = schema as { required?: string[] };
  if (!schemaObj.required || !Array.isArray(schemaObj.required)) {
    return 100; // No validation rules, assume complete
  }

  const dataObj = data as Record<string, unknown>;
  const required = schemaObj.required;

  // Count how many required fields are present and non-empty
  let presentCount = 0;
  for (const field of required) {
    const value = dataObj[field];
    if (value !== undefined && value !== null && value !== "") {
      presentCount++;
    }
  }

  // Calculate percentage
  const score = Math.floor((presentCount / required.length) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Get all phase names in execution order
 * Re-exports from planning-phases for convenience
 */
export { PLANNING_AGENT_PHASE_ORDER, isPlanningAgentPhase as isValidPhaseName } from "./planning-phases";
