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

interface GatewayPlatform {
  env?: {
    GATEWAY?: unknown;
    GATEWAY_FALLBACK_URL?: string;
  };
}

/**
 * Get gateway configuration based on environment
 * @param platform - Cloudflare platform binding
 * @returns Gateway configuration
 */
export function getGatewayConfig(
  platform: GatewayPlatform | undefined
): GatewayConfig {
  const env = platform?.env as Record<string, unknown> | undefined;
  const configuredFallback =
    typeof env?.GATEWAY_FALLBACK_URL === "string" &&
    env.GATEWAY_FALLBACK_URL.trim().length > 0
      ? env.GATEWAY_FALLBACK_URL.trim()
      : undefined;

  // Development: prefer service binding, fallback to localhost
  if (dev) {
    return {
      useServiceBinding: !!platform?.env?.GATEWAY,
      fallbackUrl: configuredFallback ?? "http://127.0.0.1:8787",
      defaultTenantId: "default",
    };
  }

  // Production: prefer service binding, no hardcoded external fallback.
  // A fallback URL may be explicitly provided via env.GATEWAY_FALLBACK_URL.
  return {
    useServiceBinding: !!platform?.env?.GATEWAY,
    fallbackUrl: configuredFallback,
    defaultTenantId: "default",
  };
}
