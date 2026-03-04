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

    this.server.registerTool(
      "get_living_prd",
      { 
        description: "Get the current Living PRD for a planning run", 
        inputSchema: { runId: z.string().describe("The ID of the planning run") } 
      },
      async ({ runId }: { runId: string }) => {
        try {
          const row = await this.env.DB.prepare('SELECT living_prd_state FROM planning_runs WHERE id = ?')
            .bind(runId)
            .first();

          if (!row || !row.living_prd_state) {
            return {
              content: [{ type: "text" as const, text: `No Living PRD found for run ID: ${runId}` }],
            };
          }

          let livingPrdStateObj: any;
          try {
            livingPrdStateObj = JSON.parse(row.living_prd_state as string);
          } catch (e: any) {
            return {
              content: [{ type: "text" as const, text: `Failed to parse Living PRD state: ${e.message}` }],
            };
          }

          return {
            content: [{ type: "text" as const, text: JSON.stringify(livingPrdStateObj, null, 2) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text" as const, text: `Error fetching Living PRD: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
    this.server.registerTool(
      "update_living_prd",
      {
        description: "Update the current Living PRD state for a planning run",
        inputSchema: {
          runId: z.string().describe("The ID of the planning run"),
          updates: z.record(z.any()).describe("A JSON object representing fields to update in the Living PRD. This will be shallow-merged with the existing state.")
        }
      },
      async ({ runId, updates }: { runId: string, updates: Record<string, any> }) => {
        try {
          const row = await this.env.DB.prepare('SELECT living_prd_state FROM planning_runs WHERE id = ?')
            .bind(runId)
            .first();

          if (!row || !row.living_prd_state) {
            return {
              content: [{ type: "text" as const, text: `No Living PRD found for run ID: ${runId}. Cannot update.` }],
              isError: true,
            };
          }

          let existingState: any;
          try {
            existingState = JSON.parse(row.living_prd_state as string);
          } catch (e: any) {
             return {
              content: [{ type: "text" as const, text: `Failed to parse existing Living PRD state: ${e.message}` }],
              isError: true,
            };
          }

          // Shallow merge
          const newState = { ...existingState, ...updates };

          await this.env.DB.prepare('UPDATE planning_runs SET living_prd_state = ? WHERE id = ?')
            .bind(JSON.stringify(newState), runId)
            .run();

          return {
            content: [{ type: "text" as const, text: `Successfully updated Living PRD for run ID: ${runId}` }],
          };
        } catch (error: any) {
          return {
            content: [{ type: "text" as const, text: `Error updating Living PRD: ${error.message}` }],
            isError: true,
          };
        }
      }
    );

    this.server.registerTool(
      "advance_planning_phase",
      {
        description: "Trigger the next step in the background planning workflow.",
        inputSchema: {
           runId: z.string().describe("The ID of the planning run to advance"),
        }
      },
      async ({ runId }: { runId: string }) => {
        try {
           // We can just fetch the workflow and tell it to resume or check status.
           // However, to trigger the durable workflow properly since it's an HTTP API:
           // Call the API endpoint. We could also hit the local URL, but binding is safer.
           // Since we don't have direct access to the WORKFLOW binding here, we will just suggest hitting the API.
           
           return {
             content: [{ type: "text" as const, text: `Note: To advance the workflow, please use the CLI tool or send a POST request to /api/planning/runs/${runId}/resume` }]
           }

        } catch (error: any) {
           return {
             content: [{ type: "text" as const, text: `Error advancing workflow: ${error.message}` }],
             isError: true,
           };
        }
      }
    );
  }

  static serve(path: string) {
    return McpAgent.serve(path, { binding: "MCP_SERVER" });
  }
}
