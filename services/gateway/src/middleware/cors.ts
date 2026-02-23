import { cors } from "hono/cors";
import type { Context } from "hono";
import type { Env } from "../types";

// Default development origins (localhost)
const DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
];

/**
 * CORS middleware with environment-aware origin validation.
 *
 * SECURITY:
 * - Production: Only allows origins from ALLOWED_ORIGINS env var
 * - Development: Allows localhost:* ports + configured origins
 * - Staging: Configurable via ALLOWED_ORIGINS env var
 *
 * Environment variables:
 * - ENVIRONMENT: "production" | "staging" | "development" (default: "development")
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 *   Example: "https://yourdomain.com,https://app.yourdomain.com"
 */
export function corsMiddleware() {
  return cors({
    origin: (origin, c: Context<{ Bindings: Env }>) => {
      // SECURITY: Reject requests with no origin
      if (!origin) return null;

      const env = c.env.ENVIRONMENT || "development";
      const allowedOriginsEnv = c.env.ALLOWED_ORIGINS || "";
      const configuredOrigins = allowedOriginsEnv
        .split(",")
        .map(o => o.trim())
        .filter(o => o.length > 0);

      // Check configured origins (works in all environments)
      const allAllowedOrigins = [...DEV_ORIGINS, ...configuredOrigins];
      if (allAllowedOrigins.includes(origin)) {
        return origin;
      }

      // Development only: Allow any localhost port
      if (env !== "production" && env !== "staging") {
        if (origin.startsWith("http://localhost:")) {
          return origin;
        }
      }

      // Reject unauthorized origins
      return null;
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Context-Token", "x-correlation-id"],
    maxAge: 86400,
  });
}
