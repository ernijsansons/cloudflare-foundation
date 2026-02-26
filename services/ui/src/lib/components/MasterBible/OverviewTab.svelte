<script lang="ts">
	import type { PlanningRun, PlanningArtifact } from '$lib/types';
	import { PLANNING_AGENT_PHASE_ORDER } from '$lib/shared';
	import Scorecard from './Scorecard.svelte';

	interface Props {
		projectName: string;
		ideaContent: string;
		status: string;
		currentPhase: string | null;
		qualityScore: number | null;
		revenuePotential: string | null;
		runs: PlanningRun[];
		artifacts: Record<string, PlanningArtifact>;
	}

	let {
		projectName: _projectName,
		ideaContent,
		status: _status,
		currentPhase,
		qualityScore,
		revenuePotential,
		runs,
		artifacts
	}: Props = $props();

	function formatPhase(phase: string | null | undefined): string {
		if (!phase) return 'Not started';
		return phase
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function formatRelativeTime(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
		return 'just now';
	}

	function getScoreClass(score: number): string {
		if (score >= 80) return 'high';
		if (score >= 60) return 'medium';
		return 'low';
	}

	// Helper to safely get record from unknown value
	function safeRecord(value: unknown): Record<string, unknown> | null {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return null;
	}

	// Extract key decisions from synthesis artifact if available
	const keyDecisions = $derived(() => {
		try {
			const synthesis = artifacts['synthesis'];
			if (synthesis?.content) {
				const content = safeRecord(synthesis.content);
				if (content && Array.isArray(content.key_decisions)) {
					return content.key_decisions.slice(0, 5);
				}
				if (content && Array.isArray(content.decisions)) {
					return content.decisions.slice(0, 5);
				}
			}
		} catch (error) {
			console.warn('Failed to extract key decisions:', error);
		}
		return [];
	});

	// Extract key risks from kill-test or synthesis
	const keyRisks = $derived(() => {
		try {
			const killTest = artifacts['kill-test'];
			const synthesis = artifacts['synthesis'];

			const risks: string[] = [];

			if (killTest?.content) {
				const content = safeRecord(killTest.content);
				if (content && Array.isArray(content.risks)) {
					risks.push(...content.risks.slice(0, 3));
				}
				if (content && Array.isArray(content.critical_risks)) {
					risks.push(...content.critical_risks.slice(0, 3));
				}
			}

			if (synthesis?.content && risks.length < 5) {
				const content = safeRecord(synthesis.content);
				if (content && Array.isArray(content.risks)) {
					risks.push(...content.risks.slice(0, 5 - risks.length));
				}
			}

			return risks.slice(0, 5);
		} catch (error) {
			console.warn('Failed to extract key risks:', error);
			return [];
		}
	});

	// Get recent activity from runs
	const recentActivity = $derived(
		runs.slice(0, 5).map((run) => ({
			id: run.id,
			action:
				run.status === 'completed'
					? `Run completed at ${formatPhase(run.current_phase)}`
					: run.status === 'killed'
						? 'Run killed at kill-test'
						: run.status === 'running'
							? `Run in progress at ${formatPhase(run.current_phase)}`
							: `Run ${run.status}`,
			timestamp: run.updated_at || run.created_at
		}))
	);

	// Calculate phase progress
	const phaseProgress = $derived(() => {
		const totalPhases = PLANNING_AGENT_PHASE_ORDER.length; // 18 phases
		const completedCount = Object.keys(artifacts).length;
		return Math.round((completedCount / totalPhases) * 100);
	});
</script>

<div class="overview-tab">
	<!-- Project Summary Card -->
	<div class="summary-card">
		<h2 class="summary-title">Project Summary</h2>
		<p class="summary-idea">{ideaContent}</p>
	</div>

	<!-- Metrics Grid -->
	<div class="metrics-grid">
		<div class="metric-card">
			<span class="metric-label">Quality Score</span>
			<span class="metric-value {qualityScore ? getScoreClass(qualityScore) : ''}">
				{qualityScore ?? '—'}
			</span>
			<span class="metric-unit">/100</span>
		</div>

		<div class="metric-card">
			<span class="metric-label">Revenue Potential</span>
			<span class="metric-value revenue">{revenuePotential ?? '—'}</span>
		</div>

		<div class="metric-card">
			<span class="metric-label">Current Phase</span>
			<span class="metric-value phase">{formatPhase(currentPhase)}</span>
		</div>

		<div class="metric-card">
			<span class="metric-label">Research Runs</span>
			<span class="metric-value">{runs.length}</span>
		</div>

		<div class="metric-card">
			<span class="metric-label">Phase Progress</span>
			<span class="metric-value">{phaseProgress()}%</span>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {phaseProgress()}%"></div>
			</div>
		</div>

		<div class="metric-card">
			<span class="metric-label">Artifacts</span>
			<span class="metric-value">{Object.keys(artifacts).length}</span>
			<span class="metric-unit">phases</span>
		</div>
	</div>

	<!-- Quality Scorecard -->
	<Scorecard {qualityScore} {artifacts} {revenuePotential} />

	<!-- Two Column Layout -->
	<div class="two-column">
		<!-- Key Decisions -->
		<div class="column-card">
			<h3 class="column-title">Key Decisions</h3>
			{#if keyDecisions().length > 0}
				<ul class="decision-list">
					{#each keyDecisions() as decision}
						<li class="decision-item">
							<span class="decision-icon">✓</span>
							<span>{typeof decision === 'string' ? decision : JSON.stringify(decision)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-message">
					No decisions documented yet. Complete the <strong>synthesis</strong> phase to populate this
					section.
				</p>
			{/if}
		</div>

		<!-- Top Risks -->
		<div class="column-card">
			<h3 class="column-title">Top Risks</h3>
			{#if keyRisks().length > 0}
				<ul class="risk-list">
					{#each keyRisks() as risk}
						<li class="risk-item">
							<span class="risk-icon">⚠️</span>
							<span>{typeof risk === 'string' ? risk : JSON.stringify(risk)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-message">
					No risks identified yet. The kill-test phase will analyze risks.
				</p>
			{/if}
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="activity-section">
		<h3 class="section-title">Recent Activity</h3>
		{#if recentActivity.length > 0}
			<div class="activity-list">
				{#each recentActivity as activity}
					<div class="activity-item">
						<span class="activity-dot"></span>
						<span class="activity-text">{activity.action}</span>
						<span class="activity-time">{formatRelativeTime(activity.timestamp)}</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-message">No activity yet. Start a research run to begin.</p>
		{/if}
	</div>
</div>

<style>
	.overview-tab {
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.summary-card {
		background: linear-gradient(135deg, var(--color-primary, #6366f1) 0%, #8b5cf6 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
	}

	.summary-title {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		opacity: 0.9;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-idea {
		margin: 0;
		font-size: 1.25rem;
		line-height: 1.5;
		font-weight: 500;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
	}

	.metric-card {
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text, #111827);
	}

	.metric-value.high {
		color: var(--color-success, #10b981);
	}

	.metric-value.medium {
		color: var(--color-warning, #f59e0b);
	}

	.metric-value.low {
		color: var(--color-error, #ef4444);
	}

	.metric-value.revenue {
		color: var(--color-success, #10b981);
		font-size: 1.25rem;
	}

	.metric-value.phase {
		font-size: 1rem;
		color: var(--color-primary, #6366f1);
	}

	.metric-unit {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.progress-bar {
		height: 6px;
		background: var(--color-border, #e5e7eb);
		border-radius: 3px;
		overflow: hidden;
		margin-top: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary, #6366f1);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.two-column {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.column-card {
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		padding: 1.25rem;
	}

	.column-title {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.decision-list,
	.risk-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.decision-item,
	.risk-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text, #111827);
	}

	.decision-icon {
		color: var(--color-success, #10b981);
		flex-shrink: 0;
	}

	.risk-icon {
		flex-shrink: 0;
	}

	.empty-message {
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		margin: 0;
		font-style: italic;
	}

	.activity-section {
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		padding: 1.25rem;
	}

	.section-title {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.activity-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
	}

	.activity-dot {
		width: 8px;
		height: 8px;
		background: var(--color-primary, #6366f1);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.activity-text {
		flex: 1;
		color: var(--color-text, #111827);
	}

	.activity-time {
		color: var(--color-text-muted, #6b7280);
		font-size: 0.75rem;
	}

	@media (max-width: 768px) {
		.two-column {
			grid-template-columns: 1fr;
		}

		.metrics-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
