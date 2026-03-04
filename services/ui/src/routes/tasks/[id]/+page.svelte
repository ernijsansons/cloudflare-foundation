<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	function formatDateTime(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(start: number, end: number): string {
		const ms = (end - start) * 1000;
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		}
		if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		}
		return `${seconds}s`;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'running':
			case 'active':
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
</script>

<svelte:head>
	<title>Task {data.task?.id?.slice(0, 8) ?? '...'} | Tasks</title>
</svelte:head>

{#if data.error}
	<div class="error-container">
		<div class="error-content">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="12" cy="12" r="10" />
				<line x1="12" y1="8" x2="12" y2="12" />
				<line x1="12" y1="16" x2="12.01" y2="16" />
			</svg>
			<h2>Task Not Found</h2>
			<p>{data.error}</p>
			<a href="/tasks" class="back-button">Back to Tasks</a>
		</div>
	</div>
{:else if data.task}
	<div class="task-detail-page">
		<header class="task-header">
			<a href="/tasks" class="back-link">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Back to Tasks
			</a>

			<div class="task-title-row">
				<h1>{data.task.title || `Task ${data.task.id.slice(0, 12)}`}</h1>
				<span
					class="status-badge"
					style="background-color: color-mix(in srgb, {getStatusColor(data.task.status)} 15%, transparent); color: {getStatusColor(data.task.status)};"
				>
					{data.task.status}
				</span>
			</div>

			<div class="task-meta-row">
				<span class="meta-item">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					{data.task.agent}
				</span>
				{#if data.task.phase}
					<span class="meta-item">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{data.task.phase}
					</span>
				{/if}
				<span class="meta-item mono">ID: {data.task.id.slice(0, 16)}</span>
			</div>
		</header>

		<div class="task-content">
			<div class="info-grid">
				<section class="info-card">
					<h2>Details</h2>
					<dl class="info-list">
						<div class="info-row">
							<dt>Run ID</dt>
							<dd>
								<a href="/ai-labs/research/runs/{data.task.run_id}" class="link">
									{data.task.run_id}
								</a>
							</dd>
						</div>
						<div class="info-row">
							<dt>Repository</dt>
							<dd><code>{data.task.repo_url}</code></dd>
						</div>
						<div class="info-row">
							<dt>Retries</dt>
							<dd>{data.task.retry_count ?? 0}</dd>
						</div>
						{#if data.task.vm_id}
							<div class="info-row">
								<dt>VM ID</dt>
								<dd><code>{data.task.vm_id}</code></dd>
							</div>
						{/if}
					</dl>
				</section>

				<section class="info-card">
					<h2>Timeline</h2>
					<dl class="info-list">
						<div class="info-row">
							<dt>Created</dt>
							<dd>{formatDateTime(data.task.created_at)}</dd>
						</div>
						{#if data.task.claimed_at}
							<div class="info-row">
								<dt>Claimed</dt>
								<dd>{formatDateTime(data.task.claimed_at)}</dd>
							</div>
						{/if}
						{#if data.task.started_at}
							<div class="info-row">
								<dt>Started</dt>
								<dd>{formatDateTime(data.task.started_at)}</dd>
							</div>
						{/if}
						{#if data.task.completed_at}
							<div class="info-row">
								<dt>Completed</dt>
								<dd>{formatDateTime(data.task.completed_at)}</dd>
							</div>
						{/if}
						{#if data.task.started_at && data.task.completed_at}
							<div class="info-row">
								<dt>Duration</dt>
								<dd>{formatDuration(data.task.started_at, data.task.completed_at)}</dd>
							</div>
						{/if}
					</dl>
				</section>
			</div>

			{#if data.task.error}
				<section class="error-section">
					<h2>Error</h2>
					<div class="error-box">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<pre>{data.task.error}</pre>
					</div>
				</section>
			{/if}

			<section class="logs-section">
				<h2>Execution Logs</h2>
				{#if data.task.logs && data.task.logs.length > 0}
					<div class="logs-container">
						{#each data.task.logs as log}
							<div class="log-entry level-{log.level}">
								<span class="log-time">{formatDateTime(log.created_at)}</span>
								{#if log.phase}
									<span class="log-phase">[{log.phase}]</span>
								{/if}
								<span class="log-level">{log.level}</span>
								<span class="log-message">{log.message}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-logs">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<p>No execution logs available yet.</p>
					</div>
				{/if}
			</section>
		</div>
	</div>
{:else}
	<div class="loading">
		<div class="spinner"></div>
		<p>Loading task...</p>
	</div>
{/if}

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: 2rem;
	}

	.error-content {
		text-align: center;
		color: var(--color-text-muted);
	}

	.error-content svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.error-content h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.error-content p {
		margin: 0 0 1.5rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--color-primary);
		color: white;
		border-radius: 6px;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.task-detail-page {
		padding: 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.task-header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-primary);
		text-decoration: none;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.task-title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.task-title-row h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.status-badge {
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.task-meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.meta-item.mono {
		font-family: ui-monospace, monospace;
	}

	.task-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.info-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1.25rem;
	}

	.info-card h2 {
		margin: 0 0 1rem;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.info-row dt {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.info-row dd {
		margin: 0;
		font-size: 0.8125rem;
		text-align: right;
		word-break: break-all;
	}

	.info-row dd code {
		font-size: 0.75rem;
		background: var(--color-bg-tertiary);
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
	}

	.link {
		color: var(--color-primary);
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}

	.error-section {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1.25rem;
	}

	.error-section h2 {
		margin: 0 0 1rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-red);
	}

	.error-box {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: color-mix(in srgb, var(--color-red) 8%, transparent);
		border-radius: 8px;
		color: var(--color-red);
	}

	.error-box svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.error-box pre {
		margin: 0;
		font-size: 0.8125rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.logs-section {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 10px;
		padding: 1.25rem;
	}

	.logs-section h2 {
		margin: 0 0 1rem;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.logs-container {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		max-height: 400px;
		overflow-y: auto;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
	}

	.log-entry {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.log-entry:last-child {
		border-bottom: none;
	}

	.log-time {
		flex-shrink: 0;
		color: var(--color-text-muted);
		font-size: 0.6875rem;
	}

	.log-phase {
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.log-level {
		flex-shrink: 0;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		background: var(--color-bg-tertiary);
		color: var(--color-text-muted);
	}

	.log-entry.level-error .log-level {
		background: color-mix(in srgb, var(--color-red) 15%, transparent);
		color: var(--color-red);
	}

	.log-entry.level-warn .log-level {
		background: color-mix(in srgb, var(--color-amber) 15%, transparent);
		color: var(--color-amber);
	}

	.log-message {
		flex: 1;
		word-break: break-word;
	}

	.log-entry.level-error .log-message {
		color: var(--color-red);
	}

	.no-logs {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.no-logs svg {
		margin-bottom: 0.75rem;
		opacity: 0.5;
	}

	.no-logs p {
		margin: 0;
		font-size: 0.875rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: var(--color-text-muted);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
