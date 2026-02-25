import { Hono } from "hono";
import type { Context } from "hono";
import { turnstileMiddleware } from "../middleware/turnstile";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

type PublicContext = Context<{ Bindings: Env; Variables: Variables }>;

interface ContextTokenPayload {
  tid: string;
  uid: string;
  plan: string;
  iat: number;
  exp: number;
}

function toBase64Url(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createContextToken(signingKey: string, payload: ContextTokenPayload): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const signatureB64 = toBase64Url(signature);
  return `${signingInput}.${signatureB64}`;
}

async function proxyPlanning(
  c: PublicContext,
  path: string,
  init?: { method?: string; body?: BodyInit | null; contentType?: string }
): Promise<Response | null> {
  if (!c.env.PLANNING_SERVICE) {
    return null;
  }

  const headers = new Headers();
  const contentType = init?.contentType ?? c.req.header("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const now = Math.floor(Date.now() / 1000);
  const contextToken = await createContextToken(c.env.CONTEXT_SIGNING_KEY, {
    tid: c.req.query("tenant_id") || "default",
    uid: "public",
    plan: "free",
    iat: now,
    exp: now + 300,
  });
  headers.set("X-Context-Token", contextToken);

  const method = init?.method ?? c.req.method;
  const body =
    init?.body !== undefined
      ? init.body
      : method === "GET" || method === "HEAD"
        ? undefined
        : c.req.raw.body;

  const request = new Request(`https://planning.internal${path}`, {
    method,
    headers,
    body,
  });

  try {
    return await c.env.PLANNING_SERVICE.fetch(request);
  } catch (error) {
    console.error("Planning proxy failed:", error);
    return c.json({ error: "Planning service unavailable" }, 503);
  }
}

app.post("/signup", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  return c.json({ created: true });
});

app.post("/contact", turnstileMiddleware(), async (c) => {
  try {
    await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  return c.json({ sent: true });
});

// Public dashboard endpoints (no auth required)
app.get("/dashboard/agents", async (c) => {
  try {
    const tenantId = c.req.query("tenant_id") || "erlvinc";
    const businessId = c.req.query("business_id") || "naomi";

    return c.json({
      agents: [
        {
          id: "chief_of_staff",
          name: "Chief of Staff",
          type: "orchestrator",
          description: "Top-level AI agent coordinating all other agents",
          children: [
            {
              id: "planning_agent",
              name: "Planning Agent",
              type: "planner",
              description: "Creates execution plans and roadmaps",
            },
            {
              id: "execution_agent",
              name: "Execution Agent",
              type: "executor",
              description: "Executes tasks and generates code",
            },
            {
              id: "qa_agent",
              name: "QA Agent",
              type: "validator",
              description: "Validates and tests implementations",
            },
          ],
        },
      ],
      tenant_id: tenantId,
      business_id: businessId,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return c.json({ error: "Internal error", agents: [] }, 500);
  }
});

app.get("/dashboard/roadmaps", async (c) => {
  try {
    const tenantId = c.req.query("tenant_id") || "erlvinc";
    const businessId = c.req.query("business_id") || "naomi";
    const status = c.req.query("status") || "active";
    const limit = 50;

    const result = await c.env.DB.prepare(
      "SELECT * FROM naomi_tasks WHERE COALESCE(tenant_id, 'default') = ? ORDER BY created_at DESC LIMIT ?"
    )
      .bind(tenantId, limit)
      .all();

    return c.json({
      roadmaps: result.results || [],
      tenant_id: tenantId,
      business_id: businessId,
      status,
    });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    return c.json({ error: "Internal error", roadmaps: [] }, 500);
  }
});

// Public planning run creation endpoint (no auth required)
app.post("/planning/runs", async (c) => {
  try {
    const body = (await c.req.json()) as {
      idea?: string;
      mode?: "local" | "cloud";
      config?: Record<string, unknown>;
    };

    if (!body.idea || typeof body.idea !== "string") {
      return c.json({ error: "idea is required" }, 400);
    }

    const proxied = await proxyPlanning(c, "/api/planning/runs", {
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({
        idea: body.idea,
        mode: body.mode ?? "cloud",
        config: body.config ?? {},
      }),
    });

    if (!proxied) {
      return c.json({ error: "Planning service not configured" }, 503);
    }

    return proxied;
  } catch (error) {
    console.error("Error creating planning run:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Public planning runs endpoint (no auth required)
app.get("/planning/runs", async (c) => {
  try {
    const search = new URL(c.req.url).search;
    const proxied = await proxyPlanning(c, `/api/planning/runs${search}`);
    if (proxied) {
      return proxied;
    }

    // Fallback path when planning service binding is unavailable.
    const limit = parseInt(c.req.query("limit") || "100", 10);
    const tenantId = c.req.query("tenant_id") || "default";
    const result = await c.env.DB.prepare(
      "SELECT * FROM planning_runs WHERE COALESCE(tenant_id, 'default') = ? ORDER BY created_at DESC LIMIT ?"
    )
      .bind(tenantId, limit)
      .all();

    return c.json({ items: result.results || [] });
  } catch (error) {
    console.error("Error fetching planning runs:", error);
    return c.json({ error: "Internal error", items: [] }, 500);
  }
});

// Public planning run detail endpoint (no auth required)
app.get("/planning/runs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const search = new URL(c.req.url).search;
    const proxied = await proxyPlanning(c, `/api/planning/runs/${id}${search}`);
    if (proxied) {
      return proxied;
    }

    const tenantId = c.req.query("tenant_id") || "default";
    const result = await c.env.DB.prepare(
      "SELECT * FROM planning_runs WHERE id = ? AND COALESCE(tenant_id, 'default') = ?"
    )
      .bind(id, tenantId)
      .first();

    if (!result) {
      return c.json({ error: "Run not found" }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching planning run:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.get("/planning/runs/:id/phases", async (c) => {
  const id = c.req.param("id");
  const proxied = await proxyPlanning(c, `/api/planning/runs/${id}/phases`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

app.get("/planning/runs/:id/artifacts", async (c) => {
  const id = c.req.param("id");
  const proxied = await proxyPlanning(c, `/api/planning/runs/${id}/artifacts`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

// Public planning artifacts endpoint (no auth required)
app.get("/planning/runs/:id/artifacts/:phase", async (c) => {
  const id = c.req.param("id");
  const phase = c.req.param("phase");
  const proxied = await proxyPlanning(c, `/api/planning/runs/${id}/artifacts/${phase}`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

app.get("/planning/parked-ideas", async (c) => {
  const search = new URL(c.req.url).search;
  const proxied = await proxyPlanning(c, `/api/planning/parked-ideas${search}`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

app.post("/planning/parked-ideas/:id/promote", async (c) => {
  const id = c.req.param("id");
  const proxied = await proxyPlanning(c, `/api/planning/parked-ideas/${id}/promote`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

// ============================================================================
// PROJECT ENDPOINTS (Aggregated view of ideas + runs for Kanban board)
// ============================================================================

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  current_phase: string | null;
  quality_score: number | null;
  revenue_potential: string | null;
  artifact_count: number;
  run_count: number;
  latest_run_id: string | null;
  risk_flags: string[];
  mode: string;
  created_at: number;
  updated_at: number;
}

/**
 * GET /projects - List projects for Kanban board
 * Aggregates ideas with their runs into a single card per project
 */
app.get("/projects", async (c) => {
  try {
    const tenantId = c.req.query("tenant_id") || "default";
    const statusFilter = c.req.query("status"); // Optional: filter by status
    const limit = parseInt(c.req.query("limit") || "100", 10);

    // First, try to get data from ideas table with aggregated run data
    // For now, we'll aggregate runs directly since that's what exists
    const runsResult = await c.env.DB.prepare(`
      SELECT
        id,
        idea,
        refined_idea,
        status,
        current_phase,
        quality_score,
        revenue_potential,
        mode,
        created_at,
        updated_at
      FROM planning_runs
      WHERE COALESCE(tenant_id, 'default') = ?
        AND status NOT IN ('deleted')
      ORDER BY created_at DESC
      LIMIT ?
    `)
      .bind(tenantId, limit)
      .all();

    const runs = (runsResult.results || []) as Array<{
      id: string;
      idea: string;
      refined_idea: string | null;
      status: string;
      current_phase: string | null;
      quality_score: number | null;
      revenue_potential: string | null;
      mode: string | null;
      created_at: number;
      updated_at: number | null;
    }>;

    // Aggregate runs by idea (project) - use idea text as grouping key for now
    // In future, this will use idea_id when runs are properly linked
    const projectMap = new Map<string, ProjectSummary>();

    for (const run of runs) {
      const projectKey = run.idea.toLowerCase().trim().slice(0, 100); // Normalize for grouping

      const existing = projectMap.get(projectKey);
      if (existing) {
        // Update aggregated data
        existing.run_count += 1;

        // Use latest phase from most recent run
        if (!existing.current_phase && run.current_phase) {
          existing.current_phase = run.current_phase;
        }

        // Track best quality score
        if (run.quality_score && (!existing.quality_score || run.quality_score > existing.quality_score)) {
          existing.quality_score = run.quality_score;
        }

        // Use latest revenue potential
        if (run.revenue_potential && !existing.revenue_potential) {
          existing.revenue_potential = run.revenue_potential;
        }

        // Update timestamp if newer
        const runUpdated = run.updated_at || run.created_at;
        if (runUpdated > existing.updated_at) {
          existing.updated_at = runUpdated;
          existing.latest_run_id = run.id;
          existing.mode = run.mode || 'cloud';
        }

        // Aggregate status - prefer active/running over completed
        if (['running', 'active'].includes(run.status)) {
          existing.status = run.status;
        }
      } else {
        // Create new project entry
        const project: ProjectSummary = {
          id: run.id, // Use first run's ID as project ID for now
          name: run.refined_idea || run.idea,
          status: run.status,
          current_phase: run.current_phase,
          quality_score: run.quality_score,
          revenue_potential: run.revenue_potential,
          artifact_count: 0, // Will be populated later
          run_count: 1,
          latest_run_id: run.id,
          risk_flags: [],
          mode: run.mode || 'cloud',
          created_at: run.created_at,
          updated_at: run.updated_at || run.created_at,
        };
        projectMap.set(projectKey, project);
      }
    }

    // Convert to array and filter
    let projects = Array.from(projectMap.values());

    // Filter by status if specified
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      projects = projects.filter(p => statuses.includes(p.status));
    } else {
      // By default, exclude killed/cancelled for board view
      projects = projects.filter(p => !['killed', 'cancelled'].includes(p.status));
    }

    // Sort by updated_at DESC
    projects.sort((a, b) => b.updated_at - a.updated_at);

    return c.json({ items: projects, total: projects.length });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json({ error: "Internal error", items: [] }, 500);
  }
});

/**
 * GET /projects/:id - Get project detail with all runs
 */
app.get("/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.req.query("tenant_id") || "default";

    // Get the primary run
    const primaryRun = await c.env.DB.prepare(
      "SELECT * FROM planning_runs WHERE id = ? AND COALESCE(tenant_id, 'default') = ?"
    )
      .bind(id, tenantId)
      .first() as {
        id: string;
        idea: string;
        refined_idea: string | null;
        status: string;
        current_phase: string | null;
        quality_score: number | null;
        revenue_potential: string | null;
        mode: string | null;
        created_at: number;
        updated_at: number | null;
      } | null;

    if (!primaryRun) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Find all related runs with similar idea
    const ideaNormalized = primaryRun.idea.toLowerCase().trim().slice(0, 100);
    const relatedRunsResult = await c.env.DB.prepare(`
      SELECT * FROM planning_runs
      WHERE COALESCE(tenant_id, 'default') = ?
        AND status NOT IN ('deleted')
      ORDER BY created_at DESC
    `)
      .bind(tenantId)
      .all();

    const allRuns = (relatedRunsResult.results || []) as Array<{
      id: string;
      idea: string;
      refined_idea: string | null;
      status: string;
      current_phase: string | null;
      quality_score: number | null;
      revenue_potential: string | null;
      mode: string | null;
      created_at: number;
      updated_at: number | null;
    }>;

    // Filter to runs that belong to this project
    const projectRuns = allRuns.filter(run =>
      run.idea.toLowerCase().trim().slice(0, 100) === ideaNormalized
    );

    // Aggregate project data
    const bestQuality = Math.max(...projectRuns.map(r => r.quality_score || 0));
    const latestRun = projectRuns[0]; // Already sorted by created_at DESC

    const project = {
      id: primaryRun.id,
      name: primaryRun.refined_idea || primaryRun.idea,
      idea_content: primaryRun.idea,
      refined_idea: primaryRun.refined_idea,
      status: latestRun?.status || primaryRun.status,
      current_phase: latestRun?.current_phase || primaryRun.current_phase,
      quality_score: bestQuality > 0 ? bestQuality : primaryRun.quality_score,
      revenue_potential: latestRun?.revenue_potential || primaryRun.revenue_potential,
      run_count: projectRuns.length,
      latest_run_id: latestRun?.id || primaryRun.id,
      mode: latestRun?.mode || primaryRun.mode || 'cloud',
      created_at: primaryRun.created_at,
      updated_at: latestRun?.updated_at || primaryRun.updated_at || primaryRun.created_at,
      runs: projectRuns,
    };

    return c.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

/**
 * GET /projects/:id/runs - Get all runs for a project
 */
app.get("/projects/:id/runs", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.req.query("tenant_id") || "default";

    // Get the primary run to find the idea
    const primaryRun = await c.env.DB.prepare(
      "SELECT idea FROM planning_runs WHERE id = ? AND COALESCE(tenant_id, 'default') = ?"
    )
      .bind(id, tenantId)
      .first() as { idea: string } | null;

    if (!primaryRun) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Find all related runs
    const ideaNormalized = primaryRun.idea.toLowerCase().trim().slice(0, 100);
    const runsResult = await c.env.DB.prepare(`
      SELECT * FROM planning_runs
      WHERE COALESCE(tenant_id, 'default') = ?
        AND status NOT IN ('deleted')
      ORDER BY created_at DESC
    `)
      .bind(tenantId)
      .all();

    const allRuns = (runsResult.results || []) as Array<{
      id: string;
      idea: string;
      [key: string]: unknown;
    }>;

    const projectRuns = allRuns.filter(run =>
      run.idea.toLowerCase().trim().slice(0, 100) === ideaNormalized
    );

    return c.json({ items: projectRuns, total: projectRuns.length });
  } catch (error) {
    console.error("Error fetching project runs:", error);
    return c.json({ error: "Internal error", items: [] }, 500);
  }
});

/**
 * GET /projects/:id/bible - Get aggregated Master Bible data for a project
 * Combines best artifacts from all runs into department views
 */
app.get("/projects/:id/bible", async (c) => {
  try {
    const id = c.req.param("id");

    // Proxy to planning service for bible data aggregation
    const proxied = await proxyPlanning(c, `/api/planning/runs/${id}/bible`);
    if (proxied) {
      return proxied;
    }

    // Fallback: return basic project info
    return c.json({ error: "Bible data not available", departments: [] });
  } catch (error) {
    console.error("Error fetching project bible:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.all("/planning/ideas", async (c) => {
  const search = new URL(c.req.url).search;
  const proxied = await proxyPlanning(c, `/api/planning/ideas${search}`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

app.all("/planning/ideas/:id", async (c) => {
  const id = c.req.param("id");
  const search = new URL(c.req.url).search;
  const proxied = await proxyPlanning(c, `/api/planning/ideas/${id}${search}`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

app.all("/planning/ideas/:id/runs", async (c) => {
  const id = c.req.param("id");
  const search = new URL(c.req.url).search;
  const proxied = await proxyPlanning(c, `/api/planning/ideas/${id}/runs${search}`);
  if (!proxied) {
    return c.json({ error: "Planning service not configured" }, 503);
  }
  return proxied;
});

export default app;
