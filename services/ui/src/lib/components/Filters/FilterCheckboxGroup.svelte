<script lang="ts">
	import { getStatusColor } from '$lib/design-system';

	interface FilterOption {
		value: string;
		label: string;
		count?: number;
	}

	interface Props {
		label: string;
		options: FilterOption[];
		selected: string[];
		showStatusColors?: boolean;
		onToggle?: (_value: string) => void;
	}

	let { label, options, selected, showStatusColors = false, onToggle }: Props = $props();

	let isCollapsed = $state(false);

	function isSelected(value: string): boolean {
		return selected.includes(value);
	}

	function handleToggle(value: string) {
		onToggle?.(value);
	}
</script>

<div class="filter-group">
	<button
		class="filter-header"
		type="button"
		onclick={() => (isCollapsed = !isCollapsed)}
		aria-expanded={!isCollapsed}
	>
		<span class="filter-label">{label}</span>
		<span class="filter-toggle" class:collapsed={isCollapsed}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</span>
	</button>

	{#if !isCollapsed}
		<div class="filter-options" role="group" aria-label={label}>
			{#each options as option}
				<label
					class="filter-option"
					class:selected={isSelected(option.value)}
				>
					<input
						type="checkbox"
						checked={isSelected(option.value)}
						onchange={() => handleToggle(option.value)}
						class="sr-only"
					/>
					<span class="checkbox">
						{#if isSelected(option.value)}
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
						{/if}
					</span>
					{#if showStatusColors}
						<span
							class="status-dot"
							style:background-color={getStatusColor(option.value)}
						></span>
					{/if}
					<span class="option-label">{option.label}</span>
					{#if option.count !== undefined}
						<span class="option-count">{option.count}</span>
					{/if}
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	.filter-group {
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.875rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.filter-header:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.filter-header:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: -2px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.filter-toggle {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		transition: transform var(--transition-fast, 150ms);
	}

	.filter-toggle.collapsed {
		transform: rotate(-90deg);
	}

	.filter-options {
		padding: 0.5rem 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filter-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-md, 6px);
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.filter-option:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.filter-option:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: -2px;
	}

	.filter-option.selected {
		background: color-mix(in srgb, var(--color-primary, hsl(212, 100%, 48%)) 10%, transparent);
	}

	.checkbox {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1.5px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: 3px;
		background: var(--color-bg, white);
		flex-shrink: 0;
		transition: all var(--transition-fast, 150ms);
	}

	.filter-option.selected .checkbox {
		background: var(--color-primary, hsl(212, 100%, 48%));
		border-color: var(--color-primary, hsl(212, 100%, 48%));
		color: white;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.option-label {
		flex: 1;
		font-size: 0.875rem;
		color: var(--color-text, #111827);
	}

	.option-count {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm, 4px);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	@media (prefers-color-scheme: dark) {
		.filter-header:hover,
		.filter-option:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
