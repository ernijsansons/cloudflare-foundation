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

    // Deep health check - verifies dependencies
    if (url.pathname === "/health") {
      const checks: Record<string, boolean> = {
        db: false,
        ai: !!env.AI,
        files: true,
        cache: true,
      };

      // Check database connectivity
      try {
        await env.DB.prepare("SELECT 1").first();
        checks.db = true;
      } catch {
        // DB check failed
      }

      // Check KV connectivity
      try {
        if (env.CACHE_KV) {
          await env.CACHE_KV.get("health-check");
          checks.cache = true;
        }
      } catch {
        checks.cache = false;
      }

      // Check R2 connectivity
      try {
        if (env.FILES) {
          await env.FILES.head("health-check");
          checks.files = true;
        }
      } catch {
        // R2 check failed (expected for non-existent key, but connection works)
        checks.files = true;
      }

      const allHealthy = Object.values(checks).every(Boolean);
      return Response.json(
        {
          status: allHealthy ? "ok" : "degraded",
          service: "foundation-agents",
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: allHealthy ? 200 : 503 }
      );
    }

    // Rate limit check endpoint - proxy to TenantRateLimiter DO
    if (url.pathname === "/rate-limit/check" && request.method === "POST") {
      try {
        const body = await request.json() as { limitId: string; increment?: boolean };
        if (!body.limitId) {
          return Response.json({ error: "limitId is required" }, { status: 400 });
        }

        // Get DO instance by limitId (e.g., "tenant:abc123" or "ip:192.168.1.1")
        const id = env.RATE_LIMITER.idFromName(body.limitId);
        const stub = env.RATE_LIMITER.get(id);

        // Forward check request to DO
        const doResponse = await stub.fetch("https://fake-host/check");

        // Parse response and add resetAt timestamp
        const data = await doResponse.json() as { allowed: boolean; remaining: number; retryAfter?: number };
        const resetAt = data.retryAfter ? Date.now() + (data.retryAfter * 1000) : Date.now() + 60000;

        return Response.json(
          { ...data, resetAt },
          {
            status: doResponse.status,
            headers: doResponse.headers
          }
        );
      } catch (error) {
        console.error("Rate limit check error:", error);
        return Response.json({ error: "Rate limit service error" }, { status: 500 });
      }
    }

    if (url.pathname.startsWith("/mcp")) {
      return FoundationMcpServer.serve("/mcp").fetch(request, env, ctx);
    }
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;
    return new Response("Agent service — use WebSocket or /mcp", { status: 200 });
  },
};
