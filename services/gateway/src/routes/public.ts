import { Hono } from "hono";
import { turnstileMiddleware } from "../middleware/turnstile";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

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

    // Return agent hierarchy configuration
    // This is static configuration data for the dashboard
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
              description: "Creates execution plans and roadmaps"
            },
            {
              id: "execution_agent",
              name: "Execution Agent",
              type: "executor",
              description: "Executes tasks and generates code"
            },
            {
              id: "qa_agent",
              name: "QA Agent",
              type: "validator",
              description: "Validates and tests implementations"
            }
          ]
        }
      ],
      tenant_id: tenantId,
      business_id: businessId
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

    // Query naomi_tasks from D1 database
    const limit = 50;
    const result = await c.env.DB.prepare(
      "SELECT * FROM naomi_tasks WHERE COALESCE(tenant_id, 'default') = ? ORDER BY created_at DESC LIMIT ?"
    ).bind(tenantId, limit).all();

    return c.json({
      roadmaps: result.results || [],
      tenant_id: tenantId,
      business_id: businessId,
      status
    });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    return c.json({ error: "Internal error", roadmaps: [] }, 500);
  }
});

// Public planning runs endpoint (no auth required)
app.get("/planning/runs", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "100", 10);
    const tenantId = c.req.query("tenant_id") || "default";

    // Query planning_runs from D1 database
    const result = await c.env.DB.prepare(
      "SELECT * FROM planning_runs WHERE COALESCE(tenant_id, 'default') = ? ORDER BY created_at DESC LIMIT ?"
    ).bind(tenantId, limit).all();

    return c.json({
      items: result.results || []
    });
  } catch (error) {
    console.error("Error fetching planning runs:", error);
    return c.json({ error: "Internal error", items: [] }, 500);
  }
});

// Public planning run detail endpoint (no auth required)
app.get("/planning/runs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const tenantId = c.req.query("tenant_id") || "default";

    // Query specific planning run from D1 database
    const result = await c.env.DB.prepare(
      "SELECT * FROM planning_runs WHERE id = ? AND COALESCE(tenant_id, 'default') = ?"
    ).bind(id, tenantId).first();

    if (!result) {
      return c.json({ error: "Run not found" }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error("Error fetching planning run:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Public planning artifacts endpoint (no auth required)
app.get("/planning/runs/:id/artifacts/:phase", async (c) => {
  try {
    const id = c.req.param("id");
    const phase = c.req.param("phase");

    // For now, return empty artifact data - this would be populated by the planning service
    return c.json({
      id: `${id}_${phase}`,
      phase,
      content: {},
      review_verdict: null,
      review_iterations: 0,
      overall_score: null
    });
  } catch (error) {
    console.error("Error fetching artifact:", error);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default app;
