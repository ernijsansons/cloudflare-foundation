import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";
import {
  RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMIT_MAX_REQUESTS,
} from "../constants";

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
    console.error("Failed to apply rate limit headers:", error);
  }
}

/**
 * Rate limiting middleware using KV storage.
 *
 * NOTE: KV-based rate limiting has an inherent race condition due to
 * eventual consistency. For strict rate limiting, use the Durable Object
 * based rate limiter (TenantRateLimiter) instead.
 *
 * This implementation provides "best effort" rate limiting suitable for
 * preventing abuse, but may allow slightly more requests than the limit
 * under high concurrency.
 */
export function rateLimitMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    // Skip rate limiting if KV not configured
    if (!c.env.RATE_LIMIT_KV) {
      console.warn("RATE_LIMIT_KV not configured, skipping rate limit");
      await next();
      return;
    }

    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    try {
      const raw = (await c.env.RATE_LIMIT_KV.get(key, "json")) as
        | { count: number; resetAt: number }
        | null;

      // Create new window or use existing
      const record =
        raw && now < raw.resetAt
          ? raw
          : { count: 0, resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000 };

      // Check limit BEFORE incrementing to fail fast
      if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
        c.header("X-RateLimit-Remaining", "0");
        c.header("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));
        return c.json(
          {
            error: "Rate limit exceeded",
            retryAfter,
          },
          429
        );
      }

      // Increment count
      record.count++;

      const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count);

      // Update KV (fire and forget to reduce latency)
      // The TTL ensures cleanup even if this fails
      c.executionCtx.waitUntil(
        c.env.RATE_LIMIT_KV.put(key, JSON.stringify(record), {
          expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 10, // Add buffer for clock skew
        })
      );

      await next();

      // Set response headers after downstream handlers (including proxied Response returns).
      applyRateLimitHeaders(c, {
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
      });
    } catch (error) {
      // Log error but don't block request on rate limit failures
      console.error("Rate limit error:", error);
      await next();
    }
  };
}
