<script lang="ts">
	import { navigationStore } from '$lib/stores';

	interface Props {
		items?: Array<{
			label: string;
			href: string;
			icon?: string;
		}>;
	}

	let { items }: Props = $props();

	// Use prop items if provided, otherwise use store
	const breadcrumbs = $derived(items ?? navigationStore.breadcrumbs);
	const hasItems = $derived(breadcrumbs.length > 0);
</script>

{#if hasItems}
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<ol class="breadcrumb-list">
			{#each breadcrumbs as item, index}
				<li class="breadcrumb-item">
					{#if index > 0}
						<span class="breadcrumb-separator" aria-hidden="true">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</span>
					{/if}

					{#if index === breadcrumbs.length - 1}
						<!-- Current page (last item) -->
						<span class="breadcrumb-current" aria-current="page">
							{#if item.icon}
								<span class="breadcrumb-icon">{item.icon}</span>
							{/if}
							{item.label}
						</span>
					{:else}
						<!-- Link to previous page -->
						<a href={item.href} class="breadcrumb-link">
							{#if item.icon}
								<span class="breadcrumb-icon">{item.icon}</span>
							{/if}
							{item.label}
						</a>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}

<style>
	.breadcrumb {
		padding: 0.75rem 0;
	}

	.breadcrumb-list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.125rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.breadcrumb-item {
		display: flex;
		align-items: center;
	}

	.breadcrumb-separator {
		display: flex;
		align-items: center;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		margin: 0 0.25rem;
	}

	.breadcrumb-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		text-decoration: none;
		border-radius: var(--radius-sm, 4px);
		transition: all var(--transition-fast, 150ms);
	}

	.breadcrumb-link:hover {
		color: var(--color-text, #111827);
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.breadcrumb-current {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text, #111827);
	}

	.breadcrumb-icon {
		font-size: 0.875rem;
	}

	@media (prefers-color-scheme: dark) {
		.breadcrumb-link:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}

	/* Truncate long breadcrumb items on small screens */
	@media (max-width: 640px) {
		.breadcrumb-link,
		.breadcrumb-current {
			max-width: 120px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
</style>
