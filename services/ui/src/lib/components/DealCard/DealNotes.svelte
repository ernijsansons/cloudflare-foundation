<script lang="ts">
  interface Note { id: string; text: string; created_at: number; updated_at: number; }

  let { notes = [], onUpdate }: {
    notes: Note[];
    onUpdate: (notes: Note[]) => void;
  } = $props();

  let newNote = $state('');

  function addNote() {
    if (!newNote.trim()) return;
    const now = Math.floor(Date.now() / 1000);
    const updated = [...notes, { id: crypto.randomUUID(), text: newNote.trim(), created_at: now, updated_at: now }];
    onUpdate(updated);
    newNote = '';
  }

  function removeNote(id: string) {
    onUpdate(notes.filter(n => n.id !== id));
  }

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="notes-panel">
  <div class="panel-header">
    <h3>Notes & Ideas</h3>
    <p class="panel-hint">Paste your thoughts, ideas, and freeform notes here.</p>
  </div>

  <div class="add-note">
    <textarea bind:value={newNote} placeholder="Write your thoughts, ideas, observations..." rows="4"></textarea>
    <button class="add-btn" onclick={addNote} disabled={!newNote.trim()}>Add Note</button>
  </div>

  <div class="notes-list">
    {#each [...notes].reverse() as note (note.id)}
      <div class="note-card">
        <div class="note-header">
          <span class="note-date">{formatDate(note.created_at)}</span>
          <button class="remove-btn" onclick={() => removeNote(note.id)} aria-label="Delete note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <pre class="note-text">{note.text}</pre>
      </div>
    {/each}
  </div>
</div>

<style>
  .notes-panel { padding: 1.5rem; }
  .panel-header { margin-bottom: 1.5rem; }
  .panel-header h3 { margin: 0; font-size: 1.125rem; }
  .panel-hint { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
  .add-note { margin-bottom: 1.5rem; }
  .add-note textarea {
    width: 100%; padding: 0.75rem;
    background: var(--color-bg-secondary); border: 1px solid var(--color-border);
    border-radius: 8px; font-size: 0.875rem; font-family: inherit;
    color: var(--color-text); resize: vertical; margin-bottom: 0.5rem;
  }
  .add-note textarea:focus { outline: none; border-color: var(--color-primary); }
  .add-btn {
    padding: 0.5rem 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer;
  }
  .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .notes-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .note-card {
    padding: 1rem; background: var(--color-bg);
    border: 1px solid var(--color-border); border-radius: 8px;
  }
  .note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .note-date { font-size: 0.75rem; color: var(--color-text-muted); }
  .remove-btn { padding: 0.25rem; border-radius: 4px; color: var(--color-text-muted); background: transparent; border: none; cursor: pointer; }
  .remove-btn:hover { color: var(--color-error); }
  .note-text {
    margin: 0; font-family: inherit; font-size: 0.875rem;
    line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; color: var(--color-text);
  }
</style>
