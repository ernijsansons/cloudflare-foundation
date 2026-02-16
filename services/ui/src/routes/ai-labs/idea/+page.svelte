<script lang="ts">
  import { page } from "$app/stores";
  import Kanban from "$lib/components/Kanban.svelte";
  import CardDetailPanel from "$lib/components/CardDetailPanel.svelte";
  import type { ParkedIdea, KanbanCard, KanbanColumn } from "$lib/types";

  interface PageData {
    ideas: ParkedIdea[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Define columns for ideas
  const columns: KanbanColumn[] = [
    { id: "parked", title: "Parked", status: "parked", color: "#f59e0b" },
  ];

  // Map ideas to Kanban cards
  const cards = $derived<KanbanCard[]>(
    data.ideas.map((idea) => ({
      id: idea.id,
      title: idea.refined_idea ?? idea.idea,
      subtitle: idea.reason,
      status: "parked",
      phase: idea.source_phase,
      metadata: {
        revisit_months: idea.revisit_estimate_months,
        revisit_note: idea.revisit_estimate_note,
        run_id: idea.run_id,
      },
      createdAt: idea.created_at,
    }))
  );

  let selectedCard: KanbanCard | null = $state(null);
  let panelOpen = $state(false);

  function handleCardClick(card: KanbanCard) {
    selectedCard = card;
    panelOpen = true;
  }

  function handlePanelClose() {
    panelOpen = false;
    selectedCard = null;
  }
</script>

<svelte:head>
  <title>Ideas | AI Labs</title>
</svelte:head>

<div class="page-header">
  <h1>Ideas</h1>
  <p class="subtitle">Browse parked ideas from killed or pivoted runs</p>
</div>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
  </div>
{:else if data.ideas.length === 0}
  <div class="empty-state">
    <p>No parked ideas yet.</p>
    <p class="hint">Ideas are parked when a research run is killed or pivoted.</p>
  </div>
{:else}
  <Kanban
    {columns}
    {cards}
    onCardClick={handleCardClick}
    emptyMessage="No ideas"
  />
{/if}

<CardDetailPanel
  open={panelOpen}
  card={selectedCard}
  onClose={handlePanelClose}
>
  {#if selectedCard?.metadata}
    <div class="detail-section">
      {#if selectedCard.metadata.revisit_months}
        <h4>Revisit In</h4>
        <p>{selectedCard.metadata.revisit_months} months</p>
      {/if}
      {#if selectedCard.metadata.revisit_note}
        <h4>Note</h4>
        <p>{selectedCard.metadata.revisit_note}</p>
      {/if}
      {#if selectedCard.metadata.run_id}
        <a href="/ai-labs/research/runs/{selectedCard.metadata.run_id}" class="view-run">
          View Original Run
        </a>
      {/if}
    </div>
  {/if}
</CardDetailPanel>

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
  }

  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-muted);
  }

  .empty-state p {
    margin: 0;
  }

  .hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .detail-section h4 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin: 0 0 0.25rem;
  }

  .detail-section p {
    margin: 0 0 1rem;
    color: var(--color-text);
  }

  .view-run {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .view-run:hover {
    border-color: var(--color-border-focus);
    text-decoration: none;
  }
</style>
