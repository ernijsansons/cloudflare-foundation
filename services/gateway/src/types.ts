import type { SectionA } from "@foundation/shared";

export interface Env {
  AGENT_SERVICE: Fetcher;
  PLANNING_SERVICE?: Fetcher;
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
}

export interface Variables {
  tenantId?: string;
  userId?: string;
  plan?: string;
  correlationId?: string;
  contextToken?: string;
  // Validation middleware fields (set by validateBody/validateQuery/validateParams)
  validatedBody?: unknown;
  validatedQuery?: unknown;
  validatedParams?: unknown;
  // Request logger (set by requestLoggerMiddleware)
  logger?: import("./lib/logger").Logger;
}

// Project Documentation Types
export interface ChecklistItem {
  task?: string;
  status?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

export interface SecurityControl {
  implementation_status: string;
  [key: string]: unknown;
}

export interface ThreatModel {
  mitigation?: string[];
  [key: string]: unknown;
}

export interface Milestone {
  week?: number;
  milestone_name?: string;
  [key: string]: unknown;
}

export interface QuickAction {
  label?: string;
  action?: string;
  link?: string;
  [key: string]: unknown;
}

export interface ExecutiveSummary {
  headline?: string;
  vision?: string;
  current_status?: string;
  critical_next_steps?: string[];
  concept?: unknown;
  status?: string;
  completeness?: number;
  key_metrics?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface QuickStats {
  total_tasks?: number;
  completed_tasks?: number;
  completion_percentage?: number;
  security_score?: number;
  budget?: unknown;
  timeline?: unknown;
  north_star_metric?: unknown;
  current_phase?: string;
  [key: string]: unknown;
}

export interface HealthIndicators {
  status?: "healthy" | "at_risk" | "critical";
  blockers?: string[];
  dependencies?: string[];
  documentation_complete?: boolean;
  unknowns_resolved?: boolean;
  checklist_progress?: number;
  security_coverage?: number;
  [key: string]: unknown;
}

export interface CriticalPath {
  next_milestone?: string;
  key_deliverables?: string[];
  blockers?: string[];
  dependencies?: string[];
  [key: string]: unknown;
}

export interface OverviewSection {
  executive_summary: ExecutiveSummary;
  quick_stats: QuickStats;
  health_indicators: HealthIndicators;
  critical_path: CriticalPath;
  quick_actions: QuickAction[];
}

export interface ProjectDocumentation {
  A?: SectionA;
  B?: {
    constraints?: {
      budget_cap?: string;
      timeline?: string;
      [key: string]: unknown;
    };
    north_star?: {
      [key: string]: unknown;
    };
    success_metrics?: {
      north_star?: string;
      autonomous_success_rate_target?: string | number;
      cost_per_outcome_target?: string | number;
      [key: string]: unknown;
    };
    success_kill_switches?: Array<{ name: string; threshold: string; [key: string]: unknown }>;
    autonomous_success_rate_target?: string | number;
    cost_per_outcome_target?: string | number;
    unit_economics?: {
      cac?: string | number;
      ltv?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  C?: {
    checklist?: ChecklistItem[];
    [key: string]: unknown;
  };
  D?: Record<string, unknown>;
  G?: {
    unit_economics?: {
      gross_profit_per_outcome?: string | number;
      breakeven_outcomes?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  J?: {
    security_controls?: SecurityControl[];
    threat_model?: ThreatModel[];
    [key: string]: unknown;
  };
  M?: {
    weekly_milestones?: Milestone[];
    roadmap?: Array<{ name: string; dependencies?: string[]; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  overview?: OverviewSection;
  [key: string]: unknown;
}

// Additional types for project-docs routes
export type SectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "Overview";

export interface ProjectDocumentationRow {
  id: string;
  project_id: string;
  section_id: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
  subsection_key?: string;
  last_updated?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ProjectDocumentationMetadataRow {
  project_id: string;
  total_sections: number;
  last_updated: string;
  completeness_percentage?: number;
  status?: string;
  [key: string]: unknown;
}

export interface GetProjectDocsResponse {
  project_id: string;
  sections: ProjectDocumentation;
  metadata: {
    total_sections: number;
    last_updated: string;
    completeness?: number;
    status?: string;
    [key: string]: unknown;
  };
}

export interface GetSectionResponse {
  section_id: SectionId;
  content: Record<string, unknown>;
  subsections: Record<string, unknown>;
  status?: string;
  last_updated: number;
}

export interface UpdateSectionRequest {
  content: unknown;
  subsection_key?: string;
  status?: string;
  [key: string]: unknown;
}
