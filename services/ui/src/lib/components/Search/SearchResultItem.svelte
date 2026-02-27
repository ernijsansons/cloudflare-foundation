<script lang="ts">
	import type { SearchResult } from '$lib/types';
	import { getStatusColor, getStatusIcon } from '$lib/design-system';

	interface Props {
		result: SearchResult;
		isSelected?: boolean;
		onSelect?: () => void;
	}

	let { result, isSelected = false, onSelect }: Props = $props();

	const typeIcons: Record<string, string> = {
		run: '▶',
		idea: '💡',
		artifact: '📄',
		phase: '◉',
		task: '☐'
	};

	const typeLabels: Record<string, string> = {
		run: 'Run',
		idea: 'Idea',
		artifact: 'Artifact',
		phase: 'Phase',
		task: 'Task'
	};

	function handleClick() {
		onSelect?.();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onSelect?.();
		}
	}
</script>

<button
	class="search-result-item"
	class:selected={isSelected}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	type="button"
	role="option"
	aria-selected={isSelected}
>
	<span class="result-icon">{typeIcons[result.type] || '•'}</span>

	<div class="result-content">
		<div class="result-title">
			{result.title}
			{#if result.highlight}
				<span class="result-highlight">{result.highlight}</span>
			{/if}
		</div>

		{#if result.subtitle}
			<div class="result-subtitle">{result.subtitle}</div>
		{/if}
	</div>

	<div class="result-meta">
		{#if result.status}
			<span
				class="result-status"
				style:color={getStatusColor(result.status)}
			>
				{getStatusIcon(result.status)}
			</span>
		{/if}

		<span class="result-type">{typeLabels[result.type] || result.type}</span>

		{#if result.score !== undefined}
			<span class="result-score">{result.score}</span>
		{/if}
	</div>
</button>

<style>
	.search-result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		border-radius: var(--radius-md, 6px);
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.search-result-item:hover,
	.search-result-item.selected {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.search-result-item:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: -2px;
	}

	.result-icon {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		opacity: 0.7;
	}

	.result-content {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		font-weight: 500;
		color: var(--color-text, #111827);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-highlight {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		margin-left: 0.5rem;
	}

	.result-subtitle {
		font-size: 0.8125rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.result-status {
		font-size: 0.875rem;
	}

	.result-type {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm, 4px);
	}

	.result-score {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary, hsl(212, 100%, 48%));
	}

	@media (prefers-color-scheme: dark) {
		.search-result-item:hover,
		.search-result-item.selected {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
