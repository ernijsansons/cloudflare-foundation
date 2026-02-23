import type { Context } from "hono";
import type { Env, Variables } from "../types";

/**
 * Utility to forward requests to downstream services with context injection.
 *
 * This abstracts the common pattern of:
 * 1. Cloning request headers
 * 2. Adding X-Context-Token for authentication
 * 3. Handling request body for non-GET/HEAD methods
 * 4. Error handling with proper status codes
 */
export async function forwardToService(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  service: Fetcher,
  options?: {
    pathTransform?: (path: string) => string;
    errorMessage?: string;
  }
): Promise<Response> {
  try {
    const url = new URL(c.req.url);

    // Apply path transformation if provided
    if (options?.pathTransform) {
      url.pathname = options.pathTransform(url.pathname);
    }

    // Clone headers and add context token
    const headers = new Headers(c.req.raw.headers);
    const contextToken = c.get("contextToken");
    if (contextToken) {
      headers.set("X-Context-Token", contextToken);
    }

    // Properly forward the request with body
    const init: RequestInit = {
      method: c.req.method,
      headers,
    };

    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      init.body = await c.req.raw.clone().arrayBuffer();
    }

    return service.fetch(new Request(url.toString(), init));
  } catch (error) {
    console.error("Service forwarding error:", error);
    return c.json(
      { error: options?.errorMessage ?? "Service unavailable" },
      503
    );
  }
}
