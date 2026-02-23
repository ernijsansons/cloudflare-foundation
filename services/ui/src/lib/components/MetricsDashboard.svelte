<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * Metrics Dashboard - MVP Implementation
   *
   * Displays:
   * 1. Orchestration metrics (consensus scores, model performance)
   * 2. Quality scores across phases
   * 3. Traceability coverage
   * 4. Decision tracking
   */

  interface OrchestrationMetrics {
    avgConsensusScore: number;
    lowConsensusCount: number;
    highConsensusCount: number;
    avgDivergence: number;
    topOutlierModels: Array<{ model: string; count: number }>;
  }

  interface ModelPerformance {
    modelId: string;
    totalRuns: number;
    avgDuration: number;
    errorCount: number;
    errorRate: number;
    avgTokensUsed: number;
    totalCost: number;
  }

  interface PhaseQuality {
    phase: string;
    qualityScore: number | null;
    hasOrchestration: boolean;
    hasDecisions: boolean;
  }

  interface DashboardData {
    runId: string;
    orchestrationMetrics: OrchestrationMetrics;
    modelPerformance: ModelPerformance[];
    phaseQuality: PhaseQuality[];
    totalPhases: number;
    phasesWithOrchestration: number;
    phasesWithDecisions: number;
    avgQualityScore: number;
  }

  // Props
  export let runId: string;
  export let apiBaseUrl = '/api';

  // State
  let loading = true;
  let error: string | null = null;
  let data: DashboardData | null = null;
  let selectedTimeRange = '7d'; // 7d, 30d, 90d
  let selectedModel: string | null = null;

  // Computed
  $: consensusHealth = data ? getConsensusHealth(data.orchestrationMetrics.avgConsensusScore) : 'unknown';
  $: qualityHealth = data ? getQualityHealth(data.avgQualityScore) : 'unknown';
  $: traceabilityCoverage = data ? (data.phasesWithOrchestration / data.totalPhases) * 100 : 0;

  function getConsensusHealth(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.9) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  function getQualityHealth(score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  async function fetchDashboardData() {
    loading = true;
    error = null;

    try {
      // Fetch multiple endpoints in parallel
      const [runSummary, consensusMetrics, modelPerfData] = await Promise.all([
        fetch(`${apiBaseUrl}/planning/runs/${runId}/trace/summary`).then(r => r.json()),
        fetch(`${apiBaseUrl}/orchestration/consensus/metrics?startDate=${getStartDate()}&endDate=${Date.now() / 1000}`).then(r => r.json()),
        Promise.all([
          fetch(`${apiBaseUrl}/orchestration/model/@cf/deepseek-ai/deepseek-r1/performance?startDate=${getStartDate()}&endDate=${Date.now() / 1000}`).then(r => r.json()),
          fetch(`${apiBaseUrl}/orchestration/model/@cf/meta/llama-4-scout/performance?startDate=${getStartDate()}&endDate=${Date.now() / 1000}`).then(r => r.json()),
          fetch(`${apiBaseUrl}/orchestration/model/@cf/qwen/qwen-3-coder/performance?startDate=${getStartDate()}&endDate=${Date.now() / 1000}`).then(r => r.json()),
        ]),
      ]);

      // Compute aggregated data
      const totalPhases = runSummary.phases.length;
      const phasesWithOrchestration = runSummary.phases.filter((p: PhaseQuality) => p.hasOrchestration).length;
      const phasesWithDecisions = runSummary.phases.filter((p: PhaseQuality) => p.hasDecisions).length;
      const avgQualityScore =
        runSummary.phases.reduce((sum: number, p: PhaseQuality) => sum + (p.qualityScore || 0), 0) /
        (runSummary.phases.filter((p: PhaseQuality) => p.qualityScore).length || 1);

      data = {
        runId,
        orchestrationMetrics: consensusMetrics,
        modelPerformance: modelPerfData,
        phaseQuality: runSummary.phases,
        totalPhases,
        phasesWithOrchestration,
        phasesWithDecisions,
        avgQualityScore: parseFloat(avgQualityScore.toFixed(2)),
      };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch dashboard data';
      console.error('Dashboard fetch error:', e);
    } finally {
      loading = false;
    }
  }

  function getStartDate(): number {
    const now = Date.now() / 1000;
    switch (selectedTimeRange) {
      case '7d':
        return now - 7 * 24 * 60 * 60;
      case '30d':
        return now - 30 * 24 * 60 * 60;
      case '90d':
        return now - 90 * 24 * 60 * 60;
      default:
        return now - 7 * 24 * 60 * 60;
    }
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`;
  }

  onMount(() => {
    fetchDashboardData();
  });

  $: if (selectedTimeRange) {
    fetchDashboardData();
  }
</script>

<div class="metrics-dashboard">
  <!-- Header -->
  <header class="dashboard-header">
    <h1>Metrics Dashboard</h1>
    <div class="time-range-selector">
      <button
        class:active={selectedTimeRange === '7d'}
        on:click={() => (selectedTimeRange = '7d')}
      >
        7 Days
      </button>
      <button
        class:active={selectedTimeRange === '30d'}
        on:click={() => (selectedTimeRange = '30d')}
      >
        30 Days
      </button>
      <button
        class:active={selectedTimeRange === '90d'}
        on:click={() => (selectedTimeRange = '90d')}
      >
        90 Days
      </button>
    </div>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading metrics...</p>
    </div>
  {:else if error}
    <div class="error">
      <p class="error-icon">⚠️</p>
      <p class="error-message">{error}</p>
      <button on:click={fetchDashboardData}>Retry</button>
    </div>
  {:else if data}
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card">
        <div class="card-header">
          <h3>Consensus Health</h3>
          <span class="health-badge {consensusHealth}">{consensusHealth.toUpperCase()}</span>
        </div>
        <div class="card-value">{(data.orchestrationMetrics.avgConsensusScore * 100).toFixed(1)}%</div>
        <div class="card-footer">
          <span class="metric-label">High consensus: {data.orchestrationMetrics.highConsensusCount}</span>
          <span class="metric-label">Low consensus: {data.orchestrationMetrics.lowConsensusCount}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Quality Score</h3>
          <span class="health-badge {qualityHealth}">{qualityHealth.toUpperCase()}</span>
        </div>
        <div class="card-value">{data.avgQualityScore}</div>
        <div class="card-footer">
          <span class="metric-label">Target: 85+</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Traceability</h3>
        </div>
        <div class="card-value">{traceabilityCoverage.toFixed(0)}%</div>
        <div class="card-footer">
          <span class="metric-label">{data.phasesWithOrchestration}/{data.totalPhases} phases</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Decisions Made</h3>
        </div>
        <div class="card-value">{data.phasesWithDecisions}</div>
        <div class="card-footer">
          <span class="metric-label">Across all phases</span>
        </div>
      </div>
    </div>

    <!-- Model Performance Table -->
    <section class="section">
      <h2>Model Performance</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Total Runs</th>
              <th>Avg Duration</th>
              <th>Error Rate</th>
              <th>Avg Tokens</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {#each data.modelPerformance as model}
              <tr
                class:selected={selectedModel === model.modelId}
                on:click={() => (selectedModel = model.modelId)}
              >
                <td class="model-name">{model.modelId}</td>
                <td>{model.totalRuns}</td>
                <td>{formatDuration(model.avgDuration)}</td>
                <td>
                  <span class:error-rate-high={model.errorRate > 0.05}>
                    {(model.errorRate * 100).toFixed(2)}%
                  </span>
                </td>
                <td>{model.avgTokensUsed.toLocaleString()}</td>
                <td>{formatCost(model.totalCost)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Phase Quality Chart -->
    <section class="section">
      <h2>Phase Quality Scores</h2>
      <div class="phase-quality-chart">
        {#each data.phaseQuality as phase}
          <div class="phase-bar">
            <div class="phase-name">{phase.phase}</div>
            <div class="bar-container">
              <div
                class="bar"
                class:high={phase.qualityScore && phase.qualityScore >= 85}
                class:medium={phase.qualityScore && phase.qualityScore >= 70 && phase.qualityScore < 85}
                class:low={phase.qualityScore && phase.qualityScore < 70}
                style="width: {phase.qualityScore || 0}%"
              >
                {#if phase.qualityScore}
                  <span class="bar-label">{phase.qualityScore.toFixed(0)}</span>
                {/if}
              </div>
            </div>
            <div class="phase-meta">
              {#if phase.hasOrchestration}
                <span class="badge orchestrated">Orchestrated</span>
              {/if}
              {#if phase.hasDecisions}
                <span class="badge decisions">Decisions</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Wild Ideas / Outliers -->
    {#if data.orchestrationMetrics.topOutlierModels.length > 0}
      <section class="section">
        <h2>Divergent Ideas (Wild Ideas)</h2>
        <p class="section-description">
          Models that frequently produce unique perspectives outside consensus
        </p>
        <div class="outlier-models">
          {#each data.orchestrationMetrics.topOutlierModels as outlier}
            <div class="outlier-card">
              <div class="outlier-model">{outlier.model}</div>
              <div class="outlier-count">{outlier.count} wild ideas</div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .metrics-dashboard {
    padding: 2rem;
    background: var(--bg-primary, #ffffff);
    min-height: 100vh;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary, #1a1a1a);
  }

  .time-range-selector {
    display: flex;
    gap: 0.5rem;
  }

  .time-range-selector button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e5e5e5);
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .time-range-selector button:hover {
    background: var(--bg-hover, #f0f0f0);
  }

  .time-range-selector button.active {
    background: var(--primary-color, #0066ff);
    color: white;
    border-color: var(--primary-color, #0066ff);
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color, #e5e5e5);
    border-top-color: var(--primary-color, #0066ff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-message {
    color: var(--error-color, #dc2626);
    margin-bottom: 1rem;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .card {
    padding: 1.5rem;
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    border: 1px solid var(--border-color, #e5e5e5);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .card-header h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .health-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .health-badge.high {
    background: #dcfce7;
    color: #166534;
  }

  .health-badge.medium {
    background: #fef3c7;
    color: #92400e;
  }

  .health-badge.low {
    background: #fee2e2;
    color: #991b1b;
  }

  .card-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary, #1a1a1a);
    margin-bottom: 0.5rem;
  }

  .card-footer {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .section-description {
    color: var(--text-secondary, #666);
    margin-bottom: 1rem;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    overflow: hidden;
  }

  thead {
    background: var(--bg-tertiary, #f0f0f0);
  }

  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    padding: 1rem;
    border-top: 1px solid var(--border-color, #e5e5e5);
  }

  tr:hover {
    background: var(--bg-hover, #f5f5f5);
    cursor: pointer;
  }

  tr.selected {
    background: var(--primary-light, #e6f0ff);
  }

  .model-name {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .error-rate-high {
    color: var(--error-color, #dc2626);
    font-weight: 600;
  }

  .phase-quality-chart {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .phase-bar {
    display: grid;
    grid-template-columns: 150px 1fr auto;
    align-items: center;
    gap: 1rem;
  }

  .phase-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .bar-container {
    background: var(--bg-tertiary, #f0f0f0);
    border-radius: 4px;
    height: 32px;
    position: relative;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  .bar.high {
    background: #22c55e;
  }

  .bar.medium {
    background: #eab308;
  }

  .bar.low {
    background: #ef4444;
  }

  .bar-label {
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .phase-meta {
    display: flex;
    gap: 0.5rem;
  }

  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge.orchestrated {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge.decisions {
    background: #fce7f3;
    color: #9f1239;
  }

  .outlier-models {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .outlier-card {
    padding: 1rem;
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    border: 2px dashed var(--border-color, #e5e5e5);
  }

  .outlier-model {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .outlier-count {
    color: var(--text-secondary, #666);
    font-size: 0.875rem;
  }
</style>
