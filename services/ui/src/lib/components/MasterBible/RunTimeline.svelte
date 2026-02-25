<script lang="ts">
  import type { PlanningRun } from '$lib/types';

  interface Props {
    runs: PlanningRun[];
    projectId: string;
  }

  let { runs, projectId }: Props = $props();

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPhase(phase: string | null | undefined): string {
    if (!phase) return 'Not started';
    return phase
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'running':
      case 'active':
        return 'var(--color-success, #10b981)';
      case 'paused':
        return 'var(--color-warning, #f59e0b)';
      case 'completed':
        return 'var(--color-primary, #6366f1)';
      case 'killed':
      case 'cancelled':
        return 'var(--color-error, #ef4444)';
      default:
        return 'var(--color-text-muted, #6b7280)';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'running':
      case 'active':
        return '▶';
      case 'paused':
        return '⏸';
      case 'completed':
        return '✓';
      case 'killed':
        return '✕';
      case 'cancelled':
        return '⊘';
      default:
        return '○';
    }
  }

  // Sort runs by created_at DESC
  const sortedRuns = $derived(
    [...runs].sort((a, b) => b.created_at - a.created_at)
  );
</script>

<div class="timeline-tab">
  <div class="timeline-header">
    <h2>Run History</h2>
    <p class="timeline-subtitle">
      {runs.length} research run{runs.length !== 1 ? 's' : ''} for this project
    </p>
  </div>

  {#if sortedRuns.length > 0}
    <!-- Timeline Visual -->
    <div class="timeline-visual">
      {#each sortedRuns as run, index}
        <div class="timeline-point" style="--status-color: {getStatusColor(run.status)}">
          <span class="point-marker">{getStatusIcon(run.status)}</span>
          {#if index < sortedRuns.length - 1}
            <div class="timeline-line"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Run Cards -->
    <div class="runs-list">
      {#each sortedRuns as run, index}
        <div class="run-card" class:current={index === 0}>
          <div class="run-header">
            <div class="run-title">
              <span class="run-number">Run #{sortedRuns.length - index}</span>
              {#if index === 0}
                <span class="current-badge">Current</span>
              {/if}
            </div>
            <span class="run-status" style="--status-color: {getStatusColor(run.status)}">
              {run.status}
            </span>
          </div>

          <div class="run-meta">
            <div class="meta-row">
              <span class="meta-label">Started:</span>
              <span class="meta-value">{formatDate(run.created_at)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Phase:</span>
              <span class="meta-value">{formatPhase(run.current_phase)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Mode:</span>
              <span class="meta-value">{run.mode === 'local' ? '🏠 Local' : '☁️ Cloud'}</span>
            </div>
            {#if run.quality_score}
              <div class="meta-row">
                <span class="meta-label">Quality:</span>
                <span class="meta-value">{run.quality_score}/100</span>
              </div>
            {/if}
            {#if run.kill_verdict}
              <div class="meta-row">
                <span class="meta-label">Kill Verdict:</span>
                <span class="meta-value verdict-{run.kill_verdict.toLowerCase()}">{run.kill_verdict}</span>
              </div>
            {/if}
          </div>

          <div class="run-actions">
            <a href="/ai-labs/research/runs/{run.id}" class="run-link">
              View Run Details →
            </a>
            <a href="/ai-labs/research/runs/{run.id}/bible" class="run-link">
              View Run Bible →
            </a>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-timeline">
      <div class="empty-icon">📅</div>
      <h3>No Research Runs Yet</h3>
      <p>Start a research run to begin validating this project idea.</p>
      <a href="/ai-labs/research" class="start-link">
        Start Research →
      </a>
    </div>
  {/if}
</div>

<style>
  .timeline-tab {
    max-width: 800px;
  }

  .timeline-header {
    margin-bottom: 2rem;
  }

  .timeline-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--color-text, #111827);
  }

  .timeline-subtitle {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .timeline-visual {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem 0;
    margin-bottom: 1.5rem;
    overflow-x: auto;
  }

  .timeline-point {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .point-marker {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--status-color);
    color: white;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .timeline-line {
    width: 60px;
    height: 2px;
    background: var(--color-border, #e5e7eb);
    margin-left: 0.5rem;
  }

  .runs-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .run-card {
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 10px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .run-card:hover {
    border-color: var(--color-primary, #6366f1);
  }

  .run-card.current {
    background: white;
    border-color: var(--color-primary, #6366f1);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }

  .run-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .run-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .run-number {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .current-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    background: var(--color-primary, #6366f1);
    color: white;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .run-status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    background: var(--status-color);
    color: white;
    border-radius: 999px;
    text-transform: capitalize;
  }

  .run-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .meta-row {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .meta-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-value {
    font-size: 0.875rem;
    color: var(--color-text, #111827);
  }

  .meta-value.verdict-go {
    color: var(--color-success, #10b981);
    font-weight: 600;
  }

  .meta-value.verdict-kill,
  .meta-value.verdict-no-go {
    color: var(--color-error, #ef4444);
    font-weight: 600;
  }

  .run-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .run-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-primary, #6366f1);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .run-link:hover {
    color: var(--color-primary-hover, #4f46e5);
    text-decoration: underline;
  }

  .empty-timeline {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 12px;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-timeline h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    color: var(--color-text, #111827);
  }

  .empty-timeline p {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .start-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #6366f1);
    color: white;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .start-link:hover {
    background: var(--color-primary-hover, #4f46e5);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .run-meta {
      grid-template-columns: 1fr;
    }

    .run-actions {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
