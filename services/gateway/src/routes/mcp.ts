import { Hono } from "hono";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// MCP endpoint — no auth middleware, McpAgent handles its own session
app.all("/*", async (c) => {
  const id = c.env.FOUNDATION_MCP.idFromName("singleton");
  const stub = c.env.FOUNDATION_MCP.get(id);
  return stub.fetch(c.req.raw);
});

export default app;
