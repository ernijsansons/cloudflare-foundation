import type { Context, Next } from "hono";
import type { Env } from "../types";

export function turnstileMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    if (c.req.method !== "POST") return next();
    const body = await c.req.parseBody();
    const token = body["cf-turnstile-response"] as string;
    if (!token) return c.json({ error: "Turnstile token required" }, 400);
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: c.env.TURNSTILE_SECRET,
        response: token,
        remoteip: c.req.header("CF-Connecting-IP"),
      }),
    });
    const outcome = (await result.json()) as { success: boolean };
    if (!outcome.success) return c.json({ error: "Turnstile verification failed" }, 403);
    await next();
  };
}
