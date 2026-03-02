/**
 * Runs Routes — Ralph Loop Control Plane API
 *
 * Manages autonomous execution runs for the Ralph Loop system.
 *
 * Routes:
 *   GET  /api/runs/v1/health          — Health check endpoint
 *   POST /api/runs                    — Create a new run
 *   GET  /api/runs                    — List runs (with filters)
 *   GET  /api/runs/:runId             — Get run details
 *   GET  /api/runs/:runId/bundle      — Download run bundle (tar.gz)
 *   POST /api/runs/:runId/report      — Submit run report
 *   POST /api/runs/:runId/approve     — Approve pending run
 *   POST /api/runs/:runId/reject      — Reject pending run
 *   GET  /api/runs/:runId/transitions — Get run state transitions
 */

import { Hono } from "hono";
import { z } from "zod";
import type { Env, Variables } from "../types";

// Extend Env for runs routes
interface RunsEnv extends Env {
  RUN_CONTROLLER: DurableObjectNamespace;
  AGENT_CONTROL_BUCKET?: R2Bucket;
}

const app = new Hono<{ Bindings: RunsEnv; Variables: Variables }>();

/**
 * GET /v1/health — Health check endpoint
 * Returns service status and version
 */
app.get("/v1/health", (c) => {
  return c.json({ status: "ok", version: "1.0.0" });
});

// Zod schemas for validation
const runSpecSchema = z.object({
  schema_version: z.string().default("1.0.0"),
  run_id: z.string().regex(/^run_\d{4}_\d{2}_\d{2}_\d{3}$/),
  project_id: z.string().min(1),
  task_type: z.enum(["implementation", "bugfix", "refactor", "docs", "migration", "audit"]),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  objective: z.string().min(10),
  repo: z.object({
    url: z.string().url(),
    base_branch: z.string().default("main"),
  }),
  branch: z.string().min(1),
  allowed_paths: z.array(z.string()).min(1),
  forbidden_paths: z.array(z.string()).default([]),
  required_inputs: z.array(z.string()).default([]),
  acceptance_criteria: z.array(z.string()).min(1),
  commands: z.object({
    install: z.string().optional(),
    lint: z.string().optional(),
    typecheck: z.string().optional(),
    test: z.string().optional(),
    smoke: z.string().optional(),
    deploy_dry: z.string().optional(),
  }),
  deliverables: z.array(z.string()).min(1),
  stop_conditions: z.array(z.string()).default([]),
  human_approval_required_for: z.array(z.string()).default([]),
  max_turns: z.number().int().min(1).max(100).default(25),
  model: z.string().default("claude-sonnet-4-5-20250929"),
});

const createRunSchema = z.object({
  runSpec: runSpecSchema,
  brief: z.string().optional(),
  docManifest: z
    .object({
      version: z.string(),
      project: z.string(),
      documents: z.array(
        z.object({
          id: z.string(),
          path: z.string(),
          priority: z.number().int().min(1).max(10),
          required: z.boolean(),
          summary: z.string().max(200),
        })
      ),
    })
    .optional(),
});

const approveRunSchema = z.object({
  approvedBy: z.string().min(1),
  resumeState: z
    .enum([
      "PRELOAD",
      "READ_SPEC",
      "READ_DOCS",
      "PLAN_PATCH",
      "EXECUTE_PATCH",
      "RUN_CHECKS",
      "UPDATE_DOCS",
      "WRITE_REPORT",
    ])
    .optional(),
});

const rejectRunSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1),
});

const runReportSchema = z.object({
  run_id: z.string(),
  project_id: z.string(),
  status: z.enum(["COMPLETE", "BLOCKED", "REQUEST_APPROVAL"]),
  branch: z.string(),
  task_type: z.string(),
  objective: z.string(),
  files_changed: z.array(z.string()),
  checks: z.object({
    lint: z.enum(["pass", "fail", "skip"]).optional(),
    typecheck: z.enum(["pass", "fail", "skip"]).optional(),
    test: z.enum(["pass", "fail", "skip"]).optional(),
    smoke: z.enum(["pass", "fail", "skip"]).optional(),
  }),
  docs_updated: z.array(z.string()).optional(),
  repair_attempts: z.number().int().optional(),
  stop_conditions_hit: z.array(z.string()).optional(),
  open_risks: z.array(z.string()).optional(),
  suggested_next_run: z.string().optional(),
  acceptance_criteria_results: z.array(
    z.object({
      criterion: z.string(),
      status: z.enum(["pass", "fail", "skip"]),
      notes: z.string().optional(),
    })
  ),
  blocked_reason: z.string().optional(),
  approval_request: z
    .object({
      action: z.string(),
      reason: z.string(),
      context: z.record(z.unknown()).optional(),
    })
    .optional(),
});

/**
 * POST /runs — Create a new run
 */
app.post("/", async (c) => {
  const tenantId = c.get("tenantId");
  if (!tenantId) {
    return c.json({ error: "Tenant ID required" }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = createRunSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid run spec", details: parsed.error.issues }, 400);
  }

  const { runSpec, brief, docManifest } = parsed.data;
  const runId = runSpec.run_id;

  // Store run metadata in D1
  try {
    await c.env.DB.prepare(
      `INSERT INTO runs (
        run_id, project_id, task_type, risk_level, status, objective,
        branch, created_by, tenant_id
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 'openclaw', ?)`
    )
      .bind(
        runId,
        runSpec.project_id,
        runSpec.task_type,
        runSpec.risk_level,
        runSpec.objective,
        runSpec.branch,
        tenantId
      )
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return c.json({ error: "Failed to create run", details: message }, 500);
  }

  // Store bundle in R2 if available
  if (c.env.AGENT_CONTROL_BUCKET) {
    const bundleKey = `projects/${runSpec.project_id}/runs/${runId}/bundle/run-spec.json`;
    await c.env.AGENT_CONTROL_BUCKET.put(bundleKey, JSON.stringify(runSpec, null, 2));

    if (brief) {
      const briefKey = `projects/${runSpec.project_id}/runs/${runId}/bundle/brief.md`;
      await c.env.AGENT_CONTROL_BUCKET.put(briefKey, brief);
    }

    if (docManifest) {
      const manifestKey = `projects/${runSpec.project_id}/runs/${runId}/bundle/doc-manifest.json`;
      await c.env.AGENT_CONTROL_BUCKET.put(manifestKey, JSON.stringify(docManifest, null, 2));
    }

    // Update D1 with R2 key
    await c.env.DB.prepare(`UPDATE runs SET bundle_r2_key = ? WHERE run_id = ?`)
      .bind(`projects/${runSpec.project_id}/runs/${runId}/bundle/`, runId)
      .run();
  }

  // Initialize the RunController DO
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const initResponse = await doStub.fetch("https://run-controller/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, runSpec }),
  });

  if (!initResponse.ok) {
    const errorData = (await initResponse.json()) as { error?: string };
    return c.json({ error: "Failed to initialize run", details: errorData.error }, 500);
  }

  // Update D1 status to IN_PROGRESS
  await c.env.DB.prepare(`UPDATE runs SET status = 'IN_PROGRESS', started_at = datetime('now') WHERE run_id = ?`)
    .bind(runId)
    .run();

  return c.json(
    {
      run_id: runId,
      status: "IN_PROGRESS",
      message: "Run created and initialized",
    },
    201
  );
});

/**
 * GET /runs — List runs with optional filters
 */
app.get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const status = c.req.query("status");
  const projectId = c.req.query("project_id");
  const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 100);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  let query = "SELECT * FROM runs WHERE 1=1";
  const params: (string | number)[] = [];

  if (tenantId) {
    query += " AND tenant_id = ?";
    params.push(tenantId);
  }

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (projectId) {
    query += " AND project_id = ?";
    params.push(projectId);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all();

  return c.json({
    runs: result.results,
    pagination: { limit, offset, total: result.results?.length || 0 },
  });
});

/**
 * GET /runs/:runId — Get run details
 */
app.get("/:runId", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  // Get from D1
  const dbResult = await c.env.DB.prepare(
    `SELECT * FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  // Get live state from DO
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  let liveState = null;
  try {
    const stateResponse = await doStub.fetch("https://run-controller/state");
    if (stateResponse.ok) {
      liveState = await stateResponse.json();
    }
  } catch {
    // DO may not exist yet
  }

  return c.json({
    ...dbResult,
    liveState,
  });
});

/**
 * GET /runs/:runId/bundle — Download run bundle
 */
app.get("/:runId/bundle", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  // Verify access
  const dbResult = await c.env.DB.prepare(
    `SELECT bundle_r2_key, project_id FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first<{ bundle_r2_key: string; project_id: string }>();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  if (!c.env.AGENT_CONTROL_BUCKET) {
    return c.json({ error: "R2 bucket not configured" }, 503);
  }

  // Get run-spec.json from R2
  const specKey = `projects/${dbResult.project_id}/runs/${runId}/bundle/run-spec.json`;
  const specObject = await c.env.AGENT_CONTROL_BUCKET.get(specKey);

  if (!specObject) {
    return c.json({ error: "Bundle not found in storage" }, 404);
  }

  const runSpec = await specObject.text();

  // Get optional files
  const briefKey = `projects/${dbResult.project_id}/runs/${runId}/bundle/brief.md`;
  const briefObject = await c.env.AGENT_CONTROL_BUCKET.get(briefKey);
  const brief = briefObject ? await briefObject.text() : null;

  const manifestKey = `projects/${dbResult.project_id}/runs/${runId}/bundle/doc-manifest.json`;
  const manifestObject = await c.env.AGENT_CONTROL_BUCKET.get(manifestKey);
  const manifest = manifestObject ? await manifestObject.text() : null;

  return c.json({
    runSpec: JSON.parse(runSpec),
    brief,
    docManifest: manifest ? JSON.parse(manifest) : null,
  });
});

/**
 * POST /runs/:runId/report — Submit run report
 */
app.post("/:runId/report", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = runReportSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid run report", details: parsed.error.issues }, 400);
  }

  const report = parsed.data;

  // Verify run exists and matches
  const dbResult = await c.env.DB.prepare(
    `SELECT project_id FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first<{ project_id: string }>();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  // Store report in R2
  if (c.env.AGENT_CONTROL_BUCKET) {
    const reportKey = `projects/${dbResult.project_id}/runs/${runId}/reports/run-report.json`;
    await c.env.AGENT_CONTROL_BUCKET.put(reportKey, JSON.stringify(report, null, 2));

    await c.env.DB.prepare(`UPDATE runs SET report_r2_key = ? WHERE run_id = ?`)
      .bind(reportKey, runId)
      .run();
  }

  // Update D1 with final status
  await c.env.DB.prepare(
    `UPDATE runs SET
      status = ?,
      completed_at = datetime('now'),
      repair_attempts = ?
    WHERE run_id = ?`
  )
    .bind(report.status, report.repair_attempts || 0, runId)
    .run();

  // Update DO state
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  await doStub.fetch("https://run-controller/transition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      toState: report.status,
      reason: report.blocked_reason || "Run completed",
    }),
  });

  return c.json({ success: true, status: report.status });
});

/**
 * POST /runs/:runId/approve — Approve pending run
 */
app.post("/:runId/approve", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = approveRunSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid approval request", details: parsed.error.issues }, 400);
  }

  // Verify run exists
  const dbResult = await c.env.DB.prepare(
    `SELECT status FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first<{ status: string }>();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  if (dbResult.status !== "REQUEST_APPROVAL") {
    return c.json({ error: "Run is not pending approval", status: dbResult.status }, 400);
  }

  // Approve via DO
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const response = await doStub.fetch("https://run-controller/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const result = (await response.json()) as { success: boolean; error?: string };

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  // Record approval in D1
  const approvalId = `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO run_approvals (id, run_id, action, status, resolved_at, resolved_by)
     VALUES (?, ?, 'approve', 'APPROVED', datetime('now'), ?)`
  )
    .bind(approvalId, runId, parsed.data.approvedBy)
    .run();

  // Update run status
  await c.env.DB.prepare(`UPDATE runs SET status = 'IN_PROGRESS' WHERE run_id = ?`).bind(runId).run();

  return c.json({ success: true, message: "Run approved" });
});

/**
 * POST /runs/:runId/reject — Reject pending run
 */
app.post("/:runId/reject", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = rejectRunSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid rejection request", details: parsed.error.issues }, 400);
  }

  // Verify run exists
  const dbResult = await c.env.DB.prepare(
    `SELECT status FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first<{ status: string }>();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  if (dbResult.status !== "REQUEST_APPROVAL") {
    return c.json({ error: "Run is not pending approval", status: dbResult.status }, 400);
  }

  // Reject via DO
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const response = await doStub.fetch("https://run-controller/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const result = (await response.json()) as { success: boolean; error?: string };

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  // Record rejection in D1
  const approvalId = `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO run_approvals (id, run_id, action, status, resolved_at, resolved_by, resolution)
     VALUES (?, ?, 'reject', 'REJECTED', datetime('now'), ?, ?)`
  )
    .bind(approvalId, runId, parsed.data.rejectedBy, parsed.data.reason)
    .run();

  // Update run status
  await c.env.DB.prepare(`UPDATE runs SET status = 'BLOCKED', completed_at = datetime('now') WHERE run_id = ?`)
    .bind(runId)
    .run();

  return c.json({ success: true, message: "Run rejected" });
});

/**
 * GET /runs/:runId/transitions — Get run state transitions
 */
app.get("/:runId/transitions", async (c) => {
  const runId = c.req.param("runId");
  const tenantId = c.get("tenantId");

  // Verify access
  const dbResult = await c.env.DB.prepare(
    `SELECT 1 FROM runs WHERE run_id = ?${tenantId ? " AND tenant_id = ?" : ""}`
  )
    .bind(...(tenantId ? [runId, tenantId] : [runId]))
    .first();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  // Get transitions from DO
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  try {
    const response = await doStub.fetch("https://run-controller/transitions");
    if (response.ok) {
      const transitions = await response.json();
      return c.json({ transitions });
    }
    return c.json({ transitions: [] });
  } catch {
    return c.json({ transitions: [] });
  }
});

export default app;
