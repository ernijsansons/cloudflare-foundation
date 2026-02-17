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
    gap: 1rem;
    padding: 1.5rem;
    padding-bottom: 1rem;
    overflow-x: auto;
    min-height: calc(100vh - var(--topbar-height) - 150px);

    /* Smooth horizontal scroll */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    /* Visible scrollbar styling */
    scrollbar-width: auto;
    scrollbar-color: var(--color-primary) var(--color-bg-secondary);
  }

  .kanban::-webkit-scrollbar {
    height: 14px;
  }

  .kanban::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 7px;
    margin: 0 1rem;
    border: 1px solid var(--color-border);
  }

  .kanban::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981);
    border-radius: 7px;
    border: 3px solid var(--color-bg-secondary);
    min-width: 80px;
  }

  .kanban::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(90deg, #7c3aed, #2563eb, #059669);
  }

  .kanban::-webkit-scrollbar-thumb:active {
    background: linear-gradient(90deg, #6d28d9, #1d4ed8, #047857);
  }
</style>
