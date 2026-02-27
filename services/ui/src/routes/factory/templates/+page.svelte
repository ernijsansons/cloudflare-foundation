<script lang="ts">
	import { goto } from '$app/navigation';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { Template } from '$lib/types';

	let { data } = $props();

	// Filter state
	let searchTerm = $state('');
	let selectedCategory = $state('all');
	let selectedCostRange = $state('all');
	let selectedComplexity = $state('all');
	let selectedSource = $state('all');

	// Filter configurations
	const filters = [
		{
			key: 'category',
			label: 'Category',
			options: ['all', 'workers', 'pages', 'apis', 'agents', 'full-stack']
		},
		{
			key: 'cost',
			label: 'Cost',
			options: ['all', 'low', 'medium', 'high']
		},
		{
			key: 'complexity',
			label: 'Complexity',
			options: ['all', 'low', 'medium', 'high']
		},
		{
			key: 'source',
			label: 'Source',
			options: ['all', 'cloudflare', 'bible', 'community', 'custom']
		}
	];

	const selected = $derived({
		category: selectedCategory,
		cost: selectedCostRange,
		complexity: selectedComplexity,
		source: selectedSource
	});

	function handleFilterChange(key: string, value: string) {
		if (key === 'category') selectedCategory = value;
		if (key === 'cost') selectedCostRange = value;
		if (key === 'complexity') selectedComplexity = value;
		if (key === 'source') selectedSource = value;
	}

	function handleSearchInput(value: string) {
		searchTerm = value;
	}

	function matchesCostRange(template: Template, range: string): boolean {
		if (range === 'all') return true;
		const avgCost = (template.cost_low + template.cost_mid + template.cost_high) / 3;
		if (range === 'low') return avgCost < 10;
		if (range === 'medium') return avgCost >= 10 && avgCost < 50;
		if (range === 'high') return avgCost >= 50;
		return true;
	}

	// Filtered templates
	let filteredTemplates = $derived(
		data.templates
			.filter(
				(t: Template) =>
					!searchTerm ||
					t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					t.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
			)
			.filter((t: Template) => selectedCategory === 'all' || t.category === selectedCategory)
			.filter((t: Template) => matchesCostRange(t, selectedCostRange))
			.filter((t: Template) => selectedComplexity === 'all' || t.complexity === selectedComplexity)
			.filter((t: Template) => selectedSource === 'all' || t.source === selectedSource)
	);

	// Table columns
	const columns = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'framework', label: 'Framework', sortable: true },
		{ key: 'cost', label: 'Cost', sortable: true, width: '100px' },
		{ key: 'complexity', label: 'Complexity', sortable: true, width: '120px' },
		{ key: 'source', label: 'Source', sortable: true, width: '120px' }
	];

	// Transform templates for table display
	let tableRows = $derived(
		filteredTemplates.map((template: Template) => ({
			name: template.name,
			framework: template.framework,
			cost: `$${template.cost_low}-${template.cost_high}`,
			complexity: template.complexity,
			source: template.source,
			_template: template
		}))
	);

	function handleRowClick(row: any) {
		goto(`/factory/templates/${row._template.slug}`);
	}
</script>

<div class="templates-page">
	<header class="page-header">
		<div class="header-content">
			<h1>Templates</h1>
			<p class="page-subtitle">{data.templates.length} Cloudflare templates available</p>
		</div>
		<div class="search-container">
			<SearchInput value={searchTerm} placeholder="Search templates..." onInput={handleSearchInput} />
		</div>
	</header>

	{#if data.error}
		<div class="error-banner">
			<strong>Error:</strong>
			{data.error}
		</div>
	{/if}

	<div class="filters-container">
		<FilterBar {filters} {selected} onChange={handleFilterChange} />
	</div>

	<div class="results-info">
		<span class="results-count"
			>Showing {filteredTemplates.length} of {data.templates.length} templates</span
		>
	</div>

	<div class="table-container">
		<DataTable {columns} rows={tableRows} onRowClick={handleRowClick} emptyMessage="No templates found. Try adjusting your filters." />
	</div>
</div>

<style>
	.templates-page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.header-content {
		flex: 1;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		font-size: 1rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.search-container {
		flex: 0 0 300px;
		max-width: 400px;
	}

	.error-banner {
		padding: 1rem;
		margin-bottom: 2rem;
		background: color-mix(in srgb, var(--color-error) 10%, var(--color-bg));
		border: 1px solid var(--color-error);
		border-radius: var(--radius-lg);
		color: var(--color-error);
		font-size: 0.875rem;
	}

	.filters-container {
		margin-bottom: 1.5rem;
	}

	.results-info {
		margin-bottom: 1rem;
		padding: 0.5rem 0;
	}

	.results-count {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.table-container {
		/* DataTable handles its own styling */
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.search-container {
			flex: 1;
			max-width: 100%;
		}
	}
</style>
