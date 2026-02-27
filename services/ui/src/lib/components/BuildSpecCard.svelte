<script lang="ts">
	import Badge from './Badge.svelte';
	import BindingsList from './BindingsList.svelte';
	import type { BuildSpec } from '$lib/types';

	interface Props {
		buildSpec: BuildSpec;
	}

	let { buildSpec }: Props = $props();

	let recommended = $derived(buildSpec.recommended);
	let template = $derived(recommended?.template);
	let matchScore = $derived(() => {
		const complexity = recommended?.complexity || 0;
		return complexity > 0 ? Math.round((complexity / 5) * 100) : 0;
	});

	function getComplexityLabel(complexity: number): string {
		if (complexity <= 1) return 'Very Low';
		if (complexity <= 2) return 'Low';
		if (complexity <= 3) return 'Medium';
		if (complexity <= 4) return 'High';
		return 'Very High';
	}

	function getComplexityVariant(complexity: number): 'success' | 'warning' | 'error' | 'default' {
		if (complexity <= 2) return 'success';
		if (complexity <= 3) return 'warning';
		return 'error';
	}

	// Combine all bindings into one array
	let allBindings = $derived(() => {
		const bindings = recommended?.bindings;
		if (!bindings) return [];

		const combined = [
			...(bindings.required || []),
			...(bindings.recommended || []),
			...(bindings.optional || [])
		];

		return combined;
	});
</script>

<div class="build-spec-card">
	<div class="card-header">
		<div class="template-info">
			<h2 class="template-name">{template?.name || 'Unknown Template'}</h2>
			<div class="template-meta">
				<Badge variant="primary">{template?.source || 'unknown'}</Badge>
				{#if recommended?.complexity}
					<Badge variant={getComplexityVariant(recommended.complexity)}>
						{getComplexityLabel(recommended.complexity)}
					</Badge>
				{/if}
			</div>
		</div>
		<div class="match-score">
			<div class="score-label">Match Score</div>
			<div class="score-value">{matchScore()}%</div>
		</div>
	</div>

	{#if template?.rationale}
		<div class="rationale-section">
			<h3>Why This Template</h3>
			<p>{template.rationale}</p>
		</div>
	{/if}

	<div class="details-grid">
		<div class="detail-section">
			<h3>Framework</h3>
			<p class="detail-value">{template?.framework || 'Not specified'}</p>
		</div>

		<div class="detail-section">
			<h3>Complexity</h3>
			<p class="detail-value">
				{#if recommended?.complexity}
					{getComplexityLabel(recommended.complexity)} ({recommended.complexity}/5)
				{:else}
					Not specified
				{/if}
			</p>
		</div>

		<div class="detail-section">
			<h3>Time to Ship</h3>
			<p class="detail-value">{recommended?.time_to_ship || 'Not specified'}</p>
		</div>

		<div class="detail-section">
			<h3>Estimated Cost</h3>
			{#if recommended?.estimated_monthly_cost}
				<p class="detail-value">
					${recommended.estimated_monthly_cost.low}-${recommended.estimated_monthly_cost.high}/mo
				</p>
			{:else}
				<p class="detail-value">Not specified</p>
			{/if}
		</div>
	</div>

	{#if allBindings().length > 0}
		<div class="bindings-section">
			<h3>Required Bindings</h3>
			<BindingsList bindings={allBindings()} />
		</div>
	{/if}

	{#if recommended?.free_wins && recommended.free_wins.length > 0}
		<div class="free-wins-section">
			<h3>Free Wins</h3>
			<ul class="free-wins-list">
				{#each recommended.free_wins as win}
					<li class="free-win-item">{win}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if template?.c3Command}
		<div class="action-section">
			<h3>Get Started</h3>
			<div class="command-block">
				<code>{template.c3Command}</code>
				<button
					class="copy-button"
					onclick={() => navigator.clipboard.writeText(template?.c3Command || '')}
					title="Copy command"
				>
					📋
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.build-spec-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-bg);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.template-info {
		flex: 1;
	}

	.template-name {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.75rem 0;
	}

	.template-meta {
		display: flex;
		gap: 0.5rem;
	}

	.match-score {
		flex-shrink: 0;
		text-align: right;
	}

	.score-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		margin-bottom: 0.25rem;
	}

	.score-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.rationale-section {
		padding: 1rem;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-md);
	}

	.rationale-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
	}

	.rationale-section p {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.detail-section h3 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
	}

	.detail-value {
		font-size: 0.875rem;
		color: var(--color-text);
		margin: 0;
		font-weight: 500;
	}

	.bindings-section h3,
	.free-wins-section h3,
	.action-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 1rem 0;
	}

	.free-wins-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.free-win-item {
		padding: 0.75rem;
		background: color-mix(in srgb, var(--color-success) 5%, var(--color-bg));
		border-left: 3px solid var(--color-success);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
	}

	.command-block {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.813rem;
	}

	.command-block code {
		flex: 1;
		color: var(--color-text);
		word-break: break-all;
	}

	.copy-button {
		flex-shrink: 0;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		opacity: 0.6;
		transition: opacity var(--transition-fast);
	}

	.copy-button:hover {
		opacity: 1;
	}

	@media (max-width: 768px) {
		.card-header {
			flex-direction: column;
		}

		.match-score {
			text-align: left;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
