import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env } from "../types";

export class FoundationMcpServer extends McpAgent<Env> {
  server = new McpServer({ name: "cloudflare-foundation", version: "1.0.0" });

  async init() {
    // List active Cloudflare Workflows
    this.server.tool(
      "list_workflows",
      "List recent Cloudflare Workflow instances and their statuses",
      {
        limit: z.number().int().min(1).max(100).default(20).optional()
          .describe("Number of records to return (default: 20)"),
      },
      async ({ limit = 20 }) => {
        const result = await this.env.DB.prepare(
          "SELECT id, type, status, created_at FROM workflow_instances ORDER BY created_at DESC LIMIT ?"
        ).bind(limit).all();
        return {
          content: [{ type: "text", text: JSON.stringify(result.results, null, 2) }],
        };
      }
    );

    // Get tenant info
    this.server.tool(
      "get_tenant",
      "Get information about a tenant by ID",
      {
        tenantId: z.string().uuid().describe("The tenant UUID"),
      },
      async ({ tenantId }) => {
        const row = await this.env.DB.prepare(
          "SELECT id, name, plan, status, created_at FROM tenants WHERE id = ?"
        ).bind(tenantId).first();
        if (!row) {
          return { content: [{ type: "text", text: "Tenant not found" }], isError: true };
        }
        return { content: [{ type: "text", text: JSON.stringify(row, null, 2) }] };
      }
    );

    // Trigger a workflow
    this.server.tool(
      "trigger_workflow",
      "Trigger a named Cloudflare Workflow (onboarding, data-pipeline, report, email-sequence)",
      {
        workflowName: z.enum(["onboarding", "data-pipeline", "report", "email-sequence"])
          .describe("The workflow to trigger"),
        params: z.record(z.unknown()).optional().describe("Optional parameters to pass to the workflow"),
      },
      async ({ workflowName, params }) => {
        const workflowMap: Record<string, Workflow | undefined> = {
          "onboarding": this.env.ONBOARDING_WORKFLOW,
          "data-pipeline": this.env.DATA_PIPELINE_WORKFLOW,
          "report": this.env.REPORT_WORKFLOW,
          "email-sequence": this.env.EMAIL_WORKFLOW,
        };
        const workflow = workflowMap[workflowName];
        if (!workflow) {
          return {
            content: [{ type: "text", text: `Workflow binding not found: ${workflowName}` }],
            isError: true,
          };
        }
        const instance = await workflow.create({ params: params ?? {} });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ workflowName, instanceId: instance.id, status: "started" }, null, 2),
          }],
        };
      }
    );

    // List naomi tasks
    this.server.tool(
      "list_naomi_tasks",
      "List Naomi agent execution tasks, optionally filtered by status",
      {
        status: z.enum(["pending", "running", "completed", "failed"]).optional()
          .describe("Filter tasks by status"),
        limit: z.number().int().min(1).max(100).default(20).optional()
          .describe("Number of records to return (default: 20)"),
      },
      async ({ status, limit = 20 }) => {
        let query = "SELECT id, run_id, repo_url, agent, status, created_at FROM naomi_tasks";
        const params: (string | number)[] = [];
        if (status) {
          query += " WHERE status = ?";
          params.push(status);
        }
        query += " ORDER BY created_at DESC LIMIT ?";
        params.push(limit);
        const result = await this.env.DB.prepare(query).bind(...params).all();
        return {
          content: [{ type: "text", text: JSON.stringify(result.results, null, 2) }],
        };
      }
    );

    // List webhooks
    this.server.tool(
      "list_webhooks",
      "List configured webhook destinations",
      {
        tenantId: z.string().optional().describe("Filter by tenant ID (defaults to 'default')"),
      },
      async ({ tenantId = "default" }) => {
        const result = await this.env.DB.prepare(
          "SELECT id, name, hostname, url, active, events, created_at FROM webhook_destinations WHERE tenant_id = ? ORDER BY created_at DESC"
        ).bind(tenantId).all();
        return {
          content: [{ type: "text", text: JSON.stringify(result.results, null, 2) }],
        };
      }
    );
  }
}
