<script lang="ts">
	import { onMount } from 'svelte';
	import { initWebVitals, logMetrics, reportMetrics, type WebVitalsMetrics } from '$lib/utils/performance';

	let metrics: WebVitalsMetrics = {};
	let isVisible = false;

	onMount(() => {
		// Only show in development
		if (import.meta.env.DEV) {
			isVisible = true;
		}

		const cleanup = initWebVitals((updatedMetrics) => {
			metrics = { ...updatedMetrics };
			logMetrics(metrics);
			reportMetrics(metrics);
		});

		return cleanup;
	});

	function getRatingColor(rating?: 'good' | 'needs-improvement' | 'poor'): string {
		if (!rating) return '#9ca3af';
		switch (rating) {
			case 'good':
				return '#10b981';
			case 'needs-improvement':
				return '#f59e0b';
			case 'poor':
				return '#ef4444';
			default:
				return '#9ca3af';
		}
	}

	function toggleVisibility() {
		isVisible = !isVisible;
	}
</script>

{#if import.meta.env.DEV}
	<div class="performance-monitor" class:collapsed={!isVisible}>
		{#if isVisible}
			<div class="monitor-header">
				<h3>Performance Monitor</h3>
				<button class="toggle-btn" on:click={toggleVisibility} aria-label="Collapse monitor">
					▼
				</button>
			</div>

			<div class="metrics">
				{#if metrics.lcp}
					<div class="metric">
						<div class="metric-label">LCP</div>
						<div class="metric-value" style="color: {getRatingColor(metrics.lcp.rating)}">
							{metrics.lcp.value.toFixed(0)}ms
						</div>
						<div class="metric-rating">{metrics.lcp.rating}</div>
					</div>
				{/if}

				{#if metrics.fid}
					<div class="metric">
						<div class="metric-label">FID</div>
						<div class="metric-value" style="color: {getRatingColor(metrics.fid.rating)}">
							{metrics.fid.value.toFixed(0)}ms
						</div>
						<div class="metric-rating">{metrics.fid.rating}</div>
					</div>
				{/if}

				{#if metrics.cls}
					<div class="metric">
						<div class="metric-label">CLS</div>
						<div class="metric-value" style="color: {getRatingColor(metrics.cls.rating)}">
							{metrics.cls.value.toFixed(3)}
						</div>
						<div class="metric-rating">{metrics.cls.rating}</div>
					</div>
				{/if}

				{#if metrics.fcp}
					<div class="metric">
						<div class="metric-label">FCP</div>
						<div class="metric-value" style="color: {getRatingColor(metrics.fcp.rating)}">
							{metrics.fcp.value.toFixed(0)}ms
						</div>
						<div class="metric-rating">{metrics.fcp.rating}</div>
					</div>
				{/if}

				{#if metrics.ttfb}
					<div class="metric">
						<div class="metric-label">TTFB</div>
						<div class="metric-value" style="color: {getRatingColor(metrics.ttfb.rating)}">
							{metrics.ttfb.value.toFixed(0)}ms
						</div>
						<div class="metric-rating">{metrics.ttfb.rating}</div>
					</div>
				{/if}

				{#if !metrics.lcp && !metrics.fid && !metrics.cls && !metrics.fcp && !metrics.ttfb}
					<div class="loading">Collecting metrics...</div>
				{/if}
			</div>
		{:else}
			<button class="expand-btn" on:click={toggleVisibility} aria-label="Expand monitor">
				📊 Performance
			</button>
		{/if}
	</div>
{/if}

<style>
	.performance-monitor {
		position: fixed;
		bottom: 20px;
		right: 20px;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 1rem;
		z-index: 9999;
		min-width: 280px;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.performance-monitor.collapsed {
		min-width: auto;
		padding: 0;
	}

	.monitor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.monitor-header h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	.toggle-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0.25rem;
		color: #6b7280;
	}

	.toggle-btn:hover {
		color: #111827;
	}

	.expand-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
		transition: transform 0.2s ease;
	}

	.expand-btn:hover {
		transform: translateY(-2px);
	}

	.metrics {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f9fafb;
		border-radius: 6px;
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-value {
		font-size: 1rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
	}

	.metric-rating {
		font-size: 0.625rem;
		color: #9ca3af;
		text-transform: uppercase;
	}

	.loading {
		text-align: center;
		color: #9ca3af;
		font-size: 0.875rem;
		padding: 1rem 0;
	}
</style>
