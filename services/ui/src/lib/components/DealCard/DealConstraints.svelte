<script lang="ts">
  interface Constraint { id: string; text: string; created_at: number; }

  let { constraints = [], onUpdate, dealStage = 'idea' }: {
    constraints: Constraint[];
    onUpdate: (constraints: Constraint[]) => void;
    dealStage?: string;
  } = $props();

  let newConstraint = $state('');

  // Constraints are locked (immutable) once we leave the idea stage
  const isLocked = $derived(dealStage !== 'idea');

  function addConstraint() {
    if (!newConstraint.trim() || isLocked) return;
    const updated = [...constraints, {
      id: crypto.randomUUID(),
      text: newConstraint.trim(),
      created_at: Math.floor(Date.now() / 1000),
    }];
    onUpdate(updated);
    newConstraint = '';
  }

  function removeConstraint(id: string) {
    if (isLocked) return;
    onUpdate(constraints.filter(c => c.id !== id));
  }
</script>

<div class="constraints-panel">
  <div class="panel-header">
    <h3>Immutable Constraints</h3>
    <p class="panel-hint">These rules CANNOT be changed during research or production.</p>
  </div>

  <div class="constraints-list">
    {#each constraints as constraint (constraint.id)}
      <div class="constraint-card">
        <div class="constraint-icon">🔒</div>
        <div class="constraint-content">
          <p>{constraint.text}</p>
        </div>
        {#if !isLocked}
          <button class="remove-btn" onclick={() => removeConstraint(constraint.id)} aria-label="Remove constraint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>
    {/each}
  </div>

  {#if isLocked}
    <p class="locked-notice">🔒 Constraints are locked — deal is in <strong>{dealStage}</strong> stage.</p>
  {:else}
    <div class="add-constraint">
      <input
        type="text"
        placeholder="Add a constraint that must not change..."
        bind:value={newConstraint}
        onkeydown={(e) => { if (e.key === 'Enter') addConstraint(); }}
      />
      <button class="add-btn" onclick={addConstraint} disabled={!newConstraint.trim()}>Add</button>
    </div>
  {/if}
</div>

<style>
  .constraints-panel { padding: 1.5rem; }
  .panel-header { margin-bottom: 1.5rem; }
  .panel-header h3 { margin: 0; font-size: 1.125rem; }
  .panel-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
  .constraints-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
  .constraint-card {
    display: flex; align-items: flex-start; gap: 0.75rem;
    padding: 1rem; background: var(--color-bg);
    border: 1px solid var(--color-border); border-left: 3px solid #f59e0b;
    border-radius: 8px;
  }
  .constraint-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }
  .constraint-content { flex: 1; }
  .constraint-content p { margin: 0; font-size: 0.875rem; line-height: 1.5; }
  .remove-btn {
    flex-shrink: 0; padding: 0.25rem; border-radius: 4px;
    color: var(--color-text-muted); transition: all 0.15s;
    background: transparent; border: none; cursor: pointer;
  }
  .remove-btn:hover { color: var(--color-error); background: color-mix(in srgb, var(--color-error) 10%, transparent); }
  .add-constraint { display: flex; gap: 0.5rem; }
  .add-constraint input {
    flex: 1; padding: 0.625rem 0.75rem;
    background: var(--color-bg-secondary); border: 1px solid var(--color-border);
    border-radius: 6px; font-size: 0.875rem; font-family: inherit; color: var(--color-text);
  }
  .add-constraint input:focus { outline: none; border-color: var(--color-primary); }
  .add-btn {
    padding: 0.625rem 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer;
  }
  .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .add-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
  .locked-notice {
    margin: 0; padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent);
    border-radius: 6px; font-size: 0.8125rem; color: var(--color-text-muted);
  }
  .locked-notice strong { color: var(--color-text); }
</style>
