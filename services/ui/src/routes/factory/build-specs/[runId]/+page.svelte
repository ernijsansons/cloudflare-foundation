<script lang="ts">
	import { goto } from '$app/navigation';
	import Tabs from '$lib/components/Tabs.svelte';
	import BuildSpecCard from '$lib/components/BuildSpecCard.svelte';
	import AlternativesList from '$lib/components/AlternativesList.svelte';
	import JsonViewer from '$lib/components/JsonViewer.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let { data } = $props();

	let activeTab = $state('overview');

	const tabs = [
		{ key: 'overview', label: 'Overview' },
		{ key: 'alternatives', label: 'Alternatives' },
		{ key: 'json', label: 'Full JSON' }
	];

	function handleTabChange(key: string) {
		activeTab = key;
	}

	function handleBack() {
		goto('/factory/build-specs');
	}

	function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
		if (status === 'approved' || status === 'active') return 'success';
		if (status === 'draft' || status === 'fallback') return 'warning';
		if (status === 'rejected') return 'error';
		return 'default';
	}
</script>

<div class="build-spec-detail">
	{#if data.error}
		<div class="error-banner">
			<strong>Error:</strong>
			{data.error}
		</div>
	{:else if data.buildSpec}
		<header class="page-header">
			<button class="back-button" onclick={handleBack}>
				<span class="back-icon">←</span>
				<span>Build Specs</span>
			</button>

			<div class="header-content">
				<div class="header-top">
					<h1>Build Spec for Run {data.buildSpec.run_id.substring(0, 8)}</h1>
					<Badge variant={getStatusVariant(data.buildSpec.status)}>
						{data.buildSpec.status}
					</Badge>
				</div>
				<p class="header-meta">
					Created {new Date(data.buildSpec.created_at).toLocaleDateString()} at{' '}
					{new Date(data.buildSpec.created_at).toLocaleTimeString()}
				</p>
			</div>
		</header>

		<div class="tabs-container">
			<Tabs {tabs} active={activeTab} onChange={handleTabChange} />
		</div>

		<div class="tab-content">
			{#if activeTab === 'overview'}
				<div class="overview-tab">
					<h2 class="section-title">Recommended Template</h2>
					<BuildSpecCard buildSpec={data.buildSpec} />

					{#if data.buildSpec.recommended?.tradeoffs && data.buildSpec.recommended.tradeoffs.length > 0}
						<div class="tradeoffs-section">
							<h2 class="section-title">Tradeoffs</h2>
							<ul class="tradeoffs-list">
								{#each data.buildSpec.recommended.tradeoffs as tradeoff}
									<li class="tradeoff-item">{tradeoff}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'alternatives'}
				<div class="alternatives-tab">
					<h2 class="section-title">Alternative Templates</h2>
					<p class="section-description">
						Other templates that could work for your project, ranked by match score.
					</p>
					<AlternativesList alternatives={data.buildSpec.alternatives || []} />
				</div>
			{:else if activeTab === 'json'}
				<div class="json-tab">
					<JsonViewer json={data.buildSpec} />
				</div>
			{/if}
		</div>
	{:else}
		<div class="empty-state">
			<p>Build specification not found.</p>
			<button class="back-button" onclick={handleBack}>← Back to Build Specs</button>
		</div>
	{/if}
</div>

<style>
	.build-spec-detail {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
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

	.page-header {
		margin-bottom: 2rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.back-button:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 3%, var(--color-bg));
	}

	.back-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.header-meta {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.tabs-container {
		margin-bottom: 2rem;
	}

	.tab-content {
		/* Content varies by tab */
	}

	.overview-tab,
	.alternatives-tab,
	.json-tab {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.section-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: -1rem 0 0 0;
	}

	.tradeoffs-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tradeoffs-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tradeoff-item {
		padding: 0.75rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.5;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-secondary);
	}

	.empty-state p {
		font-size: 1rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 768px) {
		.header-top {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
