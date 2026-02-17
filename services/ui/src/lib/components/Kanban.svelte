<script lang="ts">
  import KanbanColumn from "./KanbanColumn.svelte";
  import type { KanbanCard, KanbanColumn as ColumnType } from "$lib/types";

  interface Props {
    columns: ColumnType[];
    cards: KanbanCard[];
    onCardClick?: (card: KanbanCard) => void;
    emptyMessage?: string;
  }

  let { columns, cards, onCardClick, emptyMessage = "No items" }: Props = $props();

  function getCardsForColumn(status: string): KanbanCard[] {
    return cards.filter((c) => c.status === status);
  }
</script>

<div class="kanban">
  {#each columns as column (column.id)}
    <KanbanColumn
      title={column.title}
      color={column.color}
      cards={getCardsForColumn(column.status)}
      {onCardClick}
      {emptyMessage}
    />
  {/each}
</div>

<style>
  .kanban {
    display: flex;
    gap: 1.25rem;
    padding: 1rem;
    overflow-x: auto;
    min-height: calc(100vh - var(--topbar-height) - 150px);
  }
</style>
