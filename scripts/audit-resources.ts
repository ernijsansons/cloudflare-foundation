#!/usr/bin/env tsx
/**
 * Cloudflare Resource Audit Script
 *
 * This script audits all Cloudflare resources (D1, KV, R2, Workers) in your account
 * and cross-references them with resources defined in wrangler.jsonc files.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> pnpm audit:resources
 *
 * Required environment variables:
 *   - CLOUDFLARE_API_TOKEN: API token with account read permissions
 *   - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

interface CloudflareResource {
  id: string;
  name: string;
  type: "D1" | "KV" | "R2" | "Worker";
}

interface WranglerConfig {
  name?: string;
  d1_databases?: Array<{ binding: string; database_id: string; database_name: string }>;
  kv_namespaces?: Array<{ binding: string; id: string }>;
  r2_buckets?: Array<{ binding: string; bucket_name: string }>;
}

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN || !ACCOUNT_ID) {
  console.error("Error: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables are required");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_TOKEN}`,
  "Content-Type": "application/json",
};

async function fetchCloudflareResources(): Promise<CloudflareResource[]> {
  const resources: CloudflareResource[] = [];

  try {
    // Fetch D1 databases
    const d1Response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database`,
      { headers }
    );
    const d1Data = await d1Response.json() as { result?: Array<{ uuid: string; name: string }> };
    if (d1Data.result) {
      resources.push(
        ...d1Data.result.map((db) => ({
          id: db.uuid,
          name: db.name,
          type: "D1" as const,
        }))
      );
    }

    // Fetch KV namespaces
    const kvResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces`,
      { headers }
    );
    const kvData = await kvResponse.json() as { result?: Array<{ id: string; title: string }> };
    if (kvData.result) {
      resources.push(
        ...kvData.result.map((kv) => ({
          id: kv.id,
          name: kv.title,
          type: "KV" as const,
        }))
      );
    }

    // Fetch R2 buckets
    const r2Response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets`,
      { headers }
    );
    const r2Data = await r2Response.json() as { result?: { buckets?: Array<{ name: string }> } };
    if (r2Data.result?.buckets) {
      resources.push(
        ...r2Data.result.buckets.map((bucket) => ({
          id: bucket.name, // R2 buckets use name as ID
          name: bucket.name,
          type: "R2" as const,
        }))
      );
    }

    // Fetch Workers
    const workersResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts`,
      { headers }
    );
    const workersData = await workersResponse.json() as { result?: Array<{ id: string }> };
    if (workersData.result) {
      resources.push(
        ...workersData.result.map((worker) => ({
          id: worker.id,
          name: worker.id,
          type: "Worker" as const,
        }))
      );
    }

    return resources;
  } catch (error) {
    console.error("Error fetching Cloudflare resources:", error);
    throw error;
  }
}

async function parseWranglerConfigs(): Promise<Set<string>> {
  const referencedIds = new Set<string>();
  const referencedNames = new Set<string>();

  // Find all wrangler.jsonc files in the monorepo
  const wranglerFiles = await glob("**/wrangler.jsonc", {
    cwd: process.cwd(),
    ignore: ["**/node_modules/**", "**/.wrangler/**"],
  });

  for (const file of wranglerFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      // Remove comments from JSONC
      const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      const config = JSON.parse(jsonContent) as WranglerConfig;

      // Collect worker names
      if (config.name) {
        referencedNames.add(config.name);
      }

      // Collect D1 database IDs and names
      if (config.d1_databases) {
        for (const db of config.d1_databases) {
          if (db.database_id) referencedIds.add(db.database_id);
          if (db.database_name) referencedNames.add(db.database_name);
        }
      }

      // Collect KV namespace IDs
      if (config.kv_namespaces) {
        for (const kv of config.kv_namespaces) {
          if (kv.id) referencedIds.add(kv.id);
        }
      }

      // Collect R2 bucket names
      if (config.r2_buckets) {
        for (const bucket of config.r2_buckets) {
          if (bucket.bucket_name) referencedNames.add(bucket.bucket_name);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not parse ${file}:`, error);
    }
  }

  return new Set([...referencedIds, ...referencedNames]);
}

function printTable(resources: CloudflareResource[], referenced: Set<string>) {
  // Group resources by type
  const byType = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) acc[resource.type] = [];
    acc[resource.type]!.push(resource);
    return acc;
  }, {} as Record<string, CloudflareResource[]>);

  console.log("\n# Cloudflare Resource Audit Report\n");
  console.log(`Generated: ${new Date().toISOString()}\n`);

  for (const [type, typeResources] of Object.entries(byType)) {
    console.log(`## ${type} Resources\n`);
    console.log("| Name | ID | Status |");
    console.log("|------|-----|--------|");

    for (const resource of typeResources!) {
      const isReferenced =
        referenced.has(resource.id) || referenced.has(resource.name);
      const status = isReferenced ? "✅ Referenced" : "⚠️  Unreferenced";
      console.log(`| ${resource.name} | \`${resource.id}\` | ${status} |`);
    }

    console.log();
  }

  // Summary
  const totalResources = resources.length;
  const referencedCount = resources.filter(
    (r) => referenced.has(r.id) || referenced.has(r.name)
  ).length;
  const unreferencedCount = totalResources - referencedCount;

  console.log("## Summary\n");
  console.log(`- **Total Resources**: ${totalResources}`);
  console.log(`- **Referenced**: ${referencedCount}`);
  console.log(`- **Unreferenced**: ${unreferencedCount}\n`);

  if (unreferencedCount > 0) {
    console.log("⚠️  **Warning**: Unreferenced resources may be safe to delete, but verify first!");
    console.log("Unreferenced resources could be:");
    console.log("  - Old/unused resources from previous deployments");
    console.log("  - Resources used by other projects in the same account");
    console.log("  - Resources not yet added to wrangler.jsonc\n");
  }
}

async function main() {
  console.log("Fetching Cloudflare resources...");
  const resources = await fetchCloudflareResources();
  console.log(`Found ${resources.length} resources`);

  console.log("\nParsing wrangler.jsonc files...");
  const referenced = await parseWranglerConfigs();
  console.log(`Found ${referenced.size} referenced resource IDs/names`);

  printTable(resources, referenced);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
