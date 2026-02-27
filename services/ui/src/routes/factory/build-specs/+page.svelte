<script lang="ts">
	import { goto } from '$app/navigation';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { BuildSpec } from '$lib/types';

	let { data } = $props();

	// Table columns
	const columns = [
		{ key: 'run_id', label: 'Run ID', sortable: true },
		{ key: 'template', label: 'Template', sortable: true },
		{ key: 'score', label: 'Match Score', sortable: true, width: '120px' },
		{ key: 'status', label: 'Status', sortable: true, width: '100px' },
		{ key: 'created_at', label: 'Created', sortable: true, width: '150px' }
	];

	// Transform BuildSpecs for table display
	let tableRows = $derived(
		data.buildSpecs.map((spec: BuildSpec) => {
			const templateName = spec.recommended?.template?.name || 'Unknown';
			const complexity = spec.recommended?.complexity || 0;
			const matchScore = complexity > 0 ? Math.round((complexity / 5) * 100) : 0;

			return {
				run_id: spec.run_id.substring(0, 8),
				template: templateName,
				score: `${matchScore}%`,
				status: spec.status,
				created_at: new Date(spec.created_at).toLocaleDateString(),
				_fullSpec: spec
			};
		})
	);

	function handleRowClick(row: any) {
		goto(`/factory/build-specs/${row._fullSpec.run_id}`);
	}

	function handleGenerateNew() {
		// TODO: Open GenerateModal component
		// For now, just navigate to planning runs page or show alert
		alert('Generate New Spec functionality coming soon');
	}
</script>

<div class="build-specs-page">
	<header class="page-header">
		<div class="header-content">
			<h1>Build Specs</h1>
			<p class="page-subtitle">{data.buildSpecs.length} generated build specifications</p>
		</div>
		<button class="generate-button" onclick={handleGenerateNew}>
			<span class="button-icon">+</span>
			<span class="button-text">Generate New Spec</span>
		</button>
	</header>

	{#if data.error}
		<div class="error-banner">
			<strong>Error:</strong>
			{data.error}
		</div>
	{/if}

	<div class="table-container">
		<DataTable
			{columns}
			rows={tableRows}
			onRowClick={handleRowClick}
			emptyMessage="No build specs found. Generate one to get started."
		/>
	</div>
</div>

<style>
	.build-specs-page {
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

	.generate-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background: var(--color-primary);
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.generate-button:hover {
		background: color-mix(in srgb, var(--color-primary) 90%, black);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.button-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.button-text {
		line-height: 1;
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

	.table-container {
		/* DataTable handles its own styling */
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.generate-button {
			justify-content: center;
		}
	}
</style>
