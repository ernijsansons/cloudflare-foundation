/**
 * Actor 2: Ralph Loop Control Plane API
 *
 * Isolated execution engine with zero dependencies on product gateway.
 * Manages run lifecycle, bundles, and state transitions.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { RunController } from "./agents/run-controller";
import type { Env, RunSpec, RunReport, RalphState } from "./types";

export { RunController };

const app = new Hono<{ Bindings: Env }>();

// CORS for local development
app.use("*", cors());

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: c.env.SERVICE_NAME || "foundation-run-api",
    timestamp: Date.now(),
  })
);

// === Run Spec Validation Schema ===
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

// === POST /runs — Create a new run ===
app.post("/runs", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const createSchema = z.object({
    runSpec: runSpecSchema,
    brief: z.string().optional(),
    docManifest: z.unknown().optional(),
  });

  const parsed = createSchema.safeParse(body);
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
        branch, created_by
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 'openclaw')`
    )
      .bind(runId, runSpec.project_id, runSpec.task_type, runSpec.risk_level, runSpec.objective, runSpec.branch)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return c.json({ error: "Failed to create run", details: message }, 500);
  }

  // Store bundle in R2
  const bundleKey = `${runSpec.project_id}/${runId}/run-spec.json`;
  await c.env.BUNDLES.put(bundleKey, JSON.stringify(runSpec, null, 2));

  if (brief) {
    const briefKey = `${runSpec.project_id}/${runId}/brief.md`;
    await c.env.BUNDLES.put(briefKey, brief);
  }

  if (docManifest) {
    const manifestKey = `${runSpec.project_id}/${runId}/doc-manifest.json`;
    await c.env.BUNDLES.put(manifestKey, JSON.stringify(docManifest, null, 2));
  }

  // Update D1 with R2 key
  await c.env.DB.prepare(`UPDATE runs SET bundle_r2_key = ? WHERE run_id = ?`).bind(bundleKey, runId).run();

  // Initialize RunController DO
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

  // Update D1 status
  await c.env.DB.prepare(`UPDATE runs SET status = 'IN_PROGRESS', started_at = datetime('now') WHERE run_id = ?`)
    .bind(runId)
    .run();

  return c.json({ run_id: runId, status: "IN_PROGRESS", message: "Run created and initialized" }, 201);
});

// === GET /runs — List runs ===
app.get("/runs", async (c) => {
  const status = c.req.query("status");
  const projectId = c.req.query("project_id");
  const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 100);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  let query = "SELECT * FROM runs WHERE 1=1";
  const params: (string | number)[] = [];

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

  return c.json({ runs: result.results, pagination: { limit, offset } });
});

// === GET /runs/:runId — Get run details ===
app.get("/runs/:runId", async (c) => {
  const runId = c.req.param("runId");

  const dbResult = await c.env.DB.prepare(`SELECT * FROM runs WHERE run_id = ?`).bind(runId).first();

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

  return c.json({ ...dbResult, liveState });
});

// === GET /runs/:runId/bundle — Download run bundle ===
app.get("/runs/:runId/bundle", async (c) => {
  const runId = c.req.param("runId");

  const dbResult = await c.env.DB.prepare(`SELECT bundle_r2_key, project_id FROM runs WHERE run_id = ?`)
    .bind(runId)
    .first<{ bundle_r2_key: string; project_id: string }>();

  if (!dbResult || !dbResult.bundle_r2_key) {
    return c.json({ error: "Bundle not found" }, 404);
  }

  const specObject = await c.env.BUNDLES.get(dbResult.bundle_r2_key);
  if (!specObject) {
    return c.json({ error: "Bundle not found in storage" }, 404);
  }

  const runSpec = await specObject.text();

  // Get optional files
  const briefKey = `${dbResult.project_id}/${runId}/brief.md`;
  const briefObject = await c.env.BUNDLES.get(briefKey);
  const brief = briefObject ? await briefObject.text() : null;

  const manifestKey = `${dbResult.project_id}/${runId}/doc-manifest.json`;
  const manifestObject = await c.env.BUNDLES.get(manifestKey);
  const manifest = manifestObject ? await manifestObject.text() : null;

  return c.json({
    runSpec: JSON.parse(runSpec),
    brief,
    docManifest: manifest ? JSON.parse(manifest) : null,
  });
});

// === POST /runs/:runId/hook-violation — Record hook violation ===
app.post("/runs/:runId/hook-violation", async (c) => {
  const runId = c.req.param("runId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const violationSchema = z.object({
    hookName: z.enum(["path-guard", "forbidden-cmd", "pre-commit-audit"]),
    violationType: z.string(),
    details: z.string(),
    filePath: z.string().optional(),
    command: z.string().optional(),
  });

  const parsed = violationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid violation data", details: parsed.error.issues }, 400);
  }

  const violation = { ...parsed.data, timestamp: new Date().toISOString() };

  // Record in D1
  const violationId = `vio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await c.env.DB.prepare(
    `INSERT INTO hook_violations (id, run_id, hook_name, violation_type, details, file_path, command)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(violationId, runId, violation.hookName, violation.violationType, violation.details, violation.filePath || null, violation.command || null)
    .run();

  // Send to DO to trigger BLOCKED transition
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const response = await doStub.fetch("https://run-controller/hook-violation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(violation),
  });

  // Update D1 status
  await c.env.DB.prepare(`UPDATE runs SET status = 'BLOCKED' WHERE run_id = ?`).bind(runId).run();

  return c.json({ success: true, blocked: true, violation });
});

// === POST /runs/:runId/report — Submit run report ===
app.post("/runs/:runId/report", async (c) => {
  const runId = c.req.param("runId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const report = body as RunReport;

  // Verify run exists
  const dbResult = await c.env.DB.prepare(`SELECT project_id FROM runs WHERE run_id = ?`).bind(runId).first<{ project_id: string }>();

  if (!dbResult) {
    return c.json({ error: "Run not found" }, 404);
  }

  // Store report in R2
  const reportKey = `${dbResult.project_id}/${runId}/run-report.json`;
  await c.env.BUNDLES.put(reportKey, JSON.stringify(report, null, 2));

  // Update D1
  await c.env.DB.prepare(
    `UPDATE runs SET
      status = ?,
      report_r2_key = ?,
      completed_at = datetime('now'),
      repair_attempts = ?
    WHERE run_id = ?`
  )
    .bind(report.status, reportKey, report.repair_attempts || 0, runId)
    .run();

  // Update DO state
  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  await doStub.fetch("https://run-controller/transition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toState: report.status, reason: report.blocked_reason || "Run completed" }),
  });

  return c.json({ success: true, status: report.status });
});

// === POST /runs/:runId/approve — Approve pending run ===
app.post("/runs/:runId/approve", async (c) => {
  const runId = c.req.param("runId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const approveSchema = z.object({ approvedBy: z.string().min(1) });
  const parsed = approveSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid approval request" }, 400);
  }

  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const response = await doStub.fetch("https://run-controller/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const result = (await response.json()) as { success: boolean; error?: string };

  if (result.success) {
    await c.env.DB.prepare(`UPDATE runs SET status = 'IN_PROGRESS' WHERE run_id = ?`).bind(runId).run();
  }

  return c.json(result, { status: result.success ? 200 : 400 });
});

// === POST /runs/:runId/reject — Reject pending run ===
app.post("/runs/:runId/reject", async (c) => {
  const runId = c.req.param("runId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const rejectSchema = z.object({
    rejectedBy: z.string().min(1),
    reason: z.string().min(1),
  });
  const parsed = rejectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid rejection request" }, 400);
  }

  const doId = c.env.RUN_CONTROLLER.idFromName(runId);
  const doStub = c.env.RUN_CONTROLLER.get(doId);

  const response = await doStub.fetch("https://run-controller/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  const result = (await response.json()) as { success: boolean; error?: string };

  if (result.success) {
    await c.env.DB.prepare(`UPDATE runs SET status = 'BLOCKED', completed_at = datetime('now') WHERE run_id = ?`)
      .bind(runId)
      .run();
  }

  return c.json(result, { status: result.success ? 200 : 400 });
});

// === GET /runs/:runId/transitions — Get state transitions ===
app.get("/runs/:runId/transitions", async (c) => {
  const runId = c.req.param("runId");

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
