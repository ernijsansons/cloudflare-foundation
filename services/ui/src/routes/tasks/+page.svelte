<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Filter state
	let statusFilter = $state<'all' | 'active' | 'completed' | 'failed'>('all');

	// Filtered tasks - handles 'active' filter to include running/pending statuses
	const filteredTasks = $derived(
		statusFilter === 'all'
			? data.tasks
			: statusFilter === 'active'
				? data.tasks.filter((t) => t.status === 'active' || t.status === 'pending' || t.status === 'running')
				: data.tasks.filter((t) => t.status === statusFilter)
	);

	// Stats - use $derived.by for object return
	const stats = $derived.by(() => ({
		total: data.tasks.length,
		active: data.tasks.filter((t) => t.status === 'active' || t.status === 'pending' || t.status === 'running').length,
		completed: data.tasks.filter((t) => t.status === 'completed').length,
		failed: data.tasks.filter((t) => t.status === 'failed').length
	}));

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatDateTime(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
			case 'running':
				return 'var(--color-blue)';
			case 'pending':
				return 'var(--color-amber)';
			case 'completed':
				return 'var(--color-green)';
			case 'failed':
				return 'var(--color-red)';
			case 'review':
				return 'var(--color-purple)';
			default:
				return 'var(--color-text-muted)';
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'active':
			case 'running':
				return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'pending':
				return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'completed':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'failed':
				return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'review':
				return 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z';
			default:
				return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
		}
	}
</script>

<svelte:head>
	<title>Tasks | Dashboard</title>
</svelte:head>

<div class="tasks-page">
	<header class="page-header">
		<div class="header-content">
			<div>
				<h1>Tasks</h1>
				<p class="subtitle">Execution tasks from the production pipeline</p>
			</div>
			<div class="header-actions">
				<a href="/ai-labs/production" class="button-secondary">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					Production Pipeline
				</a>
			</div>
		</div>
	</header>

	<!-- Stats Row -->
	<div class="stats-row">
		<button class="stat-card" class:active={statusFilter === 'all'} onclick={() => statusFilter = 'all'}>
			<span class="stat-value">{stats.total}</span>
			<span class="stat-label">Total Tasks</span>
		</button>
		<button class="stat-card" class:active={statusFilter === 'active'} onclick={() => statusFilter = 'active'}>
			<span class="stat-value" style="color: var(--color-blue)">{stats.active}</span>
			<span class="stat-label">Active</span>
		</button>
		<button class="stat-card" class:active={statusFilter === 'completed'} onclick={() => statusFilter = 'completed'}>
			<span class="stat-value" style="color: var(--color-green)">{stats.completed}</span>
			<span class="stat-label">Completed</span>
		</button>
		<button class="stat-card" class:active={statusFilter === 'failed'} onclick={() => statusFilter = 'failed'}>
			<span class="stat-value" style="color: var(--color-red)">{stats.failed}</span>
			<span class="stat-label">Failed</span>
		</button>
	</div>

	{#if data.error}
		<div class="error-banner">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<span>{data.error}</span>
		</div>
	{/if}

	{#if filteredTasks.length > 0}
		<div class="tasks-grid">
			{#each filteredTasks as task (task.id)}
				<a href="/tasks/{task.id}" class="task-card">
					<div class="task-header">
						<div class="task-icon" style="color: {getStatusColor(task.status)}">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d={getStatusIcon(task.status)} />
							</svg>
						</div>
						<div class="task-info">
							<h3>{task.title || `Task ${task.id.slice(0, 8)}`}</h3>
							<p class="task-meta">
								{#if task.agent}
									<span class="task-agent">{task.agent}</span>
									<span class="separator">-</span>
								{/if}
								{#if task.phase}
									<span class="task-phase">{task.phase}</span>
								{/if}
							</p>
						</div>
						<span
							class="status-badge"
							style="background-color: color-mix(in srgb, {getStatusColor(task.status)} 15%, transparent); color: {getStatusColor(task.status)};"
						>
							{task.status}
						</span>
					</div>

					{#if task.progress_pct !== undefined}
						<div class="task-progress">
							<div class="progress-bar-container">
								<div
									class="progress-bar"
									style="width: {task.progress_pct}%; background-color: {getStatusColor(task.status)};"
								></div>
							</div>
							<span class="progress-percent">{task.progress_pct.toFixed(0)}%</span>
						</div>
					{/if}

					<div class="task-footer">
						{#if task.run_id}
							<span class="run-link">Run: {task.run_id.slice(0, 8)}</span>
						{/if}
						<span class="task-date">{formatDateTime(task.created_at)}</span>
					</div>

					{#if task.error}
						<div class="task-error">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
							<span>{task.error.slice(0, 80)}{task.error.length > 80 ? '...' : ''}</span>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{:else if !data.error}
		<div class="empty-state">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
				/>
			</svg>
			<h3>No Tasks Found</h3>
			{#if statusFilter !== 'all'}
				<p>No {statusFilter} tasks at the moment.</p>
				<button class="button-primary" onclick={() => statusFilter = 'all'}>Show All Tasks</button>
			{:else}
				<p>Tasks will appear here when work is assigned from the production pipeline.</p>
				<a href="/ai-labs/production" class="button-primary">Go to Production</a>
			{/if}
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
		margin-bottom: 1.5rem;
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

	.button-secondary,
	.button-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.15s;
		cursor: pointer;
	}

	.button-secondary {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.button-secondary:hover {
		border-color: var(--color-border-focus);
		background: var(--color-bg-tertiary);
	}

	.button-primary {
		background: var(--color-primary);
		border: 1px solid var(--color-primary);
		color: white;
	}

	.button-primary:hover {
		background: var(--color-primary-hover, #2563eb);
	}

	/* Stats Row */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border: 2px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.stat-card:hover {
		border-color: var(--color-border-focus);
	}

	.stat-card.active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-bg-secondary));
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
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

	.tasks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
		gap: 1rem;
	}

	.task-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		text-decoration: none;
		color: inherit;
		transition: all 0.15s;
	}

	.task-card:hover {
		border-color: var(--color-border-focus);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
	}

	.task-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.task-icon {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
		border-radius: 8px;
	}

	.task-info {
		flex: 1;
		min-width: 0;
	}

	.task-info h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.task-meta {
		margin: 0.25rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.separator {
		color: var(--color-border);
	}

	.status-badge {
		flex-shrink: 0;
		padding: 0.25rem 0.625rem;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.task-progress {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar-container {
		flex: 1;
		height: 6px;
		background: var(--color-bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		transition: width 0.3s;
		border-radius: 3px;
	}

	.progress-percent {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		min-width: 2.5rem;
		text-align: right;
	}

	.task-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.run-link {
		font-family: ui-monospace, monospace;
	}

	.task-error {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.625rem;
		background: color-mix(in srgb, var(--color-red) 8%, transparent);
		border-radius: 6px;
		font-size: 0.75rem;
		color: var(--color-red);
	}

	.task-error svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
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
		margin: 0.5rem 0 1.5rem;
		font-size: 0.9375rem;
	}
</style>
