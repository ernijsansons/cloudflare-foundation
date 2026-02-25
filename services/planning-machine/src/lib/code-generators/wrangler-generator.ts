/**
 * Wrangler Config Generator (Phase 1.6)
 * Generates complete wrangler.toml from tech-arch output
 */

import type { TechArchOutput } from "../../schemas/tech-arch";

export function generateWranglerConfig(
  techArchOutput: TechArchOutput,
  projectName: string = "generated-project",
  accountId: string = "PLACEHOLDER_ACCOUNT_ID"
): string {
  const config: string[] = [];

  config.push("# Auto-generated wrangler.toml from Planning Machine");
  config.push("# Generated: " + new Date().toISOString());
  config.push("");

  // Basic config
  config.push(`name = "${projectName}"`);
  config.push(`main = "src/index.ts"`);
  config.push(`compatibility_date = "${getCompatibilityDate()}"`);
  config.push(`account_id = "${accountId}"`);
  config.push("");

  const bindings = techArchOutput.cloudflareBindings;

  if (!bindings) {
    return config.join("\n");
  }

  // D1 Databases
  if (bindings.d1?.databases && bindings.d1.databases.length > 0) {
    config.push("[[d1_databases]]");
    config.push(`binding = "DB"`);
    config.push(`database_name = "${bindings.d1.databases[0]}"`);
    config.push(`database_id = "PLACEHOLDER_D1_ID"`);
    config.push(`migrations_dir = "migrations"`);
    config.push("");
  }

  // R2 Buckets
  if (bindings.r2?.buckets && bindings.r2.buckets.length > 0) {
    for (const bucket of bindings.r2.buckets) {
      config.push("[[r2_buckets]]");
      config.push(`binding = "${bucket.toUpperCase().replace(/-/g, '_')}"`);
      config.push(`bucket_name = "${bucket}"`);
      config.push("");
    }
  }

  // KV Namespaces
  if (bindings.kv && bindings.kv.length > 0) {
    for (const kv of bindings.kv) {
      config.push("[[kv_namespaces]]");
      config.push(`binding = "${kv.namespace.toUpperCase().replace(/-/g, '_')}"`);
      config.push(`id = "PLACEHOLDER_KV_ID"`);
      config.push(`# Purpose: ${kv.purpose}`);
      config.push("");
    }
  }

  // Vectorize
  if (bindings.vectorize && bindings.vectorize.length > 0) {
    for (const vector of bindings.vectorize) {
      config.push("[[vectorize]]");
      config.push(`binding = "VECTOR_INDEX"`);
      config.push(`index_name = "${vector.index}"`);
      config.push(`# Dimensions: ${vector.dimensions}, Metric: ${vector.metric}`);
      config.push("");
    }
  }

  // Durable Objects
  if (bindings.durableObjects && bindings.durableObjects.length > 0) {
    config.push("[[durable_objects.bindings]]");
    for (const doObj of bindings.durableObjects) {
      config.push(`name = "${doObj.binding}"`);
      config.push(`class_name = "${doObj.className}"`);
      if (doObj.extendsAgentSDK) {
        config.push(`# Extends: ${doObj.extendsAgentSDK} (Agents SDK v0.3.7+)`);
      }
      if (doObj.namingPattern) {
        config.push(`# Naming Pattern: ${doObj.namingPattern}`);
      }
      config.push("");
    }
  }

  // Queues
  if (bindings.queues && bindings.queues.length > 0) {
    for (const queue of bindings.queues) {
      config.push("[[queues.producers]]");
      config.push(`queue = "${queue.name}"`);
      config.push(`binding = "${queue.name.toUpperCase().replace(/-/g, '_')}"`);
      config.push("");
    }

    for (const queue of bindings.queues) {
      config.push("[[queues.consumers]]");
      config.push(`queue = "${queue.name}"`);
      config.push(`max_batch_size = 10`);
      config.push(`max_batch_timeout = 5`);
      config.push(`max_retries = ${queue.retryLimit || 3}`);
      if (queue.dlq) {
        config.push(`dead_letter_queue = "${queue.name}-dlq"`);
      }
      config.push("");
    }
  }

  // AI Gateway
  if (bindings.aiGateway?.enabled) {
    config.push("[ai]");
    config.push(`binding = "AI"`);
    if (bindings.aiGateway.gatewayId) {
      config.push("[ai.gateway]");
      config.push(`id = "${bindings.aiGateway.gatewayId}"`);
      config.push(`cache_ttl = 3600`);
    }
    config.push("");
  }

  // Workers VPC (Enterprise)
  if (bindings.vpc?.enabled) {
    config.push("[[vpc]]");
    config.push(`binding = "ENTERPRISE_VPC"`);
    config.push(`vpc_id = "${bindings.vpc.vpcId}"`);
    config.push(`subnets = ${JSON.stringify(bindings.vpc.subnets)}`);
    config.push("");
  }

  // Hyperdrive
  if (bindings.hyperdrive && bindings.hyperdrive.length > 0) {
    for (const hd of bindings.hyperdrive) {
      config.push("[[hyperdrive]]");
      config.push(`binding = "${hd.name.toUpperCase().replace(/-/g, '_')}"`);
      config.push(`id = "PLACEHOLDER_HYPERDRIVE_ID"`);
      config.push(`# Database: ${hd.database}, Purpose: ${hd.purpose}`);
      config.push("");
    }
  }

  // Analytics Engine
  if (bindings.analyticsEngine && bindings.analyticsEngine.length > 0) {
    for (const ae of bindings.analyticsEngine) {
      config.push("[[analytics_engine_datasets]]");
      config.push(`binding = "ANALYTICS"`);
      config.push(`dataset = "${ae.dataset}"`);
      config.push("");
    }
  }

  return config.join("\n");
}

function getCompatibilityDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
