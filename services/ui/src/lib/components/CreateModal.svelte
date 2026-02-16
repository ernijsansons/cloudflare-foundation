<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { type: "idea" | "run"; idea: string; mode?: "local" | "cloud" }) => Promise<void>;
  }

  let { open, onClose, onSubmit }: Props = $props();

  let type: "idea" | "run" = $state("run");
  let mode: "cloud" | "local" = $state("cloud");
  let idea = $state("");
  let loading = $state(false);
  let error = $state("");

  async function handleSubmit() {
    if (!idea.trim()) {
      error = "Please enter an idea";
      return;
    }
    loading = true;
    error = "";
    try {
      await onSubmit({ type, idea: idea.trim(), mode: type === "run" ? mode : undefined });
      idea = "";
      mode = "cloud";
      onClose();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  onMount(() => {
    if (!browser) return;
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

{#if open}
  <div class="modal-overlay" onclick={onClose} role="presentation">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <header class="modal-header">
        <h2>Create New</h2>
        <button onclick={onClose} aria-label="Close" type="button">&times;</button>
      </header>

      <form class="modal-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-group">
          <label for="type">Type</label>
          <select id="type" bind:value={type}>
            <option value="run">Research Run</option>
            <option value="idea">Idea</option>
          </select>
        </div>

        <div class="form-group">
          <label for="idea">Idea</label>
          <textarea
            id="idea"
            bind:value={idea}
            placeholder="Describe your idea..."
            rows="4"
          ></textarea>
        </div>

        {#if type === "run"}
          <div class="form-group">
            <label for="mode">Mode</label>
            <select id="mode" bind:value={mode}>
              <option value="cloud">Cloud (Cloudflare Workers AI)</option>
              <option value="local">Local (CLI / Claude Code)</option>
            </select>
          </div>

          {#if mode === "local"}
            <div class="local-instructions">
              <p><strong>Local Mode Instructions:</strong></p>
              <p>After creating, run this in Claude Code:</p>
              <code>/plan "{idea || "Your idea here"}"</code>
              <p class="hint">The CLI will sync results to this dashboard.</p>
            </div>
          {/if}
        {/if}

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <div class="form-actions">
          <button type="button" onclick={onClose} class="btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: var(--color-bg);
    border-radius: 8px;
    width: 480px;
    max-width: 90vw;
    box-shadow: var(--shadow-lg);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
  }

  .modal-header button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0;
    line-height: 1;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .error {
    color: var(--color-error);
    font-size: 0.875rem;
    margin: 0 0 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .btn-secondary:hover {
    background: var(--color-bg-secondary);
  }

  .local-instructions {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .local-instructions p {
    margin: 0 0 0.5rem;
  }

  .local-instructions p:last-child {
    margin-bottom: 0;
  }

  .local-instructions code {
    display: block;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    font-family: monospace;
    font-size: 0.8125rem;
    word-break: break-all;
    margin: 0.5rem 0;
  }

  .local-instructions .hint {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>
