<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Badge from "$lib/components/Badge.svelte";
  import PortfolioAnalytics from "$lib/components/PortfolioAnalytics.svelte";
  import type { PlanningRun } from "$lib/types";
  import { formatDate } from "$lib/utils/format-date";

  interface PageData {
    runs: PlanningRun[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Calculate summary stats
  const stats = $derived({
    total: data.runs.length,
    running: data.runs.filter((r) => r.status === "running").length,
    completed: data.runs.filter((r) => r.status === "completed").length,
    killed: data.runs.filter((r) => r.status === "killed").length,
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case "running":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "killed":
        return "#ef4444";
      case "paused":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  }

  function handleCardClick(run: PlanningRun) {
    goto(`/ai-labs/research/runs/${run.id}`);
  }
</script>

<svelte:head>
  <title>Portfolio | ERLV Inc</title>
</svelte:head>

<div class="portfolio-page">
  <header class="page-header">
    <h1>Portfolio</h1>
    <p class="subtitle">Overview of all research runs and their status</p>
  </header>

  {#if data.error}
    <div class="error-container">
      <p class="error">{data.error}</p>
      <p class="error-hint">Make sure the planning service is running and accessible.</p>
    </div>
  {:else if data.runs.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>
      <p class="empty-title">No projects yet</p>
      <p class="empty-hint">Start by creating a new idea to begin building your portfolio.</p>
    </div>
  {:else}
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-value">{stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value" style:color="#3b82f6">{stats.running}</span>
        <span class="stat-label">Running</span>
      </div>
      <div class="stat">
        <span class="stat-value" style:color="#10b981">{stats.completed}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat">
        <span class="stat-value" style:color="#ef4444">{stats.killed}</span>
        <span class="stat-label">Killed</span>
      </div>
    </div>

    {#if data.runs && data.runs.length > 0}
      <PortfolioAnalytics runs={data.runs} />
    {/if}

    <div class="grid">
      {#each data.runs as run (run.id)}
        <button class="card" onclick={() => handleCardClick(run)} type="button">
          <div class="card-header">
            <div class="card-status" style:background-color={getStatusColor(run.status)}></div>
            <Badge
              text={run.status}
              variant={run.status === "completed" ? "success" : run.status === "killed" ? "error" : "default"}
            />
          </div>

          <h3 class="card-title">{run.refined_idea ?? run.idea}</h3>

          {#if run.current_phase}
            <p class="card-phase">Phase: {run.current_phase}</p>
          {/if}

          <div class="card-meta">
            {#if run.mode}
              <Badge
                text={run.mode === "local" ? "Local" : "Cloud"}
                size="sm"
                variant={run.mode === "local" ? "info" : "default"}
              />
            {/if}
            {#if run.pivot_count && run.pivot_count > 0}
              <Badge text={`${run.pivot_count} pivots`} size="sm" />
            {/if}
          </div>

          <div class="card-footer">
            <span class="card-date">{formatDate(run.created_at)}</span>
            <span class="card-id">#{run.id.slice(0, 8)}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .portfolio-page {
    padding: 1.5rem;
    max-width: 1400px;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }

  .stats-bar {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }

    .stats-bar {
      flex-wrap: wrap;
      gap: 1rem 2rem;
    }
  }

  .card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
    text-align: left;
    cursor: pointer;
    transition:
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .card:hover {
    border-color: var(--color-border-focus);
    box-shadow: var(--shadow-sm);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .card-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-title {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-phase {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .card-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
    font-size: 0.875rem;
  }

  .error-hint {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border-radius: 8px;
  }

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .empty-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .empty-hint {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    max-width: 400px;
  }
</style>
