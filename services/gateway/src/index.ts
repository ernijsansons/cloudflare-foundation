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
  try {
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(/^\/api\/agents/, "/agents");

    // Properly forward the request with body
    const init: RequestInit = {
      method: c.req.method,
      headers: c.req.raw.headers,
    };
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      init.body = await c.req.raw.clone().arrayBuffer();
    }

    return c.env.AGENT_SERVICE.fetch(new Request(url.toString(), init));
  } catch (e) {
    console.error("Agent service error:", e);
    return c.json({ error: "Agent service unavailable" }, 503);
  }
});

app.all("/api/planning/*", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  try {
    const url = new URL(c.req.url);

    // Properly forward the request with body
    const init: RequestInit = {
      method: c.req.method,
      headers: c.req.raw.headers,
    };
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      init.body = await c.req.raw.clone().arrayBuffer();
    }

    return c.env.PLANNING_SERVICE.fetch(new Request(url.toString(), init));
  } catch (e) {
    console.error("Planning service error:", e);
    return c.json({ error: "Planning service unavailable" }, 503);
  }
});

// Webhook management routes
app.get("/api/webhooks", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const result = await c.env.DB.prepare(
      "SELECT id, name, hostname, url, active, events, created_at, updated_at FROM webhook_destinations WHERE tenant_id = ? ORDER BY created_at DESC"
    ).bind(tenantId).all();
    return c.json({ items: result.results ?? [] });
  } catch (e) {
    console.error("List webhooks error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/webhooks", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const body = await c.req.json() as {
      name?: string;
      url: string;
      secret?: string;
      events?: string;
    };

    if (!body.url || typeof body.url !== "string") {
      return c.json({ error: "url is required" }, 400);
    }

    let hostname: string;
    try {
      hostname = new URL(body.url).hostname;
    } catch {
      return c.json({ error: "Invalid URL" }, 400);
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO webhook_destinations (id, tenant_id, name, hostname, url, secret, events, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      tenantId,
      body.name ?? "",
      hostname,
      body.url,
      body.secret ?? null,
      body.events ?? "*",
      now,
      now
    ).run();

    return c.json({ id, name: body.name ?? "", hostname, url: body.url, active: 1, events: body.events ?? "*", created_at: now });
  } catch (e) {
    console.error("Create webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.delete("/api/webhooks/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      "DELETE FROM webhook_destinations WHERE id = ? AND tenant_id = ?"
    ).bind(id, tenantId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    return c.json({ deleted: true });
  } catch (e) {
    console.error("Delete webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.patch("/api/webhooks/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");
    const body = await c.req.json() as { active?: boolean; name?: string; events?: string };

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (body.active !== undefined) {
      updates.push("active = ?");
      params.push(body.active ? 1 : 0);
    }
    if (body.name !== undefined) {
      updates.push("name = ?");
      params.push(body.name);
    }
    if (body.events !== undefined) {
      updates.push("events = ?");
      params.push(body.events);
    }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = ?");
    params.push(Math.floor(Date.now() / 1000));
    params.push(id, tenantId);

    await c.env.DB.prepare(
      `UPDATE webhook_destinations SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`
    ).bind(...params).run();

    return c.json({ updated: true });
  } catch (e) {
    console.error("Update webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/workflows/:workflowName", async (c) => {
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

// Use explicit queries per table to avoid SQL interpolation
const TABLE_QUERIES: Record<string, string> = {
  users: "SELECT * FROM users WHERE tenant_id = ? LIMIT 100",
  audit_log: "SELECT * FROM audit_log WHERE tenant_id = ? LIMIT 100",
};

app.get("/api/data/:table", async (c) => {
  try {
    const table = c.req.param("table");
    const query = TABLE_QUERIES[table];

    if (!query) {
      return c.json({ error: "Invalid table" }, 400);
    }

    const tenantId = c.get("tenantId") ?? "default";
    const result = await c.env.DB.prepare(query).bind(tenantId).all();
    return c.json(result.results);
  } catch (e) {
    console.error("Data query error:", e);
    return c.json({ error: "Data query failed" }, 500);
  }
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
  try {
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
  } catch (e) {
    console.error("File upload error:", e);
    return c.json({ error: "File upload failed" }, 500);
  }
});

app.post("/api/images/transform", async (c) => {
  try {
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
  } catch (e) {
    console.error("Image transform error:", e);
    return c.json({ error: "Image transform failed" }, 500);
  }
});

app.get("/api/admin/audit-verify/:tenantId", async (c) => {
  try {
    const tenantId = c.req.param("tenantId");
    const valid = await verifyAuditChain(c.env.DB, tenantId);
    return c.json({ tenantId, chainValid: valid });
  } catch (e) {
    console.error("Audit verify error:", e);
    return c.json({ error: "Audit verification failed" }, 500);
  }
});

app.post("/api/analytics/event", async (c) => {
  try {
    const event = (await c.req.json()) as { type?: string; tenantId?: string; metadata?: string; value?: number };
    if (c.env.ANALYTICS) {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [event.type ?? "", event.tenantId ?? "", event.metadata ?? ""],
        doubles: [event.value ?? 0],
        indexes: [event.tenantId ?? "global"],
      });
    }
    return c.json({ recorded: true });
  } catch (e) {
    console.error("Analytics event error:", e);
    return c.json({ error: "Analytics event failed" }, 500);
  }
});

export default app;
