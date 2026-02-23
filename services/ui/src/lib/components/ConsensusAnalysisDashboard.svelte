<script lang="ts">
  import { onMount } from 'svelte';

  /**
   * Consensus Analysis Dashboard - Deep Dive into K-LLM Ensemble
   *
   * Provides detailed analysis of multi-model orchestration:
   * - Model-by-model output comparison
   * - Consensus vs. divergence visualization
   * - Wild idea exploration with divergence scores
   * - Semantic similarity heatmap
   * - Model performance correlation
   */

  interface ModelOutput {
    id: string;
    modelId: string;
    rawOutput: string;
    durationMs: number;
    tokensUsed: number | null;
    error: string | null;
  }

  interface WildIdea {
    id: string;
    modelId: string;
    wildIdea: string;
    reasoning: string;
    divergenceScore: number | null;
  }

  interface ConsensusData {
    consensusScore: number;
    avgSemanticSimilarity: number | null;
    sentimentStdDev: number | null;
    outlierModels: string[];
    synthesizerModel: string;
    totalDurationMs: number;
    parallelModelCount: number;
  }

  interface ConsensusAnalysis {
    artifactId: string;
    phase: string;
    modelOutputs: ModelOutput[];
    wildIdeas: WildIdea[];
    consensus: ConsensusData;
  }

  // Props
  export let artifactId: string;
  export let apiBaseUrl = '/api';

  // State
  let loading = true;
  let error: string | null = null;
  let data: ConsensusAnalysis | null = null;
  let selectedModel: string | null = null;
  let selectedWildIdea: WildIdea | null = null;
  let showRawOutputs = false;
  let comparisonMode: 'side-by-side' | 'overlay' | 'diff' = 'side-by-side';

  // Computed
  $: consensusLevel = data ? getConsensusLevel(data.consensus.consensusScore) : 'unknown';
  $: outlierCount = data?.consensus.outlierModels.length || 0;
  $: hasWildIdeas = data && data.wildIdeas.length > 0;
  $: topDivergentIdea = data?.wildIdeas.sort((a, b) => (b.divergenceScore || 0) - (a.divergenceScore || 0))[0];

  function getConsensusLevel(score: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (score >= 0.9) return 'very-high';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    if (score >= 0.6) return 'low';
    return 'very-low';
  }

  async function fetchData() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`${apiBaseUrl}/orchestration/artifact/${artifactId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      data = {
        artifactId,
        phase: 'unknown', // Could be fetched from artifact
        modelOutputs: result.modelOutputs || [],
        wildIdeas: result.wildIdeas || [],
        consensus: result.consensus || {
          consensusScore: 0,
          avgSemanticSimilarity: null,
          sentimentStdDev: null,
          outlierModels: [],
          synthesizerModel: 'unknown',
          totalDurationMs: 0,
          parallelModelCount: 0,
        },
      };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch consensus data';
      console.error('Consensus fetch error:', e);
    } finally {
      loading = false;
    }
  }

  function selectModel(modelId: string) {
    selectedModel = selectedModel === modelId ? null : modelId;
  }

  function selectWildIdea(idea: WildIdea) {
    selectedWildIdea = selectedWildIdea?.id === idea.id ? null : idea;
  }

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function formatPercent(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  function truncateText(text: string, maxLength = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  onMount(() => {
    fetchData();
  });
</script>

<div class="consensus-dashboard">
  <header class="dashboard-header">
    <h1>Consensus Analysis</h1>
    <div class="header-actions">
      <button class="toggle-button" on:click={() => (showRawOutputs = !showRawOutputs)}>
        {showRawOutputs ? 'Hide' : 'Show'} Raw Outputs
      </button>
    </div>
  </header>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading consensus analysis...</p>
    </div>
  {:else if error}
    <div class="error">
      <p class="error-icon">⚠️</p>
      <p class="error-message">{error}</p>
      <button on:click={fetchData}>Retry</button>
    </div>
  {:else if data}
    <!-- Consensus Overview -->
    <section class="section">
      <h2>Consensus Overview</h2>
      <div class="consensus-grid">
        <div class="consensus-card">
          <div class="card-label">Consensus Score</div>
          <div class="card-value consensus-{consensusLevel}">
            {formatPercent(data.consensus.consensusScore)}
          </div>
          <div class="card-sublabel">{consensusLevel.replace('-', ' ').toUpperCase()}</div>
        </div>

        {#if data.consensus.avgSemanticSimilarity}
          <div class="consensus-card">
            <div class="card-label">Semantic Similarity</div>
            <div class="card-value">{formatPercent(data.consensus.avgSemanticSimilarity)}</div>
            <div class="card-sublabel">Average across models</div>
          </div>
        {/if}

        <div class="consensus-card">
          <div class="card-label">Outlier Models</div>
          <div class="card-value">{outlierCount}</div>
          <div class="card-sublabel">
            {outlierCount === 0 ? 'All agree' : 'Divergent outputs'}
          </div>
        </div>

        <div class="consensus-card">
          <div class="card-label">Wild Ideas</div>
          <div class="card-value">{data.wildIdeas.length}</div>
          <div class="card-sublabel">Novel perspectives</div>
        </div>
      </div>
    </section>

    <!-- Model-by-Model Comparison -->
    <section class="section">
      <div class="section-header">
        <h2>Model Outputs ({data.modelOutputs.length})</h2>
        <div class="comparison-mode-selector">
          <button
            class:active={comparisonMode === 'side-by-side'}
            on:click={() => (comparisonMode = 'side-by-side')}
          >
            Side-by-Side
          </button>
          <button
            class:active={comparisonMode === 'overlay'}
            on:click={() => (comparisonMode = 'overlay')}
          >
            Overlay
          </button>
        </div>
      </div>

      <div class="model-outputs {comparisonMode}">
        {#each data.modelOutputs as output}
          {@const isOutlier = data.consensus.outlierModels.includes(output.modelId)}
          {@const isSelected = selectedModel === output.modelId}

          <div
            class="model-output-card"
            class:outlier={isOutlier}
            class:selected={isSelected}
            role="button"
            tabindex="0"
            on:click={() => selectModel(output.modelId)}
            on:keydown={(e) => e.key === 'Enter' && selectModel(output.modelId)}
          >
            <div class="model-header">
              <div class="model-name">
                {output.modelId}
                {#if isOutlier}
                  <span class="outlier-badge">OUTLIER</span>
                {/if}
              </div>
              <div class="model-stats">
                <span class="stat">{formatDuration(output.durationMs)}</span>
                {#if output.tokensUsed}
                  <span class="stat">{output.tokensUsed.toLocaleString()} tokens</span>
                {/if}
              </div>
            </div>

            {#if output.error}
              <div class="model-error">
                <span class="error-icon">❌</span>
                <span>{output.error}</span>
              </div>
            {:else if showRawOutputs || isSelected}
              <div class="model-output">
                <pre>{output.rawOutput}</pre>
              </div>
            {:else}
              <div class="model-output-preview">
                {truncateText(output.rawOutput)}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <!-- Wild Ideas Exploration -->
    {#if hasWildIdeas}
      <section class="section">
        <h2>Wild Ideas ({data.wildIdeas.length})</h2>
        <p class="section-description">
          Divergent perspectives that fell outside consensus. These may contain breakthrough insights.
        </p>

        {#if topDivergentIdea}
          <div class="top-wild-idea">
            <div class="wild-idea-label">
              🌟 Top Divergent Idea
              <span class="divergence-score">
                Divergence: {((topDivergentIdea.divergenceScore || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div class="wild-idea-content">
              <p class="wild-idea-text">{topDivergentIdea.wildIdea}</p>
              <p class="wild-idea-model">— {topDivergentIdea.modelId}</p>
              <p class="wild-idea-reasoning">{topDivergentIdea.reasoning}</p>
            </div>
          </div>
        {/if}

        <div class="wild-ideas-grid">
          {#each data.wildIdeas as idea}
            {@const isSelected = selectedWildIdea?.id === idea.id}

            <div
              class="wild-idea-card"
              class:selected={isSelected}
              role="button"
              tabindex="0"
              on:click={() => selectWildIdea(idea)}
              on:keydown={(e) => e.key === 'Enter' && selectWildIdea(idea)}
            >
              <div class="wild-idea-header">
                <span class="wild-idea-model-badge">{idea.modelId.split('/').pop()}</span>
                {#if idea.divergenceScore}
                  <span class="divergence-badge" style="--divergence: {idea.divergenceScore}">
                    {(idea.divergenceScore * 100).toFixed(0)}%
                  </span>
                {/if}
              </div>
              <div class="wild-idea-body">
                <p class="wild-idea-text">{idea.wildIdea}</p>
                {#if isSelected}
                  <div class="wild-idea-reasoning-expanded">
                    <strong>Reasoning:</strong>
                    <p>{idea.reasoning}</p>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Synthesis Info -->
    <section class="section">
      <h2>Synthesis</h2>
      <div class="synthesis-info">
        <div class="info-row">
          <span class="info-label">Synthesizer Model:</span>
          <span class="info-value">{data.consensus.synthesizerModel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Parallel Models:</span>
          <span class="info-value">{data.consensus.parallelModelCount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Duration:</span>
          <span class="info-value">{formatDuration(data.consensus.totalDurationMs)}</span>
        </div>
        {#if data.consensus.sentimentStdDev}
          <div class="info-row">
            <span class="info-label">Sentiment Std Dev:</span>
            <span class="info-value">{data.consensus.sentimentStdDev.toFixed(3)}</span>
          </div>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .consensus-dashboard {
    padding: 2rem;
    background: var(--bg-primary, #ffffff);
    min-height: 100vh;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--border-color, #e5e5e5);
  }

  .dashboard-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }

  .toggle-button {
    padding: 0.5rem 1rem;
    background: var(--bg-secondary, #f9f9f9);
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .toggle-button:hover {
    background: var(--bg-hover, #f0f0f0);
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

  .section {
    margin-bottom: 3rem;
  }

  .section h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-description {
    color: var(--text-secondary, #666);
    margin-bottom: 1.5rem;
  }

  .consensus-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .consensus-card {
    background: var(--bg-secondary, #f9f9f9);
    padding: 1.5rem;
    border-radius: 8px;
    border: 2px solid var(--border-color, #e5e5e5);
    text-align: center;
  }

  .card-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary, #666);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .card-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .card-value.consensus-very-high {
    color: #166534;
  }

  .card-value.consensus-high {
    color: #15803d;
  }

  .card-value.consensus-medium {
    color: #ca8a04;
  }

  .card-value.consensus-low {
    color: #dc2626;
  }

  .card-value.consensus-very-low {
    color: #991b1b;
  }

  .card-sublabel {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
  }

  .comparison-mode-selector {
    display: flex;
    gap: 0.5rem;
  }

  .comparison-mode-selector button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e5e5e5);
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .comparison-mode-selector button.active {
    background: var(--primary-color, #0066ff);
    color: white;
    border-color: var(--primary-color, #0066ff);
  }

  .model-outputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .model-outputs.overlay {
    position: relative;
  }

  .model-output-card {
    background: var(--bg-secondary, #f9f9f9);
    border: 2px solid var(--border-color, #e5e5e5);
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .model-output-card:hover {
    border-color: var(--primary-color, #0066ff);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .model-output-card.selected {
    border-color: var(--primary-color, #0066ff);
    background: #e6f0ff;
  }

  .model-output-card.outlier {
    border-color: #f59e0b;
    background: #fef3c7;
  }

  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .model-name {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .outlier-badge {
    padding: 0.25rem 0.5rem;
    background: #f59e0b;
    color: white;
    font-size: 0.75rem;
    border-radius: 4px;
    font-weight: 700;
  }

  .model-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
  }

  .model-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--error-color, #dc2626);
    padding: 1rem;
    background: #fee2e2;
    border-radius: 4px;
  }

  .model-output pre {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.875rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .model-output-preview {
    color: var(--text-secondary, #666);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .top-wild-idea {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 3px solid #f59e0b;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .wild-idea-label {
    font-size: 1.25rem;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .divergence-score {
    font-size: 1rem;
    padding: 0.5rem 1rem;
    background: #f59e0b;
    color: white;
    border-radius: 4px;
  }

  .wild-idea-content {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
  }

  .wild-idea-text {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    line-height: 1.6;
  }

  .wild-idea-model {
    font-family: 'Courier New', monospace;
    color: var(--text-secondary, #666);
    margin-bottom: 1rem;
  }

  .wild-idea-reasoning {
    color: var(--text-secondary, #666);
    font-style: italic;
    line-height: 1.6;
  }

  .wild-ideas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .wild-idea-card {
    background: #fef3c7;
    border: 2px solid #fbbf24;
    border-radius: 8px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .wild-idea-card:hover {
    border-color: #f59e0b;
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.2);
  }

  .wild-idea-card.selected {
    border-width: 3px;
    background: #fde68a;
  }

  .wild-idea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .wild-idea-model-badge {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: #f59e0b;
    color: white;
    border-radius: 4px;
  }

  .divergence-badge {
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: rgba(245, 158, 11, calc(var(--divergence) * 0.8));
    color: #92400e;
  }

  .wild-idea-body {
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .wild-idea-reasoning-expanded {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #fbbf24;
  }

  .wild-idea-reasoning-expanded strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #92400e;
  }

  .synthesis-info {
    background: var(--bg-secondary, #f9f9f9);
    padding: 1.5rem;
    border-radius: 8px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 600;
    color: var(--text-secondary, #666);
  }

  .info-value {
    font-family: 'Courier New', monospace;
    color: var(--text-primary, #1a1a1a);
  }
</style>
