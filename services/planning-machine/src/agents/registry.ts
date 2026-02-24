/**
 * Agent registry — maps phase names to agent classes
 */

import type { Env } from "../types";
import {
  PLANNING_AGENT_PHASE_ORDER,
  type PlanningAgentPhaseName,
} from "@foundation/shared";
import type { BaseAgent } from "./base-agent";
import { OpportunityAgent } from "./opportunity-agent";
import { CustomerIntelAgent } from "./customer-intel-agent";
import { MarketResearchAgent } from "./market-research-agent";
import { CompetitiveIntelAgent } from "./competitive-intel-agent";
import { KillTestAgent } from "./kill-test-agent";
import { RevenueExpansionAgent } from "./revenue-expansion-agent";
import { StrategyAgent } from "./strategy-agent";
import { BusinessModelAgent } from "./business-model-agent";
import { ProductDesignAgent } from "./product-design-agent";
import { GTMAgent } from "./gtm-agent";
import { ContentEngineAgent } from "./content-engine-agent";
import { TechArchAgent } from "./tech-arch-agent";
import { AnalyticsAgent } from "./analytics-agent";
import { LaunchExecutionAgent } from "./launch-execution-agent";
import { SynthesisAgent } from "./synthesis-agent";
import { TaskReconciliationAgent } from "./task-reconciliation-agent";

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
  return ["revenue-expansion", "strategy", "business-model", "product-design", "gtm-marketing", "content-engine", "tech-arch", "analytics", "launch-execution", "synthesis", "task-reconciliation"];
}
