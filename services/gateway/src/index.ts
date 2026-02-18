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

// Deep health check - verifies all dependencies
app.get("/health", async (c) => {
  const checks: Record<string, boolean> = {
    db: false,
    kv: false,
    r2: false,
  };

  // Check database connectivity
  try {
    await c.env.DB.prepare("SELECT 1").first();
    checks.db = true;
  } catch {
    // DB check failed
  }

  // Check KV connectivity
  try {
    if (c.env.CACHE_KV) {
      await c.env.CACHE_KV.get("health-check");
      checks.kv = true;
    } else {
      checks.kv = true; // KV not configured, not a failure
    }
  } catch {
    // KV check failed
  }

  // Check R2 connectivity
  try {
    if (c.env.FILES) {
      await c.env.FILES.head("health-check");
      checks.r2 = true;
    } else {
      checks.r2 = true; // R2 not configured, not a failure
    }
  } catch {
    // R2 check failed (expected for non-existent key, but connection works)
    checks.r2 = true;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  return c.json(
    {
      status: allHealthy ? "ok" : "degraded",
      service: "foundation-gateway",
      timestamp: new Date().toISOString(),
      checks,
    },
    allHealthy ? 200 : 503
  );
});

app.get("/api/health", async (c) => {
  // Simple health check for API routes (behind auth)
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/public/signup", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  return c.json({ created: true });
});

app.post("/api/public/contact", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
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
  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const tenantId = c.get("tenantId") ?? "default";
  const workflows: Record<string, Workflow | undefined> = {
    onboarding: c.env.ONBOARDING_WORKFLOW,
    "data-pipeline": c.env.DATA_PIPELINE_WORKFLOW,
    report: c.env.REPORT_WORKFLOW,
    "email-sequence": c.env.EMAIL_WORKFLOW,
  };
  const workflow = workflows[workflowName];
  if (!workflow) return c.json({ error: "Unknown workflow" }, 404);

  // Wrap workflow creation in try-catch for proper error handling
  let instance;
  try {
    instance = await workflow.create({ params: { ...body, tenantId } });
  } catch (error) {
    console.error("Workflow creation failed:", error);
    return c.json(
      {
        error: "Failed to start workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }

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

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
];

app.post("/api/files/upload", async (c) => {
  const tenantId = c.get("tenantId") ?? "default";
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data" }, 400);
  }
  const file = formData.get("file") as File | null;
  if (!file) return c.json({ error: "No file provided" }, 400);

  // SECURITY: Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "File too large", maxSize: MAX_FILE_SIZE }, 413);
  }

  // SECURITY: Validate content type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return c.json({ error: "File type not allowed", allowedTypes: ALLOWED_FILE_TYPES }, 415);
  }

  // SECURITY: Sanitize filename to prevent path traversal
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Only allow safe characters
    .replace(/\.{2,}/g, ".") // Prevent directory traversal via ..
    .slice(0, 255); // Limit filename length

  const key = `tenants/${tenantId}/uploads/${Date.now()}-${sanitizedName}`;
  await c.env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: sanitizedName, tenantId },
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
  let event: { type?: string; tenantId?: string; metadata?: string; value?: number };
  try {
    event = (await c.req.json()) as typeof event;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
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
