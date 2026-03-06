/**
 * Naomi Agent Client
 *
 * Fetches agents from Naomi Oracle via Service Binding
 * and transforms them to unified DashboardAgent schema.
 */

import type { DashboardAgent, NaomiAgent } from './agent-types';
import { transformNaomiAgent } from './agent-types';

export interface NaomiClientEnv {
  NAOMI_SERVICE: Fetcher;
  AGENTS_NAOMI_ENABLED: string;
  NAOMI_TENANT_ID?: string;
  NAOMI_BUSINESS_ID?: string;
}

/**
 * Tenant context for multi-tenant Naomi queries
 * Priority: request context > env vars > defaults
 */
export interface NaomiTenantContext {
  tenant_id?: string;
  business_id?: string;
}

// Default values for Naomi API params (fallback only)
const DEFAULT_TENANT_ID = 'global';
const DEFAULT_BUSINESS_ID = 'naomi';

export interface NaomiAgentListResponse {
  agents: NaomiAgent[];
}

export interface NaomiAgentDetailResponse {
  agent: NaomiAgent;
  tasks?: Array<{
    task_id: string;
    status: string;
    description?: string;
  }>;
  capabilities?: Array<{
    cap_id: string;
    scopes_json: string;
    expires_at?: string;
  }>;
}

/** Error codes for structured error handling */
export type NaomiErrorCode = 'NOT_FOUND' | 'API_ERROR' | 'DISABLED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE';

export interface NaomiFetchResult {
  success: boolean;
  agents: DashboardAgent[];
  error?: string;
  errorCode?: NaomiErrorCode;
}

/**
 * Check if Naomi integration is enabled via feature flag
 */
export function isNaomiEnabled(env: NaomiClientEnv): boolean {
  return env.AGENTS_NAOMI_ENABLED === 'true';
}

/**
 * Build query params for Naomi API calls
 * Priority: request context > env vars > defaults
 */
function buildNaomiParams(
  env: NaomiClientEnv,
  context?: NaomiTenantContext
): URLSearchParams {
  const params = new URLSearchParams();
  // Priority: context > env > default
  params.set('tenant_id', context?.tenant_id || env.NAOMI_TENANT_ID || DEFAULT_TENANT_ID);
  params.set('business_id', context?.business_id || env.NAOMI_BUSINESS_ID || DEFAULT_BUSINESS_ID);
  return params;
}

/**
 * Fetch all agents from Naomi Oracle service
 * @param env - Environment bindings
 * @param context - Optional tenant context (overrides env defaults)
 */
export async function fetchNaomiAgents(
  env: NaomiClientEnv,
  context?: NaomiTenantContext
): Promise<NaomiFetchResult> {
  if (!isNaomiEnabled(env)) {
    return { success: true, agents: [] };
  }

  try {
    const params = buildNaomiParams(env, context);
    const response = await env.NAOMI_SERVICE.fetch(
      new Request(`https://naomi-service/v1/dashboard/agents?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    if (!response.ok) {
      return {
        success: false,
        agents: [],
        error: `Naomi API error: ${response.status} ${response.statusText}`,
        errorCode: 'API_ERROR',
      };
    }

    const data = (await response.json()) as NaomiAgentListResponse & { ok?: boolean; error?: string };

    // Detect HTTP 200 with semantic error body (ok: false or error field)
    if (data.ok === false || data.error) {
      return {
        success: false,
        agents: [],
        error: data.error || 'Naomi API returned error',
        errorCode: 'API_ERROR',
      };
    }

    if (!data.agents || !Array.isArray(data.agents)) {
      return {
        success: false,
        agents: [],
        error: 'Invalid response format from Naomi API',
        errorCode: 'INVALID_RESPONSE',
      };
    }

    const dashboardAgents = data.agents.map(transformNaomiAgent);

    return {
      success: true,
      agents: dashboardAgents,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      agents: [],
      error: `Failed to fetch Naomi agents: ${message}`,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch a single agent by ID from Naomi Oracle service
 * @param env - Environment bindings
 * @param agentId - Agent ID to fetch
 * @param context - Optional tenant context (overrides env defaults)
 */
export async function fetchNaomiAgentById(
  env: NaomiClientEnv,
  agentId: string,
  context?: NaomiTenantContext
): Promise<{
  success: boolean;
  agent?: DashboardAgent;
  raw?: NaomiAgentDetailResponse;
  error?: string;
  errorCode?: NaomiErrorCode;
}> {
  if (!isNaomiEnabled(env)) {
    return { success: false, error: 'Naomi integration is disabled', errorCode: 'DISABLED' };
  }

  try {
    const params = buildNaomiParams(env, context);
    const response = await env.NAOMI_SERVICE.fetch(
      new Request(`https://naomi-service/v1/dashboard/agents/${agentId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Agent not found', errorCode: 'NOT_FOUND' };
      }
      return {
        success: false,
        error: `Naomi API error: ${response.status} ${response.statusText}`,
        errorCode: 'API_ERROR',
      };
    }

    const data = (await response.json()) as NaomiAgentDetailResponse & { ok?: boolean; error?: string };

    // Detect HTTP 200 with semantic error body (ok: false or error field)
    if (data.ok === false || data.error) {
      const errorMsg = data.error || 'Naomi API returned error';
      // Detect not-found semantic errors
      const isNotFound = errorMsg === 'agent_not_found' ||
                         errorMsg.toLowerCase().includes('not found') ||
                         errorMsg.toLowerCase().includes('not_found');
      return {
        success: false,
        error: errorMsg,
        errorCode: isNotFound ? 'NOT_FOUND' : 'API_ERROR',
      };
    }

    if (!data.agent) {
      return { success: false, error: 'Invalid response format from Naomi API', errorCode: 'INVALID_RESPONSE' };
    }

    return {
      success: true,
      agent: transformNaomiAgent(data.agent),
      raw: data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch Naomi agent: ${message}`,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch org chart from Naomi (hierarchical view)
 */
export async function fetchNaomiOrgChart(env: NaomiClientEnv): Promise<{
  success: boolean;
  agents: DashboardAgent[];
  error?: string;
}> {
  if (!isNaomiEnabled(env)) {
    return { success: true, agents: [] };
  }

  try {
    const params = buildNaomiParams(env);
    const response = await env.NAOMI_SERVICE.fetch(
      new Request(`https://naomi-service/v1/dashboard/org-chart?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    if (!response.ok) {
      return {
        success: false,
        agents: [],
        error: `Naomi API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { agents: NaomiAgent[] };

    if (!data.agents || !Array.isArray(data.agents)) {
      return {
        success: false,
        agents: [],
        error: 'Invalid response format from Naomi org-chart API',
      };
    }

    const dashboardAgents = data.agents.map(transformNaomiAgent);

    return {
      success: true,
      agents: dashboardAgents,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      agents: [],
      error: `Failed to fetch Naomi org chart: ${message}`,
    };
  }
}

/**
 * Health check for Naomi service
 */
export async function checkNaomiHealth(env: NaomiClientEnv): Promise<{
  enabled: boolean;
  healthy: boolean;
  error?: string;
}> {
  if (!isNaomiEnabled(env)) {
    return { enabled: false, healthy: false };
  }

  try {
    const response = await env.NAOMI_SERVICE.fetch(
      new Request('https://naomi-service/health', {
        method: 'GET',
      })
    );

    return {
      enabled: true,
      healthy: response.ok,
      error: response.ok ? undefined : `Health check failed: ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      enabled: true,
      healthy: false,
      error: message,
    };
  }
}
