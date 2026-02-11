import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";

export function authMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const auth = c.req.header("Authorization")?.replace("Bearer ", "");
    if (!auth) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const session = await c.env.SESSION_KV.get(`session:${auth}`, "json") as { tenantId?: string; userId?: string } | null;
      if (session) {
        c.set("tenantId", session.tenantId ?? "default");
        c.set("userId", session.userId ?? "default");
        c.set("plan", (session as { plan?: string }).plan ?? "free");
      } else {
        c.set("tenantId", "default");
        c.set("userId", "default");
        c.set("plan", "free");
      }
    } catch {
      c.set("tenantId", "default");
      c.set("userId", "default");
      c.set("plan", "free");
    }
    await next();
  };
}
