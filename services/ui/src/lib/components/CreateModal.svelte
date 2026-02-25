<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { fade, fly, scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

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
      error = "Please describe your idea first.";
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
      error = e instanceof Error ? e.message : "Failed to create.";
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) onClose();
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div 
    class="modal-overlay" 
    onclick={onClose} 
    role="presentation"
    transition:fade={{ duration: 200, easing: cubicOut }}
  >
    <div 
      class="modal" 
      onclick={(e) => e.stopPropagation()} 
      role="dialog" 
      aria-modal="true"
      in:fly={{ y: 20, duration: 300, easing: cubicOut }}
      out:scale={{ start: 0.95, duration: 200, easing: cubicOut }}
    >
      <header class="modal-header">
        <div class="modal-title-group">
          <div class="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <h2>Create New</h2>
        </div>
        <button onclick={onClose} aria-label="Close" type="button" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <form class="modal-body" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-grid">
          <div class="form-group">
            <label for="type">Initiative Type</label>
            <div class="select-wrapper">
              <select id="type" bind:value={type}>
                <option value="run">Research Run (AI Execution)</option>
                <option value="idea">Raw Idea (Draft)</option>
              </select>
              <svg class="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <div class="form-group">
            <label for="idea">Description</label>
            <textarea
              id="idea"
              bind:value={idea}
              placeholder="E.g., A fully autonomous agentic platform for creating dynamic Facebook ads..."
              rows="4"
              autofocus
            ></textarea>
          </div>

          {#if type === "run"}
            <div class="form-group" in:fade={{ duration: 200 }}>
              <label for="mode">Execution Mode</label>
              <div class="select-wrapper">
                <select id="mode" bind:value={mode}>
                  <option value="cloud">Cloud (Cloudflare Workers AI)</option>
                  <option value="local">Local (CLI / Claude Code)</option>
                </select>
                <svg class="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {#if mode === "local"}
              <div class="local-instructions" in:fly={{ y: -10, duration: 250 }}>
                <div class="instruction-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="4 17 10 11 4 5"/>
                    <line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                  <span>Local Mode Instructions</span>
                </div>
                <p>After creating, run the following in your terminal:</p>
                <code>/plan "{idea || "Your idea here"}"</code>
                <p class="hint">The CLI agent will automatically sync results back to this dashboard.</p>
              </div>
            {/if}
          {/if}
        </div>

        {#if error}
          <div class="error-banner" in:fly={{ y: 5, duration: 200 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{error}</p>
          </div>
        {/if}

        <footer class="form-actions">
          <button type="button" onclick={onClose} class="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" class="btn-primary" disabled={loading}>
            {#if loading}
              <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Initializing...
            {:else}
              Create {type === 'run' ? 'Run' : 'Idea'}
            {/if}
          </button>
        </footer>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--color-bg) 60%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    background: var(--color-bg);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 520px;
    box-shadow: var(--shadow-xl), 0 0 0 1px color-mix(in srgb, var(--color-border) 50%, transparent);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .modal-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    color: var(--color-text-subtle);
    transition: all var(--transition-fast);
  }

  .close-btn:hover {
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--color-border);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .select-wrapper {
    position: relative;
    width: 100%;
  }

  .select-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-subtle);
    pointer-events: none;
  }

  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-family: inherit;
    background: var(--color-bg);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
    line-height: 1.5;
  }

  .form-group select {
    appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-group select:hover,
  .form-group textarea:hover {
    border-color: color-mix(in srgb, var(--color-border) 80%, var(--color-text-muted));
  }

  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  .local-instructions {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .instruction-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.25rem;
  }

  .local-instructions p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .local-instructions code {
    display: block;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.75rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    color: var(--color-primary);
    word-break: break-all;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
  }

  .local-instructions .hint {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
    border-radius: var(--radius-md);
    color: var(--color-error);
  }

  .error-banner p {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .error-banner svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    font-size: 0.875rem;
    transition: all var(--transition-fast);
  }

  .btn-primary {
    background: var(--color-primary);
    color: #ffffff;
    border: 1px solid transparent;
    box-shadow: var(--shadow-sm), inset 0 1px 0 hsla(0, 0%, 100%, 0.2);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md), inset 0 1px 0 hsla(0, 0%, 100%, 0.2);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    filter: grayscale(20%);
  }

  .btn-secondary {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    box-shadow: var(--shadow-sm);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: color-mix(in srgb, var(--color-border) 80%, var(--color-text-muted));
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
