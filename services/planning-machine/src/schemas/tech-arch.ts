import { z } from "zod";

// ============================================================================
// CONCRETE SCHEMAS (Phase 1: Schema Hardening)
// Replaces z.any() with structured, deterministic schemas for Ralph Loop
// ============================================================================

// Database Schema Definitions
export const DatabaseColumnSchema = z.object({
  name: z.string(),
  type: z.enum(["TEXT", "INTEGER", "REAL", "BLOB", "DATETIME"]),
  nullable: z.boolean().default(true),
  primaryKey: z.boolean().default(false),
  unique: z.boolean().default(false),
  defaultValue: z.string().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
    onDelete: z.enum(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"]).default("CASCADE"),
  }).optional(),
});

export const DatabaseIndexSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()).min(1),
  unique: z.boolean().default(false),
});

export const DatabaseTableSchema = z.object({
  name: z.string(),
  columns: z.array(DatabaseColumnSchema).min(1),
  indexes: z.array(DatabaseIndexSchema).default([]),
  migrations: z.object({
    up: z.string(),    // SQL DDL for creating/altering
    down: z.string(),  // SQL DDL for rollback
  }).optional(),
});

// Audit Hash Chain Schema (Plane 10 Security - SOC2/HIPAA)
export const AuditHashChainSchema = z.object({
  enabled: z.boolean(),
  tableName: z.string().default("audit_chain"),
  hashAlgorithm: z.enum(["SHA-256", "SHA-512"]).default("SHA-256"),
  fields: z.object({
    tenantId: z.boolean().default(true),
    eventType: z.boolean().default(true),
    eventData: z.boolean().default(true),
    previousHash: z.boolean().default(true),
    currentHash: z.boolean().default(true),
    timestamp: z.boolean().default(true),
    actorId: z.boolean().default(true),
  }),
  verification: z.object({
    enabled: z.boolean().default(true),
    verifyOnInsert: z.boolean().default(true),
    periodicVerification: z.boolean().default(false),
  }),
});

// Gateway-Signed Context Tokens (Plane 10 Security - Privilege Escalation Prevention)
export const ContextTokenSchema = z.object({
  enabled: z.boolean(),
  signingService: z.enum(["gateway", "auth-service"]).default("gateway"),
  ttl: z.string().default("60s"),  // Short-lived tokens
  algorithm: z.enum(["RS256", "ES256"]).default("RS256"),
  validationMiddleware: z.enum(["required", "optional"]).default("required"),
  rotation: z.enum(["automatic", "manual"]).default("automatic"),
  headerName: z.string().default("X-Context-Token"),
});

// API Route Schema
export const APIRouteSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]),
  auth: z.enum(["required", "optional", "none"]).default("required"),
  rateLimit: z.object({
    requests: z.number(),
    window: z.string(),  // e.g., "1m", "1h"
    scope: z.enum(["global", "per-tenant", "per-user", "per-ip"]),
  }).optional(),
  requestBody: z.record(z.unknown()).optional(),
  responseBody: z.record(z.unknown()).optional(),
  middleware: z.array(z.string()).default([]),
});

// Agents SDK Configuration (v0.3.7+ - Corrected Version)
export const AgentsSDKSchema = z.object({
  version: z.string().default("0.3.7+"),
  patterns: z.object({
    agentWorkflow: z.object({
      enabled: z.boolean(),
      workflowClasses: z.array(z.object({
        name: z.string(),
        durableObject: z.string(),
        tasks: z.array(z.string()),
      })),
    }).optional(),
    scheduledTasks: z.object({
      enabled: z.boolean(),
      agents: z.array(z.object({
        agentClass: z.string(),
        schedule: z.string(),  // "Agent.scheduleEvery()"
        interval: z.string(),  // e.g., "5m", "1h"
        retryPolicy: z.object({
          maxRetries: z.number(),
          backoff: z.enum(["linear", "exponential"]),
        }),
      })),
    }).optional(),
  }),
});

// Durable Object Schema (with DO Naming Taxonomy & Hibernation)
export const DurableObjectSchema = z.object({
  className: z.string(),
  binding: z.string(),
  extendsAgentSDK: z.enum(["ChatAgent", "TaskAgent", "TenantAgent", "SessionAgent", "BaseAgent"]).nullable(),
  stateSchema: z.record(z.unknown()),  // Structured, not string
  usesSQLite: z.boolean().default(false),
  usesWebSockets: z.boolean().default(false),
  // DO Naming Taxonomy (Constraint 9)
  namingPattern: z.string().default("{tenantId}:{purpose}:{identifier}"),
  exampleId: z.string().optional(),  // e.g., "tenant_abc123:chat-agent:session_xyz789"
  // Hibernation Lifecycle (Cost Optimization)
  hibernation: z.object({
    enabled: z.boolean(),
    serializationStrategy: z.enum(["sqlite", "in-memory", "hybrid"]),
    wakeupThreshold: z.string(),  // e.g., "30s of inactivity"
    generateHandlers: z.boolean().default(true),  // Generate serializeAttachment/deserializeAttachment
  }).optional(),
  scheduledTasks: z.array(z.object({
    taskName: z.string(),
    schedule: z.enum(["once", "recurring"]),
    retryPolicy: z.object({
      maxRetries: z.number(),
      backoffMs: z.number(),
    }),
  })).default([]),
  rpcMethods: z.array(z.object({
    name: z.string(),
    params: z.record(z.unknown()),
    returns: z.record(z.unknown()),
  })).default([]),
});

// Cloudflare Bindings (Comprehensive)
export const CloudflareBindingsSchema = z.object({
  workers: z.object({
    count: z.number(),
    purposes: z.array(z.string()),
  }).optional(),
  durableObjects: z.array(DurableObjectSchema).default([]),
  d1: z.object({
    databases: z.array(z.string()),
    purpose: z.string(),
  }).optional(),
  r2: z.object({
    buckets: z.array(z.string()),
    purpose: z.string(),
  }).optional(),
  kv: z.array(z.object({
    namespace: z.string(),
    purpose: z.string(),
    ttlStrategy: z.string(),
  })).default([]),
  vectorize: z.array(z.object({
    index: z.string(),
    dimensions: z.number(),
    metric: z.enum(["cosine", "euclidean", "dot-product"]),
    purpose: z.string(),
  })).default([]),
  queues: z.array(z.object({
    name: z.string(),
    producers: z.array(z.string()),
    consumers: z.array(z.string()),
    messageSchema: z.record(z.unknown()),
    dlq: z.boolean().default(false),
    retryLimit: z.number().default(3),
  })).default([]),
  workflows: z.array(z.object({
    name: z.string(),
    className: z.string(),
    triggerPattern: z.enum(["user_action", "cron", "queue", "event"]),
    pausePoints: z.array(z.object({
      step: z.string(),
      reason: z.string(),
    })),
    stepCount: z.number(),
    maxDuration: z.string(),
  })).default([]),
  analyticsEngine: z.array(z.object({
    dataset: z.string(),
    indexes: z.array(z.string()),
    blobs: z.array(z.string()),
    doubles: z.array(z.string()),
  })).default([]),
  aiGateway: z.object({
    enabled: z.boolean(),
    gatewayId: z.string().optional(),
    costBudget: z.object({
      dailyLimit: z.number(),
      alertThreshold: z.number(),
    }).optional(),
    cachingStrategy: z.string(),
    logLevel: z.enum(["none", "errors", "all"]),
  }).optional(),
  turnstile: z.array(z.object({
    endpoint: z.string(),
    mode: z.enum(["managed", "invisible"]),
  })).default([]),
  hyperdrive: z.array(z.object({
    name: z.string(),
    database: z.string(),
    purpose: z.string(),
  })).default([]),
  // Workers VPC (Enterprise - Foundation v2.5)
  vpc: z.object({
    enabled: z.boolean(),
    vpcId: z.string(),
    subnets: z.array(z.string()),
    privateEndpoints: z.array(z.object({
      name: z.string(),
      internalHostname: z.string(),
      port: z.number(),
      protocol: z.enum(["http", "https", "tcp"]),
    })),
  }).optional(),
  agentsSDK: AgentsSDKSchema.optional(),
});

// Observability Schema
export const ObservabilitySchema = z.object({
  logging: z.object({
    strategy: z.enum(["logpush", "analytics_engine", "both"]),
    logpushDataset: z.string().optional(),
    retention: z.string(),
    structure: z.enum(["json", "text"]),
  }),
  metrics: z.object({
    analyticsEngine: z.object({
      dataset: z.string(),
      metrics: z.array(z.string()),
    }).optional(),
    customMetrics: z.array(z.object({
      name: z.string(),
      type: z.enum(["counter", "gauge", "histogram"]),
    })),
  }),
  tracing: z.object({
    enabled: z.boolean(),
    samplingRate: z.number().min(0).max(1),
    traceIdPropagation: z.boolean(),
  }).optional(),
  dashboards: z.array(z.object({
    name: z.string(),
    metrics: z.array(z.string()),
    audience: z.string(),
  })).default([]),
});

// Security Posture Schema
export const SecurityPostureSchema = z.object({
  waf: z.object({
    enabled: z.boolean(),
    rules: z.array(z.object({
      name: z.string(),
      action: z.enum(["block", "challenge", "log"]),
    })),
  }).optional(),
  access: z.object({
    enabled: z.boolean(),
    protectedPaths: z.array(z.string()),
    identityProviders: z.array(z.string()),
  }).optional(),
  zeroTrust: z.object({
    serviceToServiceAuth: z.enum(["context_tokens", "mtls", "api_keys"]),
    clientAuth: z.enum(["session", "jwt", "oauth"]),
    secretsRotation: z.boolean(),
  }),
  dataEncryption: z.object({
    atRest: z.boolean(),
    inTransit: z.boolean(),
    kms: z.string(),
  }).optional(),
  // Plane 10: Context Tokens
  contextTokens: ContextTokenSchema.optional(),
});

// Executable Artifacts (Phase 1.6 + Foundation v2.5)
export const ExecutableArtifactsSchema = z.object({
  sqlDDL: z.string().optional(),                      // Complete schema.sql content
  openAPISpec: z.string().optional(),                 // Complete openapi.yaml content
  wranglerConfig: z.string().optional(),              // Legacy wrangler.toml (deprecated)
  wranglerConfigJSONC: z.string().optional(),         // Foundation v2.5: wrangler.jsonc (PREFERRED)
  auditChainVerificationLogic: z.string().optional(), // SQL query or Drizzle function to verify chain integrity
  envExample: z.string().optional(),                  // Complete .env.example content
  cicdPipeline: z.string().optional(),                // Complete .github/workflows/deploy.yml content
});

// ============================================================================
// MAIN TECH ARCH OUTPUT SCHEMA
// ============================================================================

// Keep anyField for backward compatibility with optional fields
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const TechArchOutputSchema = z.object({
  // Concrete schemas (deterministic)
  databaseSchema: z.object({
    tables: z.array(DatabaseTableSchema).default([]),
    // Plane 10: Audit Hash Chain
    auditHashChain: AuditHashChainSchema.optional(),
  }).optional(),
  apiRoutes: z.object({
    routes: z.array(APIRouteSchema).default([]),
    gatewayChanges: anyField,
  }).optional(),
  cloudflareBindings: CloudflareBindingsSchema.optional(),
  observability: ObservabilitySchema.optional(),
  securityPosture: SecurityPostureSchema.optional(),
  executableArtifacts: ExecutableArtifactsSchema.optional(),

  // Legacy fields (kept for backward compatibility)
  sveltekitRoutes: anyField,
  durableObjects: anyField,  // Superseded by cloudflareBindings.durableObjects
  workflows: anyField,       // Superseded by cloudflareBindings.workflows
  queueHandlers: anyField,
  mcpTools: anyField,
  cronJobs: anyField,
  wranglerChanges: anyField,
  environmentVariables: anyField,
  authFlowDecisions: anyField,
  thirdPartyIntegrations: anyArray,
  technicalDecisions: anyArray,

  /**
   * Draft tasks contributed by tech-arch toward final TASKS.json.
   * Include: infra setup, DB migrations, workers, bindings, devops tasks.
   */
  draftTasks: anyArray,
}).passthrough();

export type TechArchOutput = z.infer<typeof TechArchOutputSchema>;
