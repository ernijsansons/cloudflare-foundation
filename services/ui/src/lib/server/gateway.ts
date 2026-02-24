/**
 * Gateway Client Utility
 *
 * Centralized client for making requests to the gateway service
 * with automatic tenant context and environment-aware routing
 */

import { getGatewayConfig } from "./config";

export interface GatewayClient {
  fetch(path: string, options?: RequestInit): Promise<Response>;
  fetchJson<T>(path: string, options?: RequestInit): Promise<T>;
}

/**
 * Create a gateway client with tenant context
 * @param platform - Cloudflare platform binding
 * @param locals - SvelteKit locals with session data
 * @param fetch - Fetch function
 * @returns Gateway client instance
 */
export function createGatewayClient(
  platform: App.Platform | undefined,
  locals: App.Locals,
  fetch: typeof global.fetch
): GatewayClient {
  const config = getGatewayConfig(platform);
  const gateway = platform?.env?.GATEWAY;
  const tenantId = locals.tenantId || config.defaultTenantId;

  function buildUrl(path: string): string {
    // Ensure path starts with /api
    const normalizedPath = path.startsWith("/api") ? path : `/api/${path}`;

    // Add tenant_id if not already present
    const url = new URL(normalizedPath, "http://placeholder");
    if (!url.searchParams.has("tenant_id")) {
      url.searchParams.set("tenant_id", tenantId);
    }

    return url.pathname + url.search;
  }

  async function fetchInternal(
    path: string,
    options?: RequestInit
  ): Promise<Response> {
    const url = buildUrl(path);

    // Try service binding first
    if (config.useServiceBinding && gateway) {
      const fullUrl = `https://_${url}`;
      return gateway.fetch(fullUrl, options);
    }

    // Fallback to HTTP (only in development)
    if (config.fallbackUrl) {
      const fullUrl = `${config.fallbackUrl}${url}`;
      return fetch(fullUrl, options);
    }

    throw new Error("Gateway not configured and no fallback available");
  }

  return {
    fetch: fetchInternal,
    async fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
      const response = await fetchInternal(path, options);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gateway request failed: ${response.status} ${text}`);
      }
      return response.json() as Promise<T>;
    },
  };
}
