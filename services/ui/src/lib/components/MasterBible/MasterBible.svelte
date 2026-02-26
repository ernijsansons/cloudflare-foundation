<script lang="ts">
  import type { PlanningRun, PlanningArtifact } from '$lib/types';
  import type { DepartmentView, DepartmentId } from '$lib/types/bible';
  import DepartmentTabs from '$lib/components/bible/DepartmentTabs.svelte';
  import DepartmentContent from '$lib/components/bible/DepartmentContent.svelte';
  import AgentJSONView from '$lib/components/bible/AgentJSONView.svelte';
  import OverviewTab from './OverviewTab.svelte';
  import RunTimeline from './RunTimeline.svelte';

  interface Props {
    projectId: string;
    projectName: string;
    ideaContent: string;
    status: string;
    currentPhase: string | null;
    qualityScore: number | null;
    revenuePotential: string | null;
    mode: string;
    runs: PlanningRun[];
    artifacts: Record<string, PlanningArtifact>;
    departments: DepartmentView[];
    agentJSON?: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
    onBack?: () => void;
  }

  let {
    projectId,
    projectName,
    ideaContent,
    status,
    currentPhase,
    qualityScore,
    revenuePotential,
    mode,
    runs,
    artifacts,
    departments,
    agentJSON,
    createdAt,
    updatedAt,
    onBack
  }: Props = $props();

  // Primary tabs
  type PrimaryTab = 'overview' | 'research' | 'artifacts' | 'timeline' | 'export';
  let activePrimaryTab = $state<PrimaryTab>('overview');

  // Department tab for research phases
  let selectedDept = $state<DepartmentId>('executive');

  let currentDepartment = $derived(
    departments?.find((d) => d.id === selectedDept)
  );

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatPhase(phase: string | null): string {
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

  // Keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        if (onBack) onBack();
        break;
      case '1':
        event.preventDefault();
        activePrimaryTab = 'overview';
        break;
      case '2':
        event.preventDefault();
        activePrimaryTab = 'research';
        break;
      case '3':
        event.preventDefault();
        activePrimaryTab = 'artifacts';
        break;
      case '4':
        event.preventDefault();
        activePrimaryTab = 'timeline';
        break;
      case '5':
        event.preventDefault();
        activePrimaryTab = 'export';
        break;
    }
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="master-bible">
  <!-- Header -->
  <header class="bible-header">
    <a href="/ai-labs/research" class="back-link" onclick={(e) => { if (onBack) { e.preventDefault(); onBack(); }}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to Research
    </a>

    <div class="header-content">
      <div class="header-main">
        <h1 class="bible-title">{projectName}</h1>
        <div class="header-badges">
          <span class="status-badge" style="--status-color: {getStatusColor(status)}">
            {status}
          </span>
          <span class="mode-badge">
            {mode === 'local' ? '🏠 Local' : '☁️ Cloud'}
          </span>
        </div>
      </div>

      <div class="header-meta">
        <span class="meta-item">
          <strong>Phase:</strong> {formatPhase(currentPhase)}
        </span>
        {#if qualityScore}
          <span class="meta-item">
            <strong>Quality:</strong> {qualityScore}/100
          </span>
        {/if}
        {#if revenuePotential}
          <span class="meta-item">
            <strong>Revenue:</strong> {revenuePotential}
          </span>
        {/if}
        <span class="meta-item">
          <strong>Runs:</strong> {runs.length}
        </span>
        <span class="meta-item">
          <strong>Updated:</strong> {formatDate(updatedAt)}
        </span>
      </div>
    </div>

    <!-- Primary Tabs -->
    <nav class="primary-tabs">
      <button
        class="primary-tab"
        class:active={activePrimaryTab === 'overview'}
        onclick={() => activePrimaryTab = 'overview'}
      >
        <span class="tab-icon">📊</span>
        Overview
      </button>
      <button
        class="primary-tab"
        class:active={activePrimaryTab === 'research'}
        onclick={() => activePrimaryTab = 'research'}
      >
        <span class="tab-icon">🔬</span>
        Research Phases
      </button>
      <button
        class="primary-tab"
        class:active={activePrimaryTab === 'artifacts'}
        onclick={() => activePrimaryTab = 'artifacts'}
      >
        <span class="tab-icon">📁</span>
        Artifacts
      </button>
      <button
        class="primary-tab"
        class:active={activePrimaryTab === 'timeline'}
        onclick={() => activePrimaryTab = 'timeline'}
      >
        <span class="tab-icon">📅</span>
        Timeline
      </button>
      <button
        class="primary-tab"
        class:active={activePrimaryTab === 'export'}
        onclick={() => activePrimaryTab = 'export'}
      >
        <span class="tab-icon">📤</span>
        Export
      </button>
    </nav>

    <div class="keyboard-hints">
      <span class="hint">1-5: Switch tabs</span>
      <span class="hint">Esc: Back</span>
    </div>
  </header>

  <!-- Main Content -->
  <div class="bible-body">
    {#if activePrimaryTab === 'overview'}
      <OverviewTab
        {projectName}
        {ideaContent}
        {status}
        {currentPhase}
        {qualityScore}
        {revenuePotential}
        {runs}
        {artifacts}
      />
    {:else if activePrimaryTab === 'research'}
      <div class="research-layout">
        <aside class="bible-sidebar">
          {#if departments.length > 0}
            <DepartmentTabs
              {departments}
              selected={selectedDept}
              onSelect={(dept) => selectedDept = dept}
            />
          {:else}
            <div class="no-departments">
              <p>No research phases completed yet.</p>
              <p class="hint">Run research to populate this section.</p>
            </div>
          {/if}
        </aside>

        <main class="bible-main">
          {#if selectedDept === 'agent-json' && agentJSON}
            <AgentJSONView payload={agentJSON} runId={runs[0]?.id || projectId} />
          {:else if currentDepartment}
            <DepartmentContent department={currentDepartment} />
          {:else}
            <div class="empty-content">
              <p>Select a department from the sidebar to view research findings.</p>
            </div>
          {/if}
        </main>
      </div>
    {:else if activePrimaryTab === 'artifacts'}
      <div class="artifacts-content">
        <h2>Artifacts Explorer</h2>
        <div class="artifacts-grid">
          {#each Object.entries(artifacts) as [phase, artifact]}
            <div class="artifact-card">
              <div class="artifact-header">
                <span class="artifact-phase">{formatPhase(phase)}</span>
                {#if artifact.overall_score}
                  <span class="artifact-score">{artifact.overall_score}</span>
                {/if}
              </div>
              <div class="artifact-meta">
                {#if artifact.review_verdict}
                  <span class="verdict">{artifact.review_verdict}</span>
                {/if}
              </div>
              <details class="artifact-content">
                <summary>View Content</summary>
                <pre>{JSON.stringify(artifact.content, null, 2)}</pre>
              </details>
            </div>
          {:else}
            <div class="empty-artifacts">
              <p>No artifacts available yet.</p>
              <p class="hint">Run research to generate artifacts for each phase.</p>
            </div>
          {/each}
        </div>
      </div>
    {:else if activePrimaryTab === 'timeline'}
      <RunTimeline {runs} projectId={projectId} />
    {:else if activePrimaryTab === 'export'}
      <div class="export-content">
        <h2>Export Options</h2>
        <div class="export-grid">
          <button class="export-option">
            <span class="export-icon">📄</span>
            <span class="export-label">Export as JSON</span>
            <span class="export-desc">Full project data with all artifacts</span>
          </button>
          <button class="export-option">
            <span class="export-icon">📝</span>
            <span class="export-label">Export as Markdown</span>
            <span class="export-desc">Human-readable research summary</span>
          </button>
          <button class="export-option">
            <span class="export-icon">📊</span>
            <span class="export-label">Export as PDF</span>
            <span class="export-desc">Printable executive report</span>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .master-bible {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg, #ffffff);
  }

  .bible-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .back-link:hover {
    color: white;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .header-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .bible-title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .header-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: var(--status-color);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .mode-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .header-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .meta-item strong {
    font-weight: 600;
  }

  .primary-tabs {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }

  .primary-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px 8px 0 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .primary-tab:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .primary-tab.active {
    background: var(--color-bg, white);
    color: var(--color-text, #111827);
  }

  .tab-icon {
    font-size: 1rem;
  }

  .keyboard-hints {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .hint {
    font-size: 0.75rem;
    background: rgba(255, 255, 255, 0.15);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    opacity: 0.9;
  }

  .bible-body {
    flex: 1;
    padding: 2rem;
    background: var(--color-bg, white);
  }

  /* Research Layout */
  .research-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }

  .bible-sidebar {
    position: sticky;
    top: 2rem;
    height: fit-content;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
  }

  .bible-main {
    min-width: 0;
  }

  .no-departments {
    padding: 1.5rem;
    background: var(--color-bg-secondary, #f9fafb);
    border-radius: 8px;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
  }

  .no-departments p {
    margin: 0;
  }

  .no-departments .hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    background: none;
    padding: 0;
  }

  .empty-content {
    padding: 3rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
  }

  /* Artifacts */
  .artifacts-content {
    max-width: 1200px;
  }

  .artifacts-content h2 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
  }

  .artifacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .artifact-card {
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    padding: 1rem;
  }

  .artifact-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .artifact-phase {
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .artifact-score {
    background: var(--color-primary, #6366f1);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .artifact-meta {
    margin-bottom: 0.75rem;
  }

  .verdict {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    text-transform: capitalize;
  }

  .artifact-content {
    font-size: 0.875rem;
  }

  .artifact-content summary {
    cursor: pointer;
    color: var(--color-primary, #6366f1);
    font-weight: 500;
  }

  .artifact-content pre {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .empty-artifacts {
    grid-column: 1 / -1;
    padding: 3rem;
    text-align: center;
    color: var(--color-text-muted, #6b7280);
    background: var(--color-bg-secondary, #f9fafb);
    border-radius: 8px;
  }

  .empty-artifacts p {
    margin: 0;
  }

  .empty-artifacts .hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    background: none;
    padding: 0;
  }

  /* Export */
  .export-content {
    max-width: 800px;
  }

  .export-content h2 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
  }

  .export-grid {
    display: grid;
    gap: 1rem;
  }

  .export-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .export-option:hover {
    border-color: var(--color-primary, #6366f1);
    background: white;
  }

  .export-icon {
    font-size: 2rem;
  }

  .export-label {
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .export-desc {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-left: auto;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .research-layout {
      grid-template-columns: 1fr;
    }

    .bible-sidebar {
      position: static;
      max-height: none;
    }
  }

  @media (max-width: 768px) {
    .bible-header {
      padding: 1rem 1.5rem;
    }

    .bible-title {
      font-size: 1.5rem;
    }

    .header-meta {
      flex-direction: column;
      gap: 0.5rem;
    }

    .primary-tabs {
      overflow-x: auto;
    }

    .bible-body {
      padding: 1.5rem;
    }
  }
</style>
