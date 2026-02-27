<script lang="ts">
	import type { SearchResult } from '$lib/types';
	import SearchResultItem from './SearchResultItem.svelte';

	interface Props {
		results: SearchResult[];
		selectedIndex?: number;
		isLoading?: boolean;
		error?: string | null;
		query?: string;
		recentSearches?: string[];
		onSelectResult?: (_result: SearchResult) => void;
		onSelectRecent?: (_query: string) => void;
		onClearRecent?: () => void;
	}

	let {
		results,
		selectedIndex = 0,
		isLoading = false,
		error = null,
		query = '',
		recentSearches = [],
		onSelectResult,
		onSelectRecent,
		onClearRecent
	}: Props = $props();

	const hasResults = $derived(results.length > 0);
	const showRecent = $derived(!query.trim() && recentSearches.length > 0);
	const showEmpty = $derived(query.trim() && !hasResults && !isLoading && !error);
</script>

<div class="search-results" role="listbox" aria-label="Search results">
	{#if isLoading}
		<div class="search-status">
			<span class="loading-spinner"></span>
			<span>Searching...</span>
		</div>
	{:else if error}
		<div class="search-status error">
			<span>⚠</span>
			<span>{error}</span>
		</div>
	{:else if showRecent}
		<div class="recent-searches">
			<div class="recent-header">
				<span class="recent-label">Recent searches</span>
				{#if onClearRecent}
					<button class="recent-clear" onclick={onClearRecent} type="button">
						Clear
					</button>
				{/if}
			</div>
			<div class="recent-list">
				{#each recentSearches as search}
					<button
						class="recent-item"
						onclick={() => onSelectRecent?.(search)}
						type="button"
					>
						<span class="recent-icon">↩</span>
						<span class="recent-text">{search}</span>
					</button>
				{/each}
			</div>
		</div>
	{:else if showEmpty}
		<div class="search-status empty">
			<span>🔍</span>
			<span>No results for "{query}"</span>
		</div>
	{:else if hasResults}
		<div class="results-list">
			{#each results as result, index}
				<SearchResultItem
					{result}
					isSelected={index === selectedIndex}
					onSelect={() => onSelectResult?.(result)}
				/>
			{/each}
		</div>
	{:else}
		<div class="search-status hint">
			<span>🔍</span>
			<span>Search runs, ideas, artifacts, and phases</span>
		</div>
	{/if}
</div>

<style>
	.search-results {
		min-height: 100px;
		max-height: 400px;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.search-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem 1rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		font-size: 0.875rem;
	}

	.search-status.error {
		color: var(--color-error, hsl(0, 84%, 55%));
	}

	.search-status.empty {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.search-status.hint {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--color-border, hsl(220, 20%, 90%));
		border-top-color: var(--color-primary, hsl(212, 100%, 48%));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	/* Recent searches */
	.recent-searches {
		padding: 0.5rem;
	}

	.recent-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.5rem 0.75rem;
	}

	.recent-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.recent-clear {
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm, 4px);
		transition: all var(--transition-fast, 150ms);
	}

	.recent-clear:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		color: var(--color-text, #111827);
	}

	.recent-clear:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: 2px;
	}

	.recent-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.recent-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		border-radius: var(--radius-md, 6px);
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.recent-item:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.recent-item:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: -2px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.recent-icon {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		font-size: 0.875rem;
	}

	.recent-text {
		color: var(--color-text, #111827);
		font-size: 0.875rem;
	}

	@media (prefers-color-scheme: dark) {
		.recent-item:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
