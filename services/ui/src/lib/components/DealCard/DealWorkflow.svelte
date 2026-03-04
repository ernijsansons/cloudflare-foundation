<script lang="ts">
  let { stage = 'idea' }: { stage: string } = $props();

  const workflow = [
    { id: 'idea', label: 'Idea Intake', desc: 'Document, upload, constrain', icon: '💡', color: '#8b5cf6' },
    { id: 'researching', label: 'Research Pipeline', desc: '18-phase AI validation', icon: '🔬', color: '#3b82f6',
      sub: ['Discovery', 'Validation', 'Strategy', 'Design', 'Execution'] },
    { id: 'production', label: 'Production', desc: 'Build & ship', icon: '🚀', color: '#10b981',
      sub: ['Backlog', 'In Progress', 'Review', 'Done'] },
  ];

  function isActive(id: string): boolean { return id === stage; }
  function isCompleted(id: string): boolean {
    const order = ['idea', 'researching', 'production'];
    return order.indexOf(id) < order.indexOf(stage);
  }
</script>

<div class="workflow-panel">
  <div class="panel-header">
    <h3>Deal Workflow</h3>
    <p class="panel-hint">Visual map of where this deal sits in the lifecycle.</p>
  </div>

  <div class="workflow-diagram">
    {#each workflow as step, i}
      <div class="workflow-step" class:active={isActive(step.id)} class:completed={isCompleted(step.id)} style="--step-color: {step.color}">
        <div class="step-header">
          <span class="step-icon">{step.icon}</span>
          <div>
            <div class="step-label">{step.label}</div>
            <div class="step-desc">{step.desc}</div>
          </div>
          {#if isActive(step.id)}
            <span class="current-badge">Current</span>
          {:else if isCompleted(step.id)}
            <span class="done-badge">Done</span>
          {/if}
        </div>
        {#if step.sub}
          <div class="step-substeps">
            {#each step.sub as sub}
              <span class="substep">{sub}</span>
            {/each}
          </div>
        {/if}
      </div>
      {#if i < workflow.length - 1}
        <div class="workflow-arrow" class:completed={isCompleted(workflow[i + 1].id)}>→</div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .workflow-panel { padding: 1.5rem; }
  .panel-header { margin-bottom: 1.5rem; }
  .panel-header h3 { margin: 0; font-size: 1.125rem; }
  .panel-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
  .workflow-diagram { display: flex; align-items: flex-start; gap: 0.5rem; overflow-x: auto; padding: 1rem 0; }
  .workflow-step {
    flex: 0 0 200px; min-width: 200px; border: 2px solid var(--color-border);
    border-radius: 12px; padding: 1rem; background: var(--color-bg);
    opacity: 0.5; transition: all 0.2s;
  }
  .workflow-step.active { opacity: 1; border-color: var(--step-color); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .workflow-step.completed { opacity: 0.8; border-color: var(--color-success); }
  .step-header { display: flex; align-items: flex-start; gap: 0.5rem; }
  .step-icon { font-size: 1.5rem; }
  .step-label { font-weight: 600; font-size: 0.875rem; }
  .step-desc { font-size: 0.75rem; color: var(--color-text-muted); }
  .current-badge {
    margin-left: auto; padding: 0.125rem 0.5rem; font-size: 0.6875rem; font-weight: 600;
    border-radius: 9999px; background: var(--step-color); color: white;
  }
  .done-badge {
    margin-left: auto; padding: 0.125rem 0.5rem; font-size: 0.6875rem; font-weight: 600;
    border-radius: 9999px; background: var(--color-success); color: white;
  }
  .step-substeps { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.75rem; }
  .substep {
    padding: 0.25rem 0.5rem; font-size: 0.6875rem;
    background: var(--color-bg-secondary); border: 1px solid var(--color-border);
    border-radius: 4px; color: var(--color-text-muted);
  }
  .workflow-arrow {
    display: flex; align-items: center; font-size: 1.25rem;
    color: var(--color-border); padding-top: 1rem;
  }
  .workflow-arrow.completed { color: var(--color-success); }
</style>
