/**
 * Wrangler JSONC Config Generator (Foundation v2.5 - Constraint 4 + Phase 4: Foundation Invariants)
 * Generates wrangler.jsonc (JSON with comments) for JSON Schema validation
 * Preferred over wrangler.toml for deterministic one-shot builds
 *
 * PHASE 4 ENHANCEMENT: Hard-wires foundation invariants (SESSION_KV, secrets)
 * These bindings are ALWAYS injected for Gateway services.
 */

import type { TechArchOutput } from "../../schemas/tech-arch";

/**
 * Detect if this is a gateway service based on name or architecture
 */
function isGatewayService(projectName: string, techArchOutput: TechArchOutput): boolean {
  // Check if name contains "gateway" or if it has API routes (typical of gateway)
  const hasGatewayInName = projectName.toLowerCase().includes('gateway');
  const hasAPIRoutes = Boolean(techArchOutput.apiRoutes?.routes && techArchOutput.apiRoutes.routes.length > 0);
  return hasGatewayInName || hasAPIRoutes;
}

export function generateWranglerJSONC(
  techArchOutput: TechArchOutput,
  projectName: string = "generated-project",
  accountId: string = "PLACEHOLDER_ACCOUNT_ID"
): string {
  const config: any = {
    "$schema": "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/schemas/wrangler.schema.json",
    "name": projectName,
    "main": "src/index.ts",
    "compatibility_date": getCompatibilityDate(),
    "account_id": accountId,
  };

  const bindings = techArchOutput.cloudflareBindings;

  // PHASE 4: Inject foundation invariants FIRST
  // These bindings MUST exist in every Gateway service
  const isGateway = isGatewayService(projectName, techArchOutput);

  if (isGateway) {
    // Foundation KV: SESSION_KV (required for session management)
    config.kv_namespaces = config.kv_namespaces || [];
    const hasSessionKV = config.kv_namespaces.some((kv: any) => kv.binding === 'SESSION_KV');
    if (!hasSessionKV) {
      config.kv_namespaces.unshift({
        binding: "SESSION_KV",
        id: "PLACEHOLDER_SESSION_KV_ID",
        // Foundation invariant: Session storage
      });
    }

    // Foundation secrets for Gateway
    config.vars = config.vars || {};
    config.vars["_FOUNDATION_GATEWAY_"] = "true";

    // Add placeholder for secrets (to be set via wrangler secret put)
    // Note: Secrets can't be in wrangler.jsonc, but we document them
  }

  if (!bindings) {
    // Even without product-specific bindings, return foundation invariants
    return generateJSONCWithComments(config, isGateway, []);
  }

  // D1 Databases
  if (bindings.d1?.databases && bindings.d1.databases.length > 0) {
    config.d1_databases = [{
      binding: "DB",
      database_name: bindings.d1.databases[0],
      database_id: "PLACEHOLDER_D1_ID",
      migrations_dir: "migrations",
    }];
  }

  // R2 Buckets
  if (bindings.r2?.buckets && bindings.r2.buckets.length > 0) {
    config.r2_buckets = bindings.r2.buckets.map(bucket => ({
      binding: bucket.toUpperCase().replace(/-/g, '_'),
      bucket_name: bucket,
    }));
  }

  // KV Namespaces (merge with foundation invariants, avoid duplicates)
  if (bindings.kv && bindings.kv.length > 0) {
    const existingBindings = new Set((config.kv_namespaces || []).map((kv: any) => kv.binding));
    const productKVs = bindings.kv
      .filter(kv => !existingBindings.has(kv.namespace.toUpperCase().replace(/-/g, '_')))
      .map(kv => ({
        binding: kv.namespace.toUpperCase().replace(/-/g, '_'),
        id: "PLACEHOLDER_KV_ID",
        // Note: Comments preserved in JSONC format
      }));
    config.kv_namespaces = [...(config.kv_namespaces || []), ...productKVs];
  }

  // Vectorize
  if (bindings.vectorize && bindings.vectorize.length > 0) {
    config.vectorize = bindings.vectorize.map(vector => ({
      binding: "VECTOR_INDEX",
      index_name: vector.index,
      // dimensions: vector.dimensions, metric: vector.metric (comments in final output)
    }));
  }

  // Durable Objects
  if (bindings.durableObjects && bindings.durableObjects.length > 0) {
    config.durable_objects = {
      bindings: bindings.durableObjects.map(doObj => ({
        name: doObj.binding,
        class_name: doObj.className,
        script_name: projectName,
        // Agents SDK metadata preserved as comments in final output
      }))
    };
  }

  // Queues
  if (bindings.queues && bindings.queues.length > 0) {
    config.queues = {
      producers: bindings.queues.map(queue => ({
        queue: queue.name,
        binding: queue.name.toUpperCase().replace(/-/g, '_'),
      })),
      consumers: bindings.queues.map(queue => ({
        queue: queue.name,
        max_batch_size: 10,
        max_batch_timeout: 5,
        max_retries: queue.retryLimit || 3,
        ...(queue.dlq && { dead_letter_queue: `${queue.name}-dlq` }),
      }))
    };
  }

  // AI Gateway
  if (bindings.aiGateway?.enabled) {
    config.ai = {
      binding: "AI",
    };
    if (bindings.aiGateway.gatewayId) {
      config.ai.gateway = {
        id: bindings.aiGateway.gatewayId,
        cache_ttl: 3600,
      };
    }
  }

  // Workers VPC (Enterprise)
  if (bindings.vpc?.enabled) {
    config.vpc = [{
      binding: "ENTERPRISE_VPC",
      vpc_id: bindings.vpc.vpcId,
      subnets: bindings.vpc.subnets,
    }];
  }

  // Hyperdrive
  if (bindings.hyperdrive && bindings.hyperdrive.length > 0) {
    config.hyperdrive = bindings.hyperdrive.map(hd => ({
      binding: hd.name.toUpperCase().replace(/-/g, '_'),
      id: "PLACEHOLDER_HYPERDRIVE_ID",
      // database: hd.database, purpose: hd.purpose (metadata)
    }));
  }

  // Analytics Engine
  if (bindings.analyticsEngine && bindings.analyticsEngine.length > 0) {
    config.analytics_engine_datasets = bindings.analyticsEngine.map(ae => ({
      binding: "ANALYTICS",
      dataset: ae.dataset,
    }));
  }

  // Collect Durable Objects metadata for comments
  const durableObjectsMetadata = bindings.durableObjects || [];

  // Generate JSONC with comments and foundation secrets documentation
  return generateJSONCWithComments(config, isGateway, durableObjectsMetadata);
}

/**
 * Generate JSONC with comments documenting foundation invariants and secrets
 */
function generateJSONCWithComments(
  config: any,
  isGateway: boolean,
  durableObjectsMetadata: any[]
): string {
  let jsonc = "// Auto-generated wrangler.jsonc from Planning Machine (Phase 4: Foundation Invariants)\n";
  jsonc += `// Generated: ${new Date().toISOString()}\n`;
  jsonc += "// Foundation v2.5 - Constraint 4 (JSON Schema validation)\n\n";

  if (isGateway) {
    jsonc += "// ============================================================================\n";
    jsonc += "// FOUNDATION INVARIANTS (Gateway Service)\n";
    jsonc += "// ============================================================================\n";
    jsonc += "//\n";
    jsonc += "// Required Secrets (set via: wrangler secret put <NAME>):\n";
    jsonc += "//   - JWT_SECRET: Secret key for signing JWT tokens (min 32 characters)\n";
    jsonc += "//   - GATEWAY_CONTEXT_TOKEN_PRIVATE_KEY: RS256 private key for Context Token signing (Plane 10 Security)\n";
    jsonc += "//\n";
    jsonc += "// Required KV Namespaces:\n";
    jsonc += "//   - SESSION_KV: Session storage (already injected below)\n";
    jsonc += "//\n";
    jsonc += "// Required Environment Variables:\n";
    jsonc += "//   - ENVIRONMENT: production|staging|development\n";
    jsonc += "//\n";
    jsonc += "// ============================================================================\n\n";
  }

  jsonc += JSON.stringify(config, null, 2);

  // Add Agents SDK annotations as comments (Foundation v2.5 requirement)
  if (durableObjectsMetadata && durableObjectsMetadata.length > 0) {
    jsonc += "\n\n// Durable Objects Metadata (Agents SDK v0.3.7+):\n";
    durableObjectsMetadata.forEach((doObj: any) => {
      jsonc += `// - ${doObj.className}`;
      if (doObj.extendsAgentSDK) {
        jsonc += ` extends ${doObj.extendsAgentSDK}`;
      }
      if (doObj.namingPattern) {
        jsonc += ` (Naming: ${doObj.namingPattern})`;
      }
      if (doObj.hibernation?.enabled) {
        jsonc += ` [Hibernation: enabled, 100x cost savings]`;
      }
      jsonc += "\n";
    });
  }

  return jsonc;
}

function getCompatibilityDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
