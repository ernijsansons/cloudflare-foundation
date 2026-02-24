/**
 * Environment Configuration
 *
 * Provides environment-aware configuration for gateway communication
 */

import { dev } from "$app/environment";

export interface GatewayConfig {
  useServiceBinding: boolean;
  fallbackUrl?: string;
  defaultTenantId: string;
}

/**
 * Get gateway configuration based on environment
 * @param platform - Cloudflare platform binding
 * @returns Gateway configuration
 */
export function getGatewayConfig(
  platform: App.Platform | undefined
): GatewayConfig {
  // Development: prefer service binding, fallback to localhost
  if (dev) {
    return {
      useServiceBinding: !!platform?.env?.GATEWAY,
      fallbackUrl: "http://127.0.0.1:8787",
      defaultTenantId: "default",
    };
  }

  // Production: prefer service binding, fallback to deployed gateway worker
  return {
    useServiceBinding: !!platform?.env?.GATEWAY,
    fallbackUrl: "https://foundation-gateway-production.ernijs-ansons.workers.dev",
    defaultTenantId: "default",
  };
}
