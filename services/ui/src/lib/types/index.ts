// Run status from planning_runs table
export type RunStatus = "running" | "paused" | "completed" | "killed";

// Phase names from registry
export type PhaseName =
  | "opportunity"
  | "customer-intel"
  | "market-research"
  | "competitive-intel"
  | "kill-test"
  | "revenue-expansion"
  | "strategy"
  | "business-model"
  | "product-design"
  | "gtm-marketing"
  | "content-engine"
  | "tech-arch"
  | "analytics"
  | "launch-execution"
  | "synthesis";

// Run mode (local = CLI/Claude Code, cloud = Cloudflare Workers AI)
export type RunMode = "local" | "cloud";

// Planning run from API
export interface PlanningRun {
  id: string;
  idea: string;
  refined_idea?: string;
  status: RunStatus;
  current_phase?: PhaseName;
  quality_score?: number;
  revenue_potential?: string;
  workflow_instance_id?: string;
  kill_verdict?: string;
  pivot_count?: number;
  package_key?: string;
  mode?: RunMode;
  created_at: number;
  updated_at?: number;
}

// Parked idea from API
export interface ParkedIdea {
  id: string;
  idea: string;
  refined_idea?: string;
  run_id?: string;
  source_phase: string;
  reason: string;
  revisit_estimate_months?: number;
  revisit_estimate_note?: string;
  created_at: number;
}

// Planning artifact from API
export interface PlanningArtifact {
  id: string;
  phase: PhaseName;
  content: Record<string, unknown>;
  review_verdict?: string;
  review_iterations?: number;
  overall_score?: number;
}

// Generic Kanban card
export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  phase?: string;
  mode?: RunMode;
  metadata?: Record<string, unknown>;
  createdAt?: number;
}

// Kanban column configuration
export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color?: string;
}

// Stage grouping for run detail view
export interface Stage {
  id: string;
  title: string;
  phases: PhaseName[];
}

// Phase documentation for detail views
export interface PhaseDocumentation {
  title: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  successCriteria?: string[];
}

// The 5 main stages (grouping the 15 phases)
export const STAGES: Stage[] = [
  {
    id: "discovery",
    title: "Discovery",
    phases: ["opportunity", "customer-intel", "market-research", "competitive-intel"],
  },
  {
    id: "validation",
    title: "Validation",
    phases: ["kill-test"],
  },
  {
    id: "strategy",
    title: "Strategy",
    phases: ["revenue-expansion", "strategy", "business-model"],
  },
  {
    id: "design",
    title: "Design",
    phases: ["product-design", "gtm-marketing", "content-engine"],
  },
  {
    id: "execution",
    title: "Execution",
    phases: ["tech-arch", "analytics", "launch-execution", "synthesis"],
  },
];
