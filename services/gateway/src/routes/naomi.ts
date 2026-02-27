import { Hono } from "hono";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /tasks - Create a new naomi task
app.post("/tasks", async (c) => {
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

// GET /tasks - List naomi tasks with optional filters
app.get("/tasks", async (c) => {
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

// GET /tasks/:id - Get a specific task with its execution logs
app.get("/tasks/:id", async (c) => {
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

// POST /tasks/bulk-create - Bulk create tasks from TASKS.json
// Takes a TASKS.json body and creates naomi_task records ordered by buildPhase.
// Requires additional D1 columns: task_id TEXT, task_type TEXT, title TEXT,
//   executor_prompt TEXT, build_phase INTEGER, task_data TEXT (JSON blob).
// Run: ALTER TABLE naomi_tasks ADD COLUMN task_id TEXT;
//      ALTER TABLE naomi_tasks ADD COLUMN task_type TEXT DEFAULT 'code';
//      ALTER TABLE naomi_tasks ADD COLUMN title TEXT;
//      ALTER TABLE naomi_tasks ADD COLUMN executor_prompt TEXT;
//      ALTER TABLE naomi_tasks ADD COLUMN build_phase INTEGER DEFAULT 0;
//      ALTER TABLE naomi_tasks ADD COLUMN task_data TEXT;
//      ALTER TABLE naomi_tasks ADD COLUMN attempt_number INTEGER DEFAULT 0;
app.post("/tasks/bulk-create", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    let body: {
      projectId?: string;
      projectName?: string;
      repoUrl?: string;
      tasks?: unknown[];
      marketingTasks?: unknown[];
    };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const projectId = String(body.projectId ?? "").trim();
    const repoUrl = String(body.repoUrl ?? "").trim();
    if (!projectId) return c.json({ error: "projectId is required" }, 400);
    if (!repoUrl) return c.json({ error: "repoUrl is required" }, 400);

    try {
      new URL(repoUrl);
    } catch {
      return c.json({ error: "repoUrl must be a valid URL" }, 400);
    }

    const allTasks = [
      ...(Array.isArray(body.tasks) ? body.tasks : []),
      ...(Array.isArray(body.marketingTasks) ? body.marketingTasks : []),
    ] as Array<{
      id?: string;
      type?: string;
      title?: string;
      buildPhase?: number;
      naomiPrompt?: string;
      [key: string]: unknown;
    }>;

    if (allTasks.length === 0) {
      return c.json({ error: "No tasks provided (tasks or marketingTasks arrays required)" }, 400);
    }

    // Sort by buildPhase ascending so D1 inserts are ordered
    const sorted = [...allTasks].sort((a, b) => (a.buildPhase ?? 0) - (b.buildPhase ?? 0));

    const now = Math.floor(Date.now() / 1000);
    const createdIds: Array<{ naomiId: string; taskId: string; buildPhase: number }> = [];

    // Insert tasks in a batch — D1 batch() for atomicity
    const stmts = sorted.map((task) => {
      const naomiId = `naomi_${crypto.randomUUID().replace(/-/g, "")}`;
      createdIds.push({ naomiId, taskId: task.id ?? "", buildPhase: task.buildPhase ?? 0 });
      return c.env.DB.prepare(
        `INSERT INTO naomi_tasks
           (id, run_id, repo_url, agent, status, tenant_id, created_at, updated_at,
            task_id, task_type, title, executor_prompt, build_phase, task_data, attempt_number)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      ).bind(
        naomiId,
        projectId,
        repoUrl,
        task.type ?? "code",
        tenantId,
        now,
        now,
        task.id ?? null,
        task.type ?? "code",
        task.title ?? null,
        task.naomiPrompt ?? null,
        task.buildPhase ?? 0,
        JSON.stringify(task)
      );
    });

    await c.env.DB.batch(stmts);

    if (c.env.WEBHOOK_QUEUE) {
      try {
        await c.env.WEBHOOK_QUEUE.send({
          type: "bulk_tasks_created",
          projectId,
          taskCount: sorted.length,
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return c.json({
      created: true,
      count: createdIds.length,
      projectId,
      tasks: createdIds,
    });
  } catch (e) {
    console.error("Bulk create naomi tasks error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// POST /tasks/:id/claim - Claim a task for execution
app.post("/tasks/:id/claim", async (c) => {
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

// POST /tasks/:id/progress - Update task progress
app.post("/tasks/:id/progress", async (c) => {
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

// POST /tasks/:id/logs - Append execution log entry
app.post("/tasks/:id/logs", async (c) => {
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

// POST /tasks/:id/verification - Handle verification results with auto-retry
// Naomi reports verification results (L1/L2/L3) for a completed task.
// On failure with attemptNumber < 3, re-queues the task with failure context
// injected into executor_prompt.
app.post("/tasks/:id/verification", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.get("tenantId") ?? "default";
    let body: {
      level?: "syntactic" | "contract" | "behavioral";
      passed?: boolean;
      failedChecks?: Array<{ name: string; detail?: string }>;
      summary?: string;
      attemptNumber?: number;
    };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const task = await c.env.DB.prepare(
      "SELECT * FROM naomi_tasks WHERE id = ? AND COALESCE(tenant_id, 'default') = ?"
    ).bind(id, tenantId).first() as Record<string, unknown> | null;

    if (!task) return c.json({ error: "Task not found" }, 404);

    const now = Math.floor(Date.now() / 1000);
    const attemptNumber = (body.attemptNumber ?? (task.attempt_number as number | null) ?? 0);

    // Log the verification result
    await c.env.DB.prepare(
      "INSERT INTO naomi_execution_logs (task_id, phase, level, message, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      id,
      `verification-${body.level ?? "unknown"}`,
      body.passed ? "info" : "error",
      body.summary ?? (body.passed ? "Verification passed" : "Verification failed"),
      now
    ).run();

    if (body.passed) {
      // All checks passed — task complete
      await c.env.DB.prepare(
        "UPDATE naomi_tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?"
      ).bind(now, now, id).run();
      return c.json({ id, action: "completed", passed: true });
    }

    // Verification failed
    if (attemptNumber >= 3) {
      // Max retries exceeded — escalate to human review
      await c.env.DB.prepare(
        "UPDATE naomi_tasks SET status = 'failed', error = ?, completed_at = ?, updated_at = ? WHERE id = ?"
      ).bind(
        `Max retries (3) exceeded. Last failure: ${body.summary ?? ""}`,
        now,
        now,
        id
      ).run();
      return c.json({ id, action: "escalated", passed: false, reason: "max_retries_exceeded" });
    }

    // Re-queue with failure context injected into executor_prompt
    const originalPrompt = String(task.executor_prompt ?? "");
    const failures = (body.failedChecks ?? [])
      .map((c) => `- ${c.name}: ${c.detail ?? ""}`)
      .join("\n");
    const requeuePrompt = `${originalPrompt}

=== PREVIOUS ATTEMPT FAILED (Attempt ${attemptNumber + 1}) ===
Verification level: ${body.level ?? "unknown"}
The previous execution of this task failed verification. Fix the following issues:

${failures || body.summary || "Unknown failure"}

=== END FAILURE CONTEXT ===

Retry the task addressing these specific failures. Do not change working parts of the implementation.`;

    await c.env.DB.prepare(
      `UPDATE naomi_tasks SET status = 'pending', executor_prompt = ?, attempt_number = ?,
       error = NULL, started_at = NULL, claimed_at = NULL, vm_id = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(requeuePrompt, attemptNumber + 1, now, id).run();

    return c.json({
      id,
      action: "requeued",
      passed: false,
      attemptNumber: attemptNumber + 1,
      reason: body.summary,
    });
  } catch (e) {
    console.error("Verification naomi task error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default app;
