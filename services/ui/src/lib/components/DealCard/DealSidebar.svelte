<script lang="ts">
  interface Attachment { name: string; key: string; type: string; size: number; uploaded_at: number; }
  interface Constraint { id: string; text: string; created_at: number; }
  interface Note { id: string; text: string; created_at: number; updated_at: number; }

  interface Idea {
    id: string; name: string; status: string; priority: string;
    deal_stage: string; tags: string[]; created_at: number; updated_at: number;
    attachments: Attachment[]; constraints: Constraint[]; notes: Note[];
  }

  let { idea, onUpdate }: { idea: Idea; onUpdate: (field: string, value: string) => void } = $props();

  let tagInput = $state('');

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getPriorityColor(p: string): string {
    switch (p) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#6b7280';
      case 'low': return '#9ca3af';
      default: return '#6b7280';
    }
  }

  function getStageLabel(s: string): string {
    switch (s) {
      case 'idea': return '💡 Idea';
      case 'researching': return '🔬 Researching';
      case 'production': return '🚀 Production';
      case 'parked': return '⏸️ Parked';
      case 'killed': return '❌ Killed';
      default: return s;
    }
  }

  function addTag() {
    if (!tagInput.trim()) return;
    const updated = [...idea.tags, tagInput.trim()];
    onUpdate('tags', JSON.stringify(updated));
    tagInput = '';
  }

  function removeTag(tag: string) {
    const updated = idea.tags.filter((t: string) => t !== tag);
    onUpdate('tags', JSON.stringify(updated));
  }
</script>

<aside class="deal-sidebar">
  <div class="sidebar-section">
    <label class="field-label">Status</label>
    <select class="field-select" value={idea.status} onchange={(e) => onUpdate('status', (e.target as HTMLSelectElement).value)}>
      <option value="draft">Draft</option>
      <option value="ready">Ready</option>
      <option value="researching">Researching</option>
      <option value="completed">Completed</option>
    </select>
  </div>

  <div class="sidebar-section">
    <label class="field-label">Priority</label>
    <select class="field-select" value={idea.priority} onchange={(e) => onUpdate('priority', (e.target as HTMLSelectElement).value)}>
      <option value="low">Low</option>
      <option value="normal">Normal</option>
      <option value="high">High</option>
      <option value="critical">Critical</option>
    </select>
    <div class="priority-indicator" style="background: {getPriorityColor(idea.priority)}"></div>
  </div>

  <div class="sidebar-section">
    <label class="field-label">Deal Stage</label>
    <div class="field-value stage-value">{getStageLabel(idea.deal_stage)}</div>
  </div>

  <div class="sidebar-section">
    <label class="field-label">Tags</label>
    <div class="tags-list">
      {#each idea.tags as tag}
        <span class="tag-pill">
          {tag}
          <button class="tag-remove" onclick={() => removeTag(tag)}>×</button>
        </span>
      {/each}
      <input
        class="tag-input"
        type="text"
        placeholder="+ Add tag"
        bind:value={tagInput}
        onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
      />
    </div>
  </div>

  <div class="sidebar-divider"></div>

  <div class="sidebar-section">
    <label class="field-label">Created</label>
    <div class="field-value">{formatDate(idea.created_at)}</div>
  </div>

  <div class="sidebar-section">
    <label class="field-label">Updated</label>
    <div class="field-value">{formatDate(idea.updated_at)}</div>
  </div>

  <div class="sidebar-divider"></div>

  <div class="sidebar-section stats">
    <div class="stat"><span class="stat-icon">📎</span><span>{idea.attachments.length} files</span></div>
    <div class="stat"><span class="stat-icon">🔒</span><span>{idea.constraints.length} constraints</span></div>
    <div class="stat"><span class="stat-icon">📝</span><span>{idea.notes.length} notes</span></div>
  </div>
</aside>

<style>
  .deal-sidebar {
    width: 280px; min-width: 280px; border-right: 1px solid var(--color-border);
    padding: 1.25rem; overflow-y: auto; background: var(--color-bg);
  }
  .sidebar-section { margin-bottom: 1.25rem; }
  .field-label { display: block; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }
  .field-select {
    width: 100%; padding: 0.5rem 0.625rem;
    background: var(--color-bg-secondary); border: 1px solid var(--color-border);
    border-radius: 6px; font-size: 0.8125rem; font-family: inherit; color: var(--color-text);
  }
  .field-select:focus { outline: none; border-color: var(--color-primary); }
  .field-value { font-size: 0.875rem; color: var(--color-text); }
  .stage-value { font-weight: 500; }
  .priority-indicator { width: 100%; height: 3px; border-radius: 2px; margin-top: 0.375rem; }
  .sidebar-divider { height: 1px; background: var(--color-border); margin: 1rem 0; }
  .tags-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
  .tag-pill {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.2rem 0.5rem; background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary); border-radius: 9999px; font-size: 0.75rem; font-weight: 500;
  }
  .tag-remove { font-size: 0.875rem; cursor: pointer; color: inherit; line-height: 1; background: transparent; border: none; }
  .tag-input {
    flex: 1; min-width: 80px; padding: 0.2rem 0.375rem;
    background: transparent; border: 1px dashed var(--color-border);
    border-radius: 4px; font-size: 0.75rem; color: var(--color-text);
  }
  .tag-input:focus { outline: none; border-color: var(--color-primary); border-style: solid; }
  .stats { display: flex; flex-direction: column; gap: 0.5rem; }
  .stat { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--color-text-muted); }
  .stat-icon { font-size: 1rem; }
</style>
