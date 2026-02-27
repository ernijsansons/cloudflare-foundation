import type { PhaseName, PlanningRun, PlanningArtifact, RunMode } from './index';
import type { DepartmentView } from './bible';

/**
 * Project status - maps to research lifecycle
 */
export type ProjectStatus = 'draft' | 'researching' | 'paused' | 'completed' | 'killed';

/**
 * Project summary for Kanban board display
 * Aggregates metadata from all linked runs
 */
export interface ProjectSummary {
  /** Unique project identifier (from ideas table) */
  id: string;
  /** Project name/title */
  name: string;
  /** Current lifecycle status */
  status: ProjectStatus;
  /** Current phase from latest active run */
  current_phase: PhaseName | null;
  /** Best quality score across all runs */
  quality_score: number | null;
  /** Revenue potential assessment */
  revenue_potential: string | null;
  /** Total artifacts across all runs */
  artifact_count: number;
  /** Number of research runs */
  run_count: number;
  /** ID of the most recent run */
  latest_run_id: string | null;
  /** Aggregated risk flags */
  risk_flags: string[];
  /** Execution mode (local/cloud) */
  mode: RunMode;
  /** Creation timestamp */
  created_at: number;
  /** Last update timestamp */
  updated_at: number;
}

/**
 * Full project detail including runs and aggregated artifacts
 * Used for Master Bible view
 */
export interface ProjectDetail extends ProjectSummary {
  /** Original idea content */
  idea_content: string;
  /** Refined idea if available */
  refined_idea?: string;
  /** All runs for this project, ordered by created_at DESC */
  runs: PlanningRun[];
  /** Best artifacts aggregated from all runs, keyed by phase */
  aggregated_artifacts: Partial<Record<PhaseName, PlanningArtifact>>;
  /** Department views for Bible display */
  departments: DepartmentView[];
  /** Kill verdict if project was killed */
  kill_verdict?: string;
}

/**
 * Kanban card representation for projects
 * Extends base card with project-specific fields
 */
export interface ProjectKanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  status: string; // Maps to current_phase for column placement
  phase?: PhaseName;
  mode: RunMode;
  quality_score?: number;
  revenue_potential?: string;
  run_count: number;
  artifact_count: number;
  risk_flags: string[];
  updated_at: number;
}

/**
 * Convert a ProjectSummary to a KanbanCard for board display
 */
export function projectToKanbanCard(project: ProjectSummary): ProjectKanbanCard {
  return {
    id: project.id,
    title: project.name,
    subtitle: project.status === 'paused'
      ? 'Paused'
      : project.status === 'completed'
        ? 'Completed'
        : undefined,
    status: project.current_phase ?? 'opportunity',
    phase: project.current_phase ?? undefined,
    mode: project.mode,
    quality_score: project.quality_score ?? undefined,
    revenue_potential: project.revenue_potential ?? undefined,
    run_count: project.run_count,
    artifact_count: project.artifact_count,
    risk_flags: project.risk_flags,
    updated_at: project.updated_at,
  };
}

/**
 * Aggregation strategies for combining artifacts from multiple runs
 */
export type AggregationStrategy = 'latest' | 'best_score' | 'merge';

/**
 * Phase-specific aggregation configuration
 */
export const PHASE_AGGREGATION_STRATEGIES: Partial<Record<PhaseName, AggregationStrategy>> = {
  'synthesis': 'latest',
  'kill-test': 'latest',
  'opportunity': 'best_score',
  'customer-intel': 'best_score',
  'market-research': 'best_score',
  'competitive-intel': 'best_score',
  'revenue-expansion': 'best_score',
  'strategy': 'best_score',
  'business-model': 'best_score',
  'product-design': 'best_score',
  'gtm-marketing': 'best_score',
  'content-engine': 'best_score',
  'tech-arch': 'best_score',
  'analytics': 'best_score',
  'launch-execution': 'latest',
  'task-reconciliation': 'latest',
};
