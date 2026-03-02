<script lang="ts">
  import { onMount } from "svelte";
  import Badge from "./Badge.svelte";
  import type { RalphState } from "$lib/types";

  interface Props {
    runId: string;
    initialState?: any;
  }

  let { runId, initialState }: Props = $props();

  let state = $state(initialState);
  let loading = $state(!initialState);
  let error = $state<string | null>(null);
  let pollInterval = $state<any>(null);

  async function fetchState() {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error("Failed to fetch execution state");
      const data = await res.json();
      state = data.liveState ? { ...data, ...data.liveState } : data;
      error = null;
    } catch (e) {
      console.error("Execution monitor error:", e);
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchState();
    pollInterval = setInterval(fetchState, 5000);
    return () => clearInterval(pollInterval);
  });

  function getStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
    switch (status) {
      case "COMPLETE": return "success";
      case "IN_PROGRESS": return "info";
      case "RUN_CHECKS": return "info";
      case "UPDATE_DOCS": return "info";
      case "BLOCKED": return "error";
      case "REQUEST_APPROVAL": return "warning";
      default: return "default";
    }
  }
</script>

<div class="execution-monitor">
  {#if loading && !state}
    <div class="loading">
      <div class="spinner"></div>
      <p>Connecting to Ralph Control Plane...</p>
    </div>
  {:else if error && !state}
    <div class="error">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{error}</p>
      <button onclick={fetchState}>Retry</button>
    </div>
  {:else if state}
    <div class="monitor-grid">
      <div class="status-card">
        <h3>Current Status</h3>
        <div class="status-badge-row">
          <Badge text={state.currentState || state.status} variant={getStatusVariant(state.currentState || state.status)} />
          <span class="run-id">ID: {runId}</span>
        </div>
        <div class="meta-info">
          <div class="meta-item">
            <span class="label">Turns:</span>
            <span class="value">{state.num_turns || state.numTurns || 0}</span>
          </div>
          <div class="meta-item">
            <span class="label">Repairs:</span>
            <span class="value">{state.repair_attempts || state.repairAttempts || 0}</span>
          </div>
        </div>
      </div>

      <div class="spec-card">
        <h3>Objective</h3>
        <p class="objective">{state.runSpec?.objective || state.objective || "No objective provided"}</p>
        <div class="repo-info">
          <span class="label">Branch:</span>
          <code>{state.runSpec?.branch || state.branch || "unknown"}</code>
        </div>
      </div>

      <div class="checks-card">
        <h3>Quality Checks</h3>
        <div class="checks-list">
          {#each Object.entries(state.checkResults || state.checks || {}) as [check, result]}
            <div class="check-item">
              <span class="check-name">{check}</span>
              <span class="check-status status-{result}">
                {result === 'pass' ? '✓' : result === 'fail' ? '✗' : '—'}
              </span>
            </div>
          {/each}
        </div>
      </div>

      {#if state.files_changed?.length > 0 || state.filesChanged?.length > 0}
        <div class="files-card">
          <h3>Files Changed</h3>
          <div class="files-list">
            {#each (state.files_changed || state.filesChanged) as file}
              <div class="file-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>{file}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .execution-monitor {
    padding: 1.5rem;
    height: 100%;
    overflow-y: auto;
    background: var(--color-bg-subtle, #f9fafb);
  }

  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--color-text-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .monitor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .status-card, .spec-card, .checks-card, .files-card {
    background: white;
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
  }

  .status-badge-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .run-id {
    font-size: 0.75rem;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  .meta-info {
    display: flex;
    gap: 1.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-item .label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .meta-item .value {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .objective {
    font-size: 0.9375rem;
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }

  .repo-info code {
    background: #f1f5f9;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.8125rem;
  }

  .checks-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .check-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .check-status.status-pass { color: #10b981; font-weight: bold; }
  .check-status.status-fail { color: #ef4444; font-weight: bold; }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text);
  }

  .file-item svg {
    color: var(--color-text-muted);
  }

  button {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
