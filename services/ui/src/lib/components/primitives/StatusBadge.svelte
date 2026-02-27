<script lang="ts">
	import { getStatusInfo, type StatusVariant } from '$lib/design-system';

	interface Props {
		status: string;
		size?: 'sm' | 'md' | 'lg';
		showIcon?: boolean;
		showDot?: boolean;
		variant?: StatusVariant;
	}

	let {
		status,
		size = 'md',
		showIcon = false,
		showDot = true,
		variant
	}: Props = $props();

	const info = $derived(getStatusInfo(status));
	const effectiveVariant = $derived(variant ?? info.variant);

	// Size-based padding
	const sizeClasses = {
		sm: 'badge-sm',
		md: 'badge-md',
		lg: 'badge-lg'
	};
</script>

<span
	class="status-badge {sizeClasses[size]} variant-{effectiveVariant}"
	style:--badge-color={info.color}
>
	{#if showDot}
		<span class="badge-dot"></span>
	{/if}
	{#if showIcon}
		<span class="badge-icon">{info.icon}</span>
	{/if}
	<span class="badge-label">{info.label}</span>
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-weight: 500;
		border-radius: var(--radius-full, 9999px);
		white-space: nowrap;
	}

	/* Sizes */
	.badge-sm {
		padding: 0.125rem 0.5rem;
		font-size: 0.6875rem;
	}

	.badge-md {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
	}

	.badge-lg {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}

	/* Variants */
	.variant-success {
		background: color-mix(in srgb, var(--color-success, hsl(145, 65%, 45%)) 15%, transparent);
		color: var(--color-success, hsl(145, 65%, 45%));
	}

	.variant-warning {
		background: color-mix(in srgb, var(--color-warning, hsl(45, 85%, 55%)) 15%, transparent);
		color: var(--color-warning, hsl(45, 85%, 55%));
	}

	.variant-error {
		background: color-mix(in srgb, var(--color-error, hsl(0, 75%, 55%)) 15%, transparent);
		color: var(--color-error, hsl(0, 75%, 55%));
	}

	.variant-info {
		background: color-mix(in srgb, var(--color-info, hsl(200, 85%, 55%)) 15%, transparent);
		color: var(--color-info, hsl(200, 85%, 55%));
	}

	.variant-neutral {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		color: var(--color-text-muted, hsl(220, 10%, 45%));
	}

	.variant-default {
		background: var(--color-bg-secondary, hsl(220, 10%, 98%));
		color: var(--color-text, #111827);
	}

	/* Dot */
	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--badge-color);
		flex-shrink: 0;
	}

	.badge-sm .badge-dot {
		width: 5px;
		height: 5px;
	}

	.badge-lg .badge-dot {
		width: 8px;
		height: 8px;
	}

	/* Icon */
	.badge-icon {
		font-size: 0.75em;
		line-height: 1;
	}

	/* Label */
	.badge-label {
		line-height: 1;
	}

	@media (prefers-color-scheme: dark) {
		.variant-success {
			background: color-mix(in srgb, var(--color-success, hsl(145, 65%, 45%)) 20%, transparent);
		}

		.variant-warning {
			background: color-mix(in srgb, var(--color-warning, hsl(45, 85%, 55%)) 20%, transparent);
		}

		.variant-error {
			background: color-mix(in srgb, var(--color-error, hsl(0, 75%, 55%)) 20%, transparent);
		}

		.variant-info {
			background: color-mix(in srgb, var(--color-info, hsl(200, 85%, 55%)) 20%, transparent);
		}

		.variant-neutral {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}

		.variant-default {
			background: var(--color-bg-secondary, hsl(0, 0%, 8%));
		}
	}
</style>
