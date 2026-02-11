import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

export interface Env {
  MCP_SERVER: DurableObjectNamespace;
  DB: D1Database;
}

export class FoundationMcpServer extends McpAgent<Env> {
  server = new McpServer({ name: "foundation-mcp", version: "1.0.0" });

  async init(): Promise<void> {
    this.server.registerTool(
      "echo",
      { description: "Echo back the input (template placeholder)", inputSchema: { message: z.string().optional() } },
      async ({ message }: { message?: string }) => ({
        content: [{ type: "text" as const, text: message ?? "Hello from Foundation MCP" }],
      })
    );
  }

  static serve(path: string) {
    return McpAgent.serve(path, { binding: "MCP_SERVER" });
  }
}
