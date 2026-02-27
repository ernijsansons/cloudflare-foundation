<script lang="ts">
	import { filtersStore } from '$lib/stores';
	import FilterCheckboxGroup from './FilterCheckboxGroup.svelte';
	import FilterRangeSlider from './FilterRangeSlider.svelte';
	import SavedViewsDropdown from './SavedViewsDropdown.svelte';

	interface Props {
		statusCounts?: Record<string, number>;
		modeCounts?: Record<string, number>;
	}

	let { statusCounts = {}, modeCounts = {} }: Props = $props();

	const statusOptions = $derived(() => [
		{ value: 'running', label: 'Running', count: statusCounts.running },
		{ value: 'pending', label: 'Pending', count: statusCounts.pending },
		{ value: 'completed', label: 'Completed', count: statusCounts.completed },
		{ value: 'paused', label: 'Paused', count: statusCounts.paused },
		{ value: 'killed', label: 'Killed', count: statusCounts.killed },
		{ value: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
	]);

	const modeOptions = $derived(() => [
		{ value: 'local', label: 'Local', count: modeCounts.local },
		{ value: 'cloud', label: 'Cloud', count: modeCounts.cloud }
	]);

	function handleSaveView() {
		const name = prompt('Enter a name for this view:');
		if (name?.trim()) {
			filtersStore.saveCurrentView(name.trim());
		}
	}
</script>

<aside class="filter-sidebar">
	<div class="sidebar-header">
		<h3 class="sidebar-title">Filters</h3>
		<SavedViewsDropdown
			views={filtersStore.savedViews}
			activeViewId={filtersStore.activeViewId}
			onLoadView={(id) => filtersStore.loadView(id)}
			onDeleteView={(id) => filtersStore.deleteView(id)}
			onSaveCurrentView={handleSaveView}
		/>
	</div>

	<div class="sidebar-content">
		<FilterCheckboxGroup
			label="Status"
			options={statusOptions()}
			selected={filtersStore.filters.status}
			showStatusColors
			onToggle={(status) => filtersStore.toggleStatus(status)}
		/>

		<FilterCheckboxGroup
			label="Mode"
			options={modeOptions()}
			selected={filtersStore.filters.mode}
			onToggle={(mode) => filtersStore.toggleMode(mode as 'local' | 'cloud')}
		/>

		<FilterRangeSlider
			label="Quality Score"
			min={0}
			max={100}
			step={5}
			value={filtersStore.filters.qualityRange}
			showQualityColors
			onChange={(range) => filtersStore.setQualityRange(range)}
		/>
	</div>

	{#if filtersStore.hasActiveFilters}
		<div class="sidebar-footer">
			<button
				class="reset-btn"
				type="button"
				onclick={() => filtersStore.resetFilters()}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
					<path d="M3 3v5h5"></path>
				</svg>
				Reset Filters
			</button>
		</div>
	{/if}
</aside>

<style>
	.filter-sidebar {
		width: 280px;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-lg, 10px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		flex-shrink: 0;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.sidebar-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0;
	}

	.sidebar-content {
		flex: 1;
		overflow-y: auto;
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.reset-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: none;
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-md, 6px);
		font-size: 0.875rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		cursor: pointer;
		transition: all var(--transition-fast, 150ms);
	}

	.reset-btn:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		border-color: var(--color-text-subtle, hsl(220, 15%, 65%));
		color: var(--color-text, #111827);
	}

	.reset-btn:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: 2px;
	}

	@media (prefers-color-scheme: dark) {
		.filter-sidebar {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}

		.reset-btn:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}

	@media (max-width: 1024px) {
		.filter-sidebar {
			width: 100%;
			max-width: 320px;
		}
	}
</style>
