<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { formatDate } from "$lib/utils/format-date";
  import type { Idea, Run } from "./+page.server";

  interface PageData {
    idea: Idea;
    runs: Run[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  let isEditing = $state(false);
  let editName = $state("");
  let editContent = $state("");
  let isSubmitting = $state(false);
  let showDeleteConfirm = $state(false);

  function closeDeleteConfirm() {
    showDeleteConfirm = false;
  }

  function handleDeleteBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDeleteConfirm();
    }
  }

  function handleDeleteBackdropKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeDeleteConfirm();
    }
  }

  function startEditing() {
    editName = data.idea.name;
    editContent = data.idea.content;
    isEditing = true;
  }

  function cancelEditing() {
    isEditing = false;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "draft":
        return "#6b7280";
      case "ready":
        return "#3b82f6";
      case "researching":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      default:
        return "#6b7280";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "draft":
        return "Draft";
      case "ready":
        return "Ready";
      case "researching":
        return "Researching";
      case "completed":
        return "Completed";
      default:
        return status;
    }
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
</script>

<svelte:head>
  <title>{data.idea.name} | Idea Cards | AI Labs</title>
</svelte:head>

<div class="page-container">
  <div class="page-header">
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
        {#if data.idea.status !== "researching"}
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
  </div>

  <div class="content-area">
    {#if isEditing}
      <form
        method="POST"
        action="?/update"
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
            <input
              type="text"
              id="name"
              name="name"
              bind:value={editName}
              required
            />
          </div>
          <div class="form-group">
            <label for="content">Content</label>
            <textarea
              id="content"
              name="content"
              bind:value={editContent}
              rows="20"
              required
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick={cancelEditing}>
              Cancel
            </button>
            <button type="submit" class="save-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    {:else}
      <div class="idea-header">
        <div class="idea-meta">
          <span class="status-badge" style="--status-color: {getStatusColor(data.idea.status)}">
            {getStatusLabel(data.idea.status)}
          </span>
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Created {formatDate(data.idea.created_at)}
          </span>
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Updated {formatDate(data.idea.updated_at)}
          </span>
          <span class="meta-item">
            {data.idea.content.length.toLocaleString()} characters
          </span>
        </div>
      </div>

      <div class="idea-content">
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
    {/if}
  </div>
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
        <button type="button" class="cancel-btn" onclick={closeDeleteConfirm}>
          Cancel
        </button>
        <form method="POST" action="?/delete" use:enhance>
          <button type="submit" class="confirm-delete-btn">
            Delete Idea
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .page-header {
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

  .content-area {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .idea-header {
    margin-bottom: 1.5rem;
  }

  .idea-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--status-color) 15%, transparent);
    color: var(--status-color);
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .idea-content {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.25rem;
    overflow-x: auto;
  }

  .content-display {
    margin: 0;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: var(--color-text);
  }

  .runs-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
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
    text-decoration: none;
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

  /* Edit form styles */
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
    background: var(--color-bg-secondary);
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
