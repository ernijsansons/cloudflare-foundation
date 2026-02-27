import type { Context, Next } from "hono";

/**
 * Distributed Tracing Middleware
 *
 * Generates or propagates x-foundation-trace-id for distributed tracing
 * across all Foundation services (Gateway, Agents, Planning).
 *
 * The trace ID follows this format: {timestamp}-{random}
 * This enables chronological sorting in log aggregation systems.
 */
export function correlationMiddleware() {
  return async (c: Context, next: Next) => {
    // Primary trace header for Foundation platform
    const traceId = c.req.header("x-foundation-trace-id")
      ?? c.req.header("x-correlation-id")
      ?? generateTraceId();

    // Store in context for downstream middleware and handlers
    c.set("correlationId", traceId);
    c.set("traceId", traceId);

    // Set response headers for client visibility
    c.header("x-foundation-trace-id", traceId);
    c.header("x-correlation-id", traceId); // Backwards compatibility

    await next();
  };
}

/**
 * Generate a trace ID with embedded timestamp for chronological ordering.
 * Format: {unix_ms_hex}-{random_suffix}
 * Example: 18d5a2f3c00-a1b2c3d4
 */
function generateTraceId(): string {
  const timestamp = Date.now().toString(16);
  const random = crypto.randomUUID().split("-")[0];
  return `${timestamp}-${random}`;
}

/**
 * Create headers object with trace ID for service-to-service calls.
 * Use this when forwarding requests to AGENT_SERVICE or PLANNING_SERVICE.
 */
export function createTracedHeaders(c: Context, baseHeaders?: Headers): Headers {
  const headers = new Headers(baseHeaders);
  const traceId = c.get("traceId") ?? c.get("correlationId");

  if (traceId) {
    headers.set("x-foundation-trace-id", traceId);
  }

  return headers;
}
