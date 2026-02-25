<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import MasterBible from '$lib/components/MasterBible/MasterBible.svelte';
  import type { PlanningRun, PlanningArtifact } from '$lib/types';
  import type { DepartmentView } from '$lib/types/bible';

  interface ProjectData {
    id: string;
    name: string;
    idea_content: string;
    refined_idea?: string;
    status: string;
    current_phase: string | null;
    quality_score: number | null;
    revenue_potential: string | null;
    run_count: number;
    latest_run_id: string | null;
    mode: string;
    created_at: number;
    updated_at: number;
    runs?: PlanningRun[];
  }

  interface PageData {
    project: ProjectData | null;
    runs: PlanningRun[];
    artifacts: Record<string, PlanningArtifact>;
    artifactsByRun: Record<string, Record<string, PlanningArtifact>>;
    departments: DepartmentView[];
    agentJSON?: Record<string, unknown>;
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  function handleBack() {
    goto('/ai-labs/research');
  }
</script>

<svelte:head>
  <title>{data.project?.name?.slice(0, 50) ?? 'Project'} | Master Bible | ERLV Inc</title>
</svelte:head>

{#if data.error}
  <div class="error-page">
    <div class="error-content">
      <h1>Project Not Found</h1>
      <p>{data.error}</p>
      <a href="/ai-labs/research" class="back-link">← Back to Research</a>
    </div>
  </div>
{:else if data.project}
  <MasterBible
    projectId={data.project.id}
    projectName={data.project.name}
    ideaContent={data.project.idea_content}
    status={data.project.status}
    currentPhase={data.project.current_phase}
    qualityScore={data.project.quality_score}
    revenuePotential={data.project.revenue_potential}
    mode={data.project.mode}
    runs={data.runs}
    artifacts={data.artifacts}
    departments={data.departments}
    agentJSON={data.agentJSON}
    createdAt={data.project.created_at}
    updatedAt={data.project.updated_at}
    onBack={handleBack}
  />
{:else}
  <div class="loading-page">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>Loading project...</p>
    </div>
  </div>
{/if}

<style>
  .error-page,
  .loading-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--color-bg, #ffffff);
  }

  .error-content,
  .loading-content {
    text-align: center;
    padding: 2rem;
  }

  .error-content h1 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    color: var(--color-text, #111827);
  }

  .error-content p {
    margin: 0 0 1.5rem;
    color: var(--color-error, #ef4444);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-primary, #6366f1);
    color: white;
    border-radius: 8px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .back-link:hover {
    background: var(--color-primary-hover, #4f46e5);
    transform: translateY(-1px);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border, #e5e7eb);
    border-top-color: var(--color-primary, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  .loading-content p {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
