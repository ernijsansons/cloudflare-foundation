<script lang="ts">
  /**
   * Wild Ideas Section
   *
   * Displays divergent thinking flagged by individual models during K-LLM orchestration.
   * These are ideas that significantly differed from the consensus.
   */

  import type { WildIdea } from "$lib/utils/orchestration-detection";

  interface Props {
    wildIdeas: WildIdea[];
    onViewModelResponse?: (model: string) => void;
  }

  let { wildIdeas, onViewModelResponse }: Props = $props();
</script>

<div class="wild-ideas-section">
  {#if wildIdeas.length === 0}
    <div class="empty-state">
      <svg class="success-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <p class="empty-text">All models converged on similar solutions</p>
      <p class="empty-subtext">No divergent thinking detected</p>
    </div>
  {:else}
    <div class="ideas-grid">
      {#each wildIdeas as wildIdea}
        <div class="idea-card">
          <div class="card-header">
            <div class="model-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{wildIdea.model}</span>
            </div>

            {#if onViewModelResponse}
              <button
                class="view-response-btn"
                type="button"
                onclick={() => onViewModelResponse?.(wildIdea.model)}
              >
                View Full Response
              </button>
            {/if}
          </div>

          <div class="idea-content">
            <h4 class="idea-title">Wild Idea</h4>
            <p class="idea-text">{wildIdea.wildIdea}</p>
          </div>

          {#if wildIdea.reasoning}
            <div class="reasoning-content">
              <h5 class="reasoning-title">Reasoning</h5>
              <p class="reasoning-text">{wildIdea.reasoning}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wild-ideas-section {
    display: flex;
    flex-direction: column;
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

  .success-icon {
    color: var(--color-success, #10b981);
    margin-bottom: 0.75rem;
    opacity: 0.5;
  }

  .empty-text {
    margin: 0;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-subtext {
    margin: 0.25rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  /* Ideas Grid */
  .ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1rem;
  }

  .idea-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 2px solid var(--color-warning, #f59e0b);
    transition: all 0.2s ease;
  }

  .idea-card:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .model-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .view-response-btn {
    padding: 0.25rem 0.625rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-response-btn:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
  }

  .idea-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .idea-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .idea-text {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text);
    font-weight: 500;
  }

  .reasoning-content {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }

  .reasoning-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .reasoning-text {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .ideas-grid {
      grid-template-columns: 1fr;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
