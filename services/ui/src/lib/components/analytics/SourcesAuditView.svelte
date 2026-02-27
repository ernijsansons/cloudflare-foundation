<script lang="ts">
	interface Source {
		url: string;
		title: string;
		snippet: string;
		confidence: 'high' | 'medium' | 'low';
		cited_in: string[];
		created_at?: number;
	}

	interface Props {
		sources: Source[];
		phase?: string;
	}

	let { sources, phase }: Props = $props();

	let filterConfidence = $state<'all' | 'high' | 'medium' | 'low'>('all');
	let expandedSource = $state<string | null>(null);

	const filteredSources = $derived(() => {
		if (filterConfidence === 'all') return sources;
		return sources.filter((s) => s.confidence === filterConfidence);
	});

	const confidenceCounts = $derived(() => ({
		all: sources.length,
		high: sources.filter((s) => s.confidence === 'high').length,
		medium: sources.filter((s) => s.confidence === 'medium').length,
		low: sources.filter((s) => s.confidence === 'low').length
	}));

	function getConfidenceColor(confidence: string): string {
		switch (confidence) {
			case 'high':
				return 'var(--color-success, #10b981)';
			case 'medium':
				return 'var(--color-warning, #f59e0b)';
			case 'low':
				return 'var(--color-error, #ef4444)';
			default:
				return 'var(--color-text-muted, #6b7280)';
		}
	}

	function toggleSource(url: string) {
		expandedSource = expandedSource === url ? null : url;
	}

	function formatDomain(url: string): string {
		try {
			return new URL(url).hostname.replace('www.', '');
		} catch {
			return url.slice(0, 30);
		}
	}
</script>

<div class="sources-audit">
	<div class="audit-header">
		<h3 class="audit-title">Citation Sources</h3>
		{#if phase}
			<span class="phase-badge">{phase}</span>
		{/if}
	</div>

	<!-- Filter Tabs -->
	<div class="filter-tabs">
		<button
			class="filter-tab"
			class:active={filterConfidence === 'all'}
			onclick={() => (filterConfidence = 'all')}
			type="button"
		>
			All ({confidenceCounts().all})
		</button>
		<button
			class="filter-tab high"
			class:active={filterConfidence === 'high'}
			onclick={() => (filterConfidence = 'high')}
			type="button"
		>
			High ({confidenceCounts().high})
		</button>
		<button
			class="filter-tab medium"
			class:active={filterConfidence === 'medium'}
			onclick={() => (filterConfidence = 'medium')}
			type="button"
		>
			Medium ({confidenceCounts().medium})
		</button>
		<button
			class="filter-tab low"
			class:active={filterConfidence === 'low'}
			onclick={() => (filterConfidence = 'low')}
			type="button"
		>
			Low ({confidenceCounts().low})
		</button>
	</div>

	<!-- Sources List -->
	<div class="sources-list">
		{#each filteredSources() as source}
			<button
				class="source-card"
				class:expanded={expandedSource === source.url}
				onclick={() => toggleSource(source.url)}
				type="button"
			>
				<div class="source-header">
					<span class="confidence-badge" style="background: {getConfidenceColor(source.confidence)}">
						{source.confidence}
					</span>
					<span class="source-domain">{formatDomain(source.url)}</span>
					<span class="citation-count">{source.cited_in.length} citations</span>
				</div>

				<h4 class="source-title">{source.title || 'Untitled Source'}</h4>

				{#if expandedSource === source.url}
					<div class="source-details">
						{#if source.snippet}
							<p class="source-snippet">{source.snippet}</p>
						{/if}

						<a
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
							class="source-link"
							onclick={(e) => e.stopPropagation()}
						>
							View Source
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
								<polyline points="15 3 21 3 21 9" />
								<line x1="10" y1="14" x2="21" y2="3" />
							</svg>
						</a>

						{#if source.cited_in.length > 0}
							<div class="cited-in-section">
								<span class="cited-in-label">Cited in:</span>
								<div class="cited-in-list">
									{#each source.cited_in as citation}
										<span class="citation-tag">{citation}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</button>
		{/each}

		{#if filteredSources().length === 0}
			<div class="empty-state">
				<span class="empty-icon">📑</span>
				<p>No sources found{filterConfidence !== 'all' ? ` with ${filterConfidence} confidence` : ''}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.sources-audit {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
	}

	.audit-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.audit-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text, #111827);
	}

	.phase-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.filter-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-tab {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-tab:hover {
		border-color: var(--color-text-subtle, #9ca3af);
	}

	.filter-tab.active {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
		color: white;
	}

	.filter-tab.high.active {
		background: var(--color-success, #10b981);
		border-color: var(--color-success, #10b981);
	}

	.filter-tab.medium.active {
		background: var(--color-warning, #f59e0b);
		border-color: var(--color-warning, #f59e0b);
	}

	.filter-tab.low.active {
		background: var(--color-error, #ef4444);
		border-color: var(--color-error, #ef4444);
	}

	.sources-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 500px;
		overflow-y: auto;
	}

	.source-card {
		width: 100%;
		padding: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.source-card:hover {
		border-color: var(--color-primary, #6366f1);
		box-shadow: var(--shadow-sm);
	}

	.source-card.expanded {
		background: var(--color-bg-tertiary, #f3f4f6);
	}

	.source-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.confidence-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		color: white;
	}

	.source-domain {
		font-size: 0.75rem;
		color: var(--color-text-muted, #6b7280);
		flex: 1;
	}

	.citation-count {
		font-size: 0.75rem;
		color: var(--color-text-subtle, #9ca3af);
	}

	.source-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #111827);
		line-height: 1.4;
	}

	.source-details {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #e5e7eb);
	}

	.source-snippet {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted, #6b7280);
		line-height: 1.5;
	}

	.source-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-primary, #6366f1);
		text-decoration: none;
	}

	.source-link:hover {
		text-decoration: underline;
	}

	.cited-in-section {
		margin-top: 0.75rem;
	}

	.cited-in-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted, #6b7280);
		margin-bottom: 0.375rem;
	}

	.cited-in-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.citation-tag {
		font-size: 0.6875rem;
		padding: 0.125rem 0.5rem;
		background: var(--color-bg-tertiary, #f3f4f6);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 4px;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--color-text-muted, #6b7280);
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	@media (prefers-color-scheme: dark) {
		.filter-tab,
		.source-card {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.source-card.expanded {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
