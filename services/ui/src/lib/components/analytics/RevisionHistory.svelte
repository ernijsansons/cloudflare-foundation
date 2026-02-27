<script lang="ts">
	interface Version {
		version: number;
		created_at: number;
		quality_score: number | null;
		reviewer_feedback: string | null;
	}

	interface Props {
		versions: Version[];
		phase?: string;
		latestVersion?: number;
	}

	let { versions, phase, latestVersion }: Props = $props();

	let expandedVersion = $state<number | null>(null);

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'var(--color-success, #10b981)';
		if (score >= 60) return 'var(--color-warning, #f59e0b)';
		return 'var(--color-error, #ef4444)';
	}

	function getScoreChange(currentIndex: number): { value: number; direction: 'up' | 'down' | 'same' } | null {
		if (currentIndex === 0) return null;
		const current = versions[currentIndex]?.quality_score;
		const previous = versions[currentIndex - 1]?.quality_score;
		if (current === null || previous === null) return null;
		const diff = current - previous;
		return {
			value: Math.abs(diff),
			direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
		};
	}

	function toggleVersion(version: number) {
		expandedVersion = expandedVersion === version ? null : version;
	}

	// Calculate score progression for chart
	const scoreData = $derived(() => {
		return versions
			.filter((v) => v.quality_score !== null)
			.map((v) => ({
				version: v.version,
				score: v.quality_score as number
			}));
	});

	const maxScore = $derived(() => Math.max(...scoreData().map((d) => d.score), 100));
	const minScore = $derived(() => Math.min(...scoreData().map((d) => d.score), 0));
</script>

<div class="revision-history">
	<div class="history-header">
		<h3 class="history-title">Revision History</h3>
		{#if phase}
			<span class="phase-badge">{phase}</span>
		{/if}
		<span class="version-count">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
	</div>

	<!-- Score Progression Chart -->
	{#if scoreData().length > 1}
		<div class="score-chart">
			<svg viewBox="0 0 300 80" class="chart-svg">
				<!-- Background grid -->
				<line x1="30" y1="10" x2="30" y2="60" stroke="var(--color-border)" stroke-width="1" />
				<line x1="30" y1="60" x2="290" y2="60" stroke="var(--color-border)" stroke-width="1" />

				<!-- Score line -->
				<polyline
					fill="none"
					stroke="var(--color-primary, #6366f1)"
					stroke-width="2"
					points={scoreData()
						.map((d, i) => {
							const x = 30 + (i / (scoreData().length - 1)) * 260;
							const y = 60 - ((d.score - minScore()) / (maxScore() - minScore())) * 50;
							return `${x},${y}`;
						})
						.join(' ')}
				/>

				<!-- Data points -->
				{#each scoreData() as d, i}
					{@const x = 30 + (i / (scoreData().length - 1)) * 260}
					{@const y = 60 - ((d.score - minScore()) / (maxScore() - minScore())) * 50}
					<circle cx={x} cy={y} r="4" fill="var(--color-primary, #6366f1)" />
					<text x={x} y={y - 8} text-anchor="middle" class="chart-label">{d.score}</text>
				{/each}

				<!-- Y-axis labels -->
				<text x="25" y="15" text-anchor="end" class="axis-label">{maxScore()}</text>
				<text x="25" y="62" text-anchor="end" class="axis-label">{minScore()}</text>
			</svg>
		</div>
	{/if}

	<!-- Timeline -->
	<div class="timeline">
		{#each versions as v, i}
			{@const change = getScoreChange(i)}
			<button
				class="timeline-item"
				class:latest={v.version === latestVersion}
				class:expanded={expandedVersion === v.version}
				onclick={() => toggleVersion(v.version)}
				type="button"
			>
				<div class="timeline-marker">
					<span class="marker-dot" class:latest={v.version === latestVersion}></span>
					{#if i < versions.length - 1}
						<span class="marker-line"></span>
					{/if}
				</div>

				<div class="timeline-content">
					<div class="version-header">
						<span class="version-number">
							v{v.version}
							{#if v.version === latestVersion}
								<span class="latest-badge">Latest</span>
							{/if}
						</span>
						<span class="version-date">{formatDate(v.created_at)}</span>
					</div>

					{#if v.quality_score !== null}
						<div class="version-score">
							<span class="score-value" style="color: {getScoreColor(v.quality_score)}">
								{v.quality_score}
							</span>
							{#if change}
								<span class="score-change change-{change.direction}">
									{#if change.direction === 'up'}
										+{change.value}
									{:else if change.direction === 'down'}
										-{change.value}
									{:else}
										±0
									{/if}
								</span>
							{/if}
						</div>
					{/if}

					{#if expandedVersion === v.version && v.reviewer_feedback}
						<div class="version-feedback">
							<span class="feedback-label">Reviewer Feedback:</span>
							<p class="feedback-text">{v.reviewer_feedback}</p>
						</div>
					{/if}
				</div>
			</button>
		{/each}

		{#if versions.length === 0}
			<div class="empty-state">
				<span class="empty-icon">📋</span>
				<p>No revision history available</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.revision-history {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
	}

	.history-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.history-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.phase-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.version-count {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.score-chart {
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		padding: 0.5rem;
	}

	.chart-svg {
		width: 100%;
		height: auto;
	}

	.chart-label {
		font-size: 10px;
		fill: var(--color-text, #111827);
	}

	.axis-label {
		font-size: 9px;
		fill: var(--color-text-muted, #6b7280);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.timeline-item {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		border-radius: 6px;
		transition: background-color 0.15s ease;
	}

	.timeline-item:hover {
		background: var(--color-bg, white);
	}

	.timeline-item.expanded {
		background: var(--color-bg, white);
	}

	.timeline-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 20px;
		flex-shrink: 0;
	}

	.marker-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-border, #e5e7eb);
		border: 2px solid var(--color-bg-secondary, #f9fafb);
	}

	.marker-dot.latest {
		background: var(--color-primary, #6366f1);
	}

	.marker-line {
		flex: 1;
		width: 2px;
		background: var(--color-border, #e5e7eb);
		margin-top: 4px;
	}

	.timeline-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.version-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.version-number {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.latest-badge {
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border-radius: 3px;
	}

	.version-date {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
	}

	.version-score {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.score-value {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.score-change {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.0625rem 0.375rem;
		border-radius: 3px;
	}

	.change-up {
		background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
		color: var(--color-success, #10b981);
	}

	.change-down {
		background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
		color: var(--color-error, #ef4444);
	}

	.change-same {
		background: var(--color-bg-tertiary, #f3f4f6);
		color: var(--color-text-muted, #6b7280);
	}

	.version-feedback {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--color-bg-tertiary, #f3f4f6);
		border-radius: 6px;
	}

	.feedback-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
		margin-bottom: 0.25rem;
	}

	.feedback-text {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text, #111827);
		line-height: 1.5;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	@media (prefers-color-scheme: dark) {
		.timeline-item:hover,
		.timeline-item.expanded,
		.score-chart {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.version-feedback {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
