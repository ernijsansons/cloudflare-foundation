<script lang="ts">
  import type { PhaseName, PlanningArtifact } from "$lib/types";
  import { phaseDocs, getPhaseIndex, PHASE_ORDER } from "$lib/data/phase-docs";
  import ArtifactViewer from "./ArtifactViewer.svelte";

  interface Props {
    phase: PhaseName;
    artifact?: PlanningArtifact;
    onNavigate?: (phase: PhaseName) => void;
  }

  let { phase, artifact, onNavigate }: Props = $props();

  let doc = $derived(phaseDocs[phase]);
  let phaseIndex = $derived(getPhaseIndex(phase));
  let prevPhase = $derived(phaseIndex > 1 ? PHASE_ORDER[phaseIndex - 2] : undefined);
  let nextPhase = $derived(phaseIndex < PHASE_ORDER.length ? PHASE_ORDER[phaseIndex] : undefined);

  function getStatusBadge(artifact?: PlanningArtifact): { label: string; class: string } {
    if (!artifact) return { label: "Pending", class: "pending" };
    if (artifact.review_verdict === "approved") return { label: "Approved", class: "approved" };
    if (artifact.review_verdict === "needs_revision") return { label: "Needs Revision", class: "revision" };
    return { label: "Completed", class: "completed" };
  }

  let status = $derived(getStatusBadge(artifact));
</script>

<div class="phase-detail">
  <header class="phase-header">
    <div class="phase-title-row">
      <span class="phase-number">{phaseIndex}</span>
      <h2 class="phase-title">{doc.title}</h2>
      <span class="status-badge {status.class}">{status.label}</span>
    </div>
    <p class="phase-purpose">{doc.purpose}</p>
  </header>

  <div class="phase-body">
    <section class="phase-section">
      <h3 class="section-title">Inputs</h3>
      <ul class="section-list">
        {#each doc.inputs as input (input)}
          <li>{input}</li>
        {/each}
      </ul>
    </section>

    <section class="phase-section">
      <h3 class="section-title">Expected Outputs</h3>
      <ul class="section-list">
        {#each doc.outputs as output (output)}
          <li>{output}</li>
        {/each}
      </ul>
    </section>

    {#if doc.successCriteria && doc.successCriteria.length > 0}
      <section class="phase-section">
        <h3 class="section-title">Success Criteria</h3>
        <ul class="section-list criteria">
          {#each doc.successCriteria as criterion (criterion)}
            <li>
              <span class="criterion-check">{artifact ? "✓" : "○"}</span>
              {criterion}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if artifact}
      <section class="phase-section">
        <h3 class="section-title">Artifact</h3>
        <ArtifactViewer artifact={artifact.content} expanded={true} />
      </section>

      {#if artifact.review_verdict || artifact.overall_score}
        <section class="phase-section">
          <h3 class="section-title">Review</h3>
          <div class="review-info">
            {#if artifact.overall_score}
              <div class="review-score">
                <span class="score-label">Quality Score</span>
                <span class="score-value">{artifact.overall_score}/100</span>
                <div class="score-bar">
                  <div
                    class="score-fill"
                    style="width: {artifact.overall_score}%"
                    class:good={artifact.overall_score >= 70}
                    class:medium={artifact.overall_score >= 40 && artifact.overall_score < 70}
                    class:low={artifact.overall_score < 40}
                  ></div>
                </div>
              </div>
            {/if}
            {#if artifact.review_iterations}
              <div class="review-meta">
                <span class="meta-label">Review Iterations:</span>
                <span class="meta-value">{artifact.review_iterations}</span>
              </div>
            {/if}
            {#if artifact.review_verdict}
              <div class="review-meta">
                <span class="meta-label">Verdict:</span>
                <span class="verdict-badge {artifact.review_verdict}">{artifact.review_verdict}</span>
              </div>
            {/if}
          </div>
        </section>
      {/if}
    {:else}
      <section class="phase-section pending-section">
        <div class="pending-notice">
          <span class="pending-icon">○</span>
          <span class="pending-text">This phase has not been executed yet</span>
        </div>
      </section>
    {/if}
  </div>

  {#if onNavigate}
    <footer class="phase-footer">
      <button
        class="nav-btn prev"
        onclick={() => prevPhase && onNavigate(prevPhase)}
        disabled={!prevPhase}
      >
        <span class="nav-arrow">←</span>
        <span class="nav-label">Previous</span>
      </button>
      <span class="phase-progress">{phaseIndex} of {PHASE_ORDER.length}</span>
      <button
        class="nav-btn next"
        onclick={() => nextPhase && onNavigate(nextPhase)}
        disabled={!nextPhase}
      >
        <span class="nav-label">Next</span>
        <span class="nav-arrow">→</span>
      </button>
    </footer>
  {/if}
</div>

<style>
  .phase-detail {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .phase-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .phase-title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .phase-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .phase-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
  }

  .status-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.pending {
    background: var(--color-bg-tertiary);
    color: var(--color-text-muted);
  }

  .status-badge.completed {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .status-badge.approved {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .status-badge.revision {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .phase-purpose {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-text-muted);
    line-height: 1.5;
  }

  .phase-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .phase-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    margin: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-list {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9375rem;
    color: var(--color-text);
  }

  .section-list.criteria {
    padding-left: 0;
    list-style: none;
  }

  .section-list.criteria li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .criterion-check {
    font-size: 0.875rem;
    color: var(--color-success, #10b981);
  }

  .pending-section {
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px dashed var(--color-border);
  }

  .pending-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .pending-icon {
    font-size: 1.25rem;
  }

  .review-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
  }

  .review-score {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .score-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .score-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .score-bar {
    height: 6px;
    background: var(--color-bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .score-fill.good {
    background: var(--color-success, #10b981);
  }

  .score-fill.medium {
    background: var(--color-warning, #f59e0b);
  }

  .score-fill.low {
    background: var(--color-error, #ef4444);
  }

  .review-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .meta-label {
    color: var(--color-text-muted);
  }

  .meta-value {
    color: var(--color-text);
    font-weight: 500;
  }

  .verdict-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .verdict-badge.approved {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .verdict-badge.needs_revision {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .phase-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-arrow {
    font-size: 1rem;
  }

  .phase-progress {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
</style>
