import type { Context, Next } from "hono";
import type { Env } from "../types";
import { TURNSTILE_TIMEOUT_MS } from "../constants";

export function turnstileMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    if (c.req.method !== "POST") return next();
    const body = await c.req.parseBody();
    const token = body["cf-turnstile-response"] as string;
    if (!token) return c.json({ error: "Turnstile token required" }, 400);

    // Add timeout to prevent hanging on external API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

    try {
      const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: c.env.TURNSTILE_SECRET,
          response: token,
          remoteip: c.req.header("CF-Connecting-IP"),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const outcome = (await result.json()) as { success: boolean };
      if (!outcome.success) return c.json({ error: "Turnstile verification failed" }, 403);
      await next();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Turnstile verification timed out");
        return c.json({ error: "Verification service timeout" }, 504);
      }
      console.error("Turnstile verification error:", error);
      return c.json({ error: "Verification service error" }, 500);
    }
  };
}
