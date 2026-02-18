/**
 * Agent state types used across gateway and agents service.
 */
export interface TenantState {
  tenantId: string;
  plan: string;
  limits: { maxAgents: number };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
}

export interface SessionState {
  userId: string;
  tenantId: string;
  messages: ChatMessage[];
}
