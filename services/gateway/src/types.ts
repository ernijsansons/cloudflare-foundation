import type { SectionA } from "@foundation/shared";

export interface Env {
  AGENT_SERVICE: Fetcher;
  PLANNING_SERVICE?: Fetcher;
  // External agent services (Naomi + Athena)
  NAOMI_SERVICE: Fetcher;
  ATHENA_SERVICE: Fetcher;
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  CACHE_KV?: KVNamespace;
  FILES: R2Bucket;
  AUDIT_QUEUE: Queue;
  NOTIFICATION_QUEUE?: Queue;
  ANALYTICS_QUEUE?: Queue;
  WEBHOOK_QUEUE?: Queue;
  AI?: Ai;
  VECTOR_INDEX?: VectorizeIndex;
  ANALYTICS?: AnalyticsEngineDataset;
  ONBOARDING_WORKFLOW?: Workflow;
  DATA_PIPELINE_WORKFLOW?: Workflow;
  REPORT_WORKFLOW?: Workflow;
  EMAIL_WORKFLOW?: Workflow;
  FOUNDATION_MCP: DurableObjectNamespace;
  IMAGES?: unknown;
  CONTEXT_SIGNING_KEY: string;
  TURNSTILE_SECRET: string;
  // Environment configuration
  USE_DO_RATE_LIMITING?: string;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
  // Feature flags for agent integrations
  AGENTS_NAOMI_ENABLED: string;
  AGENTS_ATHENA_ENABLED: string;
  // Naomi API configuration
  NAOMI_TENANT_ID?: string;
  NAOMI_BUSINESS_ID?: string;
  // Athena API configuration
  ATHENA_ADMIN_SECRET?: string;
}

export interface Variables {
  tenantId?: string;
  userId?: string;
  plan?: string;
  correlationId?: string;
  traceId?: string;
  contextToken?: string;
}
