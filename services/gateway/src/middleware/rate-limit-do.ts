import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";

/**
 * Durable Object-based rate limiting middleware.
 *
 * This middleware provides race-condition-free rate limiting using
 * Cloudflare Durable Objects with atomic operations. It replaces the
 * KV-based rate limiter which had known race conditions.
 *
 * Features:
 * - Tenant-based rate limiting for authenticated requests
 * - IP-based rate limiting for unauthenticated requests
 * - Fail-closed behavior: returns 429 on errors or timeouts
 * - 500ms timeout to prevent blocking
 *
 * Rate limit strategy:
 * - Authenticated: 100 requests/min per tenant
 * - Unauthenticated: 60 requests/min per IP
 */
export function rateLimitDOMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const tenantId = c.get("tenantId");
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";

    // Determine rate limit strategy
    const isAuthenticated = tenantId && tenantId !== "default";
    const limitId = isAuthenticated ? `tenant:${tenantId}` : `ip:${ip}`;

    try {
      // Call AGENT_SERVICE /rate-limit/check with timeout
      const checkResponse = await Promise.race([
        c.env.AGENT_SERVICE.fetch("https://fake-host/rate-limit/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limitId, increment: true }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 500)
        ),
      ]);

      if (!checkResponse.ok) {
        // Rate limit exceeded or error from DO
        const data = await checkResponse.json() as { retryAfter?: number };
        c.header("Retry-After", String(data.retryAfter ?? 60));
        c.header("X-RateLimit-Limit", isAuthenticated ? "100" : "60");
        c.header("X-RateLimit-Remaining", "0");
        return c.json({ error: "Rate limit exceeded" }, 429);
      }

      const result = await checkResponse.json() as {
        allowed: boolean;
        remaining: number;
        resetAt?: number;
      };

      // Set rate limit headers
      const limit = isAuthenticated ? 100 : 60;
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(result.remaining));
      if (result.resetAt) {
        c.header("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
      }

      await next();
    } catch (error) {
      // Fail closed on errors (timeout, network, etc.)
      console.error("[RATE_LIMIT_DO] Error:", error);
      c.header("Retry-After", "60");
      c.header("X-RateLimit-Limit", isAuthenticated ? "100" : "60");
      c.header("X-RateLimit-Remaining", "0");
      return c.json({ error: "Rate limit service unavailable" }, 429);
    }
  };
}
