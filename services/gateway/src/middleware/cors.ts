import { cors } from "hono/cors";

export function corsMiddleware() {
  return cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Context-Token", "x-correlation-id"],
    maxAge: 86400,
  });
}
