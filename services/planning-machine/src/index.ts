/**
 * Planning Machine — Cloudflare Worker
 * POST /api/planning/runs — start a planning run
 * GET /api/planning/runs/:id — run status
 * GET /api/planning/runs/:id/artifacts/:phase — artifact
 * POST /api/planning/runs/:id/approve — approve phase (when gates enabled)
 * POST /api/planning/run-opportunity — run opportunity agent
 * POST /api/planning/run-customer-intel — run customer intel agent
 * POST /api/planning/run-market-research — run market research agent
 * POST /api/planning/run-competitive-intel — run competitive intel agent
 * POST /api/planning/run-kill-test — run kill test agent
 * GET /api/planning/health — health check
 */

import type { Env } from "./types";
import { PlanningWorkflow } from "./workflows/planning-workflow";
import { embedAndStore, queryRelevant } from "./lib/rag";
import { OpportunityAgent } from "./agents/opportunity-agent";
import { CustomerIntelAgent } from "./agents/customer-intel-agent";
import { MarketResearchAgent } from "./agents/market-research-agent";
import { CompetitiveIntelAgent } from "./agents/competitive-intel-agent";
import { KillTestAgent } from "./agents/kill-test-agent";
import { RevenueExpansionAgent } from "./agents/revenue-expansion-agent";
import { StrategyAgent } from "./agents/strategy-agent";
import { BusinessModelAgent } from "./agents/business-model-agent";
import { ProductDesignAgent } from "./agents/product-design-agent";
import { GTMAgent } from "./agents/gtm-agent";
import { ContentEngineAgent } from "./agents/content-engine-agent";
import { TechArchAgent } from "./agents/tech-arch-agent";
import { AnalyticsAgent } from "./agents/analytics-agent";
import { LaunchExecutionAgent } from "./agents/launch-execution-agent";
import { SynthesisAgent } from "./agents/synthesis-agent";

export type { Env };
export { PlanningWorkflow };

const AGENT_ROUTES: Array<{ path: string; handler: (req: Request, env: Env) => Promise<Response> }> = [
  { path: "/api/planning/run-opportunity", handler: runOpportunityAgent },
  { path: "/api/planning/run-customer-intel", handler: runCustomerIntelAgent },
  { path: "/api/planning/run-market-research", handler: runMarketResearchAgent },
  { path: "/api/planning/run-competitive-intel", handler: runCompetitiveIntelAgent },
  { path: "/api/planning/run-kill-test", handler: runKillTestAgent },
  { path: "/api/planning/run-revenue-expansion", handler: runRevenueExpansionAgent },
  { path: "/api/planning/run-strategy", handler: runStrategyAgent },
  { path: "/api/planning/run-business-model", handler: runBusinessModelAgent },
  { path: "/api/planning/run-product-design", handler: runProductDesignAgent },
  { path: "/api/planning/run-gtm", handler: runGTMAgent },
  { path: "/api/planning/run-content-engine", handler: runContentEngineAgent },
  { path: "/api/planning/run-tech-arch", handler: runTechArchAgent },
  { path: "/api/planning/run-analytics", handler: runAnalyticsAgent },
  { path: "/api/planning/run-launch-execution", handler: runLaunchExecutionAgent },
  { path: "/api/planning/run-synthesis", handler: runSynthesisAgent },
];

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/planning/health") {
      return Response.json({
        status: "ok",
        service: "foundation-planning-machine",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname.startsWith("/api/planning/runs")) {
      return handleRuns(request, env, url);
    }

    if (url.pathname === "/api/planning/parked-ideas" && request.method === "GET") {
      return getParkedIdeas(request, env);
    }

    // Handle parked ideas promote
    const parkedPromoteMatch = url.pathname.match(/^\/api\/planning\/parked-ideas\/([^/]+)\/promote$/);
    if (parkedPromoteMatch && request.method === "POST") {
      return promoteParkedIdea(parkedPromoteMatch[1]!, env);
    }

    for (const { path, handler } of AGENT_ROUTES) {
      if (url.pathname === path && request.method === "POST") {
        return handler(request, env);
      }
    }

    return new Response("Planning Machine — use /api/planning/*", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
};

async function handleRuns(request: Request, env: Env, url: URL): Promise<Response> {
  const pathParts = url.pathname.replace(/^\/api\/planning\/runs\/?/, "").split("/").filter(Boolean);

  if (pathParts.length === 0) {
    if (request.method === "POST") {
      return createRun(request, env);
    }
    if (request.method === "GET") {
      return listRuns(request, env);
    }
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const runId = pathParts[0];
  const subPath = pathParts.slice(1);

  if (request.method === "GET" && subPath.length === 0) {
    return getRun(runId, env);
  }

  if (request.method === "DELETE" && subPath.length === 0) {
    return deleteRun(runId, env);
  }

  if (request.method === "GET" && subPath[0] === "phases" && subPath.length === 1) {
    return getRunPhases(runId, env);
  }

  if (request.method === "POST" && subPath[0] === "cancel" && subPath.length === 1) {
    return cancelRun(runId, env);
  }

  if (subPath[0] === "artifacts" && subPath.length === 2) {
    const phase = subPath[1];
    if (request.method === "GET") {
      return getArtifact(runId, phase, env);
    }
    if (request.method === "POST") {
      return syncArtifact(request, runId, phase, env);
    }
  }

  if (request.method === "POST" && subPath[0] === "context" && subPath.length === 1) {
    return getRunContext(request, runId, env);
  }

  if (request.method === "GET" && subPath[0] === "package" && subPath.length === 1) {
    return getPackage(runId, env);
  }

  if (request.method === "POST" && subPath[0] === "approve" && subPath.length === 1) {
    return approvePhase(runId, env);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

async function createRun(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { idea: string; mode?: "local" | "cloud"; config?: Record<string, unknown> };
    const idea = body.idea;
    if (!idea || typeof idea !== "string") {
      return Response.json({ error: "idea is required" }, { status: 400 });
    }

    const mode = body.mode === "local" ? "local" : "cloud";
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const config = JSON.stringify(body.config ?? {});

    await env.DB.prepare(
      `INSERT INTO planning_runs (id, idea, status, mode, config, created_at, updated_at)
       VALUES (?, ?, 'running', ?, ?, ?, ?)`
    )
      .bind(id, idea.trim(), mode, config, now, now)
      .run();

    let workflowInstanceId: string | null = null;
    // Only start workflow for cloud mode - local mode uses CLI
    if (mode === "cloud" && env.PLANNING_WORKFLOW) {
      const instance = await env.PLANNING_WORKFLOW.create({
        params: { runId: id, idea: idea.trim(), config: body.config },
      });
      workflowInstanceId = instance.id;
      await env.DB.prepare(
        "UPDATE planning_runs SET workflow_instance_id = ? WHERE id = ?"
      )
        .bind(workflowInstanceId, id)
        .run();
    }

    // Emit webhook event for run started
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_started",
          runId: id,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    const message = mode === "local"
      ? "Run created for local execution. Use CLI to run phases."
      : workflowInstanceId
        ? "Workflow started."
        : "Run created. Workflow not configured.";

    return Response.json({
      id,
      idea: idea.trim(),
      status: "running",
      mode,
      workflow_instance_id: workflowInstanceId,
      message,
    });
  } catch (e) {
    console.error("createRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function listRuns(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
    const status = url.searchParams.get("status");

    let query: string;
    let countQuery: string;
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (status) {
      query = `
        SELECT id, idea, refined_idea, status, current_phase, quality_score,
               revenue_potential, workflow_instance_id, kill_verdict, pivot_count,
               package_key, mode, created_at, updated_at
        FROM planning_runs
        WHERE status = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = "SELECT COUNT(*) as total FROM planning_runs WHERE status = ?";
      params.push(status, limit, offset);
      countParams.push(status);
    } else {
      query = `
        SELECT id, idea, refined_idea, status, current_phase, quality_score,
               revenue_potential, workflow_instance_id, kill_verdict, pivot_count,
               package_key, mode, created_at, updated_at
        FROM planning_runs
        WHERE status != 'deleted'
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = "SELECT COUNT(*) as total FROM planning_runs WHERE status != 'deleted'";
      params.push(limit, offset);
    }

    const [result, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params).all(),
      env.DB.prepare(countQuery).bind(...countParams).first(),
    ]);

    const items = (result.results ?? []).map((r) => ({
      id: (r as Record<string, unknown>).id,
      idea: (r as Record<string, unknown>).idea,
      refined_idea: (r as Record<string, unknown>).refined_idea,
      status: (r as Record<string, unknown>).status,
      current_phase: (r as Record<string, unknown>).current_phase,
      quality_score: (r as Record<string, unknown>).quality_score,
      revenue_potential: (r as Record<string, unknown>).revenue_potential,
      workflow_instance_id: (r as Record<string, unknown>).workflow_instance_id ?? null,
      kill_verdict: (r as Record<string, unknown>).kill_verdict ?? null,
      pivot_count: (r as Record<string, unknown>).pivot_count ?? 0,
      package_key: (r as Record<string, unknown>).package_key ?? null,
      mode: (r as Record<string, unknown>).mode ?? "cloud",
      created_at: (r as Record<string, unknown>).created_at,
      updated_at: (r as Record<string, unknown>).updated_at,
    }));

    const total = ((countResult as Record<string, unknown>)?.total as number) ?? 0;

    return Response.json({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  } catch (e) {
    console.error("listRuns error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getPackage(runId: string, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      "SELECT package_key FROM planning_runs WHERE id = ? AND status = ?"
    )
      .bind(runId, "completed")
      .first();

    if (!row || !(row as Record<string, unknown>).package_key) {
      return Response.json({ error: "Package not found or run not completed" }, { status: 404 });
    }

    const packageKey = (row as Record<string, unknown>).package_key as string;
    if (!env.FILES) {
      return Response.json({ error: "Storage not configured" }, { status: 503 });
    }

    const obj = await env.FILES.get(packageKey);
    if (!obj) {
      return Response.json({ error: "Package file not found" }, { status: 404 });
    }

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="planning-package-${runId}.json"`,
      },
    });
  } catch (e) {
    console.error("getPackage error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getParkedIdeas(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
    const source = url.searchParams.get("source");

    let query = "SELECT id, idea, refined_idea, run_id, source_phase, reason, revisit_estimate_months, revisit_estimate_note, created_at FROM planning_parked_ideas ORDER BY created_at DESC LIMIT ?";
    const params: (string | number)[] = [limit];
    if (source) {
      query = "SELECT id, idea, refined_idea, run_id, source_phase, reason, revisit_estimate_months, revisit_estimate_note, created_at FROM planning_parked_ideas WHERE source_phase = ? ORDER BY created_at DESC LIMIT ?";
      params.unshift(source);
    }

    const result = await env.DB.prepare(query).bind(...params).all();
    const items = (result.results ?? []).map((r) => ({
      id: (r as Record<string, unknown>).id,
      idea: (r as Record<string, unknown>).idea,
      refined_idea: (r as Record<string, unknown>).refined_idea,
      run_id: (r as Record<string, unknown>).run_id,
      source_phase: (r as Record<string, unknown>).source_phase,
      reason: (r as Record<string, unknown>).reason,
      revisit_estimate_months: (r as Record<string, unknown>).revisit_estimate_months,
      revisit_estimate_note: (r as Record<string, unknown>).revisit_estimate_note,
      created_at: (r as Record<string, unknown>).created_at,
    }));

    return Response.json({ items });
  } catch (e) {
    console.error("getParkedIdeas error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("no such table") || msg.includes("planning_parked_ideas")) {
      return Response.json({ items: [] });
    }
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function promoteParkedIdea(parkedIdeaId: string, env: Env): Promise<Response> {
  try {
    const idea = await env.DB.prepare(
      "SELECT id, idea, refined_idea, artifact_summary FROM planning_parked_ideas WHERE id = ?"
    ).bind(parkedIdeaId).first();

    if (!idea) {
      return Response.json({ error: "Parked idea not found" }, { status: 404 });
    }

    // Create a new run from this parked idea
    const runId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const ideaText = ((idea as Record<string, unknown>).refined_idea as string) ||
                     ((idea as Record<string, unknown>).idea as string);

    await env.DB.prepare(
      `INSERT INTO planning_runs (id, idea, refined_idea, status, mode, created_at, updated_at)
       VALUES (?, ?, ?, 'running', 'cloud', ?, ?)`
    ).bind(runId, ideaText, ideaText, now, now).run();

    // Mark parked idea as promoted
    await env.DB.prepare(
      "UPDATE planning_parked_ideas SET reason = ? WHERE id = ?"
    ).bind("PROMOTED to run " + runId, parkedIdeaId).run();

    // Start workflow if available
    let workflowInstanceId: string | null = null;
    if (env.PLANNING_WORKFLOW) {
      const instance = await env.PLANNING_WORKFLOW.create({
        params: { runId, idea: ideaText },
      });
      workflowInstanceId = instance.id;
      await env.DB.prepare(
        "UPDATE planning_runs SET workflow_instance_id = ? WHERE id = ?"
      ).bind(workflowInstanceId, runId).run();
    }

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "idea_promoted",
          runId,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({
      promoted: true,
      parkedIdeaId,
      newRunId: runId,
      workflowInstanceId,
    });
  } catch (e) {
    console.error("promoteParkedIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getRunPhases(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, current_phase, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const artifacts = await env.DB.prepare(
      `SELECT phase, version, review_verdict, overall_score, created_at
       FROM planning_artifacts
       WHERE run_id = ?
       ORDER BY created_at ASC`
    ).bind(runId).all();

    // Import PHASE_ORDER
    const { PHASE_ORDER } = await import("./agents/registry");

    const phases = PHASE_ORDER.map((phase) => {
      const artifact = (artifacts.results ?? []).find(
        (a) => (a as Record<string, unknown>).phase === phase
      ) as Record<string, unknown> | undefined;

      let status: string;
      if (artifact) {
        status = "completed";
      } else if ((run as Record<string, unknown>).current_phase === phase) {
        status = "in_progress";
      } else {
        status = "pending";
      }

      return {
        phase,
        status,
        version: artifact?.version ?? null,
        review_verdict: artifact?.review_verdict ?? null,
        overall_score: artifact?.overall_score ?? null,
        created_at: artifact?.created_at ?? null,
      };
    });

    return Response.json({
      runId,
      current_phase: (run as Record<string, unknown>).current_phase,
      run_status: (run as Record<string, unknown>).status,
      phases,
    });
  } catch (e) {
    console.error("getRunPhases error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function cancelRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus !== "running" && currentStatus !== "pending" && currentStatus !== "paused") {
      return Response.json({
        error: `Cannot cancel run with status '${currentStatus}'`,
      }, { status: 409 });
    }

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("cancelled", now, runId).run();

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_cancelled",
          runId,
          status: "cancelled",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({ id: runId, status: "cancelled" });
  } catch (e) {
    console.error("cancelRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function deleteRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    // Only allow deleting completed, cancelled, or killed runs
    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus === "running") {
      return Response.json({
        error: "Cannot delete a running run. Cancel it first.",
      }, { status: 409 });
    }

    // Soft delete: set status to 'deleted'
    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("deleted", Math.floor(Date.now() / 1000), runId).run();

    return Response.json({ id: runId, deleted: true });
  } catch (e) {
    console.error("deleteRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getRun(runId: string, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      "SELECT id, idea, refined_idea, status, current_phase, quality_score, revenue_potential, workflow_instance_id, kill_verdict, pivot_count, package_key, mode, created_at, updated_at FROM planning_runs WHERE id = ?"
    )
      .bind(runId)
      .first();

    if (!row) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    return Response.json({
      id: row.id,
      idea: row.idea,
      refined_idea: row.refined_idea,
      status: row.status,
      current_phase: row.current_phase,
      quality_score: row.quality_score,
      revenue_potential: row.revenue_potential,
      workflow_instance_id: (row as Record<string, unknown>).workflow_instance_id ?? null,
      kill_verdict: (row as Record<string, unknown>).kill_verdict ?? null,
      pivot_count: (row as Record<string, unknown>).pivot_count ?? 0,
      package_key: (row as Record<string, unknown>).package_key ?? null,
      mode: (row as Record<string, unknown>).mode ?? "cloud",
      created_at: row.created_at,
      updated_at: (row as Record<string, unknown>).updated_at,
    });
  } catch (e) {
    console.error("getRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getArtifact(runId: string, phase: string, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      "SELECT id, phase, content, review_verdict, overall_score FROM planning_artifacts WHERE run_id = ? AND phase = ? ORDER BY version DESC LIMIT 1"
    )
      .bind(runId, phase)
      .first();

    if (!row) {
      return Response.json({ error: "Artifact not found" }, { status: 404 });
    }

    return Response.json({
      id: row.id,
      phase: row.phase,
      content: JSON.parse(row.content as string),
      review_verdict: row.review_verdict,
      overall_score: row.overall_score,
    });
  } catch (e) {
    console.error("getArtifact error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function approvePhase(runId: string, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare("SELECT id, status FROM planning_runs WHERE id = ?")
      .bind(runId)
      .first();

    if (!row) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    if (row.status !== "paused") {
      return Response.json({
        message: "Run is not paused. Phase gates workflow integration coming soon.",
      });
    }

    return Response.json({
      message: "Approval received. Workflow continuation coming soon.",
    });
  } catch (e) {
    console.error("approvePhase error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function syncArtifact(
  request: Request,
  runId: string,
  phase: string,
  env: Env
): Promise<Response> {
  try {
    // Verify run exists
    const run = await env.DB.prepare("SELECT id FROM planning_runs WHERE id = ?")
      .bind(runId)
      .first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    // Parse content
    const content = await request.json();
    const contentStr = JSON.stringify(content);
    const now = Math.floor(Date.now() / 1000);

    // Check for existing version
    const existing = await env.DB.prepare(
      "SELECT MAX(version) as version FROM planning_artifacts WHERE run_id = ? AND phase = ?"
    )
      .bind(runId, phase)
      .first();
    const version = (((existing as Record<string, unknown>)?.version as number) ?? 0) + 1;

    // Store artifact in D1
    const artifactId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO planning_artifacts (id, run_id, phase, version, content, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(artifactId, runId, phase, version, contentStr, now)
      .run();

    // Update current phase
    await env.DB.prepare(
      "UPDATE planning_runs SET current_phase = ?, updated_at = ? WHERE id = ?"
    )
      .bind(phase, now, runId)
      .run();

    // Generate embedding and store in Vectorize
    try {
      await embedAndStore(env.AI, env.VECTOR_INDEX, env.DB, {
        id: artifactId,
        runId,
        phase,
        content: contentStr,
      });
    } catch (embedError) {
      // Don't fail if embedding fails - just warn
      console.warn("Embedding failed:", embedError);
    }

    // Emit webhook event for phase completed (local mode)
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "phase_completed",
          runId,
          phase,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({
      success: true,
      artifactId,
      phase,
      version,
    });
  } catch (e) {
    console.error("syncArtifact error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getRunContext(
  request: Request,
  runId: string,
  env: Env
): Promise<Response> {
  try {
    // Verify run exists
    const run = await env.DB.prepare(
      "SELECT id, idea, refined_idea FROM planning_runs WHERE id = ?"
    )
      .bind(runId)
      .first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const body = (await request.json()) as { query: string; topK?: number };
    const query = body.query;
    const topK = body.topK ?? 5;

    if (!query || typeof query !== "string") {
      return Response.json({ error: "query is required" }, { status: 400 });
    }

    // Query Vectorize for relevant context
    const results = await queryRelevant(env.AI, env.VECTOR_INDEX, runId, query, topK);

    return Response.json({
      runId,
      idea: (run as Record<string, unknown>).idea,
      refinedIdea: (run as Record<string, unknown>).refined_idea,
      results,
    });
  } catch (e) {
    console.error("getRunContext error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function runAgentWithBody(
  request: Request,
  env: Env,
  run: (ctx: { runId: string; idea: string; refinedIdea?: string; priorOutputs: Record<string, unknown> }, input: unknown) => Promise<{ success: boolean; output?: unknown; errors?: string[]; orchestration?: unknown }>
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      idea: string;
      refinedIdea?: string;
      priorOutputs?: Record<string, unknown>;
    };
    const idea = body.idea;
    if (!idea || typeof idea !== "string") {
      return Response.json({ error: "idea is required" }, { status: 400 });
    }

    const ctx = {
      runId: "test",
      idea: idea.trim(),
      refinedIdea: body.refinedIdea?.trim(),
      priorOutputs: body.priorOutputs ?? {},
    };

    const result = await run(ctx, body);

    if (!result.success) {
      return Response.json(
        { error: "Agent failed", details: result.errors },
        { status: 500 }
      );
    }

    const response: { success: boolean; output?: unknown; orchestration?: unknown } = {
      success: true,
      output: result.output,
    };
    if (result.orchestration) {
      response.orchestration = result.orchestration;
    }
    return Response.json(response);
  } catch (e) {
    console.error("Agent error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function runOpportunityAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx, body) => {
    const agent = new OpportunityAgent(env);
    return agent.run(ctx, { idea: ctx.idea });
  });
}

async function runCustomerIntelAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx, body) => {
    const agent = new CustomerIntelAgent(env);
    return agent.run(ctx, {
      idea: ctx.idea,
      refinedIdea: ctx.refinedIdea,
    });
  });
}

async function runMarketResearchAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx, body) => {
    const agent = new MarketResearchAgent(env);
    return agent.run(ctx, {
      idea: ctx.idea,
      refinedIdea: ctx.refinedIdea,
    });
  });
}

async function runCompetitiveIntelAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx, body) => {
    const agent = new CompetitiveIntelAgent(env);
    return agent.run(ctx, {
      idea: ctx.idea,
      refinedIdea: ctx.refinedIdea,
    });
  });
}

async function runKillTestAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new KillTestAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runRevenueExpansionAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new RevenueExpansionAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runStrategyAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new StrategyAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runBusinessModelAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new BusinessModelAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runProductDesignAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new ProductDesignAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runGTMAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new GTMAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runContentEngineAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new ContentEngineAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runTechArchAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new TechArchAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runAnalyticsAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new AnalyticsAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runLaunchExecutionAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new LaunchExecutionAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}

async function runSynthesisAgent(request: Request, env: Env): Promise<Response> {
  return runAgentWithBody(request, env, async (ctx) => {
    const agent = new SynthesisAgent(env);
    return agent.run(ctx, { idea: ctx.idea, refinedIdea: ctx.refinedIdea });
  });
}
