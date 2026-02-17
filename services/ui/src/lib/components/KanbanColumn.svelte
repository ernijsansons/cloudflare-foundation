<script lang="ts">
  import KanbanCard from "./KanbanCard.svelte";
  import Badge from "./Badge.svelte";
  import type { KanbanCard as CardType } from "$lib/types";

  interface Props {
    title: string;
    color?: string;
    cards: CardType[];
    onCardClick?: (card: CardType) => void;
    emptyMessage?: string;
  }

  let { title, color, cards, onCardClick, emptyMessage = "No items" }: Props = $props();
</script>

<div class="column">
  <header class="column-header">
    <span class="column-title" style:border-left-color={color ?? "var(--color-primary)"}>
      {title}
    </span>
    <Badge count={cards.length} />
  </header>

  <div class="column-cards">
    {#if cards.length === 0}
      <p class="empty">{emptyMessage}</p>
    {:else}
      {#each cards as card (card.id)}
        <KanbanCard {card} onclick={() => onCardClick?.(card)} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .column {
    flex: 0 0 280px;
    background: var(--color-bg-secondary);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .column-header {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border);
  }

  .column-title {
    font-weight: 600;
    font-size: 0.875rem;
    border-left: 3px solid var(--color-primary);
    padding-left: 0.5rem;
  }

  .column-cards {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty {
    color: var(--color-text-subtle);
    font-size: 0.875rem;
    font-style: italic;
    text-align: center;
    padding: 1.5rem 1rem;
  }
</style>
