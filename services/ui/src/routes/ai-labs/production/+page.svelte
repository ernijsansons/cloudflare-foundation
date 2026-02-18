<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { invalidateAll } from "$app/navigation";
  import Kanban from "$lib/components/Kanban.svelte";
  import type { PlanningRun, NaomiTask, KanbanCard, KanbanColumn } from "$lib/types";

  interface PageData {
    runs: PlanningRun[];
    tasks: NaomiTask[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  // Production Kanban columns
  const columns: KanbanColumn[] = [
    { id: "backlog", title: "Backlog", status: "backlog", color: "#6b7280" },
    { id: "in-progress", title: "In Progress", status: "in-progress", color: "#3b82f6" },
    { id: "review", title: "Review", status: "review", color: "#f59e0b" },
    { id: "done", title: "Done", status: "done", color: "#10b981" },
  ];

  // Build task map by run_id
  const taskByRunId = $derived(
    Object.fromEntries(data.tasks.map((t) => [t.run_id, t]))
  );

  // Map runs to Kanban cards; runs with tasks use task status
  const cards = $derived<KanbanCard[]>(
    data.runs.map((run) => {
      const task = taskByRunId[run.id];
      const status = task
        ? task.status === "pending"
          ? "backlog"
          : task.status === "running"
            ? "in-progress"
            : task.status === "review"
              ? "review"
              : "done"
        : "backlog";
      return {
        id: task?.id ?? run.id,
        title: run.refined_idea ?? run.idea,
        subtitle: task
          ? `${task.agent} · ${task.status}`
          : run.kill_verdict
            ? `Verdict: ${run.kill_verdict}`
            : undefined,
        status,
        phase: task?.phase ?? "completed",
        mode: run.mode ?? "cloud",
        metadata: {
          run_id: run.id,
          task_id: task?.id,
          quality_score: run.quality_score,
          revenue_potential: run.revenue_potential,
          package_key: run.package_key,
          repo_url: task?.repo_url,
        },
        createdAt: run.created_at,
      };
    })
  );

  let assignRunId = $state<string | null>(null);
  let assignRepoUrl = $state("");
  let moveError = $state<string | null>(null);
  let moveLoading = $state(false);

  const formResult = $derived(
    ($page.form as { success?: boolean; error?: string } | undefined)
  );

  function openAssignModal(runId: string) {
    assignRunId = runId;
    assignRepoUrl = "";
  }

  function closeAssignModal() {
    assignRunId = null;
    assignRepoUrl = "";
  }

  function handleCardClick(card: KanbanCard) {
    const taskId = card.metadata?.task_id as string | undefined;
    const runId = card.metadata?.run_id as string | undefined;
    if (taskId) {
      goto(`/ai-labs/production/tasks/${taskId}`);
    } else if (runId) {
      goto(`/ai-labs/research/runs/${runId}`);
    }
  }

  async function handleCardMove(card: KanbanCard, newStatus: string) {
    const taskId = card.metadata?.task_id as string | undefined;
    if (!taskId) return;
    if (card.status === newStatus) return;

    moveError = null;
    moveLoading = true;
    try {
      const formData = new FormData();
      formData.set("task_id", taskId);
      formData.set("status", newStatus);
      const res = await fetch("?/updateTaskStatus", {
        method: "POST",
        body: formData,
      });
      const result = (await res.json()) as { success?: boolean; error?: string };
      if (result.success) {
        await invalidateAll();
      } else {
        moveError = result.error ?? "Failed to update status";
      }
    } catch (e) {
      moveError = (e as Error).message;
    } finally {
      moveLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Production | AI Labs</title>
</svelte:head>

<div class="page-header">
  <h1>Production</h1>
  <p class="subtitle">Track validated ideas through implementation</p>
</div>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
    <p class="error-hint">Make sure the planning service is running and accessible.</p>
  </div>
{:else}
  {#if data.runs.length === 0}
    <p class="empty-hint-banner">Complete research runs to add validated ideas to the production pipeline.</p>
  {/if}

  {#if moveError}
    <p class="move-error">{moveError}</p>
  {/if}
  {#if moveLoading}
    <p class="move-loading">Updating...</p>
  {/if}

  <Kanban
    {columns}
    {cards}
    onCardClick={handleCardClick}
    onCardMove={handleCardMove}
    emptyMessage="No items in this stage"
  />

  <!-- Card actions: Assign to Naomi for runs without tasks -->
  {#if data.runs.length > 0}
    <div class="card-actions">
      {#each data.runs as run}
        {#if !taskByRunId[run.id]}
          <div class="card-action-row">
            <span class="card-action-title">{run.refined_idea ?? run.idea}</span>
            <button
              type="button"
              class="btn-assign"
              onclick={() => openAssignModal(run.id)}
            >
              Assign to Naomi
            </button>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
{/if}

<!-- Assign to Naomi modal -->
{#if assignRunId}
  <div class="modal-backdrop" onclick={closeAssignModal} role="button" tabindex="-1">
    <div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
      <h3>Assign to Naomi</h3>
      <form method="POST" action="?/assignToNaomi">
        <input type="hidden" name="run_id" value={assignRunId} />
        <label for="repo_url">Repository URL</label>
        <input
          id="repo_url"
          name="repo_url"
          type="url"
          placeholder="https://github.com/org/repo"
          bind:value={assignRepoUrl}
          required
        />
        {#if formResult && !formResult.success && formResult.error}
          <p class="form-error">{formResult.error}</p>
        {/if}
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={closeAssignModal}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">Assign</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .page-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .page-header h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
  }

  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
    font-size: 0.875rem;
  }

  .error-hint {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }

  .empty-hint-banner {
    margin: 0 1.5rem 1rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .move-error {
    margin: 0 1.5rem 1rem;
    padding: 0.75rem 1rem;
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--color-error);
  }

  .move-loading {
    margin: 0 1.5rem 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .card-actions {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
  }

  .card-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
  }

  .card-action-row:last-child {
    border-bottom: none;
  }

  .card-action-title {
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
  }

  .btn-assign {
    flex-shrink: 0;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-assign:hover {
    opacity: 0.9;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--color-bg);
    border-radius: 12px;
    padding: 1.5rem;
    min-width: 360px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  .modal h3 {
    margin: 0 0 1rem;
    font-size: 1.125rem;
  }

  .modal label {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .modal input[type="url"] {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .form-error {
    color: var(--color-error);
    font-size: 0.8125rem;
    margin: -0.5rem 0 0.5rem;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn-secondary {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .btn-primary {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
  }
</style>
