import type { PlanningAgentPhaseName } from '$lib/shared';

// Re-export project types
export * from './project';

// Re-export factory types
export * from './factory';

// Run status from planning_runs table
export type RunStatus =
	| 'active'
	| 'running'
	| 'pending'
	| 'paused'
	| 'completed'
	| 'killed'
	| 'cancelled';

// Phase names from registry
export type PhaseName = PlanningAgentPhaseName;

// Run mode (local = CLI/Claude Code, cloud = Cloudflare Workers AI)
export type RunMode = 'local' | 'cloud';

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

// Naomi execution task from API
export interface NaomiTask {
	id: string;
	run_id: string;
	repo_url: string;
	agent: string;
	status: 'pending' | 'running' | 'review' | 'completed' | 'failed';
	phase?: string;
	vm_id?: string;
	claimed_at?: number;
	started_at?: number;
	completed_at?: number;
	retry_count?: number;
	error?: string;
	created_at: number;
	updated_at?: number;
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
		id: 'discovery',
		title: 'Discovery',
		phases: ['opportunity', 'customer-intel', 'market-research', 'competitive-intel']
	},
	{
		id: 'validation',
		title: 'Validation',
		phases: ['kill-test']
	},
	{
		id: 'strategy',
		title: 'Strategy',
		phases: ['revenue-expansion', 'strategy', 'business-model']
	},
	{
		id: 'design',
		title: 'Design',
		phases: ['product-design', 'gtm-marketing', 'content-engine']
	},
	{
		id: 'execution',
		title: 'Execution',
		phases: ['tech-arch', 'analytics', 'launch-execution', 'synthesis', 'task-reconciliation']
	}
];

// =============================================================================
// SEARCH TYPES
// =============================================================================

/** Result types for global search */
export type SearchResultType = 'run' | 'idea' | 'artifact' | 'phase' | 'task';

/** A single search result */
export interface SearchResult {
	type: SearchResultType;
	id: string;
	title: string;
	subtitle?: string;
	href: string;
	status?: string;
	phase?: PhaseName;
	score?: number;
	matchedField?: string;
	highlight?: string;
}

/** Search response from API */
export interface SearchResponse {
	results: SearchResult[];
	total: number;
	query: string;
	took_ms?: number;
}

// =============================================================================
// FILTER TYPES
// =============================================================================

/** Sort options for run listings */
export type SortField = 'created_at' | 'updated_at' | 'quality_score' | 'name';
export type SortDirection = 'asc' | 'desc';

/** Filter state for portfolio/listing pages */
export interface FilterState {
	status: RunStatus[];
	mode: RunMode[];
	qualityRange: [number, number];
	dateRange: [number | null, number | null];
	sortBy: SortField;
	sortDir: SortDirection;
	search: string;
}

/** Saved filter view */
export interface SavedView {
	id: string;
	name: string;
	filters: FilterState;
	createdAt: number;
	isDefault?: boolean;
}

/** Default filter state */
export const DEFAULT_FILTERS: FilterState = {
	status: [],
	mode: [],
	qualityRange: [0, 100],
	dateRange: [null, null],
	sortBy: 'created_at',
	sortDir: 'desc',
	search: ''
};

// =============================================================================
// BULK ACTION TYPES
// =============================================================================

/** Available bulk actions */
export type BulkActionType = 'archive' | 'delete' | 'export' | 'tag' | 'kill';

/** Bulk action definition */
export interface BulkAction {
	type: BulkActionType;
	label: string;
	icon?: string;
	confirmMessage?: string;
	destructive?: boolean;
}

/** Available bulk actions for runs */
export const BULK_ACTIONS: BulkAction[] = [
	{
		type: 'archive',
		label: 'Archive',
		icon: '📦',
		confirmMessage: 'Archive selected runs?'
	},
	{
		type: 'export',
		label: 'Export',
		icon: '📤'
	},
	{
		type: 'tag',
		label: 'Add Tag',
		icon: '🏷️'
	},
	{
		type: 'kill',
		label: 'Kill',
		icon: '⊗',
		confirmMessage: 'Kill selected runs? This cannot be undone.',
		destructive: true
	},
	{
		type: 'delete',
		label: 'Delete',
		icon: '🗑️',
		confirmMessage: 'Permanently delete selected runs? This cannot be undone.',
		destructive: true
	}
];

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

/** Breadcrumb trail item */
export interface BreadcrumbItem {
	label: string;
	href: string;
	icon?: string;
}

// =============================================================================
// ACTIVITY TYPES
// =============================================================================

/** Activity event types */
export type ActivityType =
	| 'run_created'
	| 'run_completed'
	| 'run_killed'
	| 'run_viewed'
	| 'idea_created'
	| 'idea_viewed'
	| 'phase_completed'
	| 'artifact_viewed'
	| 'search_performed';

/** Activity feed item */
export interface ActivityItem {
	id: string;
	type: ActivityType;
	entityId: string;
	entityName: string;
	entityHref: string;
	metadata?: Record<string, unknown>;
	timestamp: number;
}

// =============================================================================
// PAGINATION TYPES
// =============================================================================

/** Pagination parameters */
export interface PaginationParams {
	page: number;
	limit: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}
