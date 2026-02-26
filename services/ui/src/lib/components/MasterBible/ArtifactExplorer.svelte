<script lang="ts">
  import type { PlanningRun, PlanningArtifact } from '$lib/types';
  import { STAGES } from '$lib/types';

  interface Props {
    artifacts: Record<string, PlanningArtifact>;
    runs: PlanningRun[];
    projectId: string;
  }

  let { artifacts, runs, projectId }: Props = $props();

  // State
  let selectedPhase = $state<string | null>(null);
  let selectedArtifact = $state<PlanningArtifact | null>(null);
  let searchQuery = $state('');
  let expandedStages = $state<Set<string>>(new Set());
  let viewMode = $state<'tree' | 'grid'>('tree');

  // Build artifact tree from STAGES
  const artifactTree = $derived(
    STAGES.map(stage => ({
      stage,
      phases: stage.phases.map(phaseId => ({
        id: phaseId,
        artifact: artifacts[phaseId] || null,
        hasData: !!artifacts[phaseId]
      }))
    }))
  );

  // Filter tree by search
  const filteredTree = $derived(
    searchQuery.trim()
      ? artifactTree.map(item => ({
          ...item,
          phases: item.phases.filter(p =>
            p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.artifact?.content && JSON.stringify(p.artifact.content).toLowerCase().includes(searchQuery.toLowerCase()))
          )
        })).filter(item => item.phases.length > 0)
      : artifactTree
  );

  // Flat list of all artifacts for grid view
  const allArtifacts = $derived(
    Object.entries(artifacts).map(([phase, artifact]) => ({
      phase,
      artifact
    }))
  );

  // Stats
  const stats = $derived({
    total: Object.keys(artifacts).length,
    withScores: Object.values(artifacts).filter(a => a.overall_score).length,
    avgScore: (() => {
      const scores = Object.values(artifacts).filter(a => a.overall_score).map(a => a.overall_score!);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    })()
  });

  function toggleStage(stageId: string) {
    const newSet = new Set(expandedStages);
    if (newSet.has(stageId)) {
      newSet.delete(stageId);
    } else {
      newSet.add(stageId);
    }
    expandedStages = newSet;
  }

  function selectPhase(phaseId: string, artifact: PlanningArtifact | null) {
    selectedPhase = phaseId;
    selectedArtifact = artifact;
  }

  function togglePhase(phaseId: string, artifact: PlanningArtifact | null) {
    if (selectedPhase === phaseId) {
      selectedPhase = null;
      selectedArtifact = null;
    } else {
      selectPhase(phaseId, artifact);
    }
  }

  function formatPhase(phase: string): string {
    return phase
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function getScoreColor(score: number | null | undefined): string {
    if (!score) return 'var(--color-text-muted, #6b7280)';
    if (score >= 80) return 'var(--color-success, #10b981)';
    if (score >= 60) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  function copyToClipboard(content: unknown) {
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    navigator.clipboard.writeText(text);
  }

  function downloadArtifact(artifact: PlanningArtifact) {
    try {
      const content = JSON.stringify(artifact, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPhase}-artifact.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download artifact. Please try again.');
    }
  }
</script>

<div class="artifact-explorer">
  <div class="explorer-header">
    <div class="header-top">
      <h2>Artifact Explorer</h2>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          class:active={viewMode === 'tree'}
          onclick={() => viewMode = 'tree'}
          aria-label="Tree view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <button
          class="toggle-btn"
          class:active={viewMode === 'grid'}
          onclick={() => viewMode = 'grid'}
          aria-label="Grid view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>
    </div>

    <div class="stats-row">
      <span class="stat">{stats.total} artifacts</span>
      <span class="stat-divider">•</span>
      <span class="stat">{stats.withScores} scored</span>
      {#if stats.avgScore}
        <span class="stat-divider">•</span>
        <span class="stat" style="color: {getScoreColor(stats.avgScore)}">Avg: {stats.avgScore}</span>
      {/if}
    </div>

    <div class="search-box">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Search artifacts..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>
  </div>

  <div class="explorer-body">
    <!-- Tree View -->
    <nav class="tree-view" role="tree" aria-label="Artifact tree navigation">
      {#each filteredTree as { stage, phases }}
        <div class="tree-stage">
          <button
            class="stage-header"
            onclick={() => toggleStage(stage.id)}
            aria-expanded={expandedStages.has(stage.id)}
          >
            <span class="stage-icon">{stage.icon}</span>
            <span class="stage-title">{stage.title}</span>
            <span class="stage-count">{phases.filter(p => p.hasData).length}/{phases.length}</span>
            <svg
              class="expand-icon"
              class:expanded={expandedStages.has(stage.id)}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {#if expandedStages.has(stage.id)}
            <div class="phase-list">
              {#each phases as { id, artifact, hasData }}
                <button
                  class="phase-item"
                  class:has-data={hasData}
                  class:selected={selectedPhase === id}
                  onclick={() => selectPhase(id, artifact)}
                  aria-selected={selectedPhase === id}
                >
                  <span class="phase-indicator" class:active={hasData}></span>
                  <span class="phase-name">{formatPhase(id)}</span>
                  {#if artifact?.overall_score}
                    <span class="phase-score" style="color: {getScoreColor(artifact.overall_score)}">
                      {artifact.overall_score}
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </nav>

    <!-- Detail Panel -->
    <div class="detail-panel">
      {#if selectedArtifact}
        <div class="detail-header">
          <h3>{formatPhase(selectedPhase || '')}</h3>
          <div class="detail-actions">
            <button class="action-btn" onclick={() => selectedArtifact && copyToClipboard(selectedArtifact.content)} title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button class="action-btn" onclick={() => selectedArtifact && downloadArtifact(selectedArtifact)} title="Download JSON">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>
        </div>

        <div class="detail-meta">
          {#if selectedArtifact.overall_score}
            <div class="meta-item">
              <span class="meta-label">Score</span>
              <span class="meta-value" style="color: {getScoreColor(selectedArtifact.overall_score)}">
                {selectedArtifact.overall_score}/100
              </span>
            </div>
          {/if}
          {#if selectedArtifact.review_verdict}
            <div class="meta-item">
              <span class="meta-label">Verdict</span>
              <span class="meta-value verdict-{selectedArtifact.review_verdict.toLowerCase()}">
                {selectedArtifact.review_verdict}
              </span>
            </div>
          {/if}
          {#if selectedArtifact.review_feedback}
            <div class="meta-item full-width">
              <span class="meta-label">Feedback</span>
              <span class="meta-value">{selectedArtifact.review_feedback}</span>
            </div>
          {/if}
        </div>

        <div class="detail-content">
          <pre>{JSON.stringify(selectedArtifact.content, null, 2)}</pre>
        </div>
      {:else}
        <div class="empty-detail">
          <div class="empty-icon">📄</div>
          <h3>Select an Artifact</h3>
          <p>Choose a phase from the tree to view its artifact content.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .artifact-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: calc(100vh - 300px);
    min-height: 500px;
  }

  .explorer-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .explorer-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text, #111827);
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-secondary, #f9fafb);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--color-text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: white;
    color: var(--color-text, #111827);
  }

  .toggle-btn.active {
    background: white;
    color: var(--color-primary, #6366f1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stats-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .stat-divider {
    opacity: 0.5;
  }

  .search-box {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted, #6b7280);
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-bg-secondary, #f9fafb);
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
    background: white;
  }

  .explorer-body {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 1.5rem;
    flex: 1;
    overflow: hidden;
    padding-top: 1rem;
  }

  .tree-view {
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .tree-stage {
    margin-bottom: 0.5rem;
  }

  .stage-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .stage-header:hover {
    background: white;
    border-color: var(--color-primary, #6366f1);
  }

  .stage-icon {
    font-size: 1rem;
  }

  .stage-title {
    flex: 1;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .stage-count {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  .expand-icon {
    color: var(--color-text-muted, #6b7280);
    transition: transform 0.2s ease;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .phase-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0 0.5rem 1.5rem;
  }

  .phase-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .phase-item:hover {
    background: var(--color-bg-secondary, #f9fafb);
  }

  .phase-item.selected {
    background: var(--color-primary, #6366f1);
    color: white;
  }

  .phase-item.selected .phase-indicator {
    background: white;
  }

  .phase-item.selected .phase-score {
    color: white !important;
  }

  .phase-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-border, #e5e7eb);
    flex-shrink: 0;
  }

  .phase-indicator.active {
    background: var(--color-success, #10b981);
  }

  .phase-name {
    flex: 1;
    font-size: 0.875rem;
    color: inherit;
  }

  .phase-item:not(.selected) .phase-name {
    color: var(--color-text, #111827);
  }

  .phase-item:not(.has-data) .phase-name {
    color: var(--color-text-muted, #6b7280);
  }

  .phase-score {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .detail-panel {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    overflow: hidden;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: white;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .detail-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .detail-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    color: var(--color-text-muted, #6b7280);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: white;
    border-color: var(--color-primary, #6366f1);
    color: var(--color-primary, #6366f1);
  }

  .detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .meta-item.full-width {
    flex-basis: 100%;
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

  .meta-value.verdict-approved,
  .meta-value.verdict-go {
    color: var(--color-success, #10b981);
    font-weight: 600;
  }

  .meta-value.verdict-rejected,
  .meta-value.verdict-kill {
    color: var(--color-error, #ef4444);
    font-weight: 600;
  }

  .detail-content {
    flex: 1;
    overflow: auto;
    padding: 1rem 1.25rem;
  }

  .detail-content pre {
    margin: 0;
    padding: 1rem;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    font-size: 0.8125rem;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .empty-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-detail h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    color: var(--color-text, #111827);
  }

  .empty-detail p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  @media (max-width: 768px) {
    .explorer-body {
      grid-template-columns: 1fr;
    }

    .tree-view {
      max-height: 300px;
    }
  }
</style>
