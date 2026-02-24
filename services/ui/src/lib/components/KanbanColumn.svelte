<script lang="ts">
  import KanbanCard from "./KanbanCard.svelte";
  import Badge from "./Badge.svelte";
  import type { KanbanCard as CardType } from "$lib/types";

  interface Props {
    title: string;
    status: string;
    color?: string;
    phaseNumber?: number;
    cards: CardType[];
    onCardClick?: (card: CardType) => void;
    onCardMove?: (card: CardType, newStatus: string) => void;
    emptyMessage?: string;
  }

  let { title, status, color, phaseNumber, cards, onCardClick, onCardMove, emptyMessage = "No items" }: Props = $props();

  let isDragOver = $state(false);

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer?.types.includes("application/json")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const raw = e.dataTransfer?.getData("application/json");
    if (!raw || !onCardMove) return;
    try {
      const card = JSON.parse(raw) as CardType;
      onCardMove(card, status);
    } catch {
      // Ignore invalid data
    }
  }
</script>

<div class="column" style:--column-color={color ?? "var(--color-primary)"}>
  <header class="column-header">
    <div class="column-title-wrapper">
      {#if phaseNumber}
        <span class="phase-number">Phase {phaseNumber}</span>
      {/if}
      <span class="column-title">
        {title}
      </span>
    </div>
    <Badge count={cards.length} />
  </header>

  <div
    class="column-cards"
    class:drop-target={isDragOver}
    role="region"
    aria-label="Drop zone for {title}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if cards.length === 0}
      <p class="empty">{emptyMessage}</p>
    {:else}
      {#each cards as card (card.id)}
        <KanbanCard
          {card}
          draggable={!!card.metadata?.task_id}
          onclick={() => onCardClick?.(card)}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .column {
    flex: 0 0 220px;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--column-color) 6%, var(--color-bg-secondary)) 0%,
      var(--color-bg-secondary) 100%
    );
    border: 1px solid color-mix(in srgb, var(--column-color) 12%, var(--color-border));
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.06),
      0 4px 12px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 color-mix(in srgb, var(--column-color) 8%, transparent);
    transition: box-shadow 0.2s ease;
  }

  .column:hover {
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 color-mix(in srgb, var(--column-color) 10%, transparent);
  }

  .column-header {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--column-color) 10%, transparent) 0%,
      transparent 70%
    );
    border-bottom: 1px solid color-mix(in srgb, var(--column-color) 15%, var(--color-border));
    border-radius: 16px 16px 0 0;
  }

  .column-title-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .phase-number {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--column-color) 70%, var(--color-text-muted));
    opacity: 0.85;
  }

  .column-title {
    font-weight: 700;
    font-size: 0.8125rem;
    letter-spacing: -0.01em;
    color: var(--column-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .column-title::before {
    content: "";
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--column-color);
    box-shadow: 0 0 8px color-mix(in srgb, var(--column-color) 60%, transparent);
    flex-shrink: 0;
  }

  .column-cards {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .empty {
    color: var(--color-text-subtle);
    font-size: 0.8125rem;
    font-style: italic;
    text-align: center;
    padding: 2rem 1rem;
    opacity: 0.7;
  }

  .column-cards.drop-target {
    background: color-mix(in srgb, var(--column-color) 10%, transparent);
    border-radius: 12px;
    outline: 2px dashed var(--column-color);
    outline-offset: -4px;
    transition: background 0.15s ease;
  }

  /* Smooth scrollbar styling */
  .column-cards::-webkit-scrollbar {
    width: 4px;
  }

  .column-cards::-webkit-scrollbar-track {
    background: transparent;
  }

  .column-cards::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--column-color) 30%, transparent);
    border-radius: 2px;
  }

  .column-cards::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--column-color) 50%, transparent);
  }
</style>
