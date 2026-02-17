<script lang="ts">
  import Badge from "./Badge.svelte";
  import type { KanbanCard as CardType } from "$lib/types";
  import { formatDate } from "$lib/utils/format-date";

  interface Props {
    card: CardType;
    onclick?: () => void;
    draggable?: boolean;
  }

  let { card, onclick, draggable = false }: Props = $props();
  let isDragging = $state(false);

  function handleDragStart(e: DragEvent) {
    if (!draggable || !e.dataTransfer) return;
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
    isDragging = true;
  }

  function handleDragEnd() {
    isDragging = false;
  }
</script>

<button
  class="card"
  class:dragging={isDragging}
  {onclick}
  type="button"
  draggable={draggable}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  title={draggable ? undefined : "Assign to Naomi to move"}
>
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
    border-radius: 10px;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 2px 6px rgba(0, 0, 0, 0.04);
    transition:
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.2s ease,
      border-color 0.2s ease;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  /* Subtle gradient overlay on hover */
  .card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      transparent 0%,
      color-mix(in srgb, var(--color-primary) 3%, transparent) 100%
    );
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .card:hover::before {
    opacity: 1;
  }

  .card:hover {
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
    box-shadow:
      0 8px 25px -5px rgba(0, 0, 0, 0.12),
      0 4px 10px -5px rgba(0, 0, 0, 0.06);
    transform: translateY(-4px);
  }

  .card:active {
    transform: translateY(-2px);
    transition-duration: 0.1s;
  }

  .card.dragging {
    opacity: 0.7;
    cursor: grabbing;
    transform: rotate(2deg) scale(1.02);
    box-shadow:
      0 20px 40px -10px rgba(0, 0, 0, 0.2),
      0 10px 20px -10px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);
  }

  .card:not([draggable="true"]) {
    cursor: pointer;
  }

  .card[draggable="true"] {
    cursor: grab;
  }

  .card[draggable="true"]:active {
    cursor: grabbing;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .card-badges {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .card-title {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-text);
    margin: 0;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-subtitle {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin: 0.625rem 0 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    position: relative;
    z-index: 1;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.875rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    position: relative;
    z-index: 1;
  }

  .card-date {
    font-weight: 500;
  }

  .card-id {
    font-family: var(--font-mono, ui-monospace, monospace);
    opacity: 0.7;
  }
</style>
