<script lang="ts">
	import { getQualityColor, getQualityLabel } from '$lib/design-system';

	interface Props {
		label: string;
		min?: number;
		max?: number;
		step?: number;
		value: [number, number];
		showQualityColors?: boolean;
		onChange?: (_value: [number, number]) => void;
	}

	let {
		label,
		min = 0,
		max = 100,
		step = 1,
		value,
		showQualityColors = false,
		onChange
	}: Props = $props();

	let isCollapsed = $state(false);

	// Track values independently for dual-thumb slider
	let minValue = $derived(value[0]);
	let maxValue = $derived(value[1]);

	function handleMinChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newMin = Math.min(Number(target.value), maxValue - step);
		onChange?.([newMin, maxValue]);
	}

	function handleMaxChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newMax = Math.max(Number(target.value), minValue + step);
		onChange?.([minValue, newMax]);
	}

	const percentMin = $derived(((minValue - min) / (max - min)) * 100);
	const percentMax = $derived(((maxValue - min) / (max - min)) * 100);

	const rangeGradient = $derived(
		showQualityColors
			? `linear-gradient(to right,
					${getQualityColor(0)} 0%,
					${getQualityColor(20)} 20%,
					${getQualityColor(40)} 40%,
					${getQualityColor(60)} 60%,
					${getQualityColor(80)} 80%,
					${getQualityColor(100)} 100%)`
			: `linear-gradient(to right,
					var(--color-bg-tertiary) 0%,
					var(--color-bg-tertiary) ${percentMin}%,
					var(--color-primary) ${percentMin}%,
					var(--color-primary) ${percentMax}%,
					var(--color-bg-tertiary) ${percentMax}%,
					var(--color-bg-tertiary) 100%)`
	);
</script>

<div class="filter-group">
	<button
		class="filter-header"
		type="button"
		onclick={() => (isCollapsed = !isCollapsed)}
		aria-expanded={!isCollapsed}
	>
		<span class="filter-label">{label}</span>
		<span class="filter-toggle" class:collapsed={isCollapsed}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</span>
	</button>

	{#if !isCollapsed}
		<div class="filter-content">
			<div class="range-values">
				<span class="range-value">
					{minValue}
					{#if showQualityColors}
						<span class="quality-label" style:color={getQualityColor(minValue)}>
							{getQualityLabel(minValue)}
						</span>
					{/if}
				</span>
				<span class="range-separator">—</span>
				<span class="range-value">
					{maxValue}
					{#if showQualityColors}
						<span class="quality-label" style:color={getQualityColor(maxValue)}>
							{getQualityLabel(maxValue)}
						</span>
					{/if}
				</span>
			</div>

			<div class="range-slider" style:--range-gradient={rangeGradient}>
				<div class="range-track"></div>
				<div
					class="range-fill"
					style:left="{percentMin}%"
					style:width="{percentMax - percentMin}%"
				></div>
				<input
					type="range"
					{min}
					{max}
					{step}
					value={minValue}
					oninput={handleMinChange}
					class="range-input range-min"
					aria-label="Minimum value"
				/>
				<input
					type="range"
					{min}
					{max}
					{step}
					value={maxValue}
					oninput={handleMaxChange}
					class="range-input range-max"
					aria-label="Maximum value"
				/>
			</div>

			{#if showQualityColors}
				<div class="quality-scale">
					<span style:color={getQualityColor(0)}>Critical</span>
					<span style:color={getQualityColor(50)}>Fair</span>
					<span style:color={getQualityColor(100)}>Excellent</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-group {
		border-bottom: 1px solid var(--color-border, hsl(220, 20%, 90%));
	}

	.filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.875rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		transition: background-color var(--transition-fast, 150ms);
	}

	.filter-header:hover {
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.filter-header:focus-visible {
		outline: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		outline-offset: -2px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
	}

	.filter-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.filter-toggle {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
		transition: transform var(--transition-fast, 150ms);
	}

	.filter-toggle.collapsed {
		transform: rotate(-90deg);
	}

	.filter-content {
		padding: 0.5rem 1rem 1rem;
	}

	.range-values {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.range-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text, #111827);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
	}

	.quality-label {
		font-size: 0.6875rem;
		font-weight: 500;
	}

	.range-separator {
		color: var(--color-text-subtle, hsl(220, 15%, 65%));
	}

	.range-slider {
		position: relative;
		height: 24px;
		margin-bottom: 0.5rem;
	}

	.range-track {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--color-bg-tertiary, hsl(220, 14%, 96%));
		border-radius: 2px;
		transform: translateY(-50%);
	}

	.range-fill {
		position: absolute;
		top: 50%;
		height: 4px;
		background: var(--color-primary, hsl(212, 100%, 48%));
		border-radius: 2px;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.range-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		pointer-events: none;
		margin: 0;
	}

	.range-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--color-bg, white);
		border: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		border-radius: 50%;
		cursor: pointer;
		pointer-events: auto;
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-fast, 150ms);
	}

	.range-input::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: var(--shadow-md);
	}

	.range-input::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: var(--color-bg, white);
		border: 2px solid var(--color-primary, hsl(212, 100%, 48%));
		border-radius: 50%;
		cursor: pointer;
		pointer-events: auto;
		box-shadow: var(--shadow-sm);
	}

	.quality-scale {
		display: flex;
		justify-content: space-between;
		font-size: 0.6875rem;
		font-weight: 500;
	}

	@media (prefers-color-scheme: dark) {
		.filter-header:hover {
			background: var(--color-bg-tertiary, hsl(0, 0%, 12%));
		}

		.range-input::-webkit-slider-thumb {
			background: var(--color-bg, hsl(0, 0%, 4%));
		}
	}
</style>
