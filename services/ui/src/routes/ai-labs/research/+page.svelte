<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import AccordionKanban from "$lib/components/AccordionKanban.svelte";
  import CreateModal from "$lib/components/CreateModal.svelte";
  import type { PlanningRun, KanbanCard, KanbanColumn } from "$lib/types";
  import { PHASE_ORDER, phaseDocs } from "$lib/data/phase-docs";

  interface PageData {
    runs: PlanningRun[];
    error: string | null;
  }

  // eslint-disable-next-line no-undef
  const data = $derived($page.data as PageData);

  // eslint-disable-next-line no-undef
  let showCreateModal = $state(false);

  async function handleCreateRun(data: { type: "idea" | "run"; idea: string; mode?: "local" | "cloud" }) {
    // eslint-disable-next-line no-undef
    const res = await fetch("/api/public/planning/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: data.idea, mode: data.mode ?? "cloud" }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to create run");
    }

    // Reload page to show new run
    // eslint-disable-next-line no-undef
    window.location.reload();
  }

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
    "task-reconciliation": "#064e3b",
  };

  // Build 15 columns from PHASE_ORDER
  const columns: KanbanColumn[] = PHASE_ORDER.map((phase) => ({
    id: phase,
    title: phaseDocs[phase].title.replace(" Analysis", "").replace(" & Marketing", "").replace(" & Metrics", ""),
    status: phase,
    color: stageColors[phase],
  }));

  // Filter out killed runs (they go to Parked Ideas page)
  // eslint-disable-next-line no-undef
  const activeRuns = $derived(data.runs.filter((r) => r.status !== "killed" && r.status !== "cancelled"));

  // Map runs to Kanban cards based on their current_phase
  // eslint-disable-next-line no-undef
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
  <div class="header-content">
    <div>
      <h1>Research Pipeline</h1>
      <p class="subtitle">16-stage validation: Discovery → Validation → Strategy → Design → Execution</p>
    </div>
    <button class="start-research-btn" onclick={() => showCreateModal = true}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Start Research
    </button>
  </div>
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
  <AccordionKanban
    {columns}
    {cards}
    onCardClick={handleCardClick}
    emptyMessage="No runs in this status"
  />
{/if}

<CreateModal
  open={showCreateModal}
  onClose={() => showCreateModal = false}
  onSubmit={handleCreateRun}
/>

<style>
  .page-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
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

  .start-research-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .start-research-btn:hover {
    background: var(--color-primary-hover, #7c3aed);
    transform: translateY(-1px);
  }

  .start-research-btn svg {
    flex-shrink: 0;
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
