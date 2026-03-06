/**
 * AgentGraph v1 Contract
 *
 * Unified agent schema for dashboard display.
 * Supports both Naomi and Athena agent systems.
 */

export type AgentSource = 'naomi' | 'athena';
export type AgentRole = 'root' | 'manager' | 'worker';
export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline';
export type AutonomyLevel = 'auto' | 'semi_auto' | 'supervised' | 'manual_review';

export interface DashboardAgent {
  id: string;
  name: string;
  source: AgentSource;
  role: AgentRole;
  status: AgentStatus;

  // Metrics (optional, may not be available from all sources)
  reliability_score?: number;
  hallucination_risk?: number;
  autonomy_level?: AutonomyLevel;

  // Capabilities
  can_delegate: boolean;
  can_execute: boolean;
  capabilities?: string[];

  // Hierarchy
  parent_id?: string;
  department?: string;
  children?: DashboardAgent[];

  // Links (computed)
  detail_url: string;
  api_endpoint: string;
}

/**
 * Response wrapper for agent list endpoint
 */
export interface AgentListResponse {
  agents: DashboardAgent[];
  sources: {
    naomi: { enabled: boolean; healthy: boolean; count: number };
    athena: { enabled: boolean; healthy: boolean; count: number };
  };
}

/**
 * Naomi agent schema (raw from Naomi Dashboard API)
 * From: GET /v1/dashboard/agents?tenant_id=X&business_id=Y
 * Source: naomi-oracle-cloudflare/src/oracle.ts lines 1955-1967
 */
export interface NaomiAgent {
  agent_id: string;
  parent_agent_id?: string;
  role: string; // "worker", "boss", "manager", etc.
  department?: string;
  can_delegate: boolean;
  can_execute: boolean;
  reliability_score?: number;
  hallucination_risk?: number;
  autonomy_level?: string; // "auto", "semi_auto", "supervised", "manual_review"
  unresolved_incidents?: number;
  created_at?: number; // Unix timestamp
}

/**
 * Athena agent schema (raw from Athena API)
 * From: GET /api/v2/agents
 */
export interface AthenaAgent {
  id: string;
  name: string;
  agent_type: 'master' | 'department' | 'worker';
  status: 'active' | 'idle' | 'busy' | 'offline' | 'terminated';
  parent_agent_id?: string;
  department?: 'engineering' | 'trading' | 'research' | string;
  capabilities?: string; // JSON array
  config?: string; // JSON config
  created_at?: string;
  updated_at?: string;
  last_heartbeat?: string;
}

/**
 * Map Naomi role to DashboardAgent role
 */
export function mapNaomiRole(role: string): AgentRole {
  switch (role.toLowerCase()) {
    case 'boss':
    case 'sovereign':
    case 'root':
      return 'root';
    case 'manager':
    case 'lead':
      return 'manager';
    default:
      return 'worker';
  }
}

/**
 * Map Athena agent_type to DashboardAgent role
 */
export function mapAthenaRole(agentType: string): AgentRole {
  switch (agentType.toLowerCase()) {
    case 'master':
      return 'root';
    case 'department':
      return 'manager';
    default:
      return 'worker';
  }
}

/**
 * Map Naomi autonomy_level to DashboardAgent autonomy
 */
export function mapNaomiAutonomy(level?: string): AutonomyLevel {
  switch (level?.toLowerCase()) {
    case 'auto':
      return 'auto';
    case 'semi_auto':
      return 'semi_auto';
    case 'supervised':
      return 'supervised';
    case 'manual_review':
    default:
      return 'manual_review';
  }
}

/**
 * Parse capabilities from Athena agent
 */
export function parseAthenaCapabilities(
  capabilitiesJson?: string,
  role?: AgentRole
): {
  capabilities: string[];
  canDelegate: boolean;
  canExecute: boolean;
} {
  let capabilities: string[] = [];

  if (capabilitiesJson) {
    try {
      capabilities = JSON.parse(capabilitiesJson) as string[];
    } catch {
      capabilities = [];
    }
  }

  // Root and managers can delegate, workers execute
  const canDelegate = role === 'root' || role === 'manager';
  const canExecute = role === 'worker' || capabilities.includes('execute');

  return { capabilities, canDelegate, canExecute };
}

/**
 * Transform Naomi agent to DashboardAgent
 */
export function transformNaomiAgent(agent: NaomiAgent): DashboardAgent {
  const dashboardRole = mapNaomiRole(agent.role);

  return {
    id: agent.agent_id,
    name: agent.role.charAt(0).toUpperCase() + agent.role.slice(1),
    source: 'naomi',
    role: dashboardRole,
    status: 'active', // Naomi doesn't expose status in dashboard API
    can_delegate: agent.can_delegate,
    can_execute: agent.can_execute,
    capabilities: [], // Naomi dashboard API doesn't return capabilities list
    parent_id: agent.parent_agent_id,
    department: agent.department,
    reliability_score: agent.reliability_score,
    hallucination_risk: agent.hallucination_risk,
    autonomy_level: mapNaomiAutonomy(agent.autonomy_level),
    detail_url: `/agents/naomi/${agent.agent_id}`,
    api_endpoint: `/v1/dashboard/agents/${agent.agent_id}`,
  };
}

/**
 * Transform Athena agent to DashboardAgent
 */
export function transformAthenaAgent(agent: AthenaAgent): DashboardAgent {
  const role = mapAthenaRole(agent.agent_type);
  const { capabilities, canDelegate, canExecute } = parseAthenaCapabilities(
    agent.capabilities,
    role
  );

  return {
    id: agent.id,
    name: agent.name,
    source: 'athena',
    role,
    status: agent.status === 'terminated' ? 'offline' : (agent.status as AgentStatus),
    can_delegate: canDelegate,
    can_execute: canExecute,
    capabilities,
    parent_id: agent.parent_agent_id,
    department: agent.department,
    autonomy_level: 'auto',
    detail_url: `/agents/athena/${agent.id}`,
    api_endpoint: `/api/v2/agents/${agent.id}`,
  };
}
