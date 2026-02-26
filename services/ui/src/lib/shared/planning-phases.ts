/**
 * Canonical planning phase ontology shared across planning-machine, gateway, and UI.
 *
 * Keep this as the single source of truth for:
 * - ordered phase execution
 * - phase name unions
 * - legacy/alias normalization
 */

export const PLANNING_AGENT_PHASE_ORDER = [
	'opportunity',
	'customer-intel',
	'market-research',
	'competitive-intel',
	'kill-test',
	'revenue-expansion',
	'strategy',
	'business-model',
	'product-design',
	'gtm-marketing',
	'content-engine',
	'tech-arch',
	'analytics',
	'launch-execution',
	'synthesis',
	'task-reconciliation',
	'diagram-generation',
	'validation'
] as const;

export type PlanningAgentPhaseName = (typeof PLANNING_AGENT_PHASE_ORDER)[number];

export const PLANNING_WORKFLOW_PHASE_ORDER = [
	'phase-0-intake',
	...PLANNING_AGENT_PHASE_ORDER
] as const;

export type PlanningWorkflowPhaseName = (typeof PLANNING_WORKFLOW_PHASE_ORDER)[number];

// Backwards-compatible alias used throughout existing code.
export type PhaseName = PlanningAgentPhaseName;

// ============================================================================
// POST-PIPELINE PHASES (Project Factory v3.0)
// These phases run AFTER the main 18-phase pipeline completes.
// ============================================================================

export const POST_PIPELINE_PHASES = ['architecture-advisor'] as const;

export type PostPipelinePhaseName = (typeof POST_PIPELINE_PHASES)[number];

const LEGACY_PHASE_ALIASES: Record<string, PlanningWorkflowPhaseName> = {
	intake: 'phase-0-intake',
	'phase-0-intake': 'phase-0-intake',
	'phase-1-opportunity': 'opportunity',
	'phase-2-customer-intel': 'customer-intel',
	'phase-3-market-research': 'market-research',
	'phase-4-competitive-intel': 'competitive-intel',
	'phase-5-kill-test': 'kill-test',
	'phase-6-revenue-expansion': 'revenue-expansion',
	'phase-7-strategy': 'strategy',
	'phase-8-business-model': 'business-model',
	'phase-9-product-design': 'product-design',
	'phase-10-gtm': 'gtm-marketing',
	'phase-11-content-engine': 'content-engine',
	'phase-12-tech-arch': 'tech-arch',
	'phase-13-analytics': 'analytics',
	'phase-14-launch': 'launch-execution',
	'phase-15-synthesis': 'synthesis',
	'phase-16-task-reconciliation': 'task-reconciliation',
	'phase-17-diagram-generation': 'diagram-generation',
	'phase-18-validation': 'validation',
	gtm: 'gtm-marketing',
	launch: 'launch-execution',
	diagrams: 'diagram-generation'
};

export function isPlanningAgentPhase(phase: string): phase is PlanningAgentPhaseName {
	return (PLANNING_AGENT_PHASE_ORDER as readonly string[]).includes(phase);
}

export function isPlanningWorkflowPhase(phase: string): phase is PlanningWorkflowPhaseName {
	return (PLANNING_WORKFLOW_PHASE_ORDER as readonly string[]).includes(phase);
}

/**
 * Normalize old or alternate phase names into canonical workflow phase names.
 */
export function normalizePlanningPhase(phase: string): PlanningWorkflowPhaseName | null {
	if (isPlanningWorkflowPhase(phase)) {
		return phase;
	}

	return LEGACY_PHASE_ALIASES[phase] ?? null;
}
