<script lang="ts">
  import { page } from "$app/stores";
  import type { ParkedIdea } from "$lib/types";
  import { formatDate } from "$lib/utils/format-date";

  interface PageData {
    ideas: ParkedIdea[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);
</script>

<svelte:head>
  <title>Parked Ideas | AI Labs</title>
</svelte:head>

<div class="page-header">
  <h1>Parked Ideas</h1>
  <p class="subtitle">Ideas too expensive today but viable in 6-18 months as AI evolves</p>
</div>

{#if data.error}
  <div class="error-container">
    <p class="error">{data.error}</p>
  </div>
{:else if data.ideas.length === 0}
  <div class="empty-state">
    <p>No parked ideas yet.</p>
    <p class="hint">Ideas killed with "park for future" will appear here.</p>
  </div>
{:else}
  <div class="ideas-table-wrapper">
    <table class="ideas-table">
      <thead>
        <tr>
          <th>Idea</th>
          <th>Reason</th>
          <th>Revisit</th>
          <th>Source</th>
          <th>Created</th>
          <th>Links</th>
        </tr>
      </thead>
      <tbody>
        {#each data.ideas as idea (idea.id)}
          <tr>
            <td class="idea-cell">
              <span class="idea-title">{idea.refined_idea ?? idea.idea}</span>
            </td>
            <td class="reason-cell">{idea.reason}</td>
            <td class="revisit-cell">
              {#if idea.revisit_estimate_months}
                {idea.revisit_estimate_months} months
                {#if idea.revisit_estimate_note}
                  <span class="revisit-note">{idea.revisit_estimate_note}</span>
                {/if}
              {:else}
                -
              {/if}
            </td>
            <td class="source-cell">{idea.source_phase}</td>
            <td class="date-cell">
              {formatDate(idea.created_at)}
            </td>
            <td class="links-cell">
              {#if idea.run_id}
                <a href="/ai-labs/research/runs/{idea.run_id}" class="link-btn">
                  View Run
                </a>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
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
  }

  .empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: var(--color-text-muted);
  }

  .empty-state p {
    margin: 0;
  }

  .hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .ideas-table-wrapper {
    padding: 1rem;
    overflow-x: auto;
  }

  .ideas-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .ideas-table th {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  .ideas-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    vertical-align: top;
  }

  .ideas-table tr:hover {
    background: var(--color-bg-secondary);
  }

  .idea-cell {
    max-width: 300px;
  }

  .idea-title {
    font-weight: 500;
    color: var(--color-text);
  }

  .reason-cell {
    max-width: 200px;
    color: var(--color-text-muted);
  }

  .revisit-cell {
    white-space: nowrap;
  }

  .revisit-note {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .source-cell {
    color: var(--color-text-muted);
  }

  .date-cell {
    white-space: nowrap;
    color: var(--color-text-muted);
  }

  .links-cell {
    white-space: nowrap;
  }

  .link-btn {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-text);
    text-decoration: none;
  }

  .link-btn:hover {
    border-color: var(--color-border-focus);
    text-decoration: none;
  }
</style>
