import { Hono } from "hono";

import { FoundationMcpServer } from "./mcp/FoundationMcpServer";
import { authMiddleware } from "./middleware/auth";
import { contextTokenMiddleware } from "./middleware/context-token";
import { correlationMiddleware } from "./middleware/correlation";
import { corsMiddleware } from "./middleware/cors";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { rateLimitDOMiddleware } from "./middleware/rate-limit-do";
import { requestLoggerMiddleware } from "./middleware/request-logger";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { tenantMiddleware } from "./middleware/tenant";
import adminRoutes from "./routes/admin";
import agentsRoutes from "./routes/agents";
import analyticsRoutes from "./routes/analytics";
import cronRoutes from "./routes/cron";
import dataRoutes from "./routes/data";
import factoryRoutes from "./routes/factory";
import filesRoutes from "./routes/files";
import imagesRoutes from "./routes/images";
import mcpRoutes from "./routes/mcp";
import naomiRoutes from "./routes/naomi";
import planningRoutes from "./routes/planning";
import projectDocsRouter from "./routes/project-docs";
import publicRoutes from "./routes/public";
import webhooksRoutes from "./routes/webhooks";
import workflowsRoutes from "./routes/workflows";
import type { Env, Variables } from "./types";

export type { Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware - applied to all routes
app.use("*", corsMiddleware());
app.use("*", correlationMiddleware());
app.use("*", requestLoggerMiddleware({ excludePaths: ["/health", "/api/health"] }));

// Conditional rate limiting based on feature flag
app.use("*", async (c, next) => {
  const useDoRateLimiting = c.env.USE_DO_RATE_LIMITING === "true";
  if (useDoRateLimiting) {
    return rateLimitDOMiddleware()(c, next);
  }
  return rateLimitMiddleware()(c, next);
});

app.use("*", securityHeadersMiddleware());

// Health check endpoints - no auth required
app.get("/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// Public routes - no auth required
app.route("/api/public", publicRoutes);

// MCP routes - no auth required (McpAgent handles its own session)
app.route("/mcp", mcpRoutes);

// Auth middleware - applied to all /api/* routes below
app.use("/api/*", authMiddleware());
app.use("/api/*", tenantMiddleware());
app.use("/api/*", contextTokenMiddleware());

// Protected API routes
app.route("/api/agents", agentsRoutes);
app.route("/api/planning", planningRoutes);
app.route("/api/webhooks", webhooksRoutes);
app.route("/api/workflows", workflowsRoutes);
app.route("/api/data", dataRoutes);
app.route("/api/files", filesRoutes);
app.route("/api/images", imagesRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/naomi", naomiRoutes);
app.route("/api/projects", projectDocsRouter);
app.route("/api/cron", cronRoutes);
app.route("/api/factory", factoryRoutes);

export default app;
export { FoundationMcpServer };
