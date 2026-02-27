<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		previousValue?: number;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
		icon?: string;
		href?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		label,
		value,
		previousValue,
		trend,
		trendValue,
		icon,
		href,
		size = 'md'
	}: Props = $props();

	// Calculate trend automatically if previousValue is provided
	const calculatedTrend = $derived(() => {
		if (trend) return trend;
		if (previousValue === undefined || typeof value !== 'number') return 'neutral';
		if (value > previousValue) return 'up';
		if (value < previousValue) return 'down';
		return 'neutral';
	});

	// Calculate percentage change
	const percentChange = $derived(() => {
		if (trendValue) return trendValue;
		if (previousValue === undefined || previousValue === 0 || typeof value !== 'number') {
			return null;
		}
		const change = ((value - previousValue) / previousValue) * 100;
		return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
	});

	const trendColor = $derived(() => {
		const t = calculatedTrend();
		if (t === 'up') return 'var(--color-success, hsl(145, 65%, 45%))';
		if (t === 'down') return 'var(--color-error, hsl(0, 75%, 55%))';
		return 'var(--color-text-muted, hsl(220, 10%, 45%))';
	});

	const trendIcon = $derived(() => {
		const t = calculatedTrend();
		if (t === 'up') return '↑';
		if (t === 'down') return '↓';
		return '→';
	});

	const sizeClass = $derived(() => (size === 'sm' ? 'card-sm' : size === 'lg' ? 'card-lg' : 'card-md'));
</script>

{#if href}
	<a class="metric-card {sizeClass()}" {href}>
		{#if icon}
			<span class="metric-icon">{icon}</span>
		{/if}
		<div class="metric-content">
			<span class="metric-label">{label}</span>
			<span class="metric-value">{value}</span>
			{#if percentChange()}
				<span class="metric-trend" style:color={trendColor()}>
					<span class="trend-icon">{trendIcon()}</span>
					<span class="trend-value">{percentChange()}</span>
				</span>
			{/if}
		</div>
	</a>
{:else}
	<div class="metric-card {sizeClass()}">
		{#if icon}
			<span class="metric-icon">{icon}</span>
		{/if}
		<div class="metric-content">
			<span class="metric-label">{label}</span>
			<span class="metric-value">{value}</span>
			{#if percentChange()}
				<span class="metric-trend" style:color={trendColor()}>
					<span class="trend-icon">{trendIcon()}</span>
					<span class="trend-value">{percentChange()}</span>
				</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.metric-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		background: var(--color-bg, white);
		border: 1px solid var(--color-border, hsl(220, 20%, 90%));
		border-radius: var(--radius-lg, 10px);
		text-decoration: none;
		transition: all var(--transition-fast, 150ms);
	}

	a.metric-card:hover {
		border-color: var(--color-primary, hsl(212, 100%, 48%));
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	/* Sizes */
	.card-sm {
		padding: 0.75rem;
	}

	.card-md {
		padding: 1rem;
	}

	.card-lg {
		padding: 1.25rem;
	}

	.metric-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.card-sm .metric-icon {
		font-size: 1.25rem;
	}

	.card-lg .metric-icon {
		font-size: 2rem;
	}

	.metric-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-text-muted, hsl(220, 10%, 45%));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.card-sm .metric-label {
		font-size: 0.6875rem;
	}

	.card-lg .metric-label {
		font-size: 0.8125rem;
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text, #111827);
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.card-sm .metric-value {
		font-size: 1.25rem;
	}

	.card-lg .metric-value {
		font-size: 2rem;
	}

	.metric-trend {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.card-sm .metric-trend {
		font-size: 0.6875rem;
	}

	.trend-icon {
		font-size: 0.875em;
	}

	@media (prefers-color-scheme: dark) {
		.metric-card {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>
