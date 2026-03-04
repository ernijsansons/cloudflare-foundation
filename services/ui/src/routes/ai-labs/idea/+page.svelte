<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { formatDate } from "$lib/utils/format-date";
  import type { Idea } from "./+page.server";

  interface PageData {
    ideas: Idea[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);

  let showCreateModal = $state(false);
  let isSubmitting = $state(false);

  function closeCreateModal() {
    showCreateModal = false;
  }

  function handleModalBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeCreateModal();
    }
  }

  function handleModalBackdropKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCreateModal();
    }
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

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "normal":
        return "#6b7280";
      case "low":
        return "#9ca3af";
      default:
        return "#6b7280";
    }
  }

  function getDealStageLabel(stage: string): string {
    switch (stage) {
      case "idea":
        return "Idea";
      case "researching":
        return "Researching";
      case "production":
        return "Production";
      case "parked":
        return "Parked";
      case "killed":
        return "Killed";
      default:
        return stage;
    }
  }

  function getDealStageIcon(stage: string): string {
    switch (stage) {
      case "idea":
        return "💡";
      case "researching":
        return "🔬";
      case "production":
        return "🚀";
      case "parked":
        return "⏸️";
      case "killed":
        return "❌";
      default:
        return "📋";
    }
  }
</script>

<svelte:head>
  <title>Ideas | AI Labs</title>
</svelte:head>

<div class="page-header">
  <div class="header-content">
    <div>
      <h1>Ideas</h1>
      <p class="subtitle">Document your ideas in detail, then launch research</p>
    </div>
    <button class="create-btn" onclick={() => (showCreateModal = true)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
      New Idea
    </button>
  </div>
</div>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
  </div>
{:else if data.ideas.length === 0}
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
    <p class="empty-title">No idea cards yet</p>
    <p class="empty-hint">Create an idea card with your PRD, business plan, or concept details. Then launch research to validate it.</p>
    <button class="create-btn-large" onclick={() => (showCreateModal = true)}>
      Create Your First Idea
    </button>
  </div>
{:else}
  <div class="ideas-grid">
    {#each data.ideas as idea (idea.id)}
      <a href="/ai-labs/idea/{idea.id}" class="idea-card" style="--priority-color: {getPriorityColor(idea.priority || 'normal')}">
        <div class="priority-accent"></div>
        <div class="card-content">
          <div class="card-header">
            <h3 class="card-title">{idea.name}</h3>
            <div class="card-badges">
              <span class="stage-badge">
                {getDealStageIcon(idea.deal_stage || 'idea')} {getDealStageLabel(idea.deal_stage || 'idea')}
              </span>
              <span class="status-badge" style="--status-color: {getStatusColor(idea.status)}">
                {getStatusLabel(idea.status)}
              </span>
            </div>
          </div>
          <p class="card-preview">
            {idea.content.slice(0, 150)}{idea.content.length > 150 ? "..." : ""}
          </p>
          {#if idea.tags && idea.tags.length > 0}
            <div class="tags-row">
              {#each idea.tags.slice(0, 4) as tag}
                <span class="tag-pill">{tag}</span>
              {/each}
              {#if idea.tags.length > 4}
                <span class="tag-more">+{idea.tags.length - 4}</span>
              {/if}
            </div>
          {/if}
          <div class="card-footer">
            <div class="card-stats">
              <span class="stat" title="Attachments">📎 {idea.attachments?.length ?? 0}</span>
              <span class="stat" title="Constraints">🔒 {idea.constraints?.length ?? 0}</span>
              <span class="stat" title="Notes">📝 {idea.notes?.length ?? 0}</span>
            </div>
            <span class="card-date">{formatDate(idea.updated_at)}</span>
          </div>
        </div>
      </a>
    {/each}
  </div>
{/if}

{#if showCreateModal}
  <div
    class="modal-overlay"
    onclick={handleModalBackdropClick}
    onkeydown={handleModalBackdropKeydown}
    role="button"
    tabindex="0"
    aria-label="Close create idea modal"
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="0">
      <div class="modal-header">
        <h2>Create Idea Card</h2>
        <button class="close-btn" type="button" onclick={closeCreateModal} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}
      >
        <div class="form-group">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="e.g., global-claw.com"
            required
          />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Brief summary of this idea..."
            rows="2"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="content">Content</label>
          <textarea
            id="content"
            name="content"
            placeholder="Paste your PRD, business plan, or detailed idea description here..."
            rows="10"
            required
          ></textarea>
          <p class="field-hint">Paste as much detail as you have - full PRD, business plan, market research, etc.</p>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label for="priority">Priority</label>
            <select id="priority" name="priority">
              <option value="normal" selected>Normal</option>
              <option value="low">Low</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="cancel-btn" onclick={closeCreateModal}>
            Cancel
          </button>
          <button type="submit" class="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Idea"}
          </button>
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

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
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

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .create-btn:hover {
    background: var(--color-primary-hover, #2563eb);
  }

  .error-container {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: var(--color-error);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-muted);
  }

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .empty-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--color-text);
  }

  .empty-hint {
    margin: 0.5rem 0 1.5rem;
    font-size: 0.875rem;
    max-width: 400px;
  }

  .create-btn-large {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .create-btn-large:hover {
    background: var(--color-primary-hover, #2563eb);
  }

  .ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
  }

  .idea-card {
    display: flex;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    overflow: hidden;
  }

  .idea-card:hover {
    border-color: var(--color-border-focus);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    text-decoration: none;
  }

  .priority-accent {
    width: 4px;
    flex-shrink: 0;
    background: var(--priority-color);
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    min-width: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .card-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-badges {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .stage-badge {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .status-badge {
    flex-shrink: 0;
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--status-color) 15%, transparent);
    color: var(--status-color);
  }

  .card-preview {
    flex: 1;
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.75rem;
  }

  .tag-pill {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
  }

  .tag-more {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    background: var(--color-bg-secondary);
    color: var(--color-text-muted);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .card-stats {
    display: flex;
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
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
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    background: var(--color-bg);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text);
  }

  form {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: inherit;
    color: var(--color-text);
    resize: vertical;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .field-hint {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .cancel-btn {
    padding: 0.5rem 1rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: var(--color-bg-secondary);
  }

  .submit-btn {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--color-primary-hover, #2563eb);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
