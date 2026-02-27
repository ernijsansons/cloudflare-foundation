<script lang="ts">
	import type { FilterState } from '$lib/types';
	import { getStatusColor, getStatusLabel } from '$lib/design-system';

	interface Props {
		filters: FilterState;
		onRemoveStatus?: (_status: string) => void;
		onRemoveMode?: (_mode: 'local' | 'cloud') => void;
		onResetQuality?: () => void;
		onResetDateRange?: () => void;
		onClearSearch?: () => void;
		onClearAll?: () => void;
	}

	let {
		filters,
		onRemoveStatus,
		onRemoveMode,
		onResetQuality,
		onResetDateRange,
		onClearSearch,
		onClearAll
	}: Props = $props();

	const hasStatusFilters = $derived(filters.status.length > 0);
	const hasModeFilters = $derived(filters.mode.length > 0);
	const hasQualityFilter = $derived(filters.qualityRange[0] > 0 || filters.qualityRange[1] < 100);
	const hasDateFilter = $derived(filters.dateRange[0] !== null || filters.dateRange[1] !== null);
	const hasSearchFilter = $derived(filters.search.trim() !== '');

	const hasAnyFilters = $derived(
		hasStatusFilters || hasModeFilters || hasQualityFilter || hasDateFilter || hasSearchFilter
	);

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

{#if hasAnyFilters}
	<div class="active-filters">
		<span class="filters-label">Filters:</span>

		<div class="filter-pills">
			{#each filters.status as status}
				<button
					class="filter-pill status-pill"
					type="button"
					onclick={() => onRemoveStatus?.(status)}
				>
					<span
						class="pill-dot"
						style:background-color={getStatusColor(status)}
					></span>
					<span class="pill-text">{getStatusLabel(status)}</span>
					<span class="pill-remove">×</span>
				</button>
			{/each}

			{#each filters.mode as mode}
				<button
					class="filter-pill mode-pill"
					type="button"
					onclick={() => onRemoveMode?.(mode)}
				>
					<span class="pill-icon">{mode === 'local' ? '💻' : '☁️'}</span>
					<span class="pill-text">{mode === 'local' ? 'Local' : 'Cloud'}</span>
					<span class="pill-remove">×</span>
				</button>
			{/each}

			{#if hasQualityFilter}
				<button
					class="filter-pill quality-pill"
					type="button"
					onclick={() => onResetQuality?.()}
				>
					<span class="pill-text">
						Quality: {filters.qualityRange[0]}–{filters.qualityRange[1]}
					</span>
					<span class="pill-remove">×</span>
				</button>
			{/if}

			{#if hasDateFilter}
				<button
					class="filter-pill date-pill"
					type="button"
					onclick={() => onResetDateRange?.()}
				>
					<span class="pill-text">
						Date:
						{#if filters.dateRange[0] && filters.dateRange[1]}
							{formatDate(filters.dateRange[0])} – {formatDate(filters.dateRange[1])}
						{:else if filters.dateRange[0]}
							After {formatDate(filters.dateRange[0])}
						{:else if filters.dateRange[1]}
							Before {formatDate(filters.dateRange[1])}
						{/if}
					</span>
					<span class="pill-remove">×</span>
				</button>
			{/if}

			{#if hasSearchFilter}
				<button
					class="filter-pill search-pill"
					type="button"
					onclick={() => onClearSearch?.()}
				>
					<span class="pill-icon">🔍</span>
					<span class="pill-text">"{filters.search}"</span>
					<span class="pill-remove">×</span>
				</button>
			{/if}
		</div>

		<button class="clear-all-btn" type="button" onclick={() => onClearAll?.()}>
			Clear all
		</button>
	</div>
{/if}

<style>
	.active-filters {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		border-radius: var(--radius-md, 6px);
		flex-wrap: wrap;
	}

	.filters-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		flex-shrink: 0;
	}

	.filter-pills {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.filter-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-full, 9999px);
		font-size: 0.75rem;
		color: var(--color-text, #111827);
		cursor: pointer;
		transition: all var(--transition-fast, 150ms);
	}

	.filter-pill:hover {
		border-color: var(--color-error, hsl(0, 84%, 55%));
		background: color-mix(in srgb, var(--color-error, hsl(0, 84%, 55%)) 5%, transparent);
	}

	.filter-pill:hover .pill-remove {
		color: var(--color-error, hsl(0, 84%, 55%));
	}

	.pill-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.pill-icon {
		font-size: 0.75rem;
	}

	.pill-text {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pill-remove {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		font-weight: 600;
		line-height: 1;
		transition: color var(--transition-fast, 150ms);
	}

	.clear-all-btn {
		padding: 0.25rem 0.5rem;
		background: none;
		border: none;
		font-size: 0.75rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		cursor: pointer;
		transition: color var(--transition-fast, 150ms);
		flex-shrink: 0;
	}

	.clear-all-btn:hover {
		color: var(--color-error, hsl(0, 84%, 55%));
	}

	@media (prefers-color-scheme: dark) {
		.active-filters {
			background: var(--color-bg-secondary, hsl(0, 0%, 8%));
		}

		.filter-pill {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>
