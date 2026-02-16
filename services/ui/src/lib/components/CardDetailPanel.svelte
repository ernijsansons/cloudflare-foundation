<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import Badge from "./Badge.svelte";
  import type { KanbanCard } from "$lib/types";
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    card: KanbanCard | null;
    onClose: () => void;
    children?: Snippet;
  }

  let { open, card, onClose, children }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      onClose();
    }
  }

  onMount(() => {
    if (!browser) return;
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  function formatDate(timestamp?: number): string {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString();
  }

  function getStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
    switch (status) {
      case "completed":
        return "success";
      case "running":
      case "in_progress":
        return "info";
      case "killed":
        return "error";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  }
</script>

{#if open}
  <div class="overlay" onclick={onClose} role="presentation"></div>
  <aside class="panel" class:open>
    <header class="panel-header">
      <h2>{card?.title ?? "Details"}</h2>
      <button class="close-btn" onclick={onClose} aria-label="Close" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>

    <div class="panel-content">
      {#if card}
        <section>
          <h3>Status</h3>
          <Badge text={card.status} variant={getStatusVariant(card.status)} />
        </section>

        {#if card.phase}
          <section>
            <h3>Current Phase</h3>
            <p>{card.phase}</p>
          </section>
        {/if}

        {#if card.subtitle}
          <section>
            <h3>Description</h3>
            <p class="description">{card.subtitle}</p>
          </section>
        {/if}

        {#if card.createdAt}
          <section>
            <h3>Created</h3>
            <p>{formatDate(card.createdAt)}</p>
          </section>
        {/if}

        <section>
          <h3>ID</h3>
          <code>{card.id}</code>
        </section>

        {#if children}
          <section class="custom-content">
            {@render children()}
          </section>
        {/if}
      {/if}
    </div>
  </aside>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 40;
  }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 480px;
    max-width: 100vw;
    height: 100vh;
    background: var(--color-bg);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    transform: translateX(100%);
    transition: transform var(--transition-normal);
    display: flex;
    flex-direction: column;
  }

  .panel.open {
    transform: translateX(0);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .panel-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 380px;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .panel-content section {
    margin-bottom: 1.5rem;
  }

  .panel-content h3 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin: 0 0 0.5rem;
    letter-spacing: 0.025em;
  }

  .panel-content p {
    margin: 0;
    color: var(--color-text);
  }

  .description {
    line-height: 1.6;
  }

  code {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    background: var(--color-bg-secondary);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .custom-content {
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }
</style>
