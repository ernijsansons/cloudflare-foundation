import type { Context, Next } from "hono";
import type { Env } from "../types";
import { MAX_REQUEST_BODY_SIZE } from "../constants";

/**
 * Middleware to reject requests with Content-Length exceeding the limit.
 * This provides an early rejection before the full body is received.
 *
 * Note: This only works for requests with Content-Length header.
 * For chunked transfer encoding, the body must be read first.
 */
export function bodySizeLimitMiddleware(maxSize = MAX_REQUEST_BODY_SIZE) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const contentLength = c.req.header("content-length");

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > maxSize) {
        return c.json(
          {
            error: "Request body too large",
            maxSize,
            received: size,
          },
          413
        );
      }
    }

    await next();
  };
}
