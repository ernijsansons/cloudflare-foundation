<script lang="ts">
  let { stage = 'idea' }: { stage: string } = $props();

  const stages = [
    { id: 'idea', label: 'Idea', icon: '💡' },
    { id: 'researching', label: 'Research', icon: '🔬' },
    { id: 'production', label: 'Production', icon: '🚀' },
  ];

  function getStageIndex(s: string): number {
    const idx = stages.findIndex(st => st.id === s);
    return idx >= 0 ? idx : 0;
  }
</script>

<div class="lifecycle-bar">
  {#each stages as s, i}
    <div class="lifecycle-stage" class:active={s.id === stage} class:completed={i < getStageIndex(stage)}>
      <div class="stage-dot">
        {#if i < getStageIndex(stage)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        {:else}
          <span class="stage-icon">{s.icon}</span>
        {/if}
      </div>
      <span class="stage-label">{s.label}</span>
    </div>
    {#if i < stages.length - 1}
      <div class="stage-connector" class:active={i < getStageIndex(stage)}></div>
    {/if}
  {/each}
</div>

<style>
  .lifecycle-bar {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }
  .lifecycle-stage {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0.4;
    transition: all 0.2s;
  }
  .lifecycle-stage.active, .lifecycle-stage.completed { opacity: 1; }
  .stage-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-bg-tertiary);
    border: 2px solid var(--color-border);
    font-size: 0.75rem;
    transition: all 0.2s;
  }
  .lifecycle-stage.active .stage-dot {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
  .lifecycle-stage.completed .stage-dot {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }
  .stage-icon { font-size: 0.75rem; }
  .stage-label { font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
  .stage-connector {
    flex: 1;
    height: 2px;
    background: var(--color-border);
    margin: 0 0.5rem;
    min-width: 2rem;
    transition: background 0.2s;
  }
  .stage-connector.active { background: var(--color-success); }
</style>
