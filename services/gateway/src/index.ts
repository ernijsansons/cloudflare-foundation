import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { corsMiddleware } from "./middleware/cors";
import { correlationMiddleware } from "./middleware/correlation";
import { tenantMiddleware } from "./middleware/tenant";
import { contextTokenMiddleware } from "./middleware/context-token";
import { turnstileMiddleware } from "./middleware/turnstile";
import { appendAuditEvent, verifyAuditChain } from "./lib/audit-chain";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, MAX_FILENAME_LENGTH } from "./constants";
import type { Env, Variables } from "./types";

export type { Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("*", corsMiddleware());
app.use("*", correlationMiddleware());
app.use("*", rateLimitMiddleware());

app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

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

// Naomi API - execution task tracking for Open Claw Naomi
app.post("/api/naomi/tasks", async (c) => {
  try {
    let body: { run_id?: string; repo_url?: string; agent?: string };
    try {
      body = (await c.req.json()) as { run_id?: string; repo_url?: string; agent?: string };
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const runId = String(body.run_id ?? "").trim();
    const repoUrl = String(body.repo_url ?? "").trim();
    if (!runId || !repoUrl) {
      return c.json({ error: "run_id and repo_url are required" }, 400);
    }
    try {
      new URL(repoUrl);
    } catch {
      return c.json({ error: "repo_url must be a valid URL" }, 400);
    }
    const tenantId = c.get("tenantId") ?? "default";
    const id = `naomi_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(
      `INSERT INTO naomi_tasks (id, run_id, repo_url, agent, status, tenant_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).bind(id, runId, repoUrl, body.agent ?? "claude", tenantId, now, now).run();

    if (c.env.WEBHOOK_QUEUE) {
      try {
        await c.env.WEBHOOK_QUEUE.send({
          type: "task_assigned",
          taskId: id,
          runId,
          repoUrl,
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return c.json({ id, run_id: runId, repo_url: repoUrl, status: "pending", created_at: now });
  } catch (e) {
    console.error("Create naomi task error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.get("/api/naomi/tasks", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const status = c.req.query("status");
    const runId = c.req.query("run_id");
    const limit = Math.min(parseInt(c.req.query("limit") ?? "50", 10) || 50, 100);

    let query = "SELECT * FROM naomi_tasks WHERE COALESCE(tenant_id, 'default') = ?";
    const params: (string | number)[] = [tenantId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (runId) {
      query += " AND run_id = ?";
      params.push(runId);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const result = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ items: result.results ?? [] });
  } catch (e) {
    console.error("List naomi tasks error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.get("/api/naomi/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId") ?? "default";
    const task = await c.env.DB.prepare("SELECT * FROM naomi_tasks WHERE id = ? AND COALESCE(tenant_id, 'default') = ?").bind(id, tenantId).first();
    if (!task) return c.json({ error: "Task not found" }, 404);

    const logs = await c.env.DB.prepare(
      "SELECT id, phase, level, message, created_at FROM naomi_execution_logs WHERE task_id = ? ORDER BY created_at ASC"
    ).bind(id).all();

    return c.json({
      ...(task as Record<string, unknown>),
      logs: logs.results ?? [],
    });
  } catch (e) {
    console.error("Get naomi task error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/naomi/tasks/:id/claim", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId") ?? "default";
    let body: { vm_id?: string } = {};
    try {
      body = (await c.req.json()) as { vm_id?: string } ?? {};
    } catch {
      // Empty body is valid for claim
    }
    const now = Math.floor(Date.now() / 1000);
    const lockExpiry = 3600; // 1 hour

    const task = await c.env.DB.prepare("SELECT * FROM naomi_tasks WHERE id = ? AND COALESCE(tenant_id, 'default') = ?").bind(id, tenantId).first();
    if (!task) return c.json({ error: "Task not found" }, 404);

    const t = task as Record<string, unknown>;
    if (t.status !== "pending") {
      return c.json({ error: `Task is not pending (status: ${t.status})` }, 409);
    }

    const repoUrl = t.repo_url as string;
    const existingLock = await c.env.DB.prepare("SELECT * FROM naomi_locks WHERE repo_url = ?").bind(repoUrl).first();
    if (existingLock) {
      const lock = existingLock as Record<string, unknown>;
      if ((lock.expires_at as number) > now) {
        return c.json({ error: "Repo is locked by another task" }, 409);
      }
      await c.env.DB.prepare("DELETE FROM naomi_locks WHERE repo_url = ?").bind(repoUrl).run();
    }

    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO naomi_locks (repo_url, task_id, acquired_at, expires_at) VALUES (?, ?, ?, ?)"
    ).bind(repoUrl, id, now, now + lockExpiry).run();

    await c.env.DB.prepare(
      "UPDATE naomi_tasks SET status = 'running', vm_id = ?, claimed_at = ?, started_at = ?, updated_at = ? WHERE id = ?"
    ).bind(body.vm_id ?? null, now, now, now, id).run();

    return c.json({
      id,
      status: "running",
      run_id: t.run_id,
      repo_url: repoUrl,
      claimed_at: now,
    });
  } catch (e) {
    console.error("Claim naomi task error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/naomi/tasks/:id/progress", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId") ?? "default";
    let body: { phase?: string; status?: string; error?: string } = {};
    try {
      body = (await c.req.json()) as { phase?: string; status?: string; error?: string } ?? {};
    } catch {
      // Empty body is valid
    }
    const now = Math.floor(Date.now() / 1000);

    const task = await c.env.DB.prepare("SELECT * FROM naomi_tasks WHERE id = ? AND COALESCE(tenant_id, 'default') = ?").bind(id, tenantId).first();
    if (!task) return c.json({ error: "Task not found" }, 404);

    const updates: string[] = ["updated_at = ?"];
    const params: (string | number | null)[] = [now];

    if (body.phase !== undefined) {
      updates.push("phase = ?");
      params.push(body.phase);
    }
    if (body.status !== undefined) {
      updates.push("status = ?");
      params.push(body.status);
    }
    if (body.error !== undefined) {
      updates.push("error = ?");
      params.push(body.error);
    }
    if (body.status === "completed" || body.status === "failed") {
      updates.push("completed_at = ?");
      params.push(now);
    }

    params.push(id);
    await c.env.DB.prepare(`UPDATE naomi_tasks SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

    return c.json({ id, updated: true });
  } catch (e) {
    console.error("Progress naomi task error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/naomi/tasks/:id/logs", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId") ?? "default";
    let body: { message?: string; phase?: string; level?: string };
    try {
      body = (await c.req.json()) as { message?: string; phase?: string; level?: string } ?? {};
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const message = String(body.message ?? "").trim();
    if (!message) {
      return c.json({ error: "message is required" }, 400);
    }
    const now = Math.floor(Date.now() / 1000);

    const task = await c.env.DB.prepare("SELECT id FROM naomi_tasks WHERE id = ? AND COALESCE(tenant_id, 'default') = ?").bind(id, tenantId).first();
    if (!task) return c.json({ error: "Task not found" }, 404);

    await c.env.DB.prepare(
      "INSERT INTO naomi_execution_logs (task_id, phase, level, message, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.phase ?? null, body.level ?? "info", message, now).run();

    return c.json({ appended: true });
  } catch (e) {
    console.error("Append naomi log error:", e);
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

app.post("/api/files/upload", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file" }, 400);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: "File too large", maxSize: MAX_FILE_SIZE }, 413);
    }

    // Validate MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      return c.json({ error: "File type not allowed", allowedTypes: ALLOWED_FILE_TYPES }, 415);
    }

    // Sanitize filename: remove path traversal, unsafe chars, and truncate
    const sanitizedName = file.name
      .replace(/[/\\:*?"<>|]/g, "_")
      .replace(/\.\./g, "_")
      .slice(0, MAX_FILENAME_LENGTH);

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
