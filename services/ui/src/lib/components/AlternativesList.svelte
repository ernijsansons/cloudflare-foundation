<script lang="ts">
	import Badge from './Badge.svelte';
	import type { AlternativeTemplate } from '$lib/types';

	interface Props {
		alternatives: AlternativeTemplate[];
	}

	let { alternatives }: Props = $props();

	function getScoreBadgeVariant(score: number): 'success' | 'warning' | 'default' {
		if (score >= 80) return 'success';
		if (score >= 60) return 'warning';
		return 'default';
	}
</script>

<div class="alternatives-list">
	{#if alternatives.length === 0}
		<div class="empty-state">No alternative templates available</div>
	{:else}
		{#each alternatives as alternative, index}
			<div class="alternative-item">
				<div class="rank-badge">#{index + 2}</div>
				<div class="alternative-content">
					<div class="alternative-header">
						<div class="alternative-name">
							<strong>{alternative.template.name}</strong>
							{#if alternative.label}
								<span class="label-text">({alternative.label})</span>
							{/if}
						</div>
						<Badge variant={getScoreBadgeVariant(alternative.match_score)}>
							{alternative.match_score}% match
						</Badge>
					</div>
					<p class="why-consider">{alternative.why_consider}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.alternatives-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.alternative-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: all var(--transition-fast);
	}

	.alternative-item:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 2%, var(--color-bg));
	}

	.rank-badge {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.alternative-content {
		flex: 1;
		min-width: 0;
	}

	.alternative-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.alternative-name {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.alternative-name strong {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.label-text {
		font-size: 0.813rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.why-consider {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.alternative-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
