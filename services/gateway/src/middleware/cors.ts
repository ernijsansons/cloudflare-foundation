import { cors } from "hono/cors";

// Configure allowed origins - update this for your deployment
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  // Add your production domains here:
  // "https://yourdomain.com",
  // "https://app.yourdomain.com",
];

export function corsMiddleware() {
  return cors({
    origin: (origin) => {
      // SECURITY: Whitelist specific origins instead of allowing all
      if (!origin) return null; // Reject requests with no origin
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      // Allow any localhost port for development
      if (origin.startsWith("http://localhost:")) return origin;
      return null; // Reject unauthorized origins
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Context-Token", "x-correlation-id"],
    maxAge: 86400,
  });
}
