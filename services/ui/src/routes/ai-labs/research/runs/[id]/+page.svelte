<script lang="ts">
  import { page } from "$app/stores";
  import { invalidateAll } from "$app/navigation";
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

  // Track selected phase - default to first phase
  let selectedPhase = $state<PhaseName>("opportunity");
  let actionLoading = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  // Sync selected phase with data changes
  $effect(() => {
    if (data.run?.current_phase) {
      // Update to current phase if current selection has no artifact
      if (!data.artifacts[selectedPhase]) {
        selectedPhase = data.run.current_phase;
      }
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

  async function handleRunAction(action: "pause" | "resume" | "cancel" | "delete") {
    if (!data.run) return;
    actionLoading = action;
    actionError = null;

    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const endpoint = action === "delete"
        ? `/api/planning/runs/${data.run.id}`
        : `/api/planning/runs/${data.run.id}/${action}`;

      const res = await fetch(endpoint, { method });
      const result = await res.json();

      if (!res.ok) {
        actionError = result.error || `Failed to ${action} run`;
        return;
      }

      // Refresh the page data
      await invalidateAll();
    } catch (e) {
      actionError = e instanceof Error ? e.message : `Failed to ${action} run`;
    } finally {
      actionLoading = null;
    }
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
        <div class="header-actions">
          {#if data.run.mode}
            <span class="mode-badge {data.run.mode}">
              {data.run.mode === "local" ? "Local" : "Cloud"}
            </span>
          {/if}
          <div class="action-buttons">
            {#if data.run.status === "running"}
              <button
                class="action-btn pause"
                onclick={() => handleRunAction("pause")}
                disabled={actionLoading !== null}
              >
                {#if actionLoading === "pause"}
                  <span class="spinner"></span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                {/if}
                Pause
              </button>
              <button
                class="action-btn cancel"
                onclick={() => handleRunAction("cancel")}
                disabled={actionLoading !== null}
              >
                {#if actionLoading === "cancel"}
                  <span class="spinner"></span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                {/if}
                Cancel
              </button>
            {/if}
            {#if data.run.status === "paused"}
              <button
                class="action-btn resume"
                onclick={() => handleRunAction("resume")}
                disabled={actionLoading !== null}
              >
                {#if actionLoading === "resume"}
                  <span class="spinner"></span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                {/if}
                Resume
              </button>
              <button
                class="action-btn cancel"
                onclick={() => handleRunAction("cancel")}
                disabled={actionLoading !== null}
              >
                {#if actionLoading === "cancel"}
                  <span class="spinner"></span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                {/if}
                Cancel
              </button>
            {/if}
            {#if data.run.status !== "running"}
              <button
                class="action-btn delete"
                onclick={() => handleRunAction("delete")}
                disabled={actionLoading !== null}
              >
                {#if actionLoading === "delete"}
                  <span class="spinner"></span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                {/if}
                Delete
              </button>
            {/if}
          </div>
        </div>
      </div>
      {#if actionError}
        <div class="action-error">{actionError}</div>
      {/if}

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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
    background: var(--color-bg);
    color: var(--color-text);
  }

  .action-btn:hover:not(:disabled) {
    background: var(--color-bg-secondary);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.pause {
    border-color: var(--color-warning, #f59e0b);
    color: var(--color-warning, #f59e0b);
  }

  .action-btn.pause:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent);
  }

  .action-btn.resume {
    border-color: var(--color-success, #10b981);
    color: var(--color-success, #10b981);
  }

  .action-btn.resume:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-success, #10b981) 10%, transparent);
  }

  .action-btn.cancel {
    border-color: var(--color-error, #ef4444);
    color: var(--color-error, #ef4444);
  }

  .action-btn.cancel:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent);
  }

  .action-btn.delete {
    border-color: var(--color-error, #ef4444);
    color: var(--color-error, #ef4444);
  }

  .action-btn.delete:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .action-error {
    padding: 0.5rem 0.75rem;
    margin-top: 0.5rem;
    background: color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent);
    border: 1px solid var(--color-error, #ef4444);
    border-radius: 6px;
    font-size: 0.8125rem;
    color: var(--color-error, #ef4444);
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
