<script lang="ts">
	import { goto } from '$app/navigation';
	import DetailPanel from '$lib/components/DetailPanel.svelte';
	import CostBreakdown from '$lib/components/CostBreakdown.svelte';
	import BindingsList from '$lib/components/BindingsList.svelte';
	import TradeoffsList from '$lib/components/TradeoffsList.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let { data } = $props();

	function handleBack() {
		goto('/factory/templates');
	}

	function getComplexityBadgeVariant(complexity: string): 'default' | 'success' | 'warning' | 'error' {
		if (complexity === 'low') return 'success';
		if (complexity === 'medium') return 'warning';
		if (complexity === 'high') return 'error';
		return 'default';
	}

	function getSourceBadgeVariant(source: string): 'default' | 'primary' {
		if (source === 'cloudflare') return 'primary';
		return 'default';
	}

	function copyC3Command() {
		if (data.template?.c3_command) {
			navigator.clipboard.writeText(data.template.c3_command);
		}
	}
</script>

<div class="template-detail">
	{#if data.error}
		<div class="error-banner">
			<strong>Error:</strong>
			{data.error}
		</div>
	{:else if data.template}
		<header class="page-header">
			<button class="back-button" onclick={handleBack}>
				<span class="back-icon">←</span>
				<span>Templates</span>
			</button>

			<div class="header-content">
				<div class="header-top">
					<h1>{data.template.name}</h1>
					<div class="header-badges">
						<Badge variant={getSourceBadgeVariant(data.template.source)}>
							{data.template.source}
						</Badge>
						<Badge variant={getComplexityBadgeVariant(data.template.complexity)}>
							{data.template.complexity}
						</Badge>
						<Badge variant="default">{data.template.category}</Badge>
					</div>
				</div>
				<p class="template-description">{data.template.description}</p>
				<p class="template-best-for"><strong>Best for:</strong> {data.template.best_for}</p>
			</div>
		</header>

		<div class="content-grid">
			<div class="main-column">
				<DetailPanel title="Overview" variant="bordered">
					{#snippet children()}
						<div class="overview-content">
							<div class="info-row">
								<span class="info-label">Framework:</span>
								<span class="info-value">{data.template.framework}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Complexity:</span>
								<span class="info-value">{data.template.complexity} (
									{data.template.complexity === 'low' ? '1-2/5' :
									 data.template.complexity === 'medium' ? '3/5' : '4-5/5'}
								)</span>
							</div>
							<div class="info-row">
								<span class="info-label">Category:</span>
								<span class="info-value">{data.template.category}</span>
							</div>
						</div>
					{/snippet}
				</DetailPanel>

				<DetailPanel title="Required Bindings" variant="bordered">
					{#snippet children()}
						<BindingsList bindings={data.template.bindings} />
					{/snippet}
				</DetailPanel>

				<DetailPanel title="Tradeoffs" variant="bordered">
					{#snippet children()}
						<TradeoffsList tradeoffs={data.template.tradeoffs} />
					{/snippet}
				</DetailPanel>
			</div>

			<div class="sidebar-column">
				<DetailPanel title="Cost Breakdown" variant="elevated">
					{#snippet children()}
						<CostBreakdown
							low={data.template.cost_low}
							mid={data.template.cost_mid}
							high={data.template.cost_high}
							notes={data.template.cost_notes}
						/>
					{/snippet}
				</DetailPanel>

				<DetailPanel title="Tags" variant="elevated">
					{#snippet children()}
						<div class="tags-container">
							{#each data.template.tags as tag}
								<Badge variant="default">{tag}</Badge>
							{/each}
						</div>
					{/snippet}
				</DetailPanel>

				{#if data.template.c3_command}
					<div class="action-card">
						<h3>Use This Template</h3>
						<p class="action-description">
							Create a new project with this template using Cloudflare's C3 tool:
						</p>
						<div class="command-block">
							<code>{data.template.c3_command}</code>
							<button class="copy-button" onclick={copyC3Command} title="Copy command">
								📋
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="empty-state">
			<p>Template not found.</p>
			<button class="back-button" onclick={handleBack}>← Back to Templates</button>
		</div>
	{/if}
</div>

<style>
	.template-detail {
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
		gap: 0.75rem;
	}

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		margin: 0;
	}

	.header-badges {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.template-description {
		font-size: 1rem;
		color: var(--color-text);
		line-height: 1.6;
		margin: 0;
	}

	.template-best-for {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
	}

	.main-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.sidebar-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.overview-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.info-label {
		font-weight: 600;
		color: var(--color-text-secondary);
		min-width: 100px;
	}

	.info-value {
		color: var(--color-text);
	}

	.tags-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.action-card {
		padding: 1.5rem;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.action-card h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.5rem 0;
	}

	.action-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.command-block {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.813rem;
	}

	.command-block code {
		flex: 1;
		color: var(--color-text);
		word-break: break-all;
	}

	.copy-button {
		flex-shrink: 0;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		opacity: 0.6;
		transition: opacity var(--transition-fast);
	}

	.copy-button:hover {
		opacity: 1;
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

	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.header-top {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
