<script lang="ts">
	import type { SectionB } from '$lib/shared';

	export let data: SectionB | undefined;

	// Helper to render object properties as a list or paragraph
	function renderObject(obj: unknown): string {
		if (obj === null || obj === undefined) return 'Not defined';
		if (typeof obj === 'string') return obj;
		if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
		if (Array.isArray(obj)) return obj.join(', ');
		if (typeof obj === 'object') {
			// Return first string value found, or stringify key-value pairs
			const entries = Object.entries(obj as Record<string, unknown>);
			const stringValues = entries
				.filter(([, v]) => typeof v === 'string')
				.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
			if (stringValues.length > 0) return stringValues.join('\n');
			return JSON.stringify(obj);
		}
		return String(obj);
	}
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
				{#if data.success_metrics?.target_value}
					<div class="target-value">Target: {data.success_metrics.target_value}</div>
				{/if}
			</div>
		</section>

		<section class="subsection">
			<h2>Business Statement</h2>
			<div class="card">
				{#if typeof data.business_statement === 'object' && data.business_statement !== null}
					{#if 'vision' in data.business_statement}
						<div class="statement-item">
							<strong>Vision:</strong>
							<p>{data.business_statement.vision}</p>
						</div>
					{/if}
					{#if 'mission' in data.business_statement}
						<div class="statement-item">
							<strong>Mission:</strong>
							<p>{data.business_statement.mission}</p>
						</div>
					{/if}
					{#if 'statement' in data.business_statement}
						<div class="statement-item">
							<strong>Statement:</strong>
							<p>{data.business_statement.statement}</p>
						</div>
					{/if}
					{#if 'values' in data.business_statement && Array.isArray(data.business_statement.values)}
						<div class="statement-item">
							<strong>Values:</strong>
							<div class="tags">
								{#each data.business_statement.values as value}
									<span class="tag">{value}</span>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<p class="statement">{renderObject(data.business_statement)}</p>
				{/if}
			</div>
		</section>

		<section class="subsection">
			<h2>Differentiation</h2>
			<div class="card">
				{#if typeof data.differentiation === 'object' && data.differentiation !== null}
					{#if 'unique_value_proposition' in data.differentiation}
						<div class="diff-item">
							<strong>Unique Value Proposition:</strong>
							<p>{data.differentiation.unique_value_proposition}</p>
						</div>
					{/if}
					{#if 'competitive_advantages' in data.differentiation && Array.isArray(data.differentiation.competitive_advantages)}
						<div class="diff-item">
							<strong>Competitive Advantages:</strong>
							<ul>
								{#each data.differentiation.competitive_advantages as advantage}
									<li>{advantage}</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if 'moat_strategy' in data.differentiation}
						<div class="diff-item">
							<strong>Moat Strategy:</strong>
							<p>{data.differentiation.moat_strategy}</p>
						</div>
					{/if}
				{:else}
					<p>{renderObject(data.differentiation)}</p>
				{/if}
			</div>
		</section>

		{#if data.monetization_model}
			<section class="subsection">
				<h2>Monetization Model</h2>
				<div class="card">
					{#if typeof data.monetization_model === 'object'}
						{#if 'primary_revenue' in data.monetization_model}
							<div class="mono-item">
								<strong>Primary Revenue:</strong>
								<p>{data.monetization_model.primary_revenue}</p>
							</div>
						{/if}
						{#if 'secondary_revenue' in data.monetization_model && Array.isArray(data.monetization_model.secondary_revenue)}
							<div class="mono-item">
								<strong>Secondary Revenue:</strong>
								<ul>
									{#each data.monetization_model.secondary_revenue as rev}
										<li>{rev}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if 'pricing_strategy' in data.monetization_model}
							<div class="mono-item">
								<strong>Pricing Strategy:</strong>
								<p>{data.monetization_model.pricing_strategy}</p>
							</div>
						{/if}
					{:else}
						<p>{renderObject(data.monetization_model)}</p>
					{/if}
				</div>
			</section>
		{/if}
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

	.target-value {
		text-align: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.statement-item,
	.diff-item,
	.mono-item {
		margin-bottom: 1.25rem;
	}

	.statement-item:last-child,
	.diff-item:last-child,
	.mono-item:last-child {
		margin-bottom: 0;
	}

	.statement-item strong,
	.diff-item strong,
	.mono-item strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #374151;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.statement-item p,
	.diff-item p,
	.mono-item p {
		margin: 0;
		color: #4b5563;
		line-height: 1.6;
	}

	.diff-item ul,
	.mono-item ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #4b5563;
	}

	.diff-item li,
	.mono-item li {
		margin-bottom: 0.5rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: #eff6ff;
		color: #1e40af;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
