<script lang="ts">
  /**
   * Mermaid Diagram Viewer
   *
   * Renders Mermaid diagrams from syntax strings.
   * Supports architecture diagrams, flowcharts, sequence diagrams, etc.
   */

  import { onMount } from "svelte";

  interface Props {
    diagram: string;
    title?: string;
  }

  let { diagram, title }: Props = $props();
  let container: HTMLDivElement;
  let error = $state<string | null>(null);
  let isLoading = $state(true);

  onMount(async () => {
    try {
      // Dynamically import mermaid to avoid SSR issues
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        themeVariables: {
          primaryColor: "#3b82f6",
          primaryTextColor: "#1e293b",
          primaryBorderColor: "#cbd5e1",
          lineColor: "#64748b",
          secondaryColor: "#f1f5f9",
          tertiaryColor: "#f8fafc",
        },
      });

      const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substring(7)}`, diagram);

      if (container) {
        // Use safe DOM manipulation instead of innerHTML
        const range = document.createRange();
        const fragment = range.createContextualFragment(svg);
        container.appendChild(fragment);
      }

      isLoading = false;
    } catch (e) {
      console.error("Mermaid rendering error:", e);
      error = e instanceof Error ? e.message : "Failed to render diagram";
      isLoading = false;
    }
  });
</script>

<div class="mermaid-viewer">
  {#if title}
    <h4 class="diagram-title">{title}</h4>
  {/if}

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <span class="loading-text">Rendering diagram...</span>
    </div>
  {:else if error}
    <div class="error-state">
      <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <p class="error-message">Failed to render diagram</p>
      <details class="error-details">
        <summary>View error details</summary>
        <pre class="error-pre">{error}</pre>
      </details>
      <details class="source-details">
        <summary>View diagram source</summary>
        <pre class="source-pre"><code>{diagram}</code></pre>
      </details>
    </div>
  {:else}
    <div bind:this={container} class="diagram-container"></div>
  {/if}
</div>

<style>
  .mermaid-viewer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .diagram-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-bg-tertiary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  /* Error State */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem 1rem;
    background: color-mix(in srgb, var(--color-error, #ef4444) 5%, transparent);
    border-radius: 6px;
    border: 1px dashed var(--color-error, #ef4444);
  }

  .error-icon {
    color: var(--color-error, #ef4444);
  }

  .error-message {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-error, #ef4444);
  }

  .error-details,
  .source-details {
    width: 100%;
    margin-top: 0.5rem;
  }

  .error-details summary,
  .source-details summary {
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-muted);
    user-select: none;
  }

  .error-details summary:hover,
  .source-details summary:hover {
    color: var(--color-text);
  }

  .error-pre,
  .source-pre {
    margin: 0.5rem 0 0;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .source-pre code {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }

  /* Diagram Container */
  .diagram-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: white;
    border-radius: 6px;
    overflow-x: auto;
  }

  .diagram-container :global(svg) {
    max-width: 100%;
    height: auto;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .diagram-container {
      padding: 0.5rem;
    }
  }
</style>
