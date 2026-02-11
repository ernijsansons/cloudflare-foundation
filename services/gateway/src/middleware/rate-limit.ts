import type { Context, Next } from "hono";
import type { Env } from "../types";

export function rateLimitMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const key = `ratelimit:${ip}`;
    const now = Date.now();
    const windowSeconds = 60;
    const maxRequests = 60;
    const raw = (await c.env.RATE_LIMIT_KV.get(key, "json")) as
      | { count: number; resetAt: number }
      | null;
    const record =
      raw && now < raw.resetAt ? raw : { count: 0, resetAt: now + windowSeconds * 1000 };
    record.count++;
    await c.env.RATE_LIMIT_KV.put(key, JSON.stringify(record), {
      expirationTtl: windowSeconds,
    });
    if (record.count > maxRequests) {
      return c.json(
        {
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        429
      );
    }
    await next();
  };
}
