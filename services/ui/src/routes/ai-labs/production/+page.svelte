<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Kanban from "$lib/components/Kanban.svelte";
  import type { PlanningRun, KanbanCard, KanbanColumn } from "$lib/types";

  interface PageData {
    runs: PlanningRun[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Production Kanban columns for tracking implementation progress
  const columns: KanbanColumn[] = [
    { id: "backlog", title: "Backlog", status: "backlog", color: "#6b7280" },
    { id: "in-progress", title: "In Progress", status: "in-progress", color: "#3b82f6" },
    { id: "review", title: "Review", status: "review", color: "#f59e0b" },
    { id: "done", title: "Done", status: "done", color: "#10b981" },
  ];

  // Map completed research runs to production Kanban cards
  // Newly completed runs start in backlog, user can drag to other columns
  const cards = $derived<KanbanCard[]>(
    data.runs.map((run) => ({
      id: run.id,
      title: run.refined_idea ?? run.idea,
      subtitle: run.kill_verdict ? `Verdict: ${run.kill_verdict}` : undefined,
      // For now, all completed runs are in backlog until we add production_status column
      status: "backlog",
      phase: "completed",
      mode: run.mode ?? "cloud",
      metadata: {
        quality_score: run.quality_score,
        revenue_potential: run.revenue_potential,
        package_key: run.package_key,
      },
      createdAt: run.created_at,
    }))
  );

  function handleCardClick(card: KanbanCard) {
    goto(`/ai-labs/research/runs/${card.id}`);
  }
</script>

<svelte:head>
  <title>Production | AI Labs</title>
</svelte:head>

<div class="page-header">
  <h1>Production</h1>
  <p class="subtitle">Track validated ideas through implementation</p>
</div>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
    <p class="error-hint">Make sure the planning service is running and accessible.</p>
  </div>
{:else if data.runs.length === 0}
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </div>
    <p class="empty-title">No ideas in production</p>
    <p class="empty-hint">Complete research runs to add validated ideas to the production pipeline.</p>
  </div>
{:else}
  <Kanban
    {columns}
    {cards}
    onCardClick={handleCardClick}
    emptyMessage="No items in this stage"
  />
{/if}

<style>
  .page-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
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
