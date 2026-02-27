/**
 * Context Token Validation
 *
 * Validates the X-Context-Token JWT header from the gateway to ensure:
 * - The token is properly formatted
 * - The signature is valid (HMAC-SHA256)
 * - The token hasn't expired
 * - Tenant context is extracted and returned
 */

export interface ContextTokenPayload {
  tid: string;  // tenantId
  uid: string;  // userId
  plan: string; // subscription plan
  iat: number;  // issued at
  exp: number;  // expiration
}

/**
 * Validate X-Context-Token JWT and extract tenant context
 * @param request - The incoming request
 * @param signingKey - The HMAC signing key
 * @returns The validated payload or throws an error
 */
export async function validateContextToken(
  request: Request,
  signingKey: string
): Promise<ContextTokenPayload> {
  const token = request.headers.get("X-Context-Token");

  if (!token) {
    throw new Error("Context token required");
  }

  // Split JWT into parts
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Invalid token format");
  }

  // Import signing key
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Convert base64url signature to Uint8Array
  const sigBytes = Uint8Array.from(
    atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  // Verify signature
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );

  if (!valid) {
    throw new Error("Invalid token signature");
  }

  // Decode and validate payload
  const payload = JSON.parse(
    atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
  ) as ContextTokenPayload;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload;
}

/**
 * Wrapper to validate context token and return error response if invalid
 * @param request - The incoming request
 * @param env - Environment variables
 * @returns The payload if valid, or an error Response
 */
export async function requireContextToken(
  request: Request,
  env: { CONTEXT_SIGNING_KEY?: string }
): Promise<ContextTokenPayload | Response> {
  try {
    if (!env.CONTEXT_SIGNING_KEY) {
      // Local/dev fallback: allow requests when signing key is not configured.
      // Production should always set CONTEXT_SIGNING_KEY to enforce gateway-issued tokens.
      const now = Math.floor(Date.now() / 1000);
      return {
        tid: "default",
        uid: "public",
        plan: "free",
        iat: now,
        exp: now + 300,
      };
    }

    return await validateContextToken(request, env.CONTEXT_SIGNING_KEY);
  } catch (error) {
    console.error("Context token validation error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Token validation failed" },
      { status: 401 }
    );
  }
}
