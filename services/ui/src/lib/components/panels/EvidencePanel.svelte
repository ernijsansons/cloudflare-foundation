<script lang="ts">
  /**
   * Evidence Panel
   *
   * Displays source citations and evidence supporting claims made in the phase analysis.
   */

  import type { Evidence } from "$lib/utils/phase-normalizer";

  interface Props {
    evidence: Evidence[];
  }

  let { evidence = [] }: Props = $props();
</script>

<div class="evidence-panel">
  {#if evidence.length === 0}
    <div class="empty-state">
      <svg
        class="empty-icon"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="empty-text">No evidence provided</p>
    </div>
  {:else}
    <ul class="evidence-list">
      {#each evidence as item (item.id)}
        <li class="evidence-item">
          <div class="evidence-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div class="evidence-content">
            <p class="evidence-claim">{item.claim}</p>

            {#if item.url}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                class="evidence-link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                {item.url}
              </a>
            {/if}

            {#if item.snippet}
              <blockquote class="evidence-snippet">
                {item.snippet}
              </blockquote>
            {/if}

            <div class="evidence-meta">
              <span class="meta-label">Source:</span>
              <span class="meta-value">{item.phaseOrigin}</span>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .evidence-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px dashed var(--color-border);
  }

  .empty-icon {
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  /* Evidence List */
  .evidence-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .evidence-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .evidence-item:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .evidence-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .evidence-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .evidence-claim {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text);
    font-weight: 500;
  }

  .evidence-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--color-primary);
    font-size: 0.8125rem;
    text-decoration: none;
    word-break: break-all;
  }

  .evidence-link:hover {
    text-decoration: underline;
  }

  .evidence-snippet {
    margin: 0;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-left: 3px solid var(--color-primary);
    border-radius: 4px;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .evidence-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
  }

  .meta-label {
    color: var(--color-text-muted);
  }

  .meta-value {
    color: var(--color-primary);
    font-weight: 500;
    text-transform: capitalize;
  }
</style>
