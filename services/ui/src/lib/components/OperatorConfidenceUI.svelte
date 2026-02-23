<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /**
   * Operator Confidence UI - Human-in-the-Loop Decision Interface
   *
   * Provides operators with decision review workflows and confidence scoring.
   * Critical component for Palantir AIP-inspired human+AI collaboration.
   */

  interface Decision {
    id: string;
    type: 'APPROVE' | 'REJECT' | 'REVISE' | 'GO' | 'KILL' | 'PIVOT';
    phase: string;
    reasoning: string;
    evidence: Array<{
      type: string;
      source: string;
      confidence: number;
    }>;
    decisionMaker: 'system' | 'operator';
    systemConfidence?: number; // 0-1 score from AI
    operatorConfidence?: number; // 0-1 score from human
    operatorId?: string;
    timestamp: number;
    requiresReview: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'revised';
  }

  interface PhaseArtifact {
    id: string;
    phase: string;
    version: number;
    content: unknown;
    reviewVerdict: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVISION';
    qualityScore?: number;
    orchestration?: {
      consensusScore: number;
      wildIdeas: Array<{
        model: string;
        wildIdea: string;
        reasoning: string;
      }>;
    };
  }

  // Props
  export let decision: Decision | null = null;
  export let artifact: PhaseArtifact | null = null;
  export let operatorId: string;

  // State
  let confidenceScore: number = 0.5; // Default 50% confidence
  let reviewNotes: string = '';
  let selectedAction: 'approve' | 'revise' | 'reject' | null = null;
  let revisionInstructions: string = '';
  let showEvidence = true;
  let showWildIdeas = false;

  const dispatch = createEventDispatcher<{
    submitReview: {
      action: 'approve' | 'revise' | 'reject';
      confidenceScore: number;
      notes: string;
      revisionInstructions?: string;
    };
    escalate: { reason: string };
  }>();

  // Computed
  $: confidenceLevel = getConfidenceLevel(confidenceScore);
  $: systemConfidenceLevel = decision?.systemConfidence
    ? getConfidenceLevel(decision.systemConfidence)
    : null;
  $: showHighConfidenceWarning = decision?.systemConfidence && decision.systemConfidence < 0.6;
  $: showLowConsensusWarning = artifact?.orchestration &&
    artifact.orchestration.consensusScore < 0.7;
  $: hasWildIdeas = artifact?.orchestration &&
    artifact.orchestration.wildIdeas.length > 0;

  function getConfidenceLevel(
    score: number
  ): 'very-low' | 'low' | 'medium' | 'high' | 'very-high' {
    if (score >= 0.9) return 'very-high';
    if (score >= 0.75) return 'high';
    if (score >= 0.5) return 'medium';
    if (score >= 0.3) return 'low';
    return 'very-low';
  }

  function handleSubmit() {
    if (!selectedAction) {
      alert('Please select an action (Approve, Revise, or Reject)');
      return;
    }

    if (confidenceScore < 0.5 && selectedAction === 'approve') {
      const confirmed = confirm(
        'Your confidence is below 50%. Are you sure you want to approve?'
      );
      if (!confirmed) return;
    }

    dispatch('submitReview', {
      action: selectedAction,
      confidenceScore,
      notes: reviewNotes,
      revisionInstructions: selectedAction === 'revise' ? revisionInstructions : undefined,
    });

    // Reset form
    selectedAction = null;
    reviewNotes = '';
    revisionInstructions = '';
    confidenceScore = 0.5;
  }

  function handleEscalate() {
    const reason = prompt('Reason for escalation:');
    if (reason) {
      dispatch('escalate', { reason });
    }
  }

  function formatConfidencePercent(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  function formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
</script>

<div class="operator-confidence-ui">
  <header class="ui-header">
    <div class="header-left">
      <h2>Decision Review</h2>
      {#if decision}
        <span class="phase-badge">{decision.phase}</span>
        <span class="type-badge type-{decision.type.toLowerCase()}">{decision.type}</span>
      {/if}
    </div>
    <div class="header-right">
      <span class="operator-id">Operator: {operatorId}</span>
    </div>
  </header>

  {#if decision}
    <!-- Warnings and Alerts -->
    <div class="alerts">
      {#if showHighConfidenceWarning}
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Low System Confidence</strong>
            <p>
              The AI system has low confidence ({formatConfidencePercent(decision.systemConfidence)}) in this decision. Extra scrutiny recommended.
            </p>
          </div>
        </div>
      {/if}

      {#if showLowConsensusWarning}
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Low Model Consensus</strong>
            <p>
              Multiple AI models disagree (consensus: {formatConfidencePercent(artifact.orchestration.consensusScore)}).
              Review wild ideas for alternative perspectives.
            </p>
          </div>
        </div>
      {/if}

      {#if decision.requiresReview}
        <div class="alert alert-info">
          <span class="alert-icon">ℹ️</span>
          <div>
            <strong>Human Review Required</strong>
            <p>This decision requires operator approval before proceeding.</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Decision Summary -->
    <section class="section">
      <h3>Decision Summary</h3>
      <div class="decision-summary">
        <div class="summary-row">
          <span class="label">Decision Type:</span>
          <span class="value">{decision.type}</span>
        </div>
        <div class="summary-row">
          <span class="label">Phase:</span>
          <span class="value">{decision.phase}</span>
        </div>
        <div class="summary-row">
          <span class="label">Made By:</span>
          <span class="value">{decision.decisionMaker}</span>
        </div>
        <div class="summary-row">
          <span class="label">Timestamp:</span>
          <span class="value">{formatTimestamp(decision.timestamp)}</span>
        </div>
        {#if decision.systemConfidence}
          <div class="summary-row">
            <span class="label">System Confidence:</span>
            <span class="value confidence-{systemConfidenceLevel}">
              {formatConfidencePercent(decision.systemConfidence)}
              <span class="confidence-label">({systemConfidenceLevel})</span>
            </span>
          </div>
        {/if}
      </div>
    </section>

    <!-- Reasoning -->
    <section class="section">
      <h3>Reasoning</h3>
      <div class="reasoning-box">
        <p>{decision.reasoning}</p>
      </div>
    </section>

    <!-- Evidence -->
    <section class="section">
      <div class="section-header">
        <h3>Evidence</h3>
        <button class="toggle-button" on:click={() => (showEvidence = !showEvidence)}>
          {showEvidence ? 'Hide' : 'Show'}
        </button>
      </div>

      {#if showEvidence && decision.evidence.length > 0}
        <div class="evidence-list">
          {#each decision.evidence as evidence, i}
            <div class="evidence-item">
              <div class="evidence-header">
                <span class="evidence-number">#{i + 1}</span>
                <span class="evidence-type">{evidence.type}</span>
                <span class="evidence-confidence confidence-{getConfidenceLevel(evidence.confidence)}">
                  {formatConfidencePercent(evidence.confidence)} confidence
                </span>
              </div>
              <div class="evidence-source">
                <strong>Source:</strong> {evidence.source}
              </div>
            </div>
          {/each}
        </div>
      {:else if showEvidence}
        <p class="no-data">No evidence available</p>
      {/if}
    </section>

    <!-- Wild Ideas (if available) -->
    {#if hasWildIdeas}
      <section class="section">
        <div class="section-header">
          <h3>Wild Ideas ({artifact.orchestration.wildIdeas.length})</h3>
          <button class="toggle-button" on:click={() => (showWildIdeas = !showWildIdeas)}>
            {showWildIdeas ? 'Hide' : 'Show'}
          </button>
        </div>

        {#if showWildIdeas}
          <div class="wild-ideas-list">
            {#each artifact.orchestration.wildIdeas as idea, i}
              <div class="wild-idea-card">
                <div class="wild-idea-header">
                  <span class="wild-idea-number">#{i + 1}</span>
                  <span class="wild-idea-model">{idea.model}</span>
                </div>
                <div class="wild-idea-content">
                  <p class="wild-idea-text">{idea.wildIdea}</p>
                  <p class="wild-idea-reasoning"><em>{idea.reasoning}</em></p>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}

    <!-- Operator Confidence Scoring -->
    <section class="section confidence-section">
      <h3>Your Confidence Assessment</h3>
      <p class="section-description">
        Rate your confidence in this decision. Be honest—low confidence triggers additional review.
      </p>

      <div class="confidence-slider">
        <label for="confidence-range">
          <span>Confidence: </span>
          <strong class="confidence-value confidence-{confidenceLevel}">
            {formatConfidencePercent(confidenceScore)}
          </strong>
          <span class="confidence-label">({confidenceLevel})</span>
        </label>
        <input
          type="range"
          id="confidence-range"
          min="0"
          max="1"
          step="0.05"
          bind:value={confidenceScore}
          class="confidence-{confidenceLevel}"
        />
        <div class="confidence-scale">
          <span>Very Low</span>
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Very High</span>
        </div>
      </div>
    </section>

    <!-- Action Selection -->
    <section class="section">
      <h3>Review Action</h3>
      <div class="action-buttons">
        <button
          class="action-button approve"
          class:selected={selectedAction === 'approve'}
          on:click={() => (selectedAction = 'approve')}
        >
          <span class="action-icon">✓</span>
          Approve
        </button>
        <button
          class="action-button revise"
          class:selected={selectedAction === 'revise'}
          on:click={() => (selectedAction = 'revise')}
        >
          <span class="action-icon">↻</span>
          Request Revision
        </button>
        <button
          class="action-button reject"
          class:selected={selectedAction === 'reject'}
          on:click={() => (selectedAction = 'reject')}
        >
          <span class="action-icon">✗</span>
          Reject
        </button>
      </div>
    </section>

    <!-- Review Notes -->
    <section class="section">
      <h3>Review Notes</h3>
      <textarea
        bind:value={reviewNotes}
        placeholder="Add notes about your review decision (optional)..."
        rows="4"
        class="notes-textarea"
      ></textarea>
    </section>

    <!-- Revision Instructions (if Revise selected) -->
    {#if selectedAction === 'revise'}
      <section class="section">
        <h3>Revision Instructions</h3>
        <p class="section-description">
          Provide specific guidance for what needs to be changed.
        </p>
        <textarea
          bind:value={revisionInstructions}
          placeholder="Be specific: what should be changed, added, or clarified?..."
          rows="6"
          class="notes-textarea"
          required
        ></textarea>
      </section>
    {/if}

    <!-- Submit Actions -->
    <footer class="ui-footer">
      <button class="button button-secondary" on:click={handleEscalate}>
        Escalate to Supervisor
      </button>
      <button
        class="button button-primary"
        on:click={handleSubmit}
        disabled={!selectedAction}
      >
        Submit Review
      </button>
    </footer>
  {:else}
    <div class="no-decision">
      <p>No decision to review</p>
    </div>
  {/if}
</div>

<style>
  .operator-confidence-ui {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--bg-primary, #ffffff);
  }

  .ui-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--border-color, #e5e5e5);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .ui-header h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
  }

  .phase-badge,
  .type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .phase-badge {
    background: #e0e7ff;
    color: #3730a3;
  }

  .type-badge {
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
  }

  .type-badge.type-approve {
    background: #dcfce7;
    color: #166534;
  }

  .type-badge.type-go {
    background: #dcfce7;
    color: #166534;
  }

  .type-badge.type-reject,
  .type-badge.type-kill {
    background: #fee2e2;
    color: #991b1b;
  }

  .type-badge.type-revise,
  .type-badge.type-pivot {
    background: #fef3c7;
    color: #92400e;
  }

  .operator-id {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
  }

  .alerts {
    margin-bottom: 2rem;
  }

  .alert {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .alert-warning {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
  }

  .alert-info {
    background: #dbeafe;
    border-left: 4px solid #3b82f6;
  }

  .alert-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .alert strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .alert p {
    margin: 0;
    font-size: 0.875rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-description {
    color: var(--text-secondary, #666);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .toggle-button {
    padding: 0.25rem 0.75rem;
    background: var(--bg-secondary, #f9f9f9);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .toggle-button:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .decision-summary {
    background: var(--bg-secondary, #f9f9f9);
    padding: 1.5rem;
    border-radius: 8px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .summary-row:last-child {
    border-bottom: none;
  }

  .summary-row .label {
    font-weight: 600;
    color: var(--text-secondary, #666);
  }

  .summary-row .value {
    color: var(--text-primary, #1a1a1a);
  }

  .confidence-very-high {
    color: #166534;
  }

  .confidence-high {
    color: #15803d;
  }

  .confidence-medium {
    color: #ca8a04;
  }

  .confidence-low {
    color: #dc2626;
  }

  .confidence-very-low {
    color: #991b1b;
  }

  .confidence-label {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    margin-left: 0.5rem;
  }

  .reasoning-box {
    background: var(--bg-secondary, #f9f9f9);
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid var(--primary-color, #0066ff);
  }

  .reasoning-box p {
    margin: 0;
    line-height: 1.6;
  }

  .evidence-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .evidence-item {
    background: var(--bg-secondary, #f9f9f9);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .evidence-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .evidence-number {
    font-weight: 700;
    color: var(--text-secondary, #666);
  }

  .evidence-type {
    padding: 0.25rem 0.5rem;
    background: #e0e7ff;
    color: #3730a3;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .evidence-confidence {
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .evidence-source {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
  }

  .wild-ideas-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .wild-idea-card {
    background: #fef3c7;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
  }

  .wild-idea-header {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .wild-idea-number {
    font-weight: 700;
    color: #92400e;
  }

  .wild-idea-model {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #92400e;
    font-weight: 600;
  }

  .wild-idea-text {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .wild-idea-reasoning {
    color: var(--text-secondary, #666);
    font-size: 0.875rem;
  }

  .confidence-section {
    background: var(--bg-secondary, #f9f9f9);
    padding: 2rem;
    border-radius: 8px;
  }

  .confidence-slider {
    margin-top: 1.5rem;
  }

  .confidence-slider label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-size: 1.125rem;
  }

  .confidence-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  input[type='range'] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    outline: none;
    -webkit-appearance: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary-color, #0066ff);
    cursor: pointer;
  }

  input[type='range']::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary-color, #0066ff);
    cursor: pointer;
    border: none;
  }

  input[type='range'].confidence-very-high::-webkit-slider-thumb {
    background: #166534;
  }

  input[type='range'].confidence-high::-webkit-slider-thumb {
    background: #15803d;
  }

  input[type='range'].confidence-medium::-webkit-slider-thumb {
    background: #ca8a04;
  }

  input[type='range'].confidence-low::-webkit-slider-thumb {
    background: #dc2626;
  }

  input[type='range'].confidence-very-low::-webkit-slider-thumb {
    background: #991b1b;
  }

  .confidence-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary, #666);
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
  }

  .action-button {
    flex: 1;
    padding: 1rem;
    border: 2px solid var(--border-color, #e5e5e5);
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .action-button:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .action-button.selected {
    border-width: 3px;
  }

  .action-button.approve.selected {
    background: #dcfce7;
    border-color: #166534;
    color: #166534;
  }

  .action-button.revise.selected {
    background: #fef3c7;
    border-color: #92400e;
    color: #92400e;
  }

  .action-button.reject.selected {
    background: #fee2e2;
    border-color: #991b1b;
    color: #991b1b;
  }

  .action-icon {
    font-size: 2rem;
  }

  .notes-textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
  }

  .notes-textarea:focus {
    outline: none;
    border-color: var(--primary-color, #0066ff);
  }

  .ui-footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 2px solid var(--border-color, #e5e5e5);
  }

  .button {
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background: var(--primary-color, #0066ff);
    color: white;
    border: none;
  }

  .button-primary:hover:not(:disabled) {
    background: #0052cc;
  }

  .button-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-secondary {
    background: transparent;
    color: var(--text-secondary, #666);
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .button-secondary:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .no-decision,
  .no-data {
    text-align: center;
    color: var(--text-secondary, #666);
    padding: 2rem;
  }
</style>
