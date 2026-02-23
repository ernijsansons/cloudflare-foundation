import { Hono } from "hono";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get("/", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const result = await c.env.DB.prepare(
      "SELECT id, name, hostname, url, active, events, created_at, updated_at FROM webhook_destinations WHERE tenant_id = ? ORDER BY created_at DESC"
    )
      .bind(tenantId)
      .all();
    return c.json({ items: result.results ?? [] });
  } catch (e) {
    console.error("List webhooks error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const body = (await c.req.json()) as {
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
    )
      .bind(
        id,
        tenantId,
        body.name ?? "",
        hostname,
        body.url,
        body.secret ?? null,
        body.events ?? "*",
        now,
        now
      )
      .run();

    return c.json({
      id,
      name: body.name ?? "",
      hostname,
      url: body.url,
      active: 1,
      events: body.events ?? "*",
      created_at: now,
    });
  } catch (e) {
    console.error("Create webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.delete("/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      "DELETE FROM webhook_destinations WHERE id = ? AND tenant_id = ?"
    )
      .bind(id, tenantId)
      .run();

    if (result.meta.changes === 0) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    return c.json({ deleted: true });
  } catch (e) {
    console.error("Delete webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.patch("/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");
    const body = (await c.req.json()) as {
      active?: boolean;
      name?: string;
      events?: string;
    };

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
    )
      .bind(...params)
      .run();

    return c.json({ updated: true });
  } catch (e) {
    console.error("Update webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

export default app;
