import { Hono } from "hono";
import { forwardToService } from "../utils/service-forwarder";
import type { Env, Variables } from "../types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.all("/:agentType/:agentId/*", async (c) => {
  return forwardToService(c, c.env.AGENT_SERVICE, {
    pathTransform: (path) => path.replace(/^\/api\/agents/, "/agents"),
    errorMessage: "Agent service unavailable",
  });
});

export default app;
