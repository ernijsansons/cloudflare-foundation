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

  // eslint-disable-next-line no-undef
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

  // Load active tab from localStorage (default to first stage with projects)
  // eslint-disable-next-line no-undef
  let activeStage = $state<string>("discovery");

  onMount(() => {
    // eslint-disable-next-line no-undef
    const saved = localStorage.getItem("kanban-active-stage");
    if (saved && stageGroups[saved as keyof typeof stageGroups]) {
      activeStage = saved;
    } else {
      // Auto-select first stage with projects
      for (const [stageId, stage] of Object.entries(stageGroups)) {
        if (getProjectCountForStage(stage.phases) > 0) {
          activeStage = stageId;
          break;
        }
      }
    }
  });

  function selectStage(stageId: string) {
    activeStage = stageId;
    // Save to localStorage
    // eslint-disable-next-line no-undef
    localStorage.setItem("kanban-active-stage", stageId);
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

<div class="tabbed-kanban">
  <!-- Horizontal Tabs -->
  <div class="stage-tabs">
    {#each Object.entries(stageGroups) as [stageId, stage]}
      {@const projectCount = getProjectCountForStage(stage.phases)}
      {@const isActive = activeStage === stageId}

      <button
        class="stage-tab"
        class:active={isActive}
        onclick={() => selectStage(stageId)}
        style="--stage-color: {stage.color}"
      >
        <div class="tab-content">
          <span class="stage-name">{stage.name}</span>
          {#if projectCount > 0}
            <div class="project-badge" style="background: {stage.color}">
              {projectCount}
            </div>
          {/if}
        </div>
        {#if isActive}
          <div class="active-indicator" style="background: {stage.color}" />
        {/if}
      </button>
    {/each}
  </div>

  <!-- Kanban Board Content -->
  <div class="kanban-content">
    {#if activeStage}
      {@const activeStageData = stageGroups[activeStage as keyof typeof stageGroups]}
      {@const stageColumns = getColumnsForStage(activeStageData.phases)}

      <div class="phase-columns" style="--stage-color: {activeStageData.color}">
        {#each stageColumns as column (column.id)}
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
    {/if}
  </div>
</div>

<style>
  .tabbed-kanban {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--topbar-height) - 150px);
  }

  .stage-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem 0;
    border-bottom: 2px solid var(--color-border);
    background: var(--color-bg);
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  .stage-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.875rem 1.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 8px 8px 0 0;
    white-space: nowrap;
    min-width: fit-content;
  }

  .stage-tab:hover {
    background: color-mix(in srgb, var(--stage-color) 8%, transparent);
  }

  .stage-tab.active {
    background: var(--color-bg-secondary);
  }

  .stage-tab.active:hover {
    background: var(--color-bg-secondary);
  }

  .tab-content {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .stage-name {
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-text);
    transition: color 0.2s ease;
  }

  .stage-tab.active .stage-name {
    color: var(--stage-color);
  }

  .project-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 0.4rem;
    border-radius: 11px;
    font-size: 0.6875rem;
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

  .active-indicator {
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
    animation: slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes slide-in {
    from {
      transform: scaleX(0);
      opacity: 0;
    }
    to {
      transform: scaleX(1);
      opacity: 1;
    }
  }

  .kanban-content {
    flex: 1;
    background: var(--color-bg-secondary);
    animation: fade-in 0.3s ease;
  }

  @keyframes fade-in {
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
    padding: 1.5rem;
    padding-bottom: 1rem;
    overflow-x: auto;
    min-height: 500px;

    /* Smooth horizontal scroll */
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;

    /* Visible scrollbar styling */
    scrollbar-width: auto;
    scrollbar-color: var(--stage-color) var(--color-bg-secondary);
  }

  .phase-columns::-webkit-scrollbar {
    height: 14px;
  }

  .phase-columns::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 7px;
    margin: 0 1rem;
    border: 1px solid var(--color-border);
  }

  .phase-columns::-webkit-scrollbar-thumb {
    background: var(--stage-color);
    border-radius: 7px;
    border: 3px solid var(--color-bg-secondary);
    min-width: 80px;
  }

  .phase-columns::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--stage-color) 80%, black);
  }

  .phase-columns::-webkit-scrollbar-thumb:active {
    background: color-mix(in srgb, var(--stage-color) 70%, black);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .stage-tabs {
      padding: 0.75rem 1rem 0;
      gap: 0.375rem;
    }

    .stage-tab {
      padding: 0.75rem 1.125rem;
    }

    .stage-name {
      font-size: 0.875rem;
    }

    .phase-columns {
      padding: 1rem;
    }
  }
</style>
