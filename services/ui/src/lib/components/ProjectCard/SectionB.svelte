<script lang="ts">
	import type { SectionB } from '@cloudflare/shared';

	export let data: SectionB | undefined;
</script>

<div class="section-b">
	{#if !data}
		<div class="empty-state">
			<div class="empty-icon">⭐</div>
			<h3>No North Star Data</h3>
			<p>Section B will be populated during synthesis phase.</p>
		</div>
	{:else}
		<section class="subsection">
			<h2>North Star Metric</h2>
			<div class="card">
				<div class="north-star-display">
					<div class="metric-value">{data.success_metrics?.north_star || 'Not defined'}</div>
					<div class="metric-label">Primary Success Metric</div>
				</div>
			</div>
		</section>

		<section class="subsection">
			<h2>Business Statement</h2>
			<div class="card">
				<p class="statement">{data.business_statement}</p>
			</div>
		</section>

		<section class="subsection">
			<h2>Differentiation</h2>
			<div class="card">
				<p>{data.differentiation}</p>
			</div>
		</section>
	{:else}
		<div class="placeholder">
			<p>North Star section data structure not yet implemented.</p>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	{/if}
</div>

<style>
	.section-b {
		max-width: 1000px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		color: #111827;
	}

	.subsection {
		margin-bottom: 2rem;
	}

	.subsection h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #667eea;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.north-star-display {
		text-align: center;
		padding: 2rem;
	}

	.metric-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #667eea;
		margin-bottom: 0.5rem;
	}

	.metric-label {
		font-size: 1rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.statement {
		font-size: 1.125rem;
		line-height: 1.6;
		color: #374151;
		margin: 0;
	}

	.placeholder {
		background: #fef3c7;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #f59e0b;
	}

	.placeholder p {
		margin: 0 0 1rem 0;
		color: #92400e;
		font-weight: 500;
	}

	.placeholder pre {
		background: white;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
	}
</style>
