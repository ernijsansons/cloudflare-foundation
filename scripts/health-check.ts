#!/usr/bin/env tsx
/**
 * Health Check Script for Cloudflare Foundation
 *
 * Checks the health of gateway and agents services and reports status.
 *
 * Usage:
 *   GATEWAY_URL=https://foundation-gateway.workers.dev \
 *   AGENTS_URL=https://foundation-agents.workers.dev \
 *   pnpm health
 *
 * Environment variables:
 *   - GATEWAY_URL: Gateway service URL (required)
 *   - AGENTS_URL: Agents service URL (optional)
 *
 * Exit codes:
 *   - 0: All services healthy
 *   - 1: One or more services unhealthy or check failed
 */

interface ServiceHealth {
  name: string;
  url: string;
  status: "ok" | "degraded" | "down" | "error";
  statusCode?: number;
  responseTime?: number;
  details?: Record<string, unknown>;
}

const GATEWAY_URL = process.env.GATEWAY_URL;
const AGENTS_URL = process.env.AGENTS_URL;

if (!GATEWAY_URL) {
  console.error("Error: GATEWAY_URL environment variable is required");
  console.error("\nUsage:");
  console.error("  GATEWAY_URL=<url> AGENTS_URL=<url> pnpm health");
  process.exit(1);
}

async function checkHealth(serviceUrl: string, serviceName: string): Promise<ServiceHealth> {
  const url = `${serviceUrl}/health`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "HealthCheck/1.0",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json() as { status?: string; [key: string]: unknown };

    return {
      name: serviceName,
      url: serviceUrl,
      status: response.ok ? (data.status === "ok" ? "ok" : "degraded") : "down",
      statusCode: response.status,
      responseTime,
      details: data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: serviceName,
      url: serviceUrl,
      status: "error",
      responseTime,
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

function printTable(results: ServiceHealth[]): void {
  console.log("\n# Health Check Report\n");
  console.log(`Generated: ${new Date().toISOString()}\n`);

  console.log("| Service | Status | Response Time | Details |");
  console.log("|---------|--------|---------------|---------|");

  for (const result of results) {
    const statusIcon = {
      ok: "✅",
      degraded: "⚠️ ",
      down: "❌",
      error: "🔴",
    }[result.status];

    const responseTime = result.responseTime
      ? `${result.responseTime}ms`
      : "N/A";

    const details = result.statusCode
      ? `HTTP ${result.statusCode}`
      : result.details?.error
      ? String(result.details.error)
      : "No details";

    console.log(`| ${result.name} | ${statusIcon} ${result.status} | ${responseTime} | ${details} |`);
  }

  console.log();
}

function printSummary(results: ServiceHealth[]): void {
  const totalServices = results.length;
  const healthyServices = results.filter((r) => r.status === "ok").length;
  const unhealthyServices = totalServices - healthyServices;

  console.log("## Summary\n");
  console.log(`- **Total Services**: ${totalServices}`);
  console.log(`- **Healthy**: ${healthyServices}`);
  console.log(`- **Unhealthy**: ${unhealthyServices}\n`);

  if (unhealthyServices > 0) {
    console.log("⚠️  **Warning**: One or more services are unhealthy!");
    console.log("Review the details above and check service logs.\n");
  } else {
    console.log("✅ **All services are healthy!**\n");
  }
}

async function main() {
  console.log("Running health checks...\n");

  const checks: Array<Promise<ServiceHealth>> = [];

  // Check gateway (required)
  checks.push(checkHealth(GATEWAY_URL!, "Gateway"));

  // Check agents (optional)
  if (AGENTS_URL) {
    checks.push(checkHealth(AGENTS_URL, "Agents"));
  }

  const results = await Promise.all(checks);

  printTable(results);
  printSummary(results);

  // Exit with error if any service is unhealthy
  const hasUnhealthy = results.some((r) => r.status !== "ok");
  if (hasUnhealthy) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
