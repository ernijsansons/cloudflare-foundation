<script lang="ts">
  /**
   * Model Response Viewer
   *
   * Displays individual model outputs from K-LLM orchestration.
   * Supports accordion-style expansion and side-by-side comparison.
   */

  import type { ModelOutput } from "$lib/utils/orchestration-detection";
  import ArtifactViewer from "./ArtifactViewer.svelte";

  interface Props {
    modelOutputs: ModelOutput[];
    viewMode?: "stacked" | "side-by-side";
  }

  let { modelOutputs, viewMode = "stacked" }: Props = $props();
  let expandedModels = $state<Set<string>>(new Set());

  function toggleModel(model: string) {
    const newSet = new Set(expandedModels);
    if (newSet.has(model)) {
      newSet.delete(model);
    } else {
      newSet.add(model);
    }
    expandedModels = newSet;
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getPreview(text: string, maxLength = 150): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
</script>

<div class="model-response-viewer" class:side-by-side={viewMode === "side-by-side"}>
  {#if viewMode === "stacked"}
    <!-- Stacked Accordion View -->
    <div class="stacked-view">
      {#each modelOutputs as output}
        <div class="model-section" class:failed={output.error}>
          <button
            class="model-header"
            type="button"
            onclick={() => toggleModel(output.model)}
            disabled={!!output.error}
          >
            <div class="header-left">
              <svg
                class="expand-icon"
                class:expanded={expandedModels.has(output.model)}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span class="model-name">{output.model}</span>
              {#if output.error}
                <span class="error-badge">Failed</span>
              {/if}
            </div>

            <div class="header-right">
              {#if !output.error}
                <span class="perf-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {formatDuration(output.durationMs)}
                </span>
                <span class="perf-badge">
                  {output.text.length} chars
                </span>
              {/if}
            </div>
          </button>

          {#if !output.error && !expandedModels.has(output.model)}
            <div class="preview-text">
              {getPreview(output.text)}
            </div>
          {/if}

          {#if output.error}
            <div class="error-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <div class="error-details">
                <span class="error-title">Model execution failed</span>
                <span class="error-message">{output.error}</span>
              </div>
            </div>
          {:else if expandedModels.has(output.model)}
            <div class="expanded-content">
              <ArtifactViewer artifact={output.text} expanded={true} />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <!-- Side-by-Side Comparison View -->
    <div class="side-by-side-view">
      {#each modelOutputs as output}
        <div class="model-column" class:failed={output.error}>
          <div class="column-header">
            <div class="column-title">
              <span class="model-name">{output.model}</span>
              {#if output.error}
                <span class="error-badge">Failed</span>
              {/if}
            </div>
            {#if !output.error}
              <div class="column-metrics">
                <span class="metric-item">{formatDuration(output.durationMs)}</span>
                <span class="metric-item">{output.text.length} chars</span>
              </div>
            {/if}
          </div>

          <div class="column-content">
            {#if output.error}
              <div class="error-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <p class="error-message">{output.error}</p>
              </div>
            {:else}
              <ArtifactViewer artifact={output.text} expanded={true} />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .model-response-viewer {
    display: flex;
    flex-direction: column;
  }

  /* Stacked View */
  .stacked-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .model-section {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .model-section.failed {
    opacity: 0.7;
  }

  .model-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 1rem;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .model-header:not(:disabled):hover {
    background: var(--color-bg-tertiary);
  }

  .model-header:disabled {
    cursor: not-allowed;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .expand-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
    transition: transform 0.2s ease;
  }

  .expand-icon.expanded {
    transform: rotate(180deg);
  }

  .model-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .error-badge {
    padding: 0.125rem 0.5rem;
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .perf-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .preview-text {
    padding: 0.75rem 1rem 1rem 2.5rem;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  .expanded-content {
    padding: 0 1rem 1rem;
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    color: var(--color-error, #ef4444);
  }

  .error-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .error-title {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .error-message {
    font-size: 0.8125rem;
    opacity: 0.8;
  }

  /* Side-by-Side View */
  .side-by-side-view {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .model-column {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    overflow: hidden;
  }

  .model-column.failed {
    opacity: 0.7;
  }

  .column-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border);
  }

  .column-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .column-metrics {
    display: flex;
    gap: 0.5rem;
  }

  .metric-item {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .column-content {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
    max-height: 600px;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .side-by-side-view {
      grid-template-columns: 1fr;
    }
  }
</style>
