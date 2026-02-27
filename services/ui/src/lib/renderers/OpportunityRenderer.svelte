<script lang="ts">
  /**
   * OpportunityRenderer
   *
   * Rich visual renderer for Opportunity Analysis phase artifacts.
   * Displays refined opportunity variants with scoring, sources, and key insights.
   */

  interface OpportunityVariant {
    idea?: string | null;
    description?: string | null;
    revenuePotential?: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | null;
    customerUrgency?: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | null;
    competitionDensity?: "LOW" | "MEDIUM" | "HIGH" | null;
    feasibility?: "HIGH" | "MEDIUM" | "LOW" | null;
    agenticScore?: "HIGH" | "MEDIUM" | "LOW" | null;
    reasoning?: string | null;
    sources?: Source[] | null;
  }

  interface Source {
    claim?: string | null;
    url?: string | null;
    snippet?: string | null;
  }

  interface OpportunityOutput {
    originalIdea?: string | null;
    refinedOpportunities?: OpportunityVariant[] | null;
    recommendedIndex?: number | null;
    keyInsight?: string | null;
    unknowns?: string[] | null;
  }

  interface Props {
    content: unknown;
  }

  let { content }: Props = $props();
  let opp = $derived(content as OpportunityOutput);
  let expandedReasoningIds = $state<Set<number>>(new Set());
  let expandedSourcesIds = $state<Set<number>>(new Set());

  function toggleReasoning(index: number) {
    const newSet = new Set(expandedReasoningIds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    expandedReasoningIds = newSet;
  }

  function toggleSources(index: number) {
    const newSet = new Set(expandedSourcesIds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    expandedSourcesIds = newSet;
  }

  function getScoreColor(score: string | null | undefined, inverted = false): string {
    if (!score) return "gray";

    const level = score.includes("VERY_HIGH") || score === "HIGH" ? "high" :
                  score === "MEDIUM" ? "medium" : "low";

    if (inverted) {
      // For competition density: LOW is good
      return level === "low" ? "green" : level === "medium" ? "yellow" : "red";
    }

    // Normal scoring: HIGH is good
    return level === "high" ? "green" : level === "medium" ? "yellow" : "red";
  }

  function formatScoreLabel(score: string | null | undefined): string {
    if (!score) return "N/A";
    return score.replace(/_/g, " ");
  }
</script>

<div class="opportunity-renderer">
  {#if opp.originalIdea}
    <section class="original-idea-section">
      <h3 class="section-title">Original Idea</h3>
      <div class="original-idea-card">
        <p class="original-idea-text">{opp.originalIdea}</p>
      </div>
    </section>
  {/if}

  {#if opp.keyInsight}
    <section class="key-insight-section">
      <div class="key-insight-callout">
        <svg class="insight-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <div class="insight-content">
          <span class="insight-label">Key Insight</span>
          <p class="insight-text">{opp.keyInsight}</p>
        </div>
      </div>
    </section>
  {/if}

  {#if opp.refinedOpportunities && opp.refinedOpportunities.length > 0}
    <section class="refined-opportunities-section">
      <h3 class="section-title">Refined Opportunities ({opp.refinedOpportunities.length})</h3>

      <div class="opportunities-grid">
        {#each opp.refinedOpportunities as variant, index}
          <div
            class="opportunity-card"
            class:is-recommended={index === opp.recommendedIndex}
          >
            {#if index === opp.recommendedIndex}
              <div class="recommended-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>Recommended</span>
              </div>
            {/if}

            <h4 class="opportunity-title">{variant.idea || "Untitled Opportunity"}</h4>

            {#if variant.description}
              <p class="opportunity-description">{variant.description}</p>
            {/if}

            <div class="score-chips">
              <div class="score-chip {getScoreColor(variant.revenuePotential)}">
                <span class="chip-label">Revenue</span>
                <span class="chip-value">{formatScoreLabel(variant.revenuePotential)}</span>
              </div>

              <div class="score-chip {getScoreColor(variant.customerUrgency)}">
                <span class="chip-label">Urgency</span>
                <span class="chip-value">{formatScoreLabel(variant.customerUrgency)}</span>
              </div>

              <div class="score-chip {getScoreColor(variant.competitionDensity, true)}">
                <span class="chip-label">Competition</span>
                <span class="chip-value">{formatScoreLabel(variant.competitionDensity)}</span>
              </div>

              <div class="score-chip {getScoreColor(variant.feasibility)}">
                <span class="chip-label">Feasibility</span>
                <span class="chip-value">{formatScoreLabel(variant.feasibility)}</span>
              </div>

              <div class="score-chip {getScoreColor(variant.agenticScore)}">
                <span class="chip-label">Agentic</span>
                <span class="chip-value">{formatScoreLabel(variant.agenticScore)}</span>
              </div>
            </div>

            {#if variant.reasoning}
              <div class="reasoning-section">
                <button
                  class="reasoning-toggle"
                  type="button"
                  onclick={() => toggleReasoning(index)}
                >
                  <svg
                    class="toggle-icon"
                    class:is-expanded={expandedReasoningIds.has(index)}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <span>Reasoning</span>
                </button>

                {#if expandedReasoningIds.has(index)}
                  <p class="reasoning-text">{variant.reasoning}</p>
                {/if}
              </div>
            {/if}

            {#if variant.sources && variant.sources.length > 0}
              <div class="sources-section">
                <button
                  class="sources-toggle"
                  type="button"
                  onclick={() => toggleSources(index)}
                >
                  <svg
                    class="toggle-icon"
                    class:is-expanded={expandedSourcesIds.has(index)}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <span>{variant.sources.length} {variant.sources.length === 1 ? 'Source' : 'Sources'}</span>
                </button>

                {#if expandedSourcesIds.has(index)}
                  <ul class="sources-list">
                    {#each variant.sources as source}
                      <li class="source-item">
                        {#if source.claim}
                          <p class="source-claim">{source.claim}</p>
                        {/if}
                        {#if source.url}
                          <a href={source.url} target="_blank" rel="noopener noreferrer" class="source-link">
                            {source.url}
                          </a>
                        {/if}
                        {#if source.snippet}
                          <p class="source-snippet">{source.snippet}</p>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .opportunity-renderer {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Section Titles */
  .section-title {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
  }

  /* Original Idea */
  .original-idea-card {
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .original-idea-text {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  /* Key Insight Callout */
  .key-insight-callout {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: color-mix(in srgb, #3b82f6 8%, transparent);
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, #3b82f6 20%, transparent);
  }

  .insight-icon {
    flex-shrink: 0;
    color: #3b82f6;
  }

  .insight-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .insight-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #3b82f6;
  }

  .insight-text {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--color-text);
    font-weight: 500;
  }

  /* Opportunities Grid */
  .opportunities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1rem;
  }

  .opportunity-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .opportunity-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .opportunity-card.is-recommended {
    border-color: var(--color-success, #10b981);
    border-width: 2px;
    padding: calc(1.25rem - 1px);
  }

  .recommended-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    width: fit-content;
  }

  .opportunity-title {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--color-text);
  }

  .opportunity-description {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  /* Score Chips */
  .score-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .score-chip {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.375rem 0.625rem;
    border-radius: 6px;
    font-size: 0.6875rem;
    line-height: 1.2;
  }

  .score-chip.green {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .score-chip.yellow {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .score-chip.red {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .score-chip.gray {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .chip-label {
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    opacity: 0.8;
  }

  .chip-value {
    font-weight: 600;
    text-transform: capitalize;
  }

  /* Reasoning Section */
  .reasoning-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }

  .reasoning-toggle,
  .sources-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    background: none;
    border: none;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-primary);
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .reasoning-toggle:hover,
  .sources-toggle:hover {
    opacity: 0.8;
  }

  .toggle-icon {
    transition: transform 0.2s ease;
  }

  .toggle-icon.is-expanded {
    transform: rotate(180deg);
  }

  .reasoning-text {
    margin: 0;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: 6px;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  /* Sources Section */
  .sources-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }

  .sources-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .source-item {
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: 6px;
    font-size: 0.8125rem;
  }

  .source-claim {
    margin: 0 0 0.5rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .source-link {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-primary);
    text-decoration: none;
    word-break: break-all;
  }

  .source-link:hover {
    text-decoration: underline;
  }

  .source-snippet {
    margin: 0;
    padding: 0.5rem;
    background: var(--color-bg-secondary);
    border-left: 2px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-style: italic;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .opportunities-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
