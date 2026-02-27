import { Hono } from "hono";
import type { Env, Variables } from "../types";

// Use explicit queries per table to avoid SQL interpolation
const TABLE_QUERIES: Record<string, string> = {
  users: "SELECT * FROM users WHERE tenant_id = ? LIMIT 100",
  audit_log: "SELECT * FROM audit_log WHERE tenant_id = ? LIMIT 100",
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get("/:table", async (c) => {
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

export default app;
