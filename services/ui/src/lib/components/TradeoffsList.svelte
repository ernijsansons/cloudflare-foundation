<script lang="ts">
	interface Props {
		tradeoffs: string[];
	}

	let { tradeoffs }: Props = $props();

	function parseTradeoff(tradeoff: string): { type: 'pro' | 'con'; text: string } {
		const trimmed = tradeoff.trim();
		if (trimmed.startsWith('✓')) {
			return { type: 'pro', text: trimmed.slice(1).trim() };
		} else if (trimmed.startsWith('⚠')) {
			return { type: 'con', text: trimmed.slice(1).trim() };
		}
		// Default to pro if no prefix
		return { type: 'pro', text: trimmed };
	}

	let parsedTradeoffs = $derived(tradeoffs.map(parseTradeoff));
</script>

<div class="tradeoffs-list">
	{#each parsedTradeoffs as tradeoff}
		<div class="tradeoff-item" class:pro={tradeoff.type === 'pro'} class:con={tradeoff.type === 'con'}>
			<div class="tradeoff-icon">
				{#if tradeoff.type === 'pro'}
					<span class="icon-pro">✓</span>
				{:else}
					<span class="icon-con">⚠</span>
				{/if}
			</div>
			<div class="tradeoff-text">{tradeoff.text}</div>
		</div>
	{/each}

	{#if tradeoffs.length === 0}
		<div class="empty-state">No tradeoffs specified</div>
	{/if}
</div>

<style>
	.tradeoffs-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.tradeoff-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--radius-md);
		background: var(--color-bg);
		transition: all var(--transition-fast);
	}

	.tradeoff-item.pro {
		border-left: 3px solid var(--color-success);
		background: color-mix(in srgb, var(--color-success) 3%, var(--color-bg));
	}

	.tradeoff-item.con {
		border-left: 3px solid var(--color-warning);
		background: color-mix(in srgb, var(--color-warning) 3%, var(--color-bg));
	}

	.tradeoff-icon {
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 1;
	}

	.icon-pro {
		color: var(--color-success);
		font-weight: 700;
	}

	.icon-con {
		color: var(--color-warning);
		font-weight: 700;
	}

	.tradeoff-text {
		flex: 1;
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: 0.875rem;
	}
</style>
