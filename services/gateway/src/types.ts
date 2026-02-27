export interface Env {
  AGENT_SERVICE: Fetcher;
  PLANNING_SERVICE?: Fetcher;
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
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
  IMAGES?: unknown;
  CONTEXT_SIGNING_KEY: string;
  TURNSTILE_SECRET: string;
}

export interface Variables {
  tenantId?: string;
  userId?: string;
  plan?: string;
  correlationId?: string;
  traceId?: string;
}
