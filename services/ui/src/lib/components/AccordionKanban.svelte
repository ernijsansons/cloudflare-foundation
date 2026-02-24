<script lang="ts">
  import { onMount } from "svelte";
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

  // Group phases into stages
  const stageGroups = {
    discovery: {
      name: "Discovery",
      phases: ["opportunity", "customer-intel", "market-research", "competitive-intel"],
      color: "#8b5cf6" // purple
    },
    validation: {
      name: "Validation",
      phases: ["kill-test"],
      color: "#f59e0b" // amber
    },
    strategy: {
      name: "Strategy",
      phases: ["revenue-expansion", "strategy", "business-model"],
      color: "#3b82f6" // blue
    },
    design: {
      name: "Design",
      phases: ["product-design", "gtm-marketing", "content-engine"],
      color: "#10b981" // green
    },
    execution: {
      name: "Execution",
      phases: ["tech-arch", "analytics", "launch-execution", "synthesis"],
      color: "#ef4444" // red
    }
  };

  // Load expanded state from localStorage
  let expandedStages = $state<Set<string>>(new Set());

  onMount(() => {
    const saved = localStorage.getItem("accordion-kanban-expanded");
    if (saved) {
      try {
        expandedStages = new Set(JSON.parse(saved));
      } catch {
        expandedStages = new Set();
      }
    }
  });

  function toggleStage(stageId: string) {
    if (expandedStages.has(stageId)) {
      expandedStages.delete(stageId);
    } else {
      expandedStages.add(stageId);
    }
    expandedStages = expandedStages; // trigger reactivity

    // Save to localStorage
    localStorage.setItem("accordion-kanban-expanded", JSON.stringify([...expandedStages]));
  }

  function getCardsForColumn(status: string): KanbanCard[] {
    return cards.filter((c) => c.status === status);
  }

  function getProjectCountForStage(phases: string[]): number {
    return phases.reduce((count, phase) => {
      return count + getCardsForColumn(phase).length;
    }, 0);
  }

  function getColumnsForStage(phases: string[]): ColumnType[] {
    return columns.filter(col => phases.includes(col.status));
  }
</script>

<div class="accordion-kanban">
  {#each Object.entries(stageGroups) as [stageId, stage]}
    {@const projectCount = getProjectCountForStage(stage.phases)}
    {@const isExpanded = expandedStages.has(stageId)}
    {@const stageColumns = getColumnsForStage(stage.phases)}

    <div class="stage-section" class:expanded={isExpanded}>
      <!-- Stage Header -->
      <button
        class="stage-header"
        onclick={() => toggleStage(stageId)}
        style="--stage-color: {stage.color}"
      >
        <div class="stage-header-left">
          <div class="stage-icon" class:expanded={isExpanded}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="stage-title">{stage.name}</h2>
          {#if projectCount > 0}
            <div class="project-count" style="background: {stage.color}">
              {projectCount}
            </div>
          {/if}
        </div>

        <div class="stage-header-right">
          <span class="phase-count">{stage.phases.length} {stage.phases.length === 1 ? 'phase' : 'phases'}</span>
        </div>
      </button>

      <!-- Expandable Content -->
      {#if isExpanded}
        <div class="stage-content">
          <div class="phase-columns">
            {#each stageColumns as column, index (column.id)}
              {@const columnCards = getCardsForColumn(column.status)}
              <KanbanColumn
                title={column.title}
                status={column.status}
                color={column.color}
                phaseNumber={columns.findIndex(c => c.id === column.id) + 1}
                cards={columnCards}
                {onCardClick}
                {onCardMove}
                {emptyMessage}
              />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .accordion-kanban {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    padding-bottom: 1rem;
    min-height: calc(100vh - var(--topbar-height) - 150px);
  }

  .stage-section {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .stage-section:hover {
    border-color: color-mix(in srgb, var(--stage-color, var(--color-primary)) 40%, var(--color-border));
    box-shadow: 0 4px 12px -4px color-mix(in srgb, var(--stage-color, var(--color-primary)) 20%, transparent);
  }

  .stage-section.expanded {
    background: var(--color-bg-secondary);
  }

  .stage-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    gap: 1rem;
  }

  .stage-header:hover {
    background: color-mix(in srgb, var(--stage-color, var(--color-primary)) 5%, transparent);
  }

  .stage-header:active {
    background: color-mix(in srgb, var(--stage-color, var(--color-primary)) 8%, transparent);
  }

  .stage-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .stage-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--stage-color, var(--color-primary));
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .stage-icon.expanded {
    transform: rotate(90deg);
  }

  .stage-title {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-text);
    margin: 0;
  }

  .project-count {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    box-shadow: 0 2px 8px -2px currentColor;
    animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes badge-pop {
    0% {
      transform: scale(0.8);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .stage-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .phase-count {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .stage-content {
    animation: expand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  }

  @keyframes expand {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .phase-columns {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem 1.5rem;
    overflow-x: auto;

    /* Smooth horizontal scroll */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    /* Visible scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--stage-color, var(--color-primary)) var(--color-bg);
  }

  .phase-columns::-webkit-scrollbar {
    height: 8px;
  }

  .phase-columns::-webkit-scrollbar-track {
    background: var(--color-bg);
    border-radius: 4px;
  }

  .phase-columns::-webkit-scrollbar-thumb {
    background: var(--stage-color, var(--color-primary));
    border-radius: 4px;
  }

  .phase-columns::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--stage-color, var(--color-primary)) 80%, black);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .accordion-kanban {
      padding: 1rem;
    }

    .stage-header {
      padding: 0.875rem 1rem;
    }

    .stage-title {
      font-size: 0.9375rem;
    }

    .phase-columns {
      padding: 0.75rem 1rem 1rem;
    }
  }
</style>
