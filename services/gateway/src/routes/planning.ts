import { Hono } from "hono";
import { forwardToService } from "../utils/service-forwarder";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.all("/*", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  return forwardToService(c, c.env.PLANNING_SERVICE, {
    errorMessage: "Planning service unavailable",
  });
});

export default app;
