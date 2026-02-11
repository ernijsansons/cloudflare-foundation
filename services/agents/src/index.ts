import { routeAgentRequest } from "agents";
import { ChatAgent } from "./agents/chat-agent";
import { TaskAgent } from "./agents/task-agent";
import { TenantAgent } from "./agents/tenant-agent";
import { SessionAgent } from "./agents/session-agent";
import { TenantRateLimiter } from "./agents/rate-limit-do";
import { FoundationMcpServer } from "./mcp/server";

export { ChatAgent, TaskAgent, TenantAgent, SessionAgent, TenantRateLimiter, FoundationMcpServer };

export interface Env {
  CHAT_AGENT: DurableObjectNamespace;
  TASK_AGENT: DurableObjectNamespace;
  TENANT_AGENT: DurableObjectNamespace;
  SESSION_AGENT: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  MCP_SERVER: DurableObjectNamespace;
  DB: D1Database;
  AI: Ai;
  FILES?: R2Bucket;
  CACHE_KV?: KVNamespace;
  VECTOR_INDEX?: VectorizeIndex;
  AUDIT_QUEUE?: Queue;
  ANALYTICS_QUEUE?: Queue;
  ANALYTICS?: AnalyticsEngineDataset;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/mcp")) {
      return FoundationMcpServer.serve("/mcp").fetch(request, env, ctx);
    }
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;
    return new Response("Agent service — use WebSocket or /mcp", { status: 200 });
  },
};
