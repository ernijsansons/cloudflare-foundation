/**
 * Status Utilities
 *
 * Maps status strings to colors, variants, and icons for consistent status display.
 */

import { colors } from './tokens';

// =============================================================================
// STATUS TYPES
// =============================================================================

export type RunStatus =
	| 'pending'
	| 'running'
	| 'completed'
	| 'failed'
	| 'killed'
	| 'paused'
	| 'queued'
	| 'cancelled';

export type PhaseStatus =
	| 'pending'
	| 'running'
	| 'completed'
	| 'failed'
	| 'skipped'
	| 'paused';

export type IdeaStatus =
	| 'draft'
	| 'ready'
	| 'in_progress'
	| 'completed'
	| 'archived';

export type KillTestDecision = 'CONTINUE' | 'PIVOT' | 'KILL';

export type StatusVariant =
	| 'default'
	| 'success'
	| 'warning'
	| 'error'
	| 'info'
	| 'neutral';

// =============================================================================
// STATUS COLOR MAPPINGS
// =============================================================================

const runStatusColors: Record<RunStatus, string> = {
	pending: colors.status.pending,
	running: colors.status.running,
	completed: colors.status.completed,
	failed: colors.status.failed,
	killed: colors.status.killed,
	paused: colors.status.paused,
	queued: colors.status.queued,
	cancelled: colors.status.cancelled
};

const phaseStatusColors: Record<PhaseStatus, string> = {
	pending: colors.status.pending,
	running: colors.status.running,
	completed: colors.status.completed,
	failed: colors.status.failed,
	skipped: colors.status.skipped,
	paused: colors.status.paused
};

const ideaStatusColors: Record<IdeaStatus, string> = {
	draft: 'hsl(220, 15%, 55%)',
	ready: colors.status.pending,
	in_progress: colors.status.running,
	completed: colors.status.completed,
	archived: 'hsl(220, 10%, 45%)'
};

const killTestColors: Record<KillTestDecision, string> = {
	CONTINUE: colors.status.completed,
	PIVOT: colors.status.pending,
	KILL: colors.status.failed
};

// =============================================================================
// STATUS VARIANT MAPPINGS
// =============================================================================

const statusVariants: Record<string, StatusVariant> = {
	// Success states
	completed: 'success',
	success: 'success',
	passed: 'success',
	active: 'success',
	CONTINUE: 'success',

	// Warning states
	pending: 'warning',
	queued: 'warning',
	waiting: 'warning',
	draft: 'warning',
	ready: 'warning',
	PIVOT: 'warning',

	// Error states
	failed: 'error',
	error: 'error',
	killed: 'error',
	cancelled: 'error',
	KILL: 'error',

	// Info states
	running: 'info',
	in_progress: 'info',
	processing: 'info',

	// Neutral states
	paused: 'neutral',
	skipped: 'neutral',
	archived: 'neutral',
	unknown: 'neutral'
};

// =============================================================================
// STATUS ICONS
// =============================================================================

const statusIcons: Record<string, string> = {
	// Run/Phase statuses
	pending: '○',
	running: '◐',
	completed: '●',
	failed: '✕',
	killed: '⊗',
	paused: '⏸',
	queued: '◎',
	cancelled: '⊘',
	skipped: '⊖',

	// Idea statuses
	draft: '✎',
	ready: '◉',
	in_progress: '◐',
	archived: '▣',

	// Kill test
	CONTINUE: '→',
	PIVOT: '↻',
	KILL: '✕',

	// Generic
	success: '✓',
	error: '✕',
	warning: '⚠',
	info: 'ℹ',
	unknown: '?'
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the color for a run status
 */
export function getRunStatusColor(status: RunStatus): string {
	return runStatusColors[status] ?? colors.status.pending;
}

/**
 * Get the color for a phase status
 */
export function getPhaseStatusColor(status: PhaseStatus): string {
	return phaseStatusColors[status] ?? colors.status.pending;
}

/**
 * Get the color for an idea status
 */
export function getIdeaStatusColor(status: IdeaStatus): string {
	return ideaStatusColors[status] ?? 'hsl(220, 15%, 55%)';
}

/**
 * Get the color for a kill test decision
 */
export function getKillTestColor(decision: KillTestDecision): string {
	return killTestColors[decision] ?? colors.status.pending;
}

/**
 * Get color for any status string (generic fallback)
 */
export function getStatusColor(status: string): string {
	const normalized = status.toLowerCase().replace(/[_-]/g, '');

	// Check run statuses
	if (normalized in runStatusColors) {
		return runStatusColors[normalized as RunStatus];
	}

	// Check phase statuses
	if (normalized in phaseStatusColors) {
		return phaseStatusColors[normalized as PhaseStatus];
	}

	// Check idea statuses
	const ideaKey = status.toLowerCase().replace('-', '_') as IdeaStatus;
	if (ideaKey in ideaStatusColors) {
		return ideaStatusColors[ideaKey];
	}

	// Check kill test
	const upperStatus = status.toUpperCase() as KillTestDecision;
	if (upperStatus in killTestColors) {
		return killTestColors[upperStatus];
	}

	// Default fallback
	return colors.status.pending;
}

/**
 * Get the semantic variant for a status
 */
export function getStatusVariant(status: string): StatusVariant {
	const normalized = status.toLowerCase().replace(/[_-]/g, '');

	// Check direct mapping
	if (normalized in statusVariants) {
		return statusVariants[normalized];
	}

	// Check uppercase (for CONTINUE/PIVOT/KILL)
	const upper = status.toUpperCase();
	if (upper in statusVariants) {
		return statusVariants[upper];
	}

	return 'default';
}

/**
 * Get the icon for a status
 */
export function getStatusIcon(status: string): string {
	// Check exact match first (case-sensitive for kill test)
	if (status in statusIcons) {
		return statusIcons[status];
	}

	// Check lowercase
	const lower = status.toLowerCase().replace(/[_-]/g, '_');
	if (lower in statusIcons) {
		return statusIcons[lower];
	}

	return statusIcons.unknown;
}

/**
 * Get CSS class name for a status variant
 */
export function getStatusClassName(status: string): string {
	const variant = getStatusVariant(status);
	return `status-${variant}`;
}

/**
 * Get display label for a status (human-readable)
 */
export function getStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		pending: 'Pending',
		running: 'Running',
		completed: 'Completed',
		failed: 'Failed',
		killed: 'Killed',
		paused: 'Paused',
		queued: 'Queued',
		cancelled: 'Cancelled',
		skipped: 'Skipped',
		draft: 'Draft',
		ready: 'Ready',
		in_progress: 'In Progress',
		archived: 'Archived',
		CONTINUE: 'Continue',
		PIVOT: 'Pivot',
		KILL: 'Kill'
	};

	return labels[status] ?? labels[status.toLowerCase()] ?? status;
}

// =============================================================================
// QUALITY SCORE UTILITIES
// =============================================================================

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/**
 * Get quality level from score (0-100)
 */
export function getQualityLevel(score: number): QualityLevel {
	if (score >= 80) return 'excellent';
	if (score >= 60) return 'good';
	if (score >= 40) return 'fair';
	if (score >= 20) return 'poor';
	return 'critical';
}

/**
 * Get color for quality score
 */
export function getQualityColor(score: number): string {
	const level = getQualityLevel(score);
	return colors.quality[level];
}

/**
 * Get CSS variable reference for quality score
 */
export function getQualityColorVar(score: number): string {
	const level = getQualityLevel(score);
	return `var(--color-quality-${level})`;
}

/**
 * Get label for quality level
 */
export function getQualityLabel(score: number): string {
	const level = getQualityLevel(score);
	const labels: Record<QualityLevel, string> = {
		excellent: 'Excellent',
		good: 'Good',
		fair: 'Fair',
		poor: 'Poor',
		critical: 'Critical'
	};
	return labels[level];
}

// =============================================================================
// COMBINED STATUS INFO
// =============================================================================

export interface StatusInfo {
	color: string;
	variant: StatusVariant;
	icon: string;
	label: string;
	className: string;
}

/**
 * Get all status information at once
 */
export function getStatusInfo(status: string): StatusInfo {
	return {
		color: getStatusColor(status),
		variant: getStatusVariant(status),
		icon: getStatusIcon(status),
		label: getStatusLabel(status),
		className: getStatusClassName(status)
	};
}

export interface QualityInfo {
	level: QualityLevel;
	color: string;
	label: string;
	score: number;
}

/**
 * Get all quality information at once
 */
export function getQualityInfo(score: number): QualityInfo {
	return {
		level: getQualityLevel(score),
		color: getQualityColor(score),
		label: getQualityLabel(score),
		score
	};
}
