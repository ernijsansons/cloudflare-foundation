<script lang="ts">
	interface Stat {
		label: string;
		value: string | number;
		previousValue?: string | number;
		trend?: 'up' | 'down' | 'same';
		trendValue?: string;
		icon?: string;
		color?: string;
		href?: string;
	}

	interface Props {
		stats: Stat[];
		columns?: 2 | 3 | 4;
	}

	let { stats, columns = 4 }: Props = $props();

	function getTrendClass(trend: 'up' | 'down' | 'same' | undefined): string {
		switch (trend) {
			case 'up':
				return 'trend-up';
			case 'down':
				return 'trend-down';
			default:
				return 'trend-same';
		}
	}

	function getTrendIcon(trend: 'up' | 'down' | 'same' | undefined): string {
		switch (trend) {
			case 'up':
				return '↑';
			case 'down':
				return '↓';
			default:
				return '→';
		}
	}
</script>

<div class="quick-stats" style="--columns: {columns}">
	{#each stats as stat}
		{#if stat.href}
			<a href={stat.href} class="stat-card clickable">
				<div class="stat-header">
					{#if stat.icon}
						<span class="stat-icon">{stat.icon}</span>
					{/if}
					<span class="stat-label">{stat.label}</span>
				</div>

				<div class="stat-body">
					<span class="stat-value" style:color={stat.color}>{stat.value}</span>

					{#if stat.trend && stat.trendValue}
						<span class="stat-trend {getTrendClass(stat.trend)}">
							<span class="trend-icon">{getTrendIcon(stat.trend)}</span>
							<span class="trend-value">{stat.trendValue}</span>
						</span>
					{/if}
				</div>

				{#if stat.previousValue !== undefined}
					<span class="stat-previous">Previous: {stat.previousValue}</span>
				{/if}
			</a>
		{:else}
			<div class="stat-card">
				<div class="stat-header">
					{#if stat.icon}
						<span class="stat-icon">{stat.icon}</span>
					{/if}
					<span class="stat-label">{stat.label}</span>
				</div>

				<div class="stat-body">
					<span class="stat-value" style:color={stat.color}>{stat.value}</span>

					{#if stat.trend && stat.trendValue}
						<span class="stat-trend {getTrendClass(stat.trend)}">
							<span class="trend-icon">{getTrendIcon(stat.trend)}</span>
							<span class="trend-value">{stat.trendValue}</span>
						</span>
					{/if}
				</div>

				{#if stat.previousValue !== undefined}
					<span class="stat-previous">Previous: {stat.previousValue}</span>
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.quick-stats {
		display: grid;
		grid-template-columns: repeat(var(--columns, 4), 1fr);
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary, #f9fafb);
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.stat-card.clickable:hover {
		border-color: var(--color-primary, #6366f1);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stat-icon {
		font-size: 1.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, #6b7280);
	}

	.stat-body {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		line-height: 1;
	}

	.stat-trend {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.trend-up {
		background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
		color: var(--color-success, #10b981);
	}

	.trend-down {
		background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
		color: var(--color-error, #ef4444);
	}

	.trend-same {
		background: var(--color-bg-tertiary, #f3f4f6);
		color: var(--color-text-muted, #6b7280);
	}

	.trend-icon {
		font-size: 0.875rem;
	}

	.stat-previous {
		font-size: 0.6875rem;
		color: var(--color-text-subtle, #9ca3af);
	}

	@media (max-width: 1024px) {
		.quick-stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.quick-stats {
			grid-template-columns: 1fr;
		}

		.stat-value {
			font-size: 1.75rem;
		}
	}

	@media (prefers-color-scheme: dark) {
		.trend-same {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}
	}
</style>
