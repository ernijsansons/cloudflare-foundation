<script lang="ts">
	import { goto } from '$app/navigation';
	import type { SearchResult } from '$lib/types';

	interface PageData {
		query: string;
		type: string;
		results: SearchResult[];
		total: number;
		took_ms: number;
		error?: string;
	}

	let { data }: { data: PageData } = $props();

	let searchInput = $state('');
	let selectedType = $state('');

	$effect(() => {
		searchInput = data.query;
		selectedType = data.type;
	});

	// Result type icons
	const typeIcons: Record<string, string> = {
		run: '🚀',
		idea: '💡',
		phase: '📊',
		artifact: '📄',
		task: '✅'
	};

	// Result type labels
	const typeLabels: Record<string, string> = {
		run: 'Runs',
		idea: 'Ideas',
		phase: 'Phases',
		artifact: 'Artifacts',
		task: 'Tasks'
	};

	// Status colors
	const statusColors: Record<string, string> = {
		completed: 'var(--color-status-completed)',
		running: 'var(--color-status-running)',
		pending: 'var(--color-status-pending)',
		paused: 'var(--color-status-paused)',
		killed: 'var(--color-status-killed)',
		failed: 'var(--color-status-failed)'
	};

	// Get unique types from results
	const availableTypes = $derived(() => {
		const types = new Set(data.results.map((r) => r.type));
		return Array.from(types);
	});

	// Handle search form submit
	function handleSearch(event: Event) {
		event.preventDefault();
		if (searchInput.trim()) {
			const params = new globalThis.URLSearchParams();
			params.set('q', searchInput.trim());
			if (selectedType) params.set('type', selectedType);
			goto(`/search?${params.toString()}`);
		}
	}

	// Handle type filter change
	function handleTypeFilter(type: string) {
		selectedType = type;
		const params = new globalThis.URLSearchParams();
		params.set('q', data.query);
		if (type) params.set('type', type);
		goto(`/search?${params.toString()}`);
	}

	// Format score
	function formatScore(score: number | undefined): string {
		if (score === undefined) return '';
		return `${Math.round(score)}%`;
	}
</script>

<svelte:head>
	<title>{data.query ? `Search: ${data.query}` : 'Search'} | Foundation</title>
</svelte:head>

<div class="search-page">
	<header class="search-header">
		<h1 class="page-title">Search</h1>

		<form class="search-form" onsubmit={handleSearch}>
			<div class="search-input-wrapper">
				<span class="search-icon">🔍</span>
				<input
					type="text"
					class="search-input"
					placeholder="Search runs, ideas, artifacts..."
					bind:value={searchInput}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
				/>
				<button type="submit" class="search-button">Search</button>
			</div>
		</form>

		{#if data.query}
			<div class="search-meta">
				<span class="result-count">
					{data.total} result{data.total !== 1 ? 's' : ''} for "{data.query}"
				</span>
				{#if data.took_ms}
					<span class="search-time">({data.took_ms}ms)</span>
				{/if}
			</div>

			<!-- Type filters -->
			{#if availableTypes().length > 0}
				<div class="type-filters">
					<button
						class="type-filter"
						class:active={!selectedType}
						onclick={() => handleTypeFilter('')}
					>
						All
					</button>
					{#each availableTypes() as type}
						<button
							class="type-filter"
							class:active={selectedType === type}
							onclick={() => handleTypeFilter(type)}
						>
							{typeIcons[type] || '📋'} {typeLabels[type] || type}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</header>

	<main class="search-results">
		{#if data.error}
			<div class="error-state">
				<span class="error-icon">⚠️</span>
				<p>{data.error}</p>
			</div>
		{:else if !data.query}
			<div class="empty-state">
				<span class="empty-icon">🔍</span>
				<h2>Search for anything</h2>
				<p>Find runs, ideas, phases, and more across your planning pipeline.</p>
				<div class="search-tips">
					<h3>Tips:</h3>
					<ul>
						<li>Use <kbd>⌘</kbd> + <kbd>K</kbd> for quick search anywhere</li>
						<li>Search by run name, idea title, or phase name</li>
						<li>Filter results by type using the tabs above</li>
					</ul>
				</div>
			</div>
		{:else if data.results.length === 0}
			<div class="empty-state">
				<span class="empty-icon">🔎</span>
				<h2>No results found</h2>
				<p>No matches for "{data.query}". Try a different search term.</p>
			</div>
		{:else}
			<ul class="results-list">
				{#each data.results as result (result.id)}
					<li class="result-item">
						<a href={result.href} class="result-link">
							<span class="result-icon">{typeIcons[result.type] || '📋'}</span>
							<div class="result-content">
								<div class="result-header">
									<span class="result-title">{result.title}</span>
									<span class="result-type">{typeLabels[result.type] || result.type}</span>
								</div>
								{#if result.subtitle}
									<p class="result-subtitle">{result.subtitle}</p>
								{/if}
								<div class="result-meta">
									{#if result.status}
										<span
											class="result-status"
											style="--status-color: {statusColors[result.status] || 'var(--color-text-muted)'}"
										>
											{result.status}
										</span>
									{/if}
									{#if result.phase}
										<span class="result-phase">{result.phase}</span>
									{/if}
									{#if result.score !== undefined}
										<span class="result-score">{formatScore(result.score)}</span>
									{/if}
								</div>
							</div>
							<span class="result-arrow">→</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>

<style>
	.search-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}

	.search-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--color-text);
	}

	.search-form {
		margin-bottom: 1rem;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		transition: border-color var(--transition-fast);
	}

	.search-input-wrapper:focus-within {
		border-color: var(--color-primary);
	}

	.search-icon {
		font-size: 1.125rem;
		opacity: 0.5;
	}

	.search-input {
		flex: 1;
		padding: 0.625rem 0;
		font-size: 1rem;
		font-family: inherit;
		background: transparent;
		border: none;
		outline: none;
		color: var(--color-text);
	}

	.search-input::placeholder {
		color: var(--color-text-subtle);
	}

	.search-button {
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background: var(--color-primary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.search-button:hover {
		background: var(--color-primary-hover);
	}

	.search-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.result-count {
		font-weight: 500;
	}

	.search-time {
		opacity: 0.7;
	}

	.type-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.type-filter {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.type-filter:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.type-filter.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.search-results {
		min-height: 300px;
	}

	.empty-state,
	.error-state {
		text-align: center;
		padding: 3rem 1rem;
	}

	.empty-icon,
	.error-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.empty-state h2,
	.error-state p {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
	}

	.search-tips {
		text-align: left;
		max-width: 400px;
		margin: 0 auto;
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
	}

	.search-tips h3 {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.search-tips ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.search-tips li {
		margin-bottom: 0.5rem;
	}

	.search-tips kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		font-family: inherit;
		font-size: 0.6875rem;
		font-weight: 500;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		box-shadow: 0 1px 0 var(--color-border);
	}

	.results-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.result-item {
		border-bottom: 1px solid var(--color-border);
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-link {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		text-decoration: none;
		color: inherit;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
	}

	.result-link:hover {
		background: var(--color-bg-secondary);
	}

	.result-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.result-content {
		flex: 1;
		min-width: 0;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.result-title {
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-type {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-full);
		color: var(--color-text-muted);
		text-transform: capitalize;
		flex-shrink: 0;
	}

	.result-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0 0 0.5rem 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
	}

	.result-status {
		padding: 0.125rem 0.5rem;
		background: color-mix(in srgb, var(--status-color) 15%, transparent);
		color: var(--status-color);
		border-radius: var(--radius-sm);
		font-weight: 500;
		text-transform: capitalize;
	}

	.result-phase {
		color: var(--color-text-subtle);
	}

	.result-score {
		color: var(--color-success);
		font-weight: 500;
	}

	.result-arrow {
		color: var(--color-text-subtle);
		font-size: 1.25rem;
		opacity: 0;
		transition: opacity var(--transition-fast);
	}

	.result-link:hover .result-arrow {
		opacity: 1;
	}

	@media (prefers-color-scheme: dark) {
		.search-input-wrapper:focus-within {
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
		}
	}

	@media (max-width: 640px) {
		.search-page {
			padding: 1rem;
		}

		.search-input-wrapper {
			flex-wrap: wrap;
		}

		.search-button {
			width: 100%;
			margin-top: 0.5rem;
		}

		.result-header {
			flex-wrap: wrap;
		}
	}
</style>
