import type { Context, Next } from "hono";

export function tenantMiddleware() {
  return async (c: Context, next: Next) => {
    if (!c.get("tenantId")) c.set("tenantId", "default");
    await next();
  };
}
