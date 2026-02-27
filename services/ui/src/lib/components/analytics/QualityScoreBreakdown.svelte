<script lang="ts">
	interface QualityDimension {
		name: string;
		score: number;
		feedback?: string;
	}

	interface Props {
		overallScore: number | null;
		dimensions: QualityDimension[];
		reviewVerdict?: string | null;
		showRadar?: boolean;
	}

	let { overallScore, dimensions, reviewVerdict, showRadar = true }: Props = $props();

	function getScoreColor(score: number): string {
		if (score >= 80) return 'var(--color-quality-excellent, #10b981)';
		if (score >= 70) return 'var(--color-quality-good, #84cc16)';
		if (score >= 60) return 'var(--color-quality-fair, #f59e0b)';
		if (score >= 40) return 'var(--color-quality-poor, #f97316)';
		return 'var(--color-quality-critical, #ef4444)';
	}

	function getScoreLabel(score: number): string {
		if (score >= 80) return 'Excellent';
		if (score >= 70) return 'Good';
		if (score >= 60) return 'Fair';
		if (score >= 40) return 'Poor';
		return 'Critical';
	}

	// Radar chart calculations
	const radarSize = 200;
	const radarCenter = radarSize / 2;
	const radarRadius = 70;

	function polarToCartesian(
		cx: number,
		cy: number,
		r: number,
		angleInDegrees: number
	): { x: number; y: number } {
		const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
		return {
			x: cx + r * Math.cos(angleInRadians),
			y: cy + r * Math.sin(angleInRadians)
		};
	}

	const radarPoints = $derived(() => {
		if (dimensions.length === 0) return '';
		const angleStep = 360 / dimensions.length;
		return dimensions
			.map((dim, i) => {
				const r = (dim.score / 100) * radarRadius;
				const { x, y } = polarToCartesian(radarCenter, radarCenter, r, i * angleStep);
				return `${x},${y}`;
			})
			.join(' ');
	});

	const radarLabels = $derived(() => {
		if (dimensions.length === 0) return [];
		const angleStep = 360 / dimensions.length;
		return dimensions.map((dim, i) => {
			const { x, y } = polarToCartesian(radarCenter, radarCenter, radarRadius + 20, i * angleStep);
			return { label: dim.name, x, y, score: dim.score };
		});
	});

	let expandedDimension = $state<string | null>(null);

	function toggleDimension(name: string) {
		expandedDimension = expandedDimension === name ? null : name;
	}
</script>

<div class="quality-breakdown">
	<!-- Overall Score -->
	<div class="overall-section">
		<div class="overall-score" style="--score-color: {getScoreColor(overallScore ?? 0)}">
			<span class="score-value">{overallScore ?? '—'}</span>
			<span class="score-max">/100</span>
		</div>
		<div class="score-meta">
			<span class="score-label" style="color: {getScoreColor(overallScore ?? 0)}">
				{overallScore ? getScoreLabel(overallScore) : 'Not scored'}
			</span>
			{#if reviewVerdict}
				<span class="review-verdict verdict-{reviewVerdict.toLowerCase()}">{reviewVerdict}</span>
			{/if}
		</div>
	</div>

	<!-- Radar Chart -->
	{#if showRadar && dimensions.length >= 3}
		<div class="radar-section">
			<svg width={radarSize} height={radarSize} class="radar-chart">
				<!-- Background rings -->
				{#each [0.25, 0.5, 0.75, 1] as ring}
					<circle
						cx={radarCenter}
						cy={radarCenter}
						r={radarRadius * ring}
						fill="none"
						stroke="var(--color-border, #e5e7eb)"
						stroke-width="1"
						opacity="0.5"
					/>
				{/each}

				<!-- Axis lines -->
				{#each dimensions as _, i}
					{@const angleStep = 360 / dimensions.length}
					{@const endpoint = polarToCartesian(radarCenter, radarCenter, radarRadius, i * angleStep)}
					<line
						x1={radarCenter}
						y1={radarCenter}
						x2={endpoint.x}
						y2={endpoint.y}
						stroke="var(--color-border, #e5e7eb)"
						stroke-width="1"
						opacity="0.5"
					/>
				{/each}

				<!-- Data polygon -->
				<polygon
					points={radarPoints()}
					fill="var(--color-primary, #6366f1)"
					fill-opacity="0.2"
					stroke="var(--color-primary, #6366f1)"
					stroke-width="2"
				/>

				<!-- Data points -->
				{#each dimensions as dim, i}
					{@const angleStep = 360 / dimensions.length}
					{@const r = (dim.score / 100) * radarRadius}
					{@const point = polarToCartesian(radarCenter, radarCenter, r, i * angleStep)}
					<circle cx={point.x} cy={point.y} r="4" fill="var(--color-primary, #6366f1)" />
				{/each}

				<!-- Labels -->
				{#each radarLabels() as label}
					<text
						x={label.x}
						y={label.y}
						text-anchor="middle"
						dominant-baseline="middle"
						class="radar-label"
					>
						{label.label.slice(0, 8)}
					</text>
				{/each}
			</svg>
		</div>
	{/if}

	<!-- Dimension List -->
	<div class="dimensions-list">
		<h4 class="dimensions-title">Quality Dimensions</h4>
		{#each dimensions as dim}
			<button
				class="dimension-item"
				class:expanded={expandedDimension === dim.name}
				onclick={() => toggleDimension(dim.name)}
				type="button"
			>
				<div class="dimension-header">
					<span class="dimension-name">{dim.name}</span>
					<div class="dimension-score-bar">
						<div
							class="dimension-fill"
							style="width: {dim.score}%; background: {getScoreColor(dim.score)}"
						></div>
					</div>
					<span class="dimension-score" style="color: {getScoreColor(dim.score)}">
						{dim.score}
					</span>
				</div>
				{#if expandedDimension === dim.name && dim.feedback}
					<div class="dimension-feedback">
						<p>{dim.feedback}</p>
					</div>
				{/if}
			</button>
		{/each}
		{#if dimensions.length === 0}
			<p class="empty-dimensions">No dimension scores available</p>
		{/if}
	</div>
</div>

<style>
	.quality-breakdown {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
	}

	.overall-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.overall-score {
		display: flex;
		align-items: baseline;
		padding: 0.75rem 1rem;
		background: var(--color-bg, white);
		border-radius: 8px;
		border: 2px solid var(--score-color);
	}

	.score-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--score-color);
		line-height: 1;
	}

	.score-max {
		font-size: 1rem;
		color: var(--color-text-muted, #6b7280);
		margin-left: 2px;
	}

	.score-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.score-label {
		font-size: 1rem;
		font-weight: 600;
	}

	.review-verdict {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		width: fit-content;
	}

	.verdict-pass,
	.verdict-approved {
		background: var(--color-success, #10b981);
		color: white;
	}

	.verdict-fail,
	.verdict-rejected {
		background: var(--color-error, #ef4444);
		color: white;
	}

	.verdict-revise,
	.verdict-needs_work {
		background: var(--color-warning, #f59e0b);
		color: white;
	}

	.radar-section {
		display: flex;
		justify-content: center;
	}

	.radar-chart {
		overflow: visible;
	}

	.radar-label {
		font-size: 10px;
		fill: var(--color-text-muted, #6b7280);
		text-transform: capitalize;
	}

	.dimensions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.dimensions-title {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.dimension-item {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.dimension-item:hover {
		border-color: var(--color-primary, #6366f1);
	}

	.dimension-item.expanded {
		background: var(--color-bg-tertiary, #f3f4f6);
	}

	.dimension-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.dimension-name {
		min-width: 100px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		text-transform: capitalize;
	}

	.dimension-score-bar {
		flex: 1;
		height: 6px;
		background: var(--color-border, #e5e7eb);
		border-radius: 3px;
		overflow: hidden;
	}

	.dimension-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.dimension-score {
		min-width: 30px;
		font-size: 0.875rem;
		font-weight: 600;
		text-align: right;
	}

	.dimension-feedback {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.dimension-feedback p {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
		line-height: 1.5;
	}

	.empty-dimensions {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
		font-style: italic;
		text-align: center;
		padding: 1rem;
	}

	@media (prefers-color-scheme: dark) {
		.overall-score,
		.dimension-item {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.dimension-item.expanded {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
