<script lang="ts">
  import { page } from "$app/stores";
  import Badge from "$lib/components/Badge.svelte";
  import PhaseTimeline from "$lib/components/PhaseTimeline.svelte";
  import PhaseDetail from "$lib/components/PhaseDetail.svelte";
  import type { PlanningRun, PlanningArtifact, PhaseName } from "$lib/types";
  import { PHASE_ORDER } from "$lib/data/phase-docs";
  import { formatDateTime } from "$lib/utils/format-date";

  interface PageData {
    run: PlanningRun | null;
    artifacts: Record<string, PlanningArtifact>;
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Track selected phase - default to current phase or first phase
  let selectedPhase = $state<PhaseName>(
    data.run?.current_phase ?? "opportunity"
  );

  // Update selected phase when data changes
  $effect(() => {
    if (data.run?.current_phase && !data.artifacts[selectedPhase]) {
      selectedPhase = data.run.current_phase;
    }
  });

  function handlePhaseSelect(phase: PhaseName) {
    selectedPhase = phase;
  }

  function getStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
    switch (status) {
      case "completed":
        return "success";
      case "running":
        return "info";
      case "killed":
        return "error";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  }

  function getCompletedCount(artifacts: Record<string, PlanningArtifact>): number {
    return Object.keys(artifacts).length;
  }

  function getProgressPercent(artifacts: Record<string, PlanningArtifact>): number {
    return Math.round((Object.keys(artifacts).length / PHASE_ORDER.length) * 100);
  }
</script>

<svelte:head>
  <title>{data.run?.idea?.slice(0, 50) ?? "Run Detail"} | ERLV Inc</title>
</svelte:head>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
    <a href="/ai-labs/research" class="back-link">&larr; Back to Research</a>
  </div>
{:else if data.run}
  <div class="run-detail">
    <header class="run-header">
      <div class="header-top">
        <a href="/ai-labs/research" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Research
        </a>
        {#if data.run.mode}
          <span class="mode-badge {data.run.mode}">
            {data.run.mode === "local" ? "Local" : "Cloud"}
          </span>
        {/if}
      </div>

      <h1 class="run-title">{data.run.refined_idea ?? data.run.idea}</h1>

      <div class="run-meta">
        <Badge text={data.run.status} variant={getStatusVariant(data.run.status)} />
        {#if data.run.kill_verdict}
          <Badge text={data.run.kill_verdict} variant={data.run.kill_verdict === "CONTINUE" ? "success" : "error"} />
        {/if}
        {#if data.run.quality_score}
          <span class="quality-score">
            <span class="score-label">Quality:</span>
            <span class="score-value">{data.run.quality_score}</span>
          </span>
        {/if}
        <span class="progress-info">
          <span class="progress-count">{getCompletedCount(data.artifacts)}/{PHASE_ORDER.length}</span>
          <span class="progress-label">phases</span>
        </span>
        <span class="date">Created: {formatDateTime(data.run.created_at)}</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width: {getProgressPercent(data.artifacts)}%"></div>
      </div>
    </header>

    <PhaseTimeline
      currentPhase={data.run.current_phase}
      {selectedPhase}
      artifacts={data.artifacts}
      onSelectPhase={handlePhaseSelect}
    />

    <div class="phase-content">
      <PhaseDetail
        phase={selectedPhase}
        artifact={data.artifacts[selectedPhase]}
        onNavigate={handlePhaseSelect}
      />
    </div>

    {#if data.run.status === "completed" && data.run.package_key}
      <div class="package-section">
        <div class="package-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <div class="package-text">
            <span class="package-title">Planning Package Ready</span>
            <span class="package-desc">Download the complete analysis package</span>
          </div>
        </div>
        <a href="/api/planning/runs/{data.run.id}/package" class="download-btn" download>
          Download Package
        </a>
      </div>
    {/if}
  </div>
{/if}

<style>
  .run-detail {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--topbar-height));
    overflow: hidden;
  }

  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
    margin-bottom: 1rem;
  }

  .run-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .mode-badge {
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mode-badge.local {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 15%, transparent);
    color: var(--color-warning, #f59e0b);
  }

  .mode-badge.cloud {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
  }

  .run-title {
    margin: 0 0 0.75rem;
    font-size: 1.375rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--color-text);
  }

  .run-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .quality-score {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }

  .score-label {
    color: var(--color-text-muted);
  }

  .score-value {
    font-weight: 600;
    color: var(--color-success, #10b981);
  }

  .progress-info {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }

  .progress-count {
    font-weight: 600;
    color: var(--color-text);
  }

  .progress-label {
    color: var(--color-text-muted);
  }

  .date {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .progress-bar {
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .phase-content {
    flex: 1;
    overflow: hidden;
    background: var(--color-bg);
  }

  .phase-content :global(.phase-detail) {
    height: 100%;
  }

  .package-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
  }

  .package-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--color-success, #10b981);
  }

  .package-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .package-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .package-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    text-decoration: none;
    transition: background var(--transition-fast);
  }

  .download-btn:hover {
    background: var(--color-primary-hover);
    text-decoration: none;
  }
</style>
