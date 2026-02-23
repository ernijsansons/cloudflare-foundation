import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";

/**
 * Public routes that do not require authentication.
 * Routes are matched using prefix matching (startsWith).
 */
export const PUBLIC_ROUTES = [
  "/health",
  "/api/health",
  "/api/public/",
  "/mcp/",
] as const;

/**
 * Check if the given path matches any public route prefix.
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path.startsWith(route));
}

/**
 * Authentication middleware that validates session tokens for protected routes.
 *
 * SECURITY: Fails closed by default - all routes require authentication unless
 * explicitly listed in PUBLIC_ROUTES. This prevents accidental exposure of
 * protected endpoints.
 *
 * Public routes (no auth required):
 * - /health, /api/health - health checks
 * - /api/public/* - public API endpoints (signup, contact)
 * - /mcp/* - MCP protocol (handles its own authentication)
 *
 * Protected routes require:
 * - Authorization: Bearer <token> header
 * - Valid session in SESSION_KV
 * - Session data includes: tenantId, userId, plan
 */
export function authMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const path = new URL(c.req.url).pathname;

    // Public routes: no authentication required
    if (isPublicRoute(path)) {
      c.set("tenantId", undefined);
      c.set("userId", undefined);
      c.set("plan", undefined);
      await next();
      return;
    }

    // Protected routes: require Authorization header
    const auth = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!auth) {
      return c.json({ error: "Authentication required" }, 401);
    }

    try {
      const session = await c.env.SESSION_KV.get(`session:${auth}`, "json") as { tenantId?: string; userId?: string; plan?: string } | null;

      if (!session) {
        return c.json({ error: "Invalid or expired session" }, 401);
      }

      c.set("tenantId", session.tenantId ?? "default");
      c.set("userId", session.userId ?? "default");
      c.set("plan", session.plan ?? "free");

      await next();
    } catch (error) {
      // SECURITY: Fail closed - log error and reject request
      console.error("Auth middleware error:", error);
      return c.json({ error: "Authentication failed" }, 401);
    }
  };
}
