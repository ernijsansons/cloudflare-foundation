/**
 * Factory Routes — Project Factory v3.0 API
 *
 * Exposes template registry, CF capabilities, and build specs.
 * Most routes forward to the planning-machine service.
 *
 * Routes:
 *   GET  /api/factory/templates          — List all templates (with filters)
 *   GET  /api/factory/templates/:slug    — Get single template
 *   GET  /api/factory/capabilities       — List all CF capabilities
 *   GET  /api/factory/capabilities/free  — List free capabilities
 *   GET  /api/factory/build-specs        — List all build specs (with pagination)
 *   GET  /api/factory/build-specs/:runId — Get BuildSpec for a run
 *   POST /api/factory/build-specs/:runId — Trigger BuildSpec generation for a run
 */

import { Hono } from "hono";

import type { Env, Variables } from "../types";
import { validateBuildSpecsParams, validateTemplatesParams } from "../utils/query-validator";
import { forwardToService } from "../utils/service-forwarder";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /templates — List all templates with optional filters
 * Query params: category, framework, maxComplexity, maxCostMid, source, tags
 */
app.get("/templates", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  const requestUrl = new URL(c.req.url);
  const validatedParams = validateTemplatesParams(requestUrl);
  const forwardedParams = new URLSearchParams(validatedParams);
  const tenantId = requestUrl.searchParams.get("tenant_id");
  if (tenantId) {
    forwardedParams.set("tenant_id", tenantId);
  }

  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => "/api/factory/templates",
    queryTransform: () => forwardedParams,
    errorMessage: "Failed to fetch templates",
  });
});

/**
 * GET /templates/:slug — Get single template by slug
 */
app.get("/templates/:slug", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  const slug = c.req.param("slug");
  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => `/api/factory/templates/${slug}`,
    errorMessage: "Failed to fetch template",
  });
});

/**
 * GET /capabilities — List all CF capabilities
 */
app.get("/capabilities", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => "/api/factory/capabilities",
    errorMessage: "Failed to fetch capabilities",
  });
});

/**
 * GET /capabilities/free — List free-tier CF capabilities
 */
app.get("/capabilities/free", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => "/api/factory/capabilities/free",
    errorMessage: "Failed to fetch free capabilities",
  });
});

/**
 * GET /build-specs — List all build specs with optional filters
 * Query params: limit (1-100), offset (0-10000), status (draft|approved|rejected|fallback)
 *
 * Security: Query params are validated and sanitized to prevent injection attacks.
 */
app.get("/build-specs", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  const requestUrl = new URL(c.req.url);
  const validatedParams = validateBuildSpecsParams(requestUrl);
  const forwardedParams = new URLSearchParams(validatedParams);
  const tenantId = requestUrl.searchParams.get("tenant_id");
  if (tenantId) {
    forwardedParams.set("tenant_id", tenantId);
  }

  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => "/api/factory/build-specs",
    queryTransform: () => forwardedParams,
    errorMessage: "Failed to fetch build specs",
  });
});

/**
 * GET /build-specs/:runId — Get BuildSpec for a planning run
 */
app.get("/build-specs/:runId", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  const runId = c.req.param("runId");
  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => `/api/factory/build-specs/${runId}`,
    errorMessage: "Failed to fetch build spec",
  });
});

/**
 * POST /build-specs/:runId — Trigger BuildSpec generation for a run
 * This is useful for runs that completed before Project Factory was deployed
 */
app.post("/build-specs/:runId", async (c) => {
  if (!c.env.PLANNING_SERVICE) {
    return c.json({ error: "Planning service not configured" }, 503);
  }

  const runId = c.req.param("runId");
  return forwardToService(c, c.env.PLANNING_SERVICE, {
    pathTransform: () => `/api/factory/build-specs/${runId}`,
    errorMessage: "Failed to generate build spec",
  });
});

export default app;
