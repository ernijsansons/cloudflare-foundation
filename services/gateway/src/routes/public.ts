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
