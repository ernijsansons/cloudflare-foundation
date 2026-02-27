import { Hono } from "hono";
import { appendAuditEvent } from "../lib/audit-chain";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.post("/:workflowName", async (c) => {
  try {
    const { workflowName } = c.req.param();
    const body = (await c.req.json()) as Record<string, unknown>;
    const tenantId = c.get("tenantId") ?? "default";

    const workflows: Record<string, Workflow | undefined> = {
      onboarding: c.env.ONBOARDING_WORKFLOW,
      "data-pipeline": c.env.DATA_PIPELINE_WORKFLOW,
      report: c.env.REPORT_WORKFLOW,
      "email-sequence": c.env.EMAIL_WORKFLOW,
    };

    const workflow = workflows[workflowName];
    if (!workflow) return c.json({ error: "Unknown workflow" }, 404);

    const instance = await workflow.create({ params: { ...body, tenantId } });

    await appendAuditEvent(c.env.DB, {
      type: "workflow_dispatched",
      tenantId,
      payload: { workflowName, instanceId: instance.id },
    });

    return c.json({ instanceId: instance.id, status: "started" });
  } catch (e) {
    console.error("Workflow dispatch error:", e);
    return c.json({ error: "Workflow dispatch failed" }, 500);
  }
});

export default app;
