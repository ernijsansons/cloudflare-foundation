<script lang="ts">
  interface Decision {
    id: string;
    decision: string;
    rationale: string;
    confidence: "high" | "medium" | "low";
    reversibility: "reversible" | "one-way-door";
  }

  interface Props {
    decisions: Decision[];
  }

  let { decisions = [] }: Props = $props();

  function getConfidenceColor(confidence: string): string {
    switch (confidence) {
      case "high":
        return "green";
      case "medium":
        return "yellow";
      case "low":
        return "red";
      default:
        return "gray";
    }
  }

  function getConfidenceLabel(confidence: string): string {
    return `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence`;
  }
</script>

<div class="decision-panel">
  {#if decisions.length === 0}
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
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="empty-text">No decisions made yet</p>
    </div>
  {:else}
    <div class="decisions-list">
      {#each decisions as decision (decision.id)}
        <div class="decision-card">
          <div class="decision-header">
            <h4 class="decision-title">{decision.decision}</h4>
            {#if decision.reversibility === "one-way-door"}
              <div class="reversibility-indicator" title="One-way door decision - difficult to reverse">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span class="reversibility-label">One-way door</span>
              </div>
            {/if}
          </div>

          <p class="decision-rationale">{decision.rationale}</p>

          <div class="decision-footer">
            <span class="confidence-badge {getConfidenceColor(decision.confidence)}">
              {getConfidenceLabel(decision.confidence)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .decision-panel {
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

  /* Decisions List */
  .decisions-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Decision Card */
  .decision-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: all 0.2s ease;
  }

  .decision-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .decision-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .decision-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-text);
    flex: 1;
  }

  .reversibility-indicator {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .reversibility-indicator svg {
    width: 14px;
    height: 14px;
  }

  .reversibility-label {
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .decision-rationale {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-text-muted);
  }

  .decision-footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
  }

  .confidence-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .confidence-badge.green {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .confidence-badge.yellow {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .confidence-badge.red {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .confidence-badge.gray {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .decision-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .reversibility-indicator {
      align-self: flex-start;
    }
  }
</style>
