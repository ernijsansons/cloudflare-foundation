<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'var(--color-blue)';
			case 'completed':
				return 'var(--color-green)';
			case 'failed':
				return 'var(--color-red)';
			default:
				return 'var(--color-text-muted)';
		}
	}

	function getRoadmapTypeIcon(type: string): string {
		switch (type) {
			case 'research':
				return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
			case 'development':
				return 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4';
			case 'deployment':
				return 'M5 12h14M12 5l7 7-7 7';
			default:
				return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
		}
	}
</script>

<svelte:head>
	<title>Tasks & Roadmaps | Naomi Dashboard</title>
</svelte:head>

<div class="tasks-page">
	<header class="page-header">
		<div class="header-content">
			<div>
				<h1>Tasks & Roadmaps</h1>
				<p class="subtitle">Active task roadmaps from Naomi's delegation system</p>
			</div>
			<div class="header-actions">
				<a href="/agents" class="button-secondary">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					</svg>
					View Agents
				</a>
			</div>
		</div>
	</header>

	{#if data.error}
		<div class="error-banner">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>{data.error}</span>
		</div>
	{/if}

	{#if data.roadmaps.length > 0}
		<div class="roadmaps-grid">
			{#each data.roadmaps as roadmap}
				<div class="roadmap-card">
					<div class="roadmap-header">
						<div class="roadmap-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path d={getRoadmapTypeIcon(roadmap.roadmap_type)} />
							</svg>
						</div>
						<div class="roadmap-info">
							<h3>{roadmap.title || roadmap.roadmap_id}</h3>
							<p class="roadmap-meta">
								<span class="roadmap-type">{roadmap.roadmap_type}</span>
								<span class="separator">•</span>
								<span class="roadmap-owner">{roadmap.owner_id}</span>
							</p>
						</div>
					</div>

					<div class="roadmap-progress">
						<div class="progress-header">
							<span class="progress-label">Progress</span>
							<span class="progress-percent">{roadmap.progress_pct.toFixed(0)}%</span>
						</div>
						<div class="progress-bar-container">
							<div
								class="progress-bar"
								style="width: {roadmap.progress_pct}%; background-color: {getStatusColor(
									roadmap.status
								)};"
							></div>
						</div>
					</div>

					<div class="roadmap-footer">
						<span
							class="status-badge"
							style="background-color: color-mix(in srgb, {getStatusColor(
								roadmap.status
							)} 15%, transparent); color: {getStatusColor(roadmap.status)};"
						>
							{roadmap.status}
						</span>
						<span class="created-date">{formatDate(roadmap.created_at)}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else if !data.error}
		<div class="empty-state">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
				/>
			</svg>
			<h3>No Active Tasks</h3>
			<p>There are currently no active task roadmaps.</p>
			<p class="empty-subtitle">Tasks will appear here when Naomi delegates work to agents.</p>
		</div>
	{/if}
</div>

<style>
	.tasks-page {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.subtitle {
		color: var(--color-text-muted);
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.button-secondary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all var(--transition-fast);
	}

	.button-secondary:hover {
		border-color: var(--color-border-focus);
		background: var(--color-bg-tertiary);
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: color-mix(in srgb, var(--color-red) 10%, transparent);
		border: 1px solid var(--color-red);
		border-radius: 8px;
		color: var(--color-red);
		margin-bottom: 1.5rem;
	}

	.roadmaps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.25rem;
	}

	.roadmap-card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.roadmap-card:hover {
		border-color: var(--color-border-focus);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.roadmap-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.roadmap-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		color: var(--color-primary);
		border-radius: 10px;
	}

	.roadmap-info h3 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.roadmap-meta {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.roadmap-type {
		text-transform: capitalize;
	}

	.separator {
		color: var(--color-border);
	}

	.roadmap-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.progress-percent {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.progress-bar-container {
		height: 8px;
		background: var(--color-bg-tertiary);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		transition: width var(--transition-normal);
		border-radius: 4px;
	}

	.roadmap-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.created-date {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.empty-state svg {
		margin-bottom: 1.5rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 0.9375rem;
	}

	.empty-subtitle {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	:root {
		--color-primary: #3b82f6;
		--color-blue: #3b82f6;
		--color-green: #10b981;
		--color-red: #ef4444;
	}
</style>
