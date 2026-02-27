import type { Context, Next } from "hono";
import type { Env, Variables } from "../types";
import { JWT_EXPIRATION_SECONDS } from "../constants";

/** Convert string to URL-safe base64 (JWT-compatible) */
function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION_SECONDS,
      };
      const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const body = toBase64Url(JSON.stringify(payload));
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
      // Convert signature to URL-safe base64 for JWT compatibility
      const sigBytes = Array.from(new Uint8Array(signature));
      const sig = btoa(sigBytes.map((b) => String.fromCharCode(b)).join(""))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      c.set("contextToken", `${header}.${body}.${sig}`);
    }
    await next();
  };
}
