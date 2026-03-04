<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { formatDate } from "$lib/utils/format-date";
  import type { Idea, Run, Attachment, Constraint, Note } from "./+page.server";
  import DealSidebar from "$lib/components/DealCard/DealSidebar.svelte";
  import DealConstraints from "$lib/components/DealCard/DealConstraints.svelte";
  import DealNotes from "$lib/components/DealCard/DealNotes.svelte";
  import DealDocuments from "$lib/components/DealCard/DealDocuments.svelte";
  import DealWorkflow from "$lib/components/DealCard/DealWorkflow.svelte";
  import DealLifecycleBar from "$lib/components/DealCard/DealLifecycleBar.svelte";

  interface PageData {
    idea: Idea;
    runs: Run[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  let activeTab = $state("overview");
  let isEditing = $state(false);
  let editName = $state("");
  let editContent = $state("");
  let editDescription = $state("");
  let isSubmitting = $state(false);
  let showDeleteConfirm = $state(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "notes", label: "Notes", icon: "📝" },
    { id: "docs", label: "Documents", icon: "📎" },
    { id: "constraints", label: "Constraints", icon: "🔒" },
    { id: "timeline", label: "Timeline", icon: "🕐" },
    { id: "workflow", label: "Workflow", icon: "🗺️" },
  ];

  function closeDeleteConfirm() {
    showDeleteConfirm = false;
  }

  function handleDeleteBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDeleteConfirm();
    }
  }

  function handleDeleteBackdropKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDeleteConfirm();
    }
  }

  function startEditing() {
    editName = data.idea.name;
    editContent = data.idea.content;
    editDescription = data.idea.description;
    isEditing = true;
  }

  function cancelEditing() {
    isEditing = false;
  }

  function getRunStatusColor(status: string): string {
    switch (status) {
      case "running":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      case "failed":
      case "cancelled":
        return "#ef4444";
      case "paused":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  }

  async function handleFieldUpdate(field: string, value: string) {
    const formData = new FormData();
    formData.append('field', field);
    formData.append('value', value);
    await fetch('?/updateField', {
      method: 'POST',
      body: formData,
    });
    invalidateAll();
  }

  async function handleConstraintsUpdate(constraints: Constraint[]) {
    try {
      await handleFieldUpdate("constraints", JSON.stringify(constraints));
    } catch (e) {
      console.error('Failed to update constraints:', e);
      alert('Failed to save constraints. Please try again.');
      invalidateAll();
    }
  }

  async function handleNotesUpdate(notes: Note[]) {
    try {
      await handleFieldUpdate("notes", JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to update notes:', e);
      alert('Failed to save notes. Please try again.');
      invalidateAll();
    }
  }

  function handleRefresh() {
    invalidateAll();
  }
</script>

<svelte:head>
  <title>{data.idea.name} | Idea Cards | AI Labs</title>
</svelte:head>

<div class="deal-page">
  <header class="deal-header">
    <div class="breadcrumb">
      <a href="/ai-labs/idea">Ideas</a>
      <span class="separator">/</span>
      <span class="current">{data.idea.name}</span>
    </div>
    <div class="header-actions">
      {#if !isEditing}
        <button class="edit-btn" onclick={startEditing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        {#if data.idea.status !== "researching" && data.idea.deal_stage !== "researching"}
          <form method="POST" action="?/startResearch" use:enhance>
            <button type="submit" class="research-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Start Research
            </button>
          </form>
        {/if}
        <button class="delete-btn" type="button" onclick={() => (showDeleteConfirm = true)} aria-label="Delete idea">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      {/if}
    </div>
  </header>

  <div class="deal-body">
    <DealSidebar idea={data.idea} onUpdate={handleFieldUpdate} />

    <main class="deal-content">
      {#if isEditing}
        <form
          method="POST"
          action="?/update"
          class="edit-form-container"
          use:enhance={() => {
            isSubmitting = true;
            return async ({ update, result }) => {
              await update();
              isSubmitting = false;
              if (result.type === "success") {
                isEditing = false;
              }
            };
          }}
        >
          <div class="edit-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" bind:value={editName} required />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" bind:value={editDescription} rows="3" placeholder="Brief description of this idea..."></textarea>
            </div>
            <div class="form-group">
              <label for="content">Content</label>
              <textarea id="content" name="content" bind:value={editContent} rows="20" required></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-btn" onclick={cancelEditing}>Cancel</button>
              <button type="submit" class="save-btn" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      {:else}
        <nav class="tabs-nav">
          {#each tabs as tab}
            <button
              class="tab-btn"
              class:active={activeTab === tab.id}
              onclick={() => (activeTab = tab.id)}
            >
              <span class="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          {/each}
        </nav>

        <div class="tab-panel">
          {#if activeTab === "overview"}
            <div class="overview-panel">
              <div class="overview-header">
                <h1>{data.idea.name}</h1>
                {#if data.idea.description}
                  <p class="overview-description">{data.idea.description}</p>
                {/if}
              </div>

              <div class="overview-content">
                <h3>Idea Content</h3>
                <pre class="content-display">{data.idea.content}</pre>
              </div>

              {#if data.runs.length > 0}
                <div class="runs-section">
                  <h3>Research Runs</h3>
                  <div class="runs-list">
                    {#each data.runs as run (run.id)}
                      <a href="/ai-labs/research/runs/{run.id}" class="run-item">
                        <div class="run-info">
                          <span class="run-status" style="--status-color: {getRunStatusColor(run.status)}">
                            {run.status}
                          </span>
                          <span class="run-phase">{run.current_phase ?? "Starting"}</span>
                        </div>
                        <span class="run-date">{formatDate(run.created_at)}</span>
                      </a>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else if activeTab === "notes"}
            <DealNotes notes={data.idea.notes} onUpdate={handleNotesUpdate} />
          {:else if activeTab === "docs"}
            <DealDocuments attachments={data.idea.attachments} ideaId={data.idea.id} onRefresh={handleRefresh} />
          {:else if activeTab === "constraints"}
            <DealConstraints constraints={data.idea.constraints} onUpdate={handleConstraintsUpdate} dealStage={data.idea.deal_stage} />
          {:else if activeTab === "timeline"}
            <div class="timeline-panel">
              <div class="panel-header">
                <h3>Timeline</h3>
                <p class="panel-hint">Activity history for this idea.</p>
              </div>
              <div class="timeline-list">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <span class="timeline-label">Created</span>
                    <span class="timeline-date">{formatDate(data.idea.created_at)}</span>
                  </div>
                </div>
                {#each data.runs as run (run.id)}
                  <div class="timeline-item">
                    <div class="timeline-dot run"></div>
                    <div class="timeline-content">
                      <span class="timeline-label">Research run started</span>
                      <span class="timeline-date">{formatDate(run.created_at)}</span>
                    </div>
                  </div>
                {/each}
                <div class="timeline-item">
                  <div class="timeline-dot updated"></div>
                  <div class="timeline-content">
                    <span class="timeline-label">Last updated</span>
                    <span class="timeline-date">{formatDate(data.idea.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          {:else if activeTab === "workflow"}
            <DealWorkflow stage={data.idea.deal_stage} />
          {/if}
        </div>
      {/if}
    </main>
  </div>

  <DealLifecycleBar stage={data.idea.deal_stage} />
</div>

{#if showDeleteConfirm}
  <div
    class="modal-overlay"
    onclick={handleDeleteBackdropClick}
    onkeydown={handleDeleteBackdropKeydown}
    role="button"
    tabindex="0"
    aria-label="Close delete confirmation modal"
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="0">
      <div class="modal-header">
        <h2>Delete Idea</h2>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete <strong>{data.idea.name}</strong>?</p>
        <p class="warning">This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="cancel-btn" onclick={closeDeleteConfirm}>Cancel</button>
        <form method="POST" action="?/delete" use:enhance>
          <button type="submit" class="confirm-delete-btn">Delete Idea</button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .deal-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .deal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb a {
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .breadcrumb a:hover {
    color: var(--color-primary);
  }

  .separator {
    color: var(--color-text-muted);
  }

  .current {
    color: var(--color-text);
    font-weight: 500;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn,
  .research-btn,
  .delete-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .edit-btn {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .edit-btn:hover {
    border-color: var(--color-border-focus);
  }

  .research-btn {
    background: var(--color-primary);
    border: none;
    color: white;
    font-weight: 500;
  }

  .research-btn:hover {
    background: var(--color-primary-hover, #2563eb);
  }

  .delete-btn {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    padding: 0.375rem;
  }

  .delete-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .deal-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .deal-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tabs-nav {
    display: flex;
    gap: 0;
    padding: 0 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tab-btn:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .tab-icon {
    font-size: 1rem;
  }

  .tab-panel {
    flex: 1;
    overflow-y: auto;
    background: var(--color-bg-secondary);
  }

  /* Overview panel */
  .overview-panel {
    padding: 1.5rem;
  }

  .overview-header {
    margin-bottom: 1.5rem;
  }

  .overview-header h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }

  .overview-description {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .overview-content {
    margin-bottom: 2rem;
  }

  .overview-content h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .content-display {
    margin: 0;
    padding: 1.25rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--color-text);
  }

  .runs-section h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .runs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .run-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s;
  }

  .run-item:hover {
    border-color: var(--color-border-focus);
  }

  .run-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .run-status {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    border-radius: 4px;
    background: color-mix(in srgb, var(--status-color) 15%, transparent);
    color: var(--status-color);
  }

  .run-phase {
    font-size: 0.8125rem;
    color: var(--color-text);
  }

  .run-date {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  /* Timeline panel */
  .timeline-panel {
    padding: 1.5rem;
  }

  .panel-header {
    margin-bottom: 1.5rem;
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1.125rem;
  }

  .panel-hint {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
    border-left: 2px solid var(--color-border);
    margin-left: 0.5rem;
    padding-left: 1.5rem;
    position: relative;
  }

  .timeline-dot {
    position: absolute;
    left: -6px;
    top: 1.125rem;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-border);
  }

  .timeline-dot.run {
    background: var(--color-primary);
  }

  .timeline-dot.updated {
    background: var(--color-success);
  }

  .timeline-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .timeline-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .timeline-date {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  /* Edit form */
  .edit-form-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .edit-form {
    max-width: 800px;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    color: var(--color-text);
    resize: vertical;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
  }

  .cancel-btn,
  .save-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .cancel-btn {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .cancel-btn:hover {
    background: var(--color-bg-secondary);
  }

  .save-btn {
    background: var(--color-primary);
    border: none;
    color: white;
    font-weight: 500;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Modal styles */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    width: 100%;
    max-width: 400px;
    background: var(--color-bg);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body p {
    margin: 0;
  }

  .warning {
    margin-top: 0.75rem !important;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .confirm-delete-btn {
    padding: 0.5rem 1rem;
    background: #ef4444;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
  }

  .confirm-delete-btn:hover {
    background: #dc2626;
  }
</style>
