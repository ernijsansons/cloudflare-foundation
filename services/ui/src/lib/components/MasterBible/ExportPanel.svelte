<script lang="ts">
  import type { PlanningRun, PlanningArtifact } from '$lib/types';

  interface Props {
    projectName: string;
    ideaContent: string;
    runs: PlanningRun[];
    artifacts: Record<string, PlanningArtifact>;
    qualityScore: number | null;
    revenuePotential: string | null;
  }

  let {
    projectName,
    ideaContent,
    runs,
    artifacts,
    qualityScore,
    revenuePotential
  }: Props = $props();

  // Export state
  let exportStatus = $state<'idle' | 'exporting' | 'success' | 'error'>('idle');
  let exportMessage = $state('');
  let selectedFormat = $state<'json' | 'markdown' | 'pdf'>('json');

  // Helper to escape markdown special characters in table cells
  function escapeMd(text: string | null | undefined): string {
    if (!text) return '';
    return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }

  function formatDate(timestamp: number): string {
    try {
      if (!timestamp || isNaN(timestamp)) return 'Unknown';
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }

  function formatPhase(phase: string | null | undefined): string {
    if (!phase) return 'N/A';
    return phase
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async function exportJSON() {
    exportStatus = 'exporting';
    exportMessage = 'Preparing JSON export...';

    try {
      const exportData = {
        project: {
          name: projectName,
          idea: ideaContent,
          qualityScore,
          revenuePotential,
          exportedAt: new Date().toISOString()
        },
        runs: runs.map(run => ({
          id: run.id,
          status: run.status,
          phase: run.current_phase,
          mode: run.mode,
          qualityScore: run.quality_score,
          killVerdict: run.kill_verdict,
          createdAt: run.created_at,
          updatedAt: run.updated_at
        })),
        artifacts: Object.fromEntries(
          Object.entries(artifacts).map(([phase, artifact]) => [
            phase,
            {
              content: artifact.content,
              overallScore: artifact.overall_score,
              reviewVerdict: artifact.review_verdict,
              reviewFeedback: artifact.review_feedback
            }
          ])
        )
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-export-${crypto.randomUUID().slice(0, 8)}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportStatus = 'success';
      exportMessage = `Exported as ${filename}`;
    } catch (error) {
      console.error('JSON export failed:', error);
      exportStatus = 'error';
      exportMessage = 'Failed to export JSON. Please try again.';
    }
  }

  async function exportMarkdown() {
    exportStatus = 'exporting';
    exportMessage = 'Generating markdown...';

    try {
      let markdown = `# ${escapeMd(projectName)}\n\n`;
      markdown += `> ${escapeMd(ideaContent)}\n\n`;

      markdown += `## Overview\n\n`;
      markdown += `| Metric | Value |\n`;
      markdown += `|--------|-------|\n`;
      markdown += `| Quality Score | ${qualityScore ?? 'N/A'} |\n`;
      markdown += `| Revenue Potential | ${escapeMd(revenuePotential) || 'N/A'} |\n`;
      markdown += `| Total Runs | ${runs.length} |\n`;
      markdown += `| Artifacts | ${Object.keys(artifacts).length} |\n\n`;

      if (runs.length > 0) {
        markdown += `## Research Runs\n\n`;
        markdown += `| Run ID | Status | Phase | Mode | Created |\n`;
        markdown += `|--------|--------|-------|------|--------|\n`;
        for (const run of runs) {
          markdown += `| ${run.id.slice(0, 8)} | ${escapeMd(run.status)} | ${escapeMd(formatPhase(run.current_phase))} | ${escapeMd(run.mode) || 'N/A'} | ${escapeMd(formatDate(run.created_at))} |\n`;
        }
        markdown += '\n';
      }

      if (Object.keys(artifacts).length > 0) {
        markdown += `## Artifacts\n\n`;
        for (const [phase, artifact] of Object.entries(artifacts)) {
          markdown += `### ${formatPhase(phase)}\n\n`;
          if (artifact.overall_score) {
            markdown += `**Score:** ${artifact.overall_score}/100\n\n`;
          }
          if (artifact.review_verdict) {
            markdown += `**Verdict:** ${artifact.review_verdict}\n\n`;
          }
          if (artifact.content) {
            markdown += `\`\`\`json\n${JSON.stringify(artifact.content, null, 2)}\n\`\`\`\n\n`;
          }
        }
      }

      markdown += `---\n*Exported on ${new Date().toLocaleDateString()}*\n`;

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-export-${crypto.randomUUID().slice(0, 8)}.md`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportStatus = 'success';
      exportMessage = `Exported as ${filename}`;
    } catch (error) {
      console.error('Markdown export failed:', error);
      exportStatus = 'error';
      exportMessage = 'Failed to export Markdown. Please try again.';
    }
  }

  async function exportPDF() {
    exportStatus = 'exporting';
    exportMessage = 'Generating PDF...';

    try {
      // Generate HTML for print
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${projectName} - Research Export</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { color: #111827; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; }
            h2 { color: #374151; margin-top: 2rem; }
            h3 { color: #4b5563; }
            blockquote { background: #f3f4f6; border-left: 4px solid #6366f1; padding: 1rem; margin: 1rem 0; }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
            th { background: #f9fafb; }
            pre { background: #f3f4f6; padding: 1rem; overflow-x: auto; font-size: 0.875rem; }
            .score { font-weight: bold; }
            .score.high { color: #10b981; }
            .score.medium { color: #f59e0b; }
            .score.low { color: #ef4444; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${projectName}</h1>
          <blockquote>${ideaContent}</blockquote>

          <h2>Overview</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Quality Score</td><td class="score ${qualityScore && qualityScore >= 80 ? 'high' : qualityScore && qualityScore >= 60 ? 'medium' : 'low'}">${qualityScore ?? 'N/A'}</td></tr>
            <tr><td>Revenue Potential</td><td>${revenuePotential ?? 'N/A'}</td></tr>
            <tr><td>Total Runs</td><td>${runs.length}</td></tr>
            <tr><td>Artifacts</td><td>${Object.keys(artifacts).length}</td></tr>
          </table>
      `;

      if (runs.length > 0) {
        html += `
          <h2>Research Runs</h2>
          <table>
            <tr><th>Run ID</th><th>Status</th><th>Phase</th><th>Mode</th><th>Created</th></tr>
            ${runs.map(run => `
              <tr>
                <td>${run.id.slice(0, 8)}</td>
                <td>${run.status}</td>
                <td>${formatPhase(run.current_phase)}</td>
                <td>${run.mode || 'N/A'}</td>
                <td>${formatDate(run.created_at)}</td>
              </tr>
            `).join('')}
          </table>
        `;
      }

      if (Object.keys(artifacts).length > 0) {
        html += `<h2>Artifacts Summary</h2>`;
        for (const [phase, artifact] of Object.entries(artifacts)) {
          html += `
            <h3>${formatPhase(phase)}</h3>
            ${artifact.overall_score ? `<p><strong>Score:</strong> <span class="score ${artifact.overall_score >= 80 ? 'high' : artifact.overall_score >= 60 ? 'medium' : 'low'}">${artifact.overall_score}/100</span></p>` : ''}
            ${artifact.review_verdict ? `<p><strong>Verdict:</strong> ${artifact.review_verdict}</p>` : ''}
          `;
        }
      }

      html += `
          <hr>
          <p><em>Exported on ${new Date().toLocaleDateString()}</em></p>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      // Fallback cleanup in case onload never fires
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        exportStatus = 'error';
        exportMessage = 'Popup blocked. Please allow popups for this site and try again.';
        return;
      }

      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
      };

      exportStatus = 'success';
      exportMessage = 'PDF print dialog opened';
    } catch (error) {
      console.error('PDF export failed:', error);
      exportStatus = 'error';
      exportMessage = 'Failed to generate PDF. Please try again.';
    }
  }

  async function handleExport() {
    switch (selectedFormat) {
      case 'json':
        await exportJSON();
        break;
      case 'markdown':
        await exportMarkdown();
        break;
      case 'pdf':
        await exportPDF();
        break;
    }
  }
</script>

<div class="export-panel">
  <div class="export-header">
    <h2>Export Project</h2>
    <p class="export-subtitle">Download your research data in various formats</p>
  </div>

  <div class="format-selector">
    <h3>Select Format</h3>
    <div class="format-options">
      <button
        class="format-option"
        class:selected={selectedFormat === 'json'}
        onclick={() => selectedFormat = 'json'}
      >
        <span class="format-icon">📄</span>
        <span class="format-name">JSON</span>
        <span class="format-desc">Full project data with all artifacts</span>
      </button>

      <button
        class="format-option"
        class:selected={selectedFormat === 'markdown'}
        onclick={() => selectedFormat = 'markdown'}
      >
        <span class="format-icon">📝</span>
        <span class="format-name">Markdown</span>
        <span class="format-desc">Human-readable research summary</span>
      </button>

      <button
        class="format-option"
        class:selected={selectedFormat === 'pdf'}
        onclick={() => selectedFormat = 'pdf'}
      >
        <span class="format-icon">📊</span>
        <span class="format-name">PDF</span>
        <span class="format-desc">Printable executive report</span>
      </button>
    </div>
  </div>

  <div class="export-preview">
    <h3>Export Contents</h3>
    <div class="preview-summary">
      <div class="preview-item">
        <span class="preview-label">Project Name</span>
        <span class="preview-value">{projectName}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Research Runs</span>
        <span class="preview-value">{runs.length}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Artifacts</span>
        <span class="preview-value">{Object.keys(artifacts).length} phases</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">Quality Score</span>
        <span class="preview-value">{qualityScore ?? 'N/A'}</span>
      </div>
    </div>
  </div>

  <div class="export-actions">
    <button
      class="export-button"
      onclick={handleExport}
      disabled={exportStatus === 'exporting'}
    >
      {#if exportStatus === 'exporting'}
        <span class="spinner"></span>
        Exporting...
      {:else}
        Export as {selectedFormat.toUpperCase()}
      {/if}
    </button>

    {#if exportMessage}
      <div class="export-message" class:success={exportStatus === 'success'} class:error={exportStatus === 'error'}>
        {exportMessage}
      </div>
    {/if}
  </div>
</div>

<style>
  .export-panel {
    max-width: 800px;
  }

  .export-header {
    margin-bottom: 2rem;
  }

  .export-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text, #111827);
  }

  .export-subtitle {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .format-selector {
    margin-bottom: 2rem;
  }

  .format-selector h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .format-options {
    display: grid;
    gap: 1rem;
  }

  .format-option {
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.25rem 1rem;
    align-items: center;
    padding: 1.25rem;
    background: var(--color-bg-secondary, #f9fafb);
    border: 2px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .format-option:hover {
    border-color: var(--color-primary, #6366f1);
    background: white;
  }

  .format-option.selected {
    border-color: var(--color-primary, #6366f1);
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .format-icon {
    grid-row: span 2;
    font-size: 2rem;
  }

  .format-name {
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .format-desc {
    grid-column: 2;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .export-preview {
    margin-bottom: 2rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
  }

  .export-preview h3 {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preview-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preview-label {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  .preview-value {
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .export-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .export-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: var(--color-primary, #6366f1);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .export-button:hover:not(:disabled) {
    background: var(--color-primary-hover, #4f46e5);
    transform: translateY(-1px);
  }

  .export-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .export-message {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    text-align: center;
  }

  .export-message.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success, #10b981);
  }

  .export-message.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error, #ef4444);
  }

  @media (max-width: 640px) {
    .format-option {
      grid-template-columns: auto 1fr;
    }

    .format-icon {
      grid-row: span 1;
    }

    .format-desc {
      grid-column: 1 / -1;
    }
  }
</style>
