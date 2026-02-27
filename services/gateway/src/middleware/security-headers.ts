import type { Context, Next } from "hono";

/**
 * Security headers middleware that adds essential security headers to all responses.
 *
 * Headers applied:
 * - Strict-Transport-Security: Enforces HTTPS (1 year)
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - Content-Security-Policy: Prevents XSS and injection attacks
 *
 * These headers provide defense-in-depth against common web vulnerabilities.
 */
export function securityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    // Set security headers on response
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'");
  };
}
