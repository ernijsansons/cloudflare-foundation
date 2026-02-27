<script lang="ts">
	interface Filter {
		key: string;
		label: string;
		options: string[];
	}

	interface Props {
		filters: Filter[];
		selected: Record<string, string>;
		onChange: (_key: string, _value: string) => void;
	}

	let { filters, selected, onChange }: Props = $props();

	function handleOptionClick(filterKey: string, option: string) {
		onChange(filterKey, option);
	}
</script>

<div class="filter-bar">
	{#each filters as filter}
		<div class="filter-group">
			<span class="filter-label">{filter.label}:</span>
			<div class="filter-options">
				{#each filter.options as option}
					<button
						type="button"
						class="filter-pill"
						class:active={selected[filter.key] === option}
						onclick={() => handleOptionClick(filter.key, option)}
					>
						{option}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.filter-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.filter-options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.filter-pill {
		padding: 0.375rem 0.75rem;
		font-size: 0.813rem;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-bg);
		color: var(--color-text);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.filter-pill:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
	}

	.filter-pill.active {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: white;
	}

	.filter-pill:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
