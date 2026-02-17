<script lang="ts">
  import { page } from "$app/stores";
  import { formatDateTime } from "$lib/utils/format-date";

  interface TaskWithLogs {
    id: string;
    run_id: string;
    repo_url: string;
    agent: string;
    status: string;
    phase?: string;
    vm_id?: string;
    claimed_at?: number;
    started_at?: number;
    completed_at?: number;
    retry_count?: number;
    error?: string;
    created_at: number;
    updated_at?: number;
    logs: Array<{ id: number; phase?: string; level: string; message: string; created_at: number }>;
  }

  interface PageData {
    task: TaskWithLogs | null;
    error: string | null;
  }

  const data = $derived($page.data as PageData);
</script>

<svelte:head>
  <title>Task {data.task?.id?.slice(0, 12) ?? "..."} | Production</title>
</svelte:head>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
    <a href="/ai-labs/production" class="back-link">&larr; Back to Production</a>
  </div>
{:else if data.task}
  <div class="task-detail">
    <header class="task-header">
      <a href="/ai-labs/production" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Production
      </a>
      <div class="task-meta">
        <span class="task-id">#{data.task.id.slice(0, 16)}</span>
        <span class="task-status {data.task.status}">{data.task.status}</span>
        <span class="task-agent">{data.task.agent}</span>
      </div>
    </header>

    <section class="task-info">
      <h2>Task Info</h2>
      <dl>
        <dt>Run ID</dt>
        <dd><a href="/ai-labs/research/runs/{data.task.run_id}">{data.task.run_id}</a></dd>
        <dt>Repo</dt>
        <dd><code>{data.task.repo_url}</code></dd>
        <dt>Phase</dt>
        <dd>{data.task.phase ?? "—"}</dd>
        <dt>Retries</dt>
        <dd>{data.task.retry_count ?? 0}</dd>
        {#if data.task.error}
          <dt>Error</dt>
          <dd class="error-text">{data.task.error}</dd>
        {/if}
        <dt>Created</dt>
        <dd>{formatDateTime(data.task.created_at)}</dd>
        {#if data.task.claimed_at}
          <dt>Claimed</dt>
          <dd>{formatDateTime(data.task.claimed_at)}</dd>
        {/if}
        {#if data.task.completed_at}
          <dt>Completed</dt>
          <dd>{formatDateTime(data.task.completed_at)}</dd>
        {/if}
      </dl>
    </section>

    <section class="task-logs">
      <h2>Execution Logs</h2>
      {#if data.task.logs.length === 0}
        <p class="no-logs">No logs yet.</p>
      {:else}
        <div class="log-stream">
          {#each data.task.logs as log}
            <div class="log-line level-{log.level}">
              <span class="log-time">{formatDateTime(log.created_at)}</span>
              {#if log.phase}
                <span class="log-phase">[{log.phase}]</span>
              {/if}
              <span class="log-message">{log.message}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{:else}
  <div class="loading">Loading...</div>
{/if}

<style>
  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .task-detail {
    padding: 1.5rem;
    max-width: 900px;
  }

  .task-header {
    margin-bottom: 1.5rem;
  }

  .task-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-top: 0.5rem;
  }

  .task-id {
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .task-status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .task-status.pending {
    background: #e5e7eb;
    color: #374151;
  }

  .task-status.running {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .task-status.completed {
    background: #d1fae5;
    color: #047857;
  }

  .task-status.failed {
    background: #fee2e2;
    color: #b91c1c;
  }

  .task-agent {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .task-info,
  .task-logs {
    margin-bottom: 2rem;
  }

  .task-info h2,
  .task-logs h2 {
    font-size: 1rem;
    margin: 0 0 0.75rem;
  }

  .task-info dl {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .task-info dt {
    color: var(--color-text-muted);
  }

  .task-info dd {
    margin: 0;
  }

  .task-info dd code {
    font-size: 0.8125rem;
    word-break: break-all;
  }

  .error-text {
    color: var(--color-error);
  }

  .log-stream {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    font-family: ui-monospace, monospace;
    font-size: 0.8125rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .log-line {
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .log-line:last-child {
    border-bottom: none;
  }

  .log-time {
    color: var(--color-text-muted);
    margin-right: 0.5rem;
  }

  .log-phase {
    color: var(--color-primary);
    margin-right: 0.5rem;
  }

  .log-message {
    color: var(--color-text);
  }

  .log-line.level-error .log-message {
    color: var(--color-error);
  }

  .no-logs {
    color: var(--color-text-muted);
    font-style: italic;
    padding: 1rem;
  }

  .loading {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-muted);
  }
</style>
