import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";

export function contextTokenMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const plan = c.get("plan");
    if (tenantId && c.env.CONTEXT_SIGNING_KEY) {
      const payload = {
        tid: tenantId,
        uid: userId,
        plan,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
      };
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const body = btoa(JSON.stringify(payload));
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(c.env.CONTEXT_SIGNING_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${header}.${body}`)
      );
      const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
      c.req.raw.headers.set("X-Context-Token", `${header}.${body}.${sig}`);
    }
    await next();
  };
}
