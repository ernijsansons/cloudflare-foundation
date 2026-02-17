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

  // Pipeline columns: Ideas → Research → Production
  const columns: KanbanColumn[] = [
    { id: "idea", title: "Ideas", status: "idea", color: "#8b5cf6" },         // Violet
    { id: "research", title: "Research", status: "research", color: "#3b82f6" }, // Blue
    { id: "production", title: "Production", status: "production", color: "#10b981" }, // Green
  ];

  // Filter out killed runs (they go to Parked Ideas page)
  const activeRuns = $derived(data.runs.filter((r) => r.status !== "killed"));

  // Map runs to Kanban cards with pipeline status
  const cards = $derived<KanbanCard[]>(
    activeRuns.map((run) => {
      // Map API status to pipeline column
      const pipelineStatus =
        run.status === "completed" ? "production" :
        run.status === "running" || run.status === "paused" ? "research" :
        "idea";

      return {
        id: run.id,
        title: run.refined_idea ?? run.idea,
        subtitle: run.current_phase ? `Phase: ${run.current_phase}` : undefined,
        status: pipelineStatus,
        phase: run.current_phase,
        mode: run.mode ?? "cloud",
        metadata: {
          quality_score: run.quality_score,
          revenue_potential: run.revenue_potential,
          kill_verdict: run.kill_verdict,
        },
        createdAt: run.created_at,
      };
    })
  );

  function handleCardClick(card: KanbanCard) {
    // Navigate directly to the detail page
    goto(`/ai-labs/research/runs/${card.id}`);
  }
</script>

<svelte:head>
  <title>Research | ERLV Inc</title>
</svelte:head>

<div class="page-header">
  <h1>Pipeline</h1>
  <p class="subtitle">Ideas → Research → Production</p>
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
        <path d="M9 3h6v7l4 9H5l4-9V3z" />
        <path d="M9 3h6" />
      </svg>
    </div>
    <p class="empty-title">No research runs yet</p>
    <p class="empty-hint">Start by creating a new idea in the Ideas section, then promote it to research.</p>
  </div>
{:else}
  <Kanban
    {columns}
    {cards}
    onCardClick={handleCardClick}
    emptyMessage="No runs in this status"
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
