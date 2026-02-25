<script lang="ts">
  import type { ProjectKanbanCard } from '$lib/types/project';

  interface Props {
    project: ProjectKanbanCard;
    onclick?: () => void;
  }

  let { project, onclick }: Props = $props();

  function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  function formatPhase(phase: string | undefined): string {
    if (!phase) return 'Not started';
    return phase
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>

<button class="project-card" {onclick}>
  <div class="card-header">
    <h4 class="card-title">{project.title}</h4>
    <span class="card-mode" class:local={project.mode === 'local'}>
      {project.mode === 'local' ? '🏠' : '☁️'}
    </span>
  </div>

  {#if project.subtitle}
    <p class="card-subtitle">{project.subtitle}</p>
  {/if}

  <div class="card-phase">
    <span class="phase-indicator">▶</span>
    <span class="phase-name">{formatPhase(project.phase)}</span>
    {#if project.quality_score}
      <span class="quality-score" class:high={project.quality_score >= 80} class:medium={project.quality_score >= 60 && project.quality_score < 80}>
        {project.quality_score}
      </span>
    {/if}
  </div>

  <div class="card-metrics">
    {#if project.revenue_potential}
      <span class="metric revenue">{project.revenue_potential}</span>
    {/if}
    {#if project.risk_flags.length > 0}
      <span class="metric risks">⚠️ {project.risk_flags.length} risk{project.risk_flags.length !== 1 ? 's' : ''}</span>
    {/if}
  </div>

  <div class="card-footer">
    <span class="footer-item">
      {project.run_count} run{project.run_count !== 1 ? 's' : ''}
    </span>
    <span class="footer-separator">•</span>
    <span class="footer-item">
      {project.artifact_count} artifact{project.artifact_count !== 1 ? 's' : ''}
    </span>
    <span class="footer-separator">•</span>
    <span class="footer-item updated">
      {formatRelativeTime(project.updated_at)}
    </span>
  </div>
</button>

<style>
  .project-card {
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .project-card:hover {
    border-color: var(--color-primary, #6366f1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text, #111827);
    line-height: 1.4;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-mode {
    font-size: 1rem;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .card-mode.local {
    opacity: 1;
  }

  .card-subtitle {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-weight: 500;
  }

  .card-phase {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-top: 1px solid var(--color-border, #e5e7eb);
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .phase-indicator {
    font-size: 0.625rem;
    color: var(--color-primary, #6366f1);
  }

  .phase-name {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text, #111827);
  }

  .quality-score {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    height: 1.5rem;
    padding: 0 0.5rem;
    background: var(--color-bg-subtle, #f3f4f6);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
  }

  .quality-score.high {
    background: color-mix(in srgb, var(--color-success, #10b981) 15%, white);
    color: var(--color-success, #10b981);
  }

  .quality-score.medium {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, white);
    color: var(--color-warning, #f59e0b);
  }

  .card-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .metric {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
  }

  .metric.revenue {
    background: color-mix(in srgb, var(--color-success, #10b981) 10%, white);
    color: var(--color-success, #10b981);
  }

  .metric.risks {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, white);
    color: var(--color-warning, #f59e0b);
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding-top: 0.5rem;
  }

  .footer-item {
    font-size: 0.6875rem;
    color: var(--color-text-muted, #9ca3af);
  }

  .footer-separator {
    font-size: 0.5rem;
    color: var(--color-text-muted, #9ca3af);
  }

  .footer-item.updated {
    margin-left: auto;
  }
</style>
