import type { Context, Next } from "hono";

// Public routes that don't require tenant context
const PUBLIC_ROUTES = /^\/(health|api\/public\/)/;

/**
 * Tenant Middleware - Enforces tenant context for protected routes
 *
 * Public routes (health, /api/public/*) can proceed without tenant context.
 * All other routes MUST have tenant context from authentication.
 */
export function tenantMiddleware() {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;

    // Allow public routes to proceed without tenant context
    if (PUBLIC_ROUTES.test(path)) {
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
