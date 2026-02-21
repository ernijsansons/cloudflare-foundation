<script lang="ts">
  /**
   * K-LLM Consensus Panel
   *
   * Displays consensus metrics and model participation for K-LLM ensemble orchestration.
   * Shows consensus score, model success/failure status, and synthesizer information.
   */

  import type { OrchestrationData } from "$lib/utils/orchestration-detection";
  import {
    calculateConsensusScore,
    getConsensusLevel,
    getConsensusColor,
    getSuccessfulOutputs,
    getFailedOutputs,
  } from "$lib/utils/orchestration-detection";

  interface Props {
    orchestration: OrchestrationData;
  }

  let { orchestration }: Props = $props();

  let consensusScore = $derived(calculateConsensusScore(orchestration));
  let consensusLevel = $derived(getConsensusLevel(consensusScore));
  let consensusColor = $derived(getConsensusColor(consensusScore));
  let successfulOutputs = $derived(getSuccessfulOutputs(orchestration));
  let failedOutputs = $derived(getFailedOutputs(orchestration));

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getConsensuLabel(level: string): string {
    switch (level) {
      case "high":
        return "High Consensus";
      case "moderate":
        return "Moderate Consensus";
      case "low":
        return "Divergent Thinking";
      default:
        return "Unknown";
    }
  }
</script>

<div class="kllm-consensus-panel">
  <!-- Consensus Strength Bar -->
  <div class="consensus-header">
    <div class="consensus-label-row">
      <span class="consensus-label">Model Consensus</span>
      <span class="consensus-value {consensusColor}">{getConsensuLabel(consensusLevel)}</span>
    </div>

    <div class="consensus-bar">
      <div
        class="consensus-fill {consensusColor}"
        style="width: {consensusScore}%"
      ></div>
    </div>

    <div class="consensus-score-row">
      <span class="score-number">{consensusScore}/100</span>
      {#if orchestration.wildIdeas.length > 0}
        <span class="wild-ideas-indicator">
          {orchestration.wildIdeas.length} wild {orchestration.wildIdeas.length === 1 ? "idea" : "ideas"}
        </span>
      {/if}
    </div>
  </div>

  <!-- Model Participation Grid -->
  <div class="models-section">
    <h4 class="models-title">Model Participation</h4>

    <div class="models-grid">
      {#each orchestration.modelOutputs as modelOutput}
        <div class="model-card" class:failed={modelOutput.error}>
          <div class="model-header">
            <div class="model-name-row">
              {#if modelOutput.error}
                <svg class="status-icon error" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              {:else}
                <svg class="status-icon success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              {/if}
              <span class="model-name">{modelOutput.model}</span>
            </div>
          </div>

          <div class="model-metrics">
            {#if !modelOutput.error}
              <div class="metric">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>{formatDuration(modelOutput.durationMs)}</span>
              </div>
              <div class="metric">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <span>{modelOutput.text.length} chars</span>
              </div>
            {:else}
              <div class="error-message" title={modelOutput.error}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span>Failed</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Synthesizer Badge -->
  <div class="synthesizer-section">
    <div class="synthesizer-badge">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <div class="synthesizer-info">
        <span class="synthesizer-label">Synthesized by</span>
        <span class="synthesizer-model">{orchestration.synthesizerModel}</span>
      </div>
      {#if orchestration.totalDurationMs}
        <span class="synthesizer-duration">{formatDuration(orchestration.totalDurationMs)}</span>
      {/if}
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="stats-row">
    <div class="stat-item">
      <span class="stat-value">{successfulOutputs.length}</span>
      <span class="stat-label">Successful</span>
    </div>
    {#if failedOutputs.length > 0}
      <div class="stat-item error">
        <span class="stat-value">{failedOutputs.length}</span>
        <span class="stat-label">Failed</span>
      </div>
    {/if}
    <div class="stat-item">
      <span class="stat-value">{orchestration.modelOutputs.length}</span>
      <span class="stat-label">Total Models</span>
    </div>
  </div>
</div>

<style>
  .kllm-consensus-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  /* Consensus Header */
  .consensus-header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .consensus-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .consensus-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .consensus-value {
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  .consensus-value.green {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, transparent);
    color: var(--color-success, #10b981);
  }

  .consensus-value.yellow {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .consensus-value.orange {
    background: color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent);
    color: var(--color-error, #ef4444);
  }

  .consensus-bar {
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
  }

  .consensus-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .consensus-fill.green {
    background: var(--color-success, #10b981);
  }

  .consensus-fill.yellow {
    background: var(--color-warning, #f59e0b);
  }

  .consensus-fill.orange {
    background: var(--color-error, #ef4444);
  }

  .consensus-score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .score-number {
    font-weight: 600;
    color: var(--color-text);
  }

  .wild-ideas-indicator {
    color: var(--color-warning, #f59e0b);
    font-weight: 500;
  }

  /* Models Section */
  .models-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .models-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .model-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: 6px;
    border: 1px solid var(--color-border);
  }

  .model-card.failed {
    opacity: 0.6;
  }

  .model-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .model-name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-icon {
    flex-shrink: 0;
  }

  .status-icon.success {
    color: var(--color-success, #10b981);
  }

  .status-icon.error {
    color: var(--color-error, #ef4444);
  }

  .model-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .model-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .metric {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--color-error, #ef4444);
  }

  /* Synthesizer Section */
  .synthesizer-section {
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
  }

  .synthesizer-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, #a855f7 10%, transparent);
    border: 1px solid color-mix(in srgb, #a855f7 20%, transparent);
    border-radius: 8px;
    color: #a855f7;
  }

  .synthesizer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .synthesizer-label {
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    opacity: 0.8;
  }

  .synthesizer-model {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .synthesizer-duration {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.8;
  }

  /* Stats Row */
  .stats-row {
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-bg-primary);
    border-radius: 6px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-item.error .stat-value {
    color: var(--color-error, #ef4444);
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .models-grid {
      grid-template-columns: 1fr;
    }

    .stats-row {
      justify-content: space-around;
    }
  }
</style>
