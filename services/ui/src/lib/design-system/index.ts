/**
 * Design System Exports
 *
 * Central export for design tokens and status utilities.
 */

// Tokens
export {
	colors,
	spacing,
	gap,
	typography,
	borders,
	shadows,
	transitions,
	zIndex,
	breakpoints,
	type Color,
	type StatusColor,
	type QualityLevel as TokenQualityLevel,
	type Spacing,
	type Gap,
	type FontSize,
	type FontWeight,
	type BorderRadius,
	type Shadow,
	type ZIndex,
	type Breakpoint
} from './tokens';

// Status utilities
export {
	getRunStatusColor,
	getPhaseStatusColor,
	getIdeaStatusColor,
	getKillTestColor,
	getStatusColor,
	getStatusVariant,
	getStatusIcon,
	getStatusClassName,
	getStatusLabel,
	getStatusInfo,
	getQualityLevel,
	getQualityColor,
	getQualityColorVar,
	getQualityLabel,
	getQualityInfo,
	type RunStatus,
	type PhaseStatus,
	type IdeaStatus,
	type KillTestDecision,
	type StatusVariant,
	type QualityLevel,
	type StatusInfo,
	type QualityInfo
} from './status';
