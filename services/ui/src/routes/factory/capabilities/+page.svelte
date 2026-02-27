<script lang="ts">
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import type { Capability } from '$lib/types';

	let { data } = $props();

	// Filter state
	let selectedFreeTier = $state('all');

	// Expanded row tracking
	let expandedRow = $state<string | null>(null);

	// Filter configurations
	const filters = [
		{
			key: 'freeTier',
			label: 'Free Tier',
			options: ['all', 'free', 'paid']
		}
	];

	const selected = $derived({
		freeTier: selectedFreeTier
	});

	function handleFilterChange(key: string, value: string) {
		if (key === 'freeTier') selectedFreeTier = value;
	}

	// Filtered capabilities
	let filteredCapabilities = $derived(
		data.capabilities.filter((c: Capability) => {
			if (selectedFreeTier === 'all') return true;
			if (selectedFreeTier === 'free') return c.has_free_quota;
			if (selectedFreeTier === 'paid') return !c.has_free_quota;
			return true;
		})
	);

	function toggleRow(slug: string) {
		if (expandedRow === slug) {
			expandedRow = null;
		} else {
			expandedRow = slug;
		}
	}

	// Sort state
	let sortColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	let sortedCapabilities = $derived(() => {
		if (!sortColumn) return filteredCapabilities;

		const sorted = [...filteredCapabilities].sort((a, b) => {
			let aVal = a[sortColumn as keyof Capability];
			let bVal = b[sortColumn as keyof Capability];

			// Handle null/undefined
			if (aVal == null) return 1;
			if (bVal == null) return -1;

			// String comparison
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal);
			}

			// Boolean comparison
			if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
				return aVal === bVal ? 0 : aVal ? -1 : 1;
			}

			return 0;
		});

		return sortDirection === 'desc' ? sorted.reverse() : sorted;
	});
</script>

<div class="capabilities-page">
	<header class="page-header">
		<div class="header-content">
			<h1>Cloudflare Capabilities</h1>
			<p class="page-subtitle">{data.capabilities.length} Cloudflare products available</p>
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
			>Showing {sortedCapabilities().length} of {data.capabilities.length} capabilities</span
		>
	</div>

	<div class="capabilities-table">
		<table>
			<thead>
				<tr>
					<th class="sortable" onclick={() => handleSort('name')}>
						<span class="header-content">
							Product
							{#if sortColumn === 'name'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</span>
					</th>
					<th>Binding</th>
					<th class="sortable" onclick={() => handleSort('has_free_quota')}>
						<span class="header-content">
							Free Tier
							{#if sortColumn === 'has_free_quota'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</span>
					</th>
					<th>Pricing</th>
					<th class="expand-col"></th>
				</tr>
			</thead>
			<tbody>
				{#each sortedCapabilities() as capability}
					<tr class="capability-row" class:expanded={expandedRow === capability.slug}>
						<td class="name-cell">
							<strong>{capability.name}</strong>
						</td>
						<td class="binding-cell">
							{#if capability.binding_type}
								<code class="binding-code">{capability.binding_type}</code>
							{:else}
								<span class="no-binding">-</span>
							{/if}
						</td>
						<td class="free-tier-cell">
							{#if capability.has_free_quota}
								<Badge variant="success">Free Tier</Badge>
								{#if capability.free_quota}
									<div class="quota-text">{capability.free_quota}</div>
								{/if}
							{:else}
								<Badge variant="default">Paid Only</Badge>
							{/if}
						</td>
						<td class="pricing-cell">
							{#if capability.paid_pricing}
								<span class="pricing-text">{capability.paid_pricing}</span>
							{:else}
								<span class="no-pricing">-</span>
							{/if}
						</td>
						<td class="expand-cell">
							<button class="expand-button" onclick={() => toggleRow(capability.slug)}>
								{expandedRow === capability.slug ? '−' : '+'}
							</button>
						</td>
					</tr>
					{#if expandedRow === capability.slug}
						<tr class="detail-row">
							<td colspan="5">
								<div class="detail-content">
									<div class="detail-section">
										<h4>Description</h4>
										<p>{capability.description}</p>
									</div>
									<div class="detail-section">
										<h4>Best For</h4>
										<p>{capability.best_for}</p>
									</div>
									{#if capability.limitations}
										<div class="detail-section">
											<h4>Limitations</h4>
											<p>{capability.limitations}</p>
										</div>
									{/if}
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>

		{#if sortedCapabilities().length === 0}
			<div class="empty-state">No capabilities found. Try adjusting your filters.</div>
		{/if}
	</div>
</div>

<style>
	.capabilities-page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
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

	.capabilities-table {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-bg);
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: var(--color-bg-secondary);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	th {
		padding: 1rem;
		text-align: left;
		font-size: 0.813rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--color-border);
	}

	th.sortable {
		cursor: pointer;
		user-select: none;
		transition: color var(--transition-fast);
	}

	th.sortable:hover {
		color: var(--color-primary);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-indicator {
		font-size: 0.75rem;
		color: var(--color-primary);
	}

	.expand-col {
		width: 60px;
	}

	tbody tr.capability-row {
		border-bottom: 1px solid var(--color-border);
		transition: background var(--transition-fast);
	}

	tbody tr.capability-row:hover {
		background: var(--color-bg-hover);
	}

	tbody tr.capability-row.expanded {
		background: color-mix(in srgb, var(--color-primary) 3%, var(--color-bg));
	}

	td {
		padding: 1rem;
		font-size: 0.875rem;
		color: var(--color-text);
	}

	.name-cell strong {
		font-weight: 600;
		color: var(--color-text);
	}

	.binding-cell .binding-code {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.813rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text);
	}

	.no-binding,
	.no-pricing {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.free-tier-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.quota-text {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.pricing-text {
		color: var(--color-text);
	}

	.expand-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}

	.expand-button:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
	}

	.detail-row {
		border-bottom: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-primary) 2%, var(--color-bg));
	}

	.detail-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-section h4 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		margin: 0 0 0.5rem 0;
	}

	.detail-section p {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.capabilities-table {
			overflow-x: auto;
		}

		table {
			min-width: 600px;
		}
	}
</style>
