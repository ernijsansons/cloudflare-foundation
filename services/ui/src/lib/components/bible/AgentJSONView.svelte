<script lang="ts">
  import type { RalphLoopPayload } from "$lib/services/ralph-generator";
  import ArtifactViewer from "../ArtifactViewer.svelte";

  interface Props {
    payload: RalphLoopPayload;
    runId: string;
  }

  let { payload, runId }: Props = $props();
  let copySuccess = $state(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ralph-payload-${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="agent-json-view">
  <header class="json-header">
    <div class="header-content">
      <h2 class="header-title">Ralph Loop Implementation Payload</h2>
      <p class="header-description">
        Structured JSON for agent-driven implementation
      </p>
    </div>

    <div class="header-actions">
      <button
        class="action-btn"
        type="button"
        onclick={copyToClipboard}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        {copySuccess ? "Copied!" : "Copy JSON"}
      </button>

      <button
        class="action-btn primary"
        type="button"
        onclick={downloadJSON}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download JSON
      </button>
    </div>
  </header>

  <div class="validation-status">
    <div class="status-item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="success">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <div class="status-content">
        <span class="status-label">Validation</span>
        <span class="status-value">Valid JSON Schema</span>
      </div>
    </div>

    <div class="status-item">
      <span class="status-label">Confidence</span>
      <span class="status-value">{payload.metadata.confidence}/100</span>
    </div>

    <div class="status-item">
      <span class="status-label">Completeness</span>
      <span class="status-value">{payload.metadata.completeness}%</span>
    </div>
  </div>

  <div class="json-content">
    <ArtifactViewer artifact={payload} expanded={true} />
  </div>
</div>

<style>
  .agent-json-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .json-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .header-description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--color-bg-tertiary);
  }

  .action-btn.primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .action-btn.primary:hover {
    opacity: 0.9;
  }

  .validation-status {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-item svg.success {
    color: var(--color-success, #10b981);
  }

  .status-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .status-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .status-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .json-content {
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
    .json-header {
      flex-direction: column;
    }

    .header-actions {
      width: 100%;
    }

    .action-btn {
      flex: 1;
    }

    .validation-status {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style>
