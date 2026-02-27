<script lang="ts">
	interface Props {
		count: number;
		label: string;
		icon?: string;
		variant?: 'default' | 'primary' | 'success';
	}

	let { count, label, icon, variant = 'default' }: Props = $props();
</script>

<div class="stat-card {variant}">
	<div class="stat-content">
		<div class="stat-count">{count}</div>
		<div class="stat-label">{label}</div>
	</div>
	{#if icon}
		<div class="stat-icon">{icon}</div>
	{/if}
</div>

<style>
	.stat-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		transition: all var(--transition-fast);
	}

	.stat-card:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.stat-card.primary {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg));
	}

	.stat-card.success {
		border-color: var(--color-success);
		background: color-mix(in srgb, var(--color-success) 5%, var(--color-bg));
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-count {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.stat-icon {
		font-size: 2rem;
		opacity: 0.3;
	}
</style>
