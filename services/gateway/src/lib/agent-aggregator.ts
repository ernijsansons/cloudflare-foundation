/**
 * Agent Aggregator
 *
 * Aggregates agents from multiple sources (Naomi, Athena)
 * with graceful degradation when sources are unavailable.
 */

import type { DashboardAgent, AgentListResponse } from './agent-types';
import { fetchNaomiAgents, checkNaomiHealth, isNaomiEnabled } from './naomi-client';
import type { NaomiClientEnv } from './naomi-client';
import { fetchAthenaAgents, checkAthenaHealth, isAthenaEnabled } from './athena-client';
import type { AthenaClientEnv } from './athena-client';

export type AgentAggregatorEnv = NaomiClientEnv & AthenaClientEnv;

export type AgentSourceFilter = 'all' | 'naomi' | 'athena';

/**
 * Tenant context for multi-tenant agent queries
 */
export interface AgentTenantContext {
  tenant_id?: string;
  business_id?: string;
}

export interface AggregatedAgentsResult {
  agents: DashboardAgent[];
  sources: {
    naomi: { enabled: boolean; healthy: boolean; count: number; error?: string };
    athena: { enabled: boolean; healthy: boolean; count: number; error?: string };
  };
  errors: string[];
}

/**
 * Fetch agents from all enabled sources in parallel
 * with graceful degradation
 *
 * @param env - Environment bindings
 * @param source - Which source(s) to fetch from
 * @param tenantContext - Optional tenant context for multi-tenant queries
 */
export async function fetchAllAgents(
  env: AgentAggregatorEnv,
  source: AgentSourceFilter = 'all',
  tenantContext?: AgentTenantContext
): Promise<AggregatedAgentsResult> {
  const result: AggregatedAgentsResult = {
    agents: [],
    sources: {
      naomi: { enabled: false, healthy: false, count: 0 },
      athena: { enabled: false, healthy: false, count: 0 },
    },
    errors: [],
  };

  // Determine which sources to fetch
  const fetchNaomi = source === 'all' || source === 'naomi';
  const fetchAthena = source === 'all' || source === 'athena';

  // Parallel fetch from enabled sources
  const promises: Promise<void>[] = [];

  if (fetchNaomi && isNaomiEnabled(env)) {
    result.sources.naomi.enabled = true;
    promises.push(
      fetchNaomiAgents(env, tenantContext).then(naomiResult => {
        result.sources.naomi.healthy = naomiResult.success;
        if (naomiResult.success) {
          result.sources.naomi.count = naomiResult.agents.length;
          result.agents.push(...naomiResult.agents);
        } else {
          result.sources.naomi.error = naomiResult.error;
          result.errors.push(`Naomi: ${naomiResult.error}`);
        }
      })
    );
  }

  if (fetchAthena && isAthenaEnabled(env)) {
    result.sources.athena.enabled = true;
    promises.push(
      fetchAthenaAgents(env).then(athenaResult => {
        result.sources.athena.healthy = athenaResult.success;
        if (athenaResult.success) {
          result.sources.athena.count = athenaResult.agents.length;
          result.agents.push(...athenaResult.agents);
        } else {
          result.sources.athena.error = athenaResult.error;
          result.errors.push(`Athena: ${athenaResult.error}`);
        }
      })
    );
  }

  // Wait for all fetches to complete
  await Promise.all(promises);

  // Sort agents: root first, then managers, then workers
  result.agents.sort((a, b) => {
    const roleOrder = { root: 0, manager: 1, worker: 2 };
    const aOrder = roleOrder[a.role] ?? 3;
    const bOrder = roleOrder[b.role] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Within same role, sort by source then name
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });

  return result;
}

/**
 * Check health of all agent sources
 */
export async function checkAllSourcesHealth(env: AgentAggregatorEnv): Promise<{
  naomi: { enabled: boolean; healthy: boolean; error?: string };
  athena: { enabled: boolean; healthy: boolean; error?: string };
}> {
  const [naomiHealth, athenaHealth] = await Promise.all([
    checkNaomiHealth(env),
    checkAthenaHealth(env),
  ]);

  return {
    naomi: naomiHealth,
    athena: athenaHealth,
  };
}

/**
 * Build response for agent list API
 */
export function buildAgentListResponse(result: AggregatedAgentsResult): AgentListResponse {
  return {
    agents: result.agents,
    sources: {
      naomi: {
        enabled: result.sources.naomi.enabled,
        healthy: result.sources.naomi.healthy,
        count: result.sources.naomi.count,
      },
      athena: {
        enabled: result.sources.athena.enabled,
        healthy: result.sources.athena.healthy,
        count: result.sources.athena.count,
      },
    },
  };
}

/**
 * Group agents by source for UI display
 */
export function groupAgentsBySource(
  agents: DashboardAgent[]
): Record<string, DashboardAgent[]> {
  return agents.reduce(
    (acc, agent) => {
      const source = agent.source;
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(agent);
      return acc;
    },
    {} as Record<string, DashboardAgent[]>
  );
}

/**
 * Group agents by role for hierarchical display
 */
export function groupAgentsByRole(
  agents: DashboardAgent[]
): Record<string, DashboardAgent[]> {
  return agents.reduce(
    (acc, agent) => {
      const role = agent.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(agent);
      return acc;
    },
    {} as Record<string, DashboardAgent[]>
  );
}

/**
 * Build agent hierarchy tree from flat list
 */
export function buildAgentHierarchy(agents: DashboardAgent[]): DashboardAgent[] {
  const agentMap = new Map<string, DashboardAgent>();
  const rootAgents: DashboardAgent[] = [];

  // Create a map of all agents with empty children arrays
  for (const agent of agents) {
    agentMap.set(agent.id, { ...agent, children: [] });
  }

  // Build the tree
  for (const agent of agents) {
    const mappedAgent = agentMap.get(agent.id)!;
    if (agent.parent_id && agentMap.has(agent.parent_id)) {
      const parent = agentMap.get(agent.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(mappedAgent);
    } else {
      rootAgents.push(mappedAgent);
    }
  }

  return rootAgents;
}
