<script lang="ts">
  import type { PhaseName, PlanningArtifact } from "$lib/types";
  import { phaseDocs, PHASE_ORDER, getPhaseIndex } from "$lib/data/phase-docs";

  interface Props {
    currentPhase?: PhaseName;
    selectedPhase: PhaseName;
    artifacts: Record<string, PlanningArtifact>;
    onSelectPhase: (phase: PhaseName) => void;
  }

  let { currentPhase, selectedPhase, artifacts, onSelectPhase }: Props = $props();

  function getPhaseStatus(phase: PhaseName): "completed" | "current" | "pending" {
    if (artifacts[phase]) return "completed";
    if (phase === currentPhase) return "current";
    return "pending";
  }

  let timelineEl: HTMLDivElement;

  $effect(() => {
    // Auto-scroll to selected phase
    if (timelineEl) {
      const selectedBtn = timelineEl.querySelector(`[data-phase="${selectedPhase}"]`);
      selectedBtn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });
</script>

<div class="phase-timeline" bind:this={timelineEl}>
  <div class="phases-container">
    {#each PHASE_ORDER as phase (phase)}
      {@const status = getPhaseStatus(phase)}
      {@const index = getPhaseIndex(phase)}
      {@const doc = phaseDocs[phase]}
      <button
        class="phase-btn"
        class:selected={selectedPhase === phase}
        class:completed={status === "completed"}
        class:current={status === "current"}
        class:pending={status === "pending"}
        data-phase={phase}
        onclick={() => onSelectPhase(phase)}
        title={doc.title}
      >
        <span class="phase-index">{index}</span>
        <span class="phase-name">{doc.title}</span>
        {#if status === "completed"}
          <span class="phase-check">✓</span>
        {:else if status === "current"}
          <span class="phase-dot"></span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .phase-timeline {
    overflow-x: auto;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .phases-container {
    display: flex;
    gap: 0;
    padding: 0.5rem;
    min-width: min-content;
  }

  .phase-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .phase-btn:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
  }

  .phase-btn.selected {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .phase-btn.completed {
    color: var(--color-success, #10b981);
  }

  .phase-btn.completed.selected {
    color: var(--color-success, #10b981);
  }

  .phase-btn.current {
    color: var(--color-primary);
  }

  .phase-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .phase-btn.completed .phase-index {
    background: var(--color-success, #10b981);
    color: white;
  }

  .phase-btn.current .phase-index {
    background: var(--color-primary);
    color: white;
  }

  .phase-btn.selected .phase-index {
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px currentColor;
  }

  .phase-name {
    font-weight: 500;
  }

  .phase-check {
    font-size: 0.75rem;
  }

  .phase-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Hide scrollbar but keep functionality */
  .phase-timeline::-webkit-scrollbar {
    height: 4px;
  }

  .phase-timeline::-webkit-scrollbar-track {
    background: transparent;
  }

  .phase-timeline::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;
  }
</style>
