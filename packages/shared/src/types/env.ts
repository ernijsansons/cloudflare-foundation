/**
 * Global Env type — contains ALL bindings across all services.
 * Production: generate per-service types via `wrangler types` in each service directory.
 */
/// <reference types="@cloudflare/workers-types" />
import type { Pipeline } from "cloudflare:pipelines";

export interface Env {
  GATEWAY: Fetcher;
  AGENT_SERVICE: Fetcher;
  WORKFLOW_SERVICE: Fetcher;

  CHAT_AGENT: DurableObjectNamespace;
  TASK_AGENT: DurableObjectNamespace;
  TENANT_AGENT: DurableObjectNamespace;
  SESSION_AGENT: DurableObjectNamespace;
  MCP_SERVER: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;

  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  FILES: R2Bucket;
  ASSETS: R2Bucket;

  IMAGES?: unknown;

  AI: Ai;
  VECTOR_INDEX: VectorizeIndex;

  BROWSER?: Fetcher;
  SANDBOX?: DurableObjectNamespace;

  AUDIT_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  ANALYTICS_QUEUE: Queue;
  WEBHOOK_QUEUE: Queue;

  SEND_EMAIL?: SendEmail;

  ANALYTICS?: AnalyticsEngineDataset;

  EVENT_PIPELINE?: Pipeline<Record<string, unknown>>;
  POSTGRES?: Hyperdrive;

  ONBOARDING_WORKFLOW?: Workflow;
  DATA_PIPELINE_WORKFLOW?: Workflow;
  REPORT_WORKFLOW?: Workflow;
  EMAIL_WORKFLOW?: Workflow;

  JWT_SECRET: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  CONTEXT_SIGNING_KEY: string;
  TURNSTILE_SECRET: string;
}
