<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		icon?: string;
		title: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
		variant?: 'default' | 'compact' | 'card';
		children?: Snippet;
	}

	let {
		icon = '📭',
		title,
		description,
		actionLabel,
		actionHref,
		onAction,
		variant = 'default',
		children
	}: Props = $props();
</script>

<div class="empty-state variant-{variant}">
	<span class="empty-icon">{icon}</span>
	<h3 class="empty-title">{title}</h3>

	{#if description}
		<p class="empty-description">{description}</p>
	{/if}

	{#if children}
		<div class="empty-content">
			{@render children()}
		</div>
	{/if}

	{#if actionLabel}
		{#if actionHref}
			<a class="empty-action" href={actionHref}>
				{actionLabel}
			</a>
		{:else if onAction}
			<button class="empty-action" type="button" onclick={onAction}>
				{actionLabel}
			</button>
		{/if}
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 3rem 2rem;
	}

	.variant-compact {
		padding: 2rem 1.5rem;
	}

	.variant-card {
		padding: 2rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-lg, 10px);
	}

	.empty-icon {
		font-size: 3rem;
		line-height: 1;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.variant-compact .empty-icon {
		font-size: 2rem;
		margin-bottom: 0.75rem;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		margin: 0 0 0.5rem;
	}

	.variant-compact .empty-title {
		font-size: 1rem;
	}

	.empty-description {
		font-size: 0.875rem;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		margin: 0 0 1.5rem;
		max-width: 360px;
		line-height: 1.5;
	}

	.variant-compact .empty-description {
		font-size: 0.8125rem;
		margin-bottom: 1rem;
	}

	.empty-content {
		margin-bottom: 1.5rem;
	}

	.empty-action {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1.25rem;
		background: var(--color-primary, hsl(212, 100%, 48%));
		color: white;
		border: none;
		border-radius: var(--radius-md, 6px);
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all var(--transition-fast, 150ms);
	}

	.empty-action:hover {
		background: var(--color-primary-hover, hsl(212, 100%, 40%));
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.variant-compact .empty-action {
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
	}

	@media (prefers-color-scheme: dark) {
		.variant-card {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>
