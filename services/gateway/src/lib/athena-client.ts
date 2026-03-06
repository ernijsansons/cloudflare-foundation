/**
 * Athena Agent Client
 *
 * Fetches agents from Athena Core via Service Binding
 * and transforms them to unified DashboardAgent schema.
 */

import type { DashboardAgent, AthenaAgent } from './agent-types';
import { transformAthenaAgent } from './agent-types';

export interface AthenaClientEnv {
  ATHENA_SERVICE: Fetcher;
  AGENTS_ATHENA_ENABLED: string;
  ATHENA_ADMIN_SECRET?: string;
}

/**
 * Build headers for Athena API calls (includes auth if available)
 */
function buildAthenaHeaders(env: AthenaClientEnv): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authorization if secret is available
  if (env.ATHENA_ADMIN_SECRET) {
    headers['Authorization'] = `Bearer ${env.ATHENA_ADMIN_SECRET}`;
  }

  return headers;
}

export interface AthenaAgentListResponse {
  agents: AthenaAgent[];
}

export interface AthenaAgentDetailResponse {
  agent: AthenaAgent;
  tasks?: Array<{
    id: string;
    status: string;
    description?: string;
  }>;
  metrics?: {
    tasks_completed: number;
    tasks_failed: number;
    avg_latency_ms: number;
  };
}

/** Error codes for structured error handling */
export type AthenaErrorCode = 'NOT_FOUND' | 'API_ERROR' | 'DISABLED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'UNAUTHORIZED';

export interface AthenaFetchResult {
  success: boolean;
  agents: DashboardAgent[];
  error?: string;
  errorCode?: AthenaErrorCode;
}

/**
 * Check if Athena integration is enabled via feature flag
 */
export function isAthenaEnabled(env: AthenaClientEnv): boolean {
  return env.AGENTS_ATHENA_ENABLED === 'true';
}

/**
 * Fetch all agents from Athena Core service
 */
export async function fetchAthenaAgents(env: AthenaClientEnv): Promise<AthenaFetchResult> {
  if (!isAthenaEnabled(env)) {
    return { success: true, agents: [] };
  }

  try {
    const response = await env.ATHENA_SERVICE.fetch(
      new Request('https://athena-service/api/v2/agents', {
        method: 'GET',
        headers: buildAthenaHeaders(env),
      })
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          agents: [],
          error: 'Unauthorized - invalid or missing auth token',
          errorCode: 'UNAUTHORIZED',
        };
      }
      return {
        success: false,
        agents: [],
        error: `Athena API error: ${response.status} ${response.statusText}`,
        errorCode: 'API_ERROR',
      };
    }

    const data = (await response.json()) as AthenaAgentListResponse & { error?: string };

    // Detect HTTP 200 with semantic error body
    if (data.error) {
      return {
        success: false,
        agents: [],
        error: data.error,
        errorCode: 'API_ERROR',
      };
    }

    if (!data.agents || !Array.isArray(data.agents)) {
      return {
        success: false,
        agents: [],
        error: 'Invalid response format from Athena API',
        errorCode: 'INVALID_RESPONSE',
      };
    }

    const dashboardAgents = data.agents.map(transformAthenaAgent);

    return {
      success: true,
      agents: dashboardAgents,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      agents: [],
      error: `Failed to fetch Athena agents: ${message}`,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch a single agent by ID from Athena Core service
 */
export async function fetchAthenaAgentById(
  env: AthenaClientEnv,
  agentId: string
): Promise<{
  success: boolean;
  agent?: DashboardAgent;
  raw?: AthenaAgentDetailResponse;
  error?: string;
  errorCode?: AthenaErrorCode;
}> {
  if (!isAthenaEnabled(env)) {
    return { success: false, error: 'Athena integration is disabled', errorCode: 'DISABLED' };
  }

  try {
    const response = await env.ATHENA_SERVICE.fetch(
      new Request(`https://athena-service/api/v2/agents/${agentId}`, {
        method: 'GET',
        headers: buildAthenaHeaders(env),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Agent not found', errorCode: 'NOT_FOUND' };
      }
      if (response.status === 401) {
        return { success: false, error: 'Unauthorized - invalid or missing auth token', errorCode: 'UNAUTHORIZED' };
      }
      return {
        success: false,
        error: `Athena API error: ${response.status} ${response.statusText}`,
        errorCode: 'API_ERROR',
      };
    }

    const data = (await response.json()) as AthenaAgentDetailResponse & { error?: string };

    // Detect HTTP 200 with semantic error body
    if (data.error) {
      const isNotFound = data.error.toLowerCase().includes('not found');
      return {
        success: false,
        error: data.error,
        errorCode: isNotFound ? 'NOT_FOUND' : 'API_ERROR',
      };
    }

    if (!data.agent) {
      return { success: false, error: 'Invalid response format from Athena API', errorCode: 'INVALID_RESPONSE' };
    }

    return {
      success: true,
      agent: transformAthenaAgent(data.agent),
      raw: data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch Athena agent: ${message}`,
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch Athena gateway metrics
 */
export async function fetchAthenaMetrics(env: AthenaClientEnv): Promise<{
  success: boolean;
  metrics?: {
    requests_total: number;
    errors_total: number;
    latency_p50_ms: number;
    latency_p99_ms: number;
  };
  error?: string;
}> {
  if (!isAthenaEnabled(env)) {
    return { success: false, error: 'Athena integration is disabled' };
  }

  try {
    const response = await env.ATHENA_SERVICE.fetch(
      new Request('https://athena-service/api/v2/gateway/metrics', {
        method: 'GET',
        headers: buildAthenaHeaders(env),
      })
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Athena API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      metrics: data as {
        requests_total: number;
        errors_total: number;
        latency_p50_ms: number;
        latency_p99_ms: number;
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch Athena metrics: ${message}`,
    };
  }
}

/**
 * Health check for Athena service
 */
export async function checkAthenaHealth(env: AthenaClientEnv): Promise<{
  enabled: boolean;
  healthy: boolean;
  error?: string;
}> {
  if (!isAthenaEnabled(env)) {
    return { enabled: false, healthy: false };
  }

  try {
    const response = await env.ATHENA_SERVICE.fetch(
      new Request('https://athena-service/health', {
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
