<script lang="ts">
	import { goto } from '$app/navigation';
	import StatCard from '$lib/components/StatCard.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { BuildSpec } from '$lib/types';

	let { data } = $props();

	const columns = [
		{ key: 'run_id', label: 'Run ID', sortable: true },
		{ key: 'template', label: 'Template', sortable: true },
		{ key: 'score', label: 'Score', sortable: true, width: '100px' },
		{ key: 'status', label: 'Status', sortable: true, width: '100px' },
		{ key: 'created_at', label: 'Created', sortable: true, width: '150px' }
	];

	// Transform BuildSpecs for table display
	let tableRows = $derived(
		data.recentBuildSpecs.map((spec: BuildSpec) => ({
			run_id: spec.run_id.substring(0, 8),
			template: spec.recommended?.template?.name || 'Unknown',
			score: spec.recommended?.complexity ? `${spec.recommended.complexity}/5` : '-',
			status: spec.status,
			created_at: new Date(spec.created_at).toLocaleDateString(),
			_fullSpec: spec
		}))
	);

	function handleBuildSpecClick(row: any) {
		goto(`/factory/build-specs/${row._fullSpec.run_id}`);
	}
</script>

<div class="factory-overview">
	<header class="page-header">
		<h1>Factory</h1>
		<p class="page-subtitle">Browse templates, capabilities, and generated build specifications</p>
	</header>

	{#if data.error}
		<div class="error-banner">
			<strong>Error:</strong>
			{data.error}
		</div>
	{/if}

	<section class="stats-grid">
		<StatCard count={data.stats.templateCount} label="Templates" icon="📦" variant="primary" />
		<StatCard count={data.stats.capabilityCount} label="Capabilities" icon="⚡" variant="success" />
		<StatCard count={data.stats.buildSpecCount} label="Build Specs" icon="📋" />
	</section>

	<section class="recent-section">
		<div class="section-header">
			<h2>Recent Build Specs</h2>
			<a href="/factory/build-specs" class="view-all-link">View all →</a>
		</div>

		<DataTable {columns} rows={tableRows} onRowClick={handleBuildSpecClick} />
	</section>

	<section class="quick-actions">
		<a href="/factory/templates" class="action-button primary">
			<span class="button-icon">📦</span>
			<span class="button-text">Browse Templates</span>
		</a>
		<a href="/factory/capabilities" class="action-button">
			<span class="button-icon">⚡</span>
			<span class="button-text">View Capabilities</span>
		</a>
	</section>
</div>

<style>
	.factory-overview {
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

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.recent-section {
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.view-all-link {
		font-size: 0.875rem;
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		transition: color var(--transition-fast);
	}

	.view-all-link:hover {
		color: color-mix(in srgb, var(--color-primary) 80%, black);
	}

	.quick-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.action-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: var(--color-primary);
	}

	.action-button.primary {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.action-button.primary:hover {
		background: color-mix(in srgb, var(--color-primary) 90%, black);
	}

	.button-icon {
		font-size: 1.25rem;
	}

	.button-text {
		line-height: 1;
	}
</style>
