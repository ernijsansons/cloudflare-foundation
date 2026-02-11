import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { corsMiddleware } from "./middleware/cors";
import { correlationMiddleware } from "./middleware/correlation";
import { tenantMiddleware } from "./middleware/tenant";
import { contextTokenMiddleware } from "./middleware/context-token";
import { turnstileMiddleware } from "./middleware/turnstile";
import { appendAuditEvent, verifyAuditChain } from "./lib/audit-chain";
import type { Env, Variables } from "./types";

export type { Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", corsMiddleware());
app.use("*", correlationMiddleware());
app.use("*", rateLimitMiddleware());

app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

app.post("/api/public/signup", turnstileMiddleware(), async (c) => {
  await c.req.json();
  return c.json({ created: true });
});

app.post("/api/public/contact", turnstileMiddleware(), async (c) => {
  await c.req.json();
  return c.json({ sent: true });
});

app.use("/api/*", authMiddleware());
app.use("/api/*", tenantMiddleware());
app.use("/api/*", contextTokenMiddleware());

app.all("/api/agents/:agentType/:agentId/*", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api\/agents/, "/agents");
  return c.env.AGENT_SERVICE.fetch(new Request(url.toString(), c.req.raw));
});

app.post("/api/workflows/:workflowName", async (c) => {
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
});

const ALLOWED_TABLES = ["users", "audit_log"] as const;
app.get("/api/data/:table", async (c) => {
  const table = c.req.param("table");
  if (!ALLOWED_TABLES.includes(table as (typeof ALLOWED_TABLES)[number]))
    return c.json({ error: "Invalid table" }, 400);
  const tenantId = c.get("tenantId") ?? "default";
  const result = await c.env.DB.prepare(
    `SELECT * FROM ${table} WHERE tenant_id = ? LIMIT 100`
  )
    .bind(tenantId)
    .all();
  return c.json(result.results);
});

app.post("/api/files/upload", async (c) => {
  const tenantId = c.get("tenantId") ?? "default";
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file" }, 400);
  const key = `tenants/${tenantId}/uploads/${Date.now()}-${file.name}`;
  await c.env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name, tenantId },
  });
  return c.json({ key, size: file.size });
});

app.post("/api/images/transform", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !c.env.IMAGES) return c.json({ error: "No file or IMAGES binding" }, 400);
  const images = c.env.IMAGES as { input: (s: ReadableStream) => { transform: (o: object) => { output: (o: object) => { response: () => Response } } } };
  const response = images
    .input(file.stream())
    .transform({ width: 256, height: 256 })
    .output({ format: "image/webp" })
    .response();
  return new Response(response.body, { headers: response.headers });
});

app.get("/api/admin/audit-verify/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const valid = await verifyAuditChain(c.env.DB, tenantId);
  return c.json({ tenantId, chainValid: valid });
});

app.post("/api/analytics/event", async (c) => {
  const event = (await c.req.json()) as { type?: string; tenantId?: string; metadata?: string; value?: number };
  if (c.env.ANALYTICS) {
    c.env.ANALYTICS.writeDataPoint({
      blobs: [event.type ?? "", event.tenantId ?? "", event.metadata ?? ""],
      doubles: [event.value ?? 0],
      indexes: [event.tenantId ?? "global"],
    });
  }
  return c.json({ recorded: true });
});

export default app;
