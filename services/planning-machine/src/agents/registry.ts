/**
 * Agent registry — maps phase names to agent classes
 *
 * Includes both main pipeline agents (18 phases) and post-pipeline agents
 * (e.g., Architecture Advisor for Project Factory v3.0)
 */

import {
  PLANNING_AGENT_PHASE_ORDER,
  POST_PIPELINE_PHASES,
  type PlanningAgentPhaseName,
  type PostPipelinePhaseName,
} from "@foundation/shared";

import type { Env } from "../types";

import { AnalyticsAgent } from "./analytics-agent";
import { ArchitectureAdvisorAgent } from "./architecture-advisor-agent";
import type { BaseAgent } from "./base-agent";
import { BusinessModelAgent } from "./business-model-agent";
import { CompetitiveIntelAgent } from "./competitive-intel-agent";
import { ContentEngineAgent } from "./content-engine-agent";
import { CustomerIntelAgent } from "./customer-intel-agent";
import { DiagramGeneratorAgent } from "./diagram-generator-agent";
import { GTMAgent } from "./gtm-agent";
import { KillTestAgent } from "./kill-test-agent";
import { LaunchExecutionAgent } from "./launch-execution-agent";
import { MarketResearchAgent } from "./market-research-agent";
import { OpportunityAgent } from "./opportunity-agent";
import { ProductDesignAgent } from "./product-design-agent";
import { RevenueExpansionAgent } from "./revenue-expansion-agent";
import { StrategyAgent } from "./strategy-agent";
import { SynthesisAgent } from "./synthesis-agent";
import { TaskReconciliationAgent } from "./task-reconciliation-agent";
import { TechArchAgent } from "./tech-arch-agent";
import { ValidatorAgent } from "./validator-agent";

export const PHASE_ORDER = PLANNING_AGENT_PHASE_ORDER;

export type PhaseName = PlanningAgentPhaseName;

const AGENT_FACTORIES: Record<PhaseName, new (env: Env) => BaseAgent> = {
  opportunity: OpportunityAgent as new (env: Env) => BaseAgent,
  "customer-intel": CustomerIntelAgent as new (env: Env) => BaseAgent,
  "market-research": MarketResearchAgent as new (env: Env) => BaseAgent,
  "competitive-intel": CompetitiveIntelAgent as new (env: Env) => BaseAgent,
  "kill-test": KillTestAgent as new (env: Env) => BaseAgent,
  "revenue-expansion": RevenueExpansionAgent as new (env: Env) => BaseAgent,
  strategy: StrategyAgent as new (env: Env) => BaseAgent,
  "business-model": BusinessModelAgent as new (env: Env) => BaseAgent,
  "product-design": ProductDesignAgent as new (env: Env) => BaseAgent,
  "gtm-marketing": GTMAgent as new (env: Env) => BaseAgent,
  "content-engine": ContentEngineAgent as new (env: Env) => BaseAgent,
  "tech-arch": TechArchAgent as new (env: Env) => BaseAgent,
  analytics: AnalyticsAgent as new (env: Env) => BaseAgent,
  "launch-execution": LaunchExecutionAgent as new (env: Env) => BaseAgent,
  synthesis: SynthesisAgent as new (env: Env) => BaseAgent,
  "task-reconciliation": TaskReconciliationAgent as new (env: Env) => BaseAgent,
  "diagram-generation": DiagramGeneratorAgent as new (env: Env) => BaseAgent,
  validation: ValidatorAgent as new (env: Env) => BaseAgent,
};

export function getAgentForPhase(phase: PhaseName, env: Env): BaseAgent {
  const Factory = AGENT_FACTORIES[phase];
  if (!Factory) throw new Error(`Unknown phase: ${phase}`);
  return new Factory(env);
}

export function getPhasesBeforeKillTest(): PhaseName[] {
  return ["opportunity", "customer-intel", "market-research", "competitive-intel", "kill-test"];
}

export function getPhasesAfterKillTest(): PhaseName[] {
  return ["revenue-expansion", "strategy", "business-model", "product-design", "gtm-marketing", "content-engine", "tech-arch", "analytics", "launch-execution", "synthesis", "task-reconciliation", "diagram-generation", "validation"];
}

// ============================================================================
// POST-PIPELINE AGENTS (Project Factory v3.0)
// These agents run AFTER the main 18-phase pipeline completes.
// ============================================================================

export { POST_PIPELINE_PHASES };

const POST_PIPELINE_FACTORIES: Record<
  PostPipelinePhaseName,
  new (env: Env) => BaseAgent
> = {
  "architecture-advisor": ArchitectureAdvisorAgent as new (env: Env) => BaseAgent,
};

/**
 * Get a post-pipeline agent by phase name.
 * Returns null if the phase is not a valid post-pipeline phase.
 */
export function getPostPipelineAgent(
  phase: string,
  env: Env
): BaseAgent | null {
  const Factory = POST_PIPELINE_FACTORIES[phase as PostPipelinePhaseName];
  if (!Factory) return null;
  return new Factory(env);
}

/**
 * Check if a phase is a post-pipeline phase
 */
export function isPostPipelinePhase(phase: string): phase is PostPipelinePhaseName {
  return (POST_PIPELINE_PHASES as readonly string[]).includes(phase);
}
