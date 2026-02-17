<script lang="ts">
  import KanbanColumn from "./KanbanColumn.svelte";
  import type { KanbanCard, KanbanColumn as ColumnType } from "$lib/types";

  interface Props {
    columns: ColumnType[];
    cards: KanbanCard[];
    onCardClick?: (card: KanbanCard) => void;
    onCardMove?: (card: KanbanCard, newStatus: string) => void;
    emptyMessage?: string;
  }

  let { columns, cards, onCardClick, onCardMove, emptyMessage = "No items" }: Props = $props();

  function getCardsForColumn(status: string): KanbanCard[] {
    return cards.filter((c) => c.status === status);
  }
</script>

<div class="kanban">
  {#each columns as column (column.id)}
    <KanbanColumn
      title={column.title}
      status={column.status}
      color={column.color}
      cards={getCardsForColumn(column.status)}
      {onCardClick}
      {onCardMove}
      {emptyMessage}
    />
  {/each}
</div>

<style>
  .kanban {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    overflow-x: auto;
    min-height: calc(100vh - var(--topbar-height) - 150px);

    /* Smooth horizontal scroll */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    /* Subtle scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .kanban::-webkit-scrollbar {
    height: 8px;
  }

  .kanban::-webkit-scrollbar-track {
    background: transparent;
    margin: 0 1rem;
  }

  .kanban::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .kanban::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-subtle);
    background-clip: padding-box;
  }
</style>
