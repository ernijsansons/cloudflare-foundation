<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		variant?: 'default' | 'bordered' | 'elevated';
		children: Snippet;
	}

	let { title, variant = 'default', children }: Props = $props();
</script>

<div class="detail-panel {variant}">
	<h3 class="panel-title">{title}</h3>
	<div class="panel-content">
		{@render children()}
	</div>
</div>

<style>
	.detail-panel {
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		background: var(--color-bg);
	}

	.detail-panel.bordered {
		border: 1px solid var(--color-border);
	}

	.detail-panel.elevated {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 1rem 0;
	}

	.panel-content {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.6;
	}
</style>
