import type { Context, Next } from "hono";

export function correlationMiddleware() {
  return async (c: Context, next: Next) => {
    const id = c.req.header("x-correlation-id") ?? crypto.randomUUID();
    c.set("correlationId", id);
    c.header("x-correlation-id", id);
    await next();
  };
}
