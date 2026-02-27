import type { Context, Next } from "hono";

import {
  RATE_LIMIT_DO_MAX_REQUESTS_AUTHENTICATED,
  RATE_LIMIT_DO_MAX_REQUESTS_UNAUTHENTICATED,
} from "../constants";
import type { Env, Variables } from "../types";

function applyRateLimitHeaders(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  headers: Record<string, string>
): void {
  try {
    for (const [name, value] of Object.entries(headers)) {
      c.res.headers.set(name, value);
    }
    return;
  } catch {
    // Proxied responses can have immutable headers; clone to apply custom headers safely.
  }

  try {
    const cloned = new Response(c.res.body, c.res);
    for (const [name, value] of Object.entries(headers)) {
      cloned.headers.set(name, value);
    }
    c.res = cloned;
  } catch (error) {
    console.error("[RATE_LIMIT_DO] Failed to apply rate limit headers:", error);
  }
}

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
 * - Fail-open behavior: allows request on errors or timeouts (availability > strict enforcement)
 * - 500ms timeout to prevent blocking
 *
 * Rate limit strategy:
 * - Authenticated: 500 requests/min per tenant
 * - Unauthenticated: 200 requests/min per IP
 */
export function rateLimitDOMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const tenantId = c.get("tenantId");
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";

    // Determine rate limit strategy
    const isAuthenticated = tenantId && tenantId !== "default";
    const limitId = isAuthenticated ? `tenant:${tenantId}` : `ip:${ip}`;
    const limit = isAuthenticated
      ? RATE_LIMIT_DO_MAX_REQUESTS_AUTHENTICATED
      : RATE_LIMIT_DO_MAX_REQUESTS_UNAUTHENTICATED;

    try {
      // Call AGENT_SERVICE /rate-limit/check with timeout
      const checkResponse = await Promise.race([
        c.env.AGENT_SERVICE.fetch("https://fake-host/rate-limit/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limitId, increment: true, maxRequests: limit }),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 500)
        ),
      ]);

      if (!checkResponse.ok) {
        if (checkResponse.status === 429) {
          // Upstream explicitly indicates rate limit exceeded.
          const data = await checkResponse.json() as { retryAfter?: number };
          c.header("Retry-After", String(data.retryAfter ?? 60));
          c.header("X-RateLimit-Limit", String(limit));
          c.header("X-RateLimit-Remaining", "0");
          return c.json({ error: "Rate limit exceeded" }, 429);
        }

        // Fail open on upstream 5xx/errors to preserve availability.
        const body = await checkResponse.text().catch(() => "");
        console.error("[RATE_LIMIT_DO] Upstream rate-limit error, allowing request:", {
          status: checkResponse.status,
          body,
        });
        await next();
        // Preserve header contract even in fail-open mode.
        applyRateLimitHeaders(c, {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(limit),
        });
        return;
      }

      const result = await checkResponse.json() as {
        allowed: boolean;
        remaining: number;
        resetAt?: number;
      };

      await next();

      const responseHeaders: Record<string, string> = {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(result.remaining),
      };
      if (result.resetAt) {
        responseHeaders["X-RateLimit-Reset"] = String(Math.floor(result.resetAt / 1000));
      }

      // Set headers after downstream handlers (including proxied Response returns).
      applyRateLimitHeaders(c, responseHeaders);
    } catch (error) {
      // Fail open on errors (timeout, network, etc.) - availability over strict enforcement
      console.error("[RATE_LIMIT_DO] Error (allowing request):", error);
      await next();
      // Preserve header contract even in fail-open mode.
      applyRateLimitHeaders(c, {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(limit),
      });
    }
  };
}
