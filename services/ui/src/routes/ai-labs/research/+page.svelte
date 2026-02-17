<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Kanban from "$lib/components/Kanban.svelte";
  import type { PlanningRun, KanbanCard, KanbanColumn } from "$lib/types";
  import { PHASE_ORDER, phaseDocs } from "$lib/data/phase-docs";

  interface PageData {
    runs: PlanningRun[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Stage colors for visual grouping (matching the 5 stages)
  const stageColors: Record<string, string> = {
    // Discovery (phases 1-4): Violet shades
    "opportunity": "#8b5cf6",
    "customer-intel": "#7c3aed",
    "market-research": "#6d28d9",
    "competitive-intel": "#5b21b6",
    // Validation (phase 5): Red/Orange - critical decision point
    "kill-test": "#ef4444",
    // Strategy (phases 6-8): Blue shades
    "revenue-expansion": "#3b82f6",
    "strategy": "#2563eb",
    "business-model": "#1d4ed8",
    // Design (phases 9-11): Amber/Orange shades
    "product-design": "#f59e0b",
    "gtm-marketing": "#d97706",
    "content-engine": "#b45309",
    // Execution (phases 12-15): Green shades
    "tech-arch": "#10b981",
    "analytics": "#059669",
    "launch-execution": "#047857",
    "synthesis": "#065f46",
  };

  // Build 15 columns from PHASE_ORDER
  const columns: KanbanColumn[] = PHASE_ORDER.map((phase) => ({
    id: phase,
    title: phaseDocs[phase].title.replace(" Analysis", "").replace(" & Marketing", "").replace(" & Metrics", ""),
    status: phase,
    color: stageColors[phase],
  }));

  // Filter out killed runs (they go to Parked Ideas page)
  const activeRuns = $derived(data.runs.filter((r) => r.status !== "killed"));

  // Map runs to Kanban cards based on their current_phase
  const cards = $derived<KanbanCard[]>(
    activeRuns.map((run) => {
      // Use current_phase if available, otherwise "opportunity" for new runs
      const phase = run.current_phase ?? "opportunity";

      return {
        id: run.id,
        title: run.refined_idea ?? run.idea,
        subtitle: run.status === "paused" ? "⏸ Paused" : run.status === "completed" ? "✓ Completed" : undefined,
        status: phase,
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
  <h1>Research Pipeline</h1>
  <p class="subtitle">15-phase validation: Discovery → Validation → Strategy → Design → Execution</p>
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
