<script lang="ts">
  import Badge from "./Badge.svelte";
  import type { KanbanCard as CardType } from "$lib/types";
  import { formatDate } from "$lib/utils/format-date";

  interface Props {
    card: CardType;
    onclick?: () => void;
  }

  let { card, onclick }: Props = $props();
</script>

<button class="card" {onclick} type="button">
  <div class="card-header">
    <h3 class="card-title">{card.title}</h3>
    <div class="card-badges">
      {#if card.mode}
        <Badge
          text={card.mode === "local" ? "Local" : "Cloud"}
          size="sm"
          variant={card.mode === "local" ? "info" : "default"}
        />
      {/if}
      {#if card.phase}
        <Badge text={card.phase} size="sm" />
      {/if}
    </div>
  </div>

  {#if card.subtitle}
    <p class="card-subtitle">{card.subtitle}</p>
  {/if}

  <div class="card-footer">
    {#if card.createdAt}
      <span class="card-date">{formatDate(card.createdAt)}</span>
    {/if}
    <span class="card-id">#{card.id.slice(0, 8)}</span>
  </div>
</button>

<style>
  .card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition:
      box-shadow var(--transition-fast),
      border-color var(--transition-fast),
      transform var(--transition-fast);
    width: 100%;
  }

  .card:hover {
    border-color: var(--color-border-focus);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .card-badges {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
  }
</style>
