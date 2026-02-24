/**
 * Planning Machine — Cloudflare Worker
 *
 * Runs:
 *   POST /api/planning/runs — start a planning run
 *   GET  /api/planning/runs — list runs
 *   GET  /api/planning/runs/:id — run status
 *   DELETE /api/planning/runs/:id — delete run
 *   POST /api/planning/runs/:id/cancel — cancel run
 *   POST /api/planning/runs/:id/pause — pause run
 *   POST /api/planning/runs/:id/resume — resume run
 *   GET  /api/planning/runs/:id/phases — list phases
 *   GET  /api/planning/runs/:id/artifacts/:phase — artifact
 *   POST /api/planning/runs/:id/artifacts/:phase — sync artifact
 *   POST /api/planning/runs/:id/approve — approve phase (when gates enabled)
 *
 * Ideas (Idea Cards):
 *   GET  /api/planning/ideas — list ideas
 *   POST /api/planning/ideas — create idea
 *   GET  /api/planning/ideas/:id — get idea
 *   PUT  /api/planning/ideas/:id — update idea
 *   DELETE /api/planning/ideas/:id — delete idea
 *   GET  /api/planning/ideas/:id/runs — list runs for idea
 *   POST /api/planning/ideas/:id/runs — create run from idea
 *
 * Agents (direct testing):
 *   POST /api/planning/run-opportunity
 *   POST /api/planning/run-customer-intel
 *   POST /api/planning/run-market-research
 *   POST /api/planning/run-competitive-intel
 *   POST /api/planning/run-kill-test
 *   ... (and more)
 *
 * Health:
 *   GET /api/planning/health — health check
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
import { requireContextToken } from "./middleware/context-token";

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

    // Health check doesn't require authentication
    if (url.pathname === "/api/planning/health") {
      return Response.json({
        status: "ok",
        service: "foundation-planning-machine",
        timestamp: new Date().toISOString(),
      });
    }

    // Validate context token for all other routes
    const contextOrError = await requireContextToken(request, env);
    if (contextOrError instanceof Response) {
      return contextOrError; // Return error response
    }

    // Context is valid, continue with request handling
    // The tenant context is available in contextOrError.tid, contextOrError.uid, etc.

    if (url.pathname.startsWith("/api/planning/runs")) {
      return handleRuns(request, env, url);
    }

    if (url.pathname.startsWith("/api/planning/ideas")) {
      return handleIdeas(request, env, url);
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

  if (request.method === "POST" && subPath[0] === "pause" && subPath.length === 1) {
    return pauseRun(runId, env);
  }

  if (request.method === "POST" && subPath[0] === "resume" && subPath.length === 1) {
    return resumeRun(runId, env);
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

  if (request.method === "GET" && subPath[0] === "artifacts" && subPath.length === 1) {
    return listArtifacts(runId, env);
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

// ---------------------------------------------------------------------------
// Ideas CRUD (Idea Cards)
// ---------------------------------------------------------------------------

async function handleIdeas(request: Request, env: Env, url: URL): Promise<Response> {
  const pathParts = url.pathname.replace(/^\/api\/planning\/ideas\/?/, "").split("/").filter(Boolean);

  if (pathParts.length === 0) {
    if (request.method === "POST") {
      return createIdea(request, env);
    }
    if (request.method === "GET") {
      return listIdeas(request, env);
    }
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ideaId = pathParts[0];
  const subPath = pathParts.slice(1);

  if (request.method === "GET" && subPath.length === 0) {
    return getIdea(ideaId, env);
  }

  if (request.method === "PUT" && subPath.length === 0) {
    return updateIdea(request, ideaId, env);
  }

  if (request.method === "DELETE" && subPath.length === 0) {
    return deleteIdea(ideaId, env);
  }

  // GET /api/planning/ideas/:id/runs - list runs for this idea
  if (request.method === "GET" && subPath[0] === "runs" && subPath.length === 1) {
    return listRunsForIdea(ideaId, env);
  }

  // POST /api/planning/ideas/:id/runs - create run from this idea
  if (request.method === "POST" && subPath[0] === "runs" && subPath.length === 1) {
    return createRunFromIdea(request, ideaId, env);
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

async function listIdeas(request: Request, env: Env): Promise<Response> {
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
        SELECT id, name, content, status, created_at, updated_at
        FROM ideas
        WHERE status = ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = "SELECT COUNT(*) as total FROM ideas WHERE status = ?";
      params.push(status, limit, offset);
      countParams.push(status);
    } else {
      query = `
        SELECT id, name, content, status, created_at, updated_at
        FROM ideas
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `;
      countQuery = "SELECT COUNT(*) as total FROM ideas";
      params.push(limit, offset);
    }

    const [result, countResult] = await Promise.all([
      env.DB.prepare(query).bind(...params).all(),
      env.DB.prepare(countQuery).bind(...countParams).first(),
    ]);

    const items = (result.results ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        name: row.name,
        // Truncate content for list view (first 500 chars)
        content: typeof row.content === "string" ? row.content.slice(0, 500) : row.content,
        contentLength: typeof row.content === "string" ? row.content.length : 0,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    const total = ((countResult as Record<string, unknown>)?.total as number) ?? 0;

    return Response.json({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  } catch (e) {
    console.error("listIdeas error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("no such table") || msg.includes("ideas")) {
      return Response.json({ items: [], total: 0, limit: 50, offset: 0, hasMore: false });
    }
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function createIdea(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { name: string; content: string; status?: string };
    const name = body.name;
    const content = body.content;

    if (!name || typeof name !== "string") {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const status = body.status ?? "draft";

    await env.DB.prepare(
      `INSERT INTO ideas (id, name, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name.trim(), content, status, now, now)
      .run();

    return Response.json({
      id,
      name: name.trim(),
      content,
      status,
      created_at: now,
      updated_at: now,
    });
  } catch (e) {
    console.error("createIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function getIdea(ideaId: string, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      "SELECT id, name, content, status, created_at, updated_at FROM ideas WHERE id = ?"
    )
      .bind(ideaId)
      .first();

    if (!row) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    return Response.json({
      id: row.id,
      name: row.name,
      content: row.content,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (e) {
    console.error("getIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function updateIdea(request: Request, ideaId: string, env: Env): Promise<Response> {
  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM ideas WHERE id = ?"
    ).bind(ideaId).first();

    if (!existing) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const body = await request.json() as { name?: string; content?: string; status?: string };
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) {
      updates.push("name = ?");
      values.push(body.name.trim());
    }
    if (body.content !== undefined) {
      updates.push("content = ?");
      values.push(body.content);
    }
    if (body.status !== undefined) {
      updates.push("status = ?");
      values.push(body.status);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    updates.push("updated_at = ?");
    values.push(now, ideaId);

    await env.DB.prepare(
      `UPDATE ideas SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...values)
      .run();

    // Return updated idea
    return getIdea(ideaId, env);
  } catch (e) {
    console.error("updateIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function deleteIdea(ideaId: string, env: Env): Promise<Response> {
  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM ideas WHERE id = ?"
    ).bind(ideaId).first();

    if (!existing) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    // Check if any runs reference this idea
    const linkedRuns = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM planning_runs WHERE idea_id = ?"
    ).bind(ideaId).first();

    if (((linkedRuns as Record<string, unknown>)?.count as number) > 0) {
      return Response.json({
        error: "Cannot delete idea with linked runs. Delete runs first.",
      }, { status: 409 });
    }

    await env.DB.prepare("DELETE FROM ideas WHERE id = ?")
      .bind(ideaId)
      .run();

    return Response.json({ id: ideaId, deleted: true });
  } catch (e) {
    console.error("deleteIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function listRunsForIdea(ideaId: string, env: Env): Promise<Response> {
  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM ideas WHERE id = ?"
    ).bind(ideaId).first();

    if (!existing) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const result = await env.DB.prepare(`
      SELECT id, idea, refined_idea, status, current_phase, quality_score,
             revenue_potential, workflow_instance_id, kill_verdict, pivot_count,
             package_key, mode, created_at, updated_at
      FROM planning_runs
      WHERE idea_id = ?
      ORDER BY created_at DESC
    `).bind(ideaId).all();

    const items = (result.results ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        idea: row.idea,
        refined_idea: row.refined_idea,
        status: row.status,
        current_phase: row.current_phase,
        quality_score: row.quality_score,
        revenue_potential: row.revenue_potential,
        workflow_instance_id: row.workflow_instance_id ?? null,
        kill_verdict: row.kill_verdict ?? null,
        pivot_count: row.pivot_count ?? 0,
        package_key: row.package_key ?? null,
        mode: row.mode ?? "cloud",
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return Response.json({ items });
  } catch (e) {
    console.error("listRunsForIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function createRunFromIdea(request: Request, ideaId: string, env: Env): Promise<Response> {
  try {
    const ideaRow = await env.DB.prepare(
      "SELECT id, name, content FROM ideas WHERE id = ?"
    ).bind(ideaId).first();

    if (!ideaRow) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const body = await request.json() as { mode?: "local" | "cloud"; config?: Record<string, unknown> } | null;
    const mode = body?.mode === "local" ? "local" : "cloud";
    const config = JSON.stringify(body?.config ?? {});

    // Use idea name as the run idea, and full content is available via idea_id
    const ideaName = (ideaRow as Record<string, unknown>).name as string;
    const ideaContent = (ideaRow as Record<string, unknown>).content as string;

    // Combine name and content for the idea field (agents will use this)
    const ideaText = `${ideaName}\n\n${ideaContent}`;

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO planning_runs (id, idea, status, mode, config, idea_id, created_at, updated_at)
       VALUES (?, ?, 'running', ?, ?, ?, ?, ?)`
    )
      .bind(id, ideaText.trim(), mode, config, ideaId, now, now)
      .run();

    // Update idea status to 'researching'
    await env.DB.prepare(
      "UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("researching", now, ideaId).run();

    let workflowInstanceId: string | null = null;
    if (mode === "cloud" && env.PLANNING_WORKFLOW) {
      const instance = await env.PLANNING_WORKFLOW.create({
        params: { runId: id, idea: ideaText.trim(), config: body?.config },
      });
      workflowInstanceId = instance.id;
      await env.DB.prepare(
        "UPDATE planning_runs SET workflow_instance_id = ? WHERE id = ?"
      )
        .bind(workflowInstanceId, id)
        .run();
    }

    // Emit webhook event
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_started",
          runId: id,
          ideaId,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({
      id,
      idea_id: ideaId,
      idea: ideaText.trim(),
      status: "running",
      mode,
      workflow_instance_id: workflowInstanceId,
      message: mode === "local"
        ? "Run created for local execution. Use CLI to run phases."
        : workflowInstanceId
          ? "Workflow started."
          : "Run created. Workflow not configured.",
    });
  } catch (e) {
    console.error("createRunFromIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
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

async function pauseRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus !== "running") {
      return Response.json({
        error: `Cannot pause run with status '${currentStatus}'. Only running runs can be paused.`,
      }, { status: 409 });
    }

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("paused", now, runId).run();

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_paused",
          runId,
          status: "paused",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({ id: runId, status: "paused" });
  } catch (e) {
    console.error("pauseRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function resumeRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status, idea, workflow_instance_id FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus !== "paused") {
      return Response.json({
        error: `Cannot resume run with status '${currentStatus}'. Only paused runs can be resumed.`,
      }, { status: 409 });
    }

    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("running", now, runId).run();

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_resumed",
          runId,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({ id: runId, status: "running" });
  } catch (e) {
    console.error("resumeRun error:", e);
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

async function listArtifacts(runId: string, env: Env): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      `SELECT id, phase, content, review_verdict, overall_score, version, created_at
       FROM planning_artifacts
       WHERE run_id = ?
       ORDER BY phase ASC, version DESC, created_at DESC`
    )
      .bind(runId)
      .all();

    const latestByPhase = new Map<string, Record<string, unknown>>();
    for (const row of (result.results ?? []) as Array<Record<string, unknown>>) {
      const phase = String(row.phase ?? "");
      if (!phase || latestByPhase.has(phase)) {
        continue;
      }
      latestByPhase.set(phase, row);
    }

    const items = Array.from(latestByPhase.values()).map((row) => {
      const contentRaw = row.content;
      let content: unknown = {};
      if (typeof contentRaw === "string") {
        try {
          content = JSON.parse(contentRaw);
        } catch {
          content = {};
        }
      } else if (contentRaw && typeof contentRaw === "object") {
        content = contentRaw;
      }

      return {
        id: row.id,
        phase: row.phase,
        version: row.version,
        content,
        review_verdict: row.review_verdict,
        overall_score: row.overall_score,
        created_at: row.created_at,
      };
    });

    return Response.json(items);
  } catch (e) {
    console.error("listArtifacts error:", e);
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
