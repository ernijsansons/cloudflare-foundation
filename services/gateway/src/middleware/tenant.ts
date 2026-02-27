import type { Context, Next } from "hono";

import { isPublicRoute } from "../constants";

/**
 * Tenant Middleware - Enforces tenant context for protected routes
 *
 * Public routes (defined in constants.ts) can proceed without tenant context.
 * All other routes MUST have tenant context from authentication.
 */
export function tenantMiddleware() {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;

    // Allow public routes to proceed without tenant context
    if (isPublicRoute(path)) {
      await next();
      return;
    }

    // Protected routes require tenant context
    const tenantId = c.get("tenantId");
    if (!tenantId) {
      return c.json(
        {
          error: "Tenant context required",
          message: "This endpoint requires authenticated access with tenant context",
        },
        401
      );
    }

    await next();
  };
}
