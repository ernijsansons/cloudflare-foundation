<script lang="ts">
  import type { PlanningArtifact } from '$lib/types';

  interface Props {
    qualityScore: number | null;
    artifacts: Record<string, PlanningArtifact>;
    revenuePotential: string | null;
  }

  let { qualityScore, artifacts, revenuePotential }: Props = $props();

  // Radar chart dimensions
  const dimensions = [
    { key: 'market', label: 'Market', phases: ['market-research'] },
    { key: 'customer', label: 'Customer', phases: ['customer-intel'] },
    { key: 'product', label: 'Product', phases: ['product-design', 'opportunity'] },
    { key: 'revenue', label: 'Revenue', phases: ['business-model', 'revenue-expansion'] },
    { key: 'tech', label: 'Technical', phases: ['tech-arch'] },
    { key: 'competitive', label: 'Competitive', phases: ['competitive-intel'] }
  ];

  // Extract scores from artifacts
  let dimensionScores = $derived(() => {
    return dimensions.map(dim => {
      // Find the best score from any of the related phases
      let maxScore = 0;
      let hasData = false;

      for (const phase of dim.phases) {
        const artifact = artifacts[phase];
        if (artifact?.overall_score) {
          hasData = true;
          maxScore = Math.max(maxScore, artifact.overall_score);
        }
      }

      return {
        ...dim,
        score: hasData ? maxScore : null,
        normalizedScore: hasData ? maxScore / 100 : 0
      };
    });
  });

  // Calculate overall metrics
  let metrics = $derived(() => {
    const scores = dimensionScores().filter(d => d.score !== null);
    const avgDimensionScore = scores.length > 0
      ? Math.round(scores.reduce((sum, d) => sum + (d.score || 0), 0) / scores.length)
      : null;

    const artifactCount = Object.keys(artifacts).length;
    const artifactScores = Object.values(artifacts)
      .filter(a => a.overall_score)
      .map(a => a.overall_score!);
    const avgArtifactScore = artifactScores.length > 0
      ? Math.round(artifactScores.reduce((a, b) => a + b, 0) / artifactScores.length)
      : null;

    return {
      overall: qualityScore ?? avgDimensionScore ?? avgArtifactScore,
      coverage: Math.round((artifactCount / 16) * 100),
      avgDimensionScore,
      avgArtifactScore,
      completedDimensions: scores.length,
      totalDimensions: dimensions.length
    };
  });

  // Radar chart SVG calculations
  const chartSize = 240;
  const chartCenter = chartSize / 2;
  const chartRadius = 90;
  const levels = 5;

  function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
    // Start from top (270 degrees in standard coords, or -90 degrees)
    const angleRad = ((angle - 90) * Math.PI) / 180;
    return {
      x: chartCenter + radius * Math.cos(angleRad),
      y: chartCenter + radius * Math.sin(angleRad)
    };
  }

  let radarPoints = $derived(() => {
    const scores = dimensionScores();
    const angleStep = 360 / scores.length;

    return scores.map((dim, index) => {
      const angle = index * angleStep;
      const radius = dim.normalizedScore * chartRadius;
      const point = polarToCartesian(angle, radius);
      const labelPoint = polarToCartesian(angle, chartRadius + 25);

      return {
        ...dim,
        angle,
        x: point.x,
        y: point.y,
        labelX: labelPoint.x,
        labelY: labelPoint.y
      };
    });
  });

  let radarPath = $derived(() => {
    const points = radarPoints();
    if (points.length === 0) return '';

    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';
  });

  let gridPaths = $derived((() => {
    const paths: string[] = [];
    const angleStep = 360 / dimensions.length;

    for (let level = 1; level <= levels; level++) {
      const radius = (level / levels) * chartRadius;
      const points = dimensions.map((_, index) => {
        const angle = index * angleStep;
        return polarToCartesian(angle, radius);
      });

      paths.push(
        points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
      );
    }

    return paths;
  })());

  function getAxisLines(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    const angleStep = 360 / dimensions.length;
    return dimensions.map((_, index) => {
      const angle = index * angleStep;
      const end = polarToCartesian(angle, chartRadius);
      return {
        x1: chartCenter,
        y1: chartCenter,
        x2: end.x,
        y2: end.y
      };
    });
  }

  function getScoreColor(score: number | null): string {
    if (score === null) return 'var(--color-text-muted, #6b7280)';
    if (score >= 80) return 'var(--color-success, #10b981)';
    if (score >= 60) return 'var(--color-warning, #f59e0b)';
    return 'var(--color-error, #ef4444)';
  }

  function getScoreLabel(score: number | null): string {
    if (score === null) return 'No Data';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  }
</script>

<div class="scorecard">
  <div class="scorecard-header">
    <h3 class="scorecard-title">Quality Scorecard</h3>
    <div class="overall-score" style="--score-color: {getScoreColor(metrics().overall)}">
      <span class="score-value">{metrics().overall ?? '—'}</span>
      <span class="score-label">{getScoreLabel(metrics().overall)}</span>
    </div>
  </div>

  <div class="scorecard-body">
    <!-- Radar Chart -->
    <div class="radar-section">
      <svg
        class="radar-chart"
        viewBox="0 0 {chartSize} {chartSize}"
        width={chartSize}
        height={chartSize}
        role="img"
        aria-label="Quality scorecard radar chart showing scores across 6 dimensions"
      >
        <title>Quality Scorecard Radar Chart</title>
        <desc>A radar chart displaying scores for Market, Customer, Product, Revenue, Technical, and Competitive dimensions.</desc>
        <!-- Grid circles -->
        <g class="radar-grid">
          {#each gridPaths as path, index}
            <path
              d={path}
              fill="none"
              stroke="var(--color-border, #e5e7eb)"
              stroke-width="1"
              opacity={0.5 + (index * 0.1)}
            />
          {/each}
        </g>

        <!-- Axis lines -->
        <g class="radar-axes">
          {#each getAxisLines() as line}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="var(--color-border, #e5e7eb)"
              stroke-width="1"
            />
          {/each}
        </g>

        <!-- Data area -->
        {#if radarPath()}
          <path
            d={radarPath()}
            fill="rgba(99, 102, 241, 0.2)"
            stroke="var(--color-primary, #6366f1)"
            stroke-width="2"
            class="radar-area"
          />
        {/if}

        <!-- Data points -->
        <g class="radar-points">
          {#each radarPoints() as point}
            {#if point.score !== null}
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="var(--color-primary, #6366f1)"
                stroke="white"
                stroke-width="2"
              />
            {/if}
          {/each}
        </g>

        <!-- Labels -->
        <g class="radar-labels">
          {#each radarPoints() as point}
            <text
              x={point.labelX}
              y={point.labelY}
              text-anchor="middle"
              dominant-baseline="middle"
              class="radar-label"
              fill="var(--color-text-muted, #6b7280)"
            >
              {point.label}
            </text>
          {/each}
        </g>
      </svg>
    </div>

    <!-- Dimension Scores -->
    <div class="dimension-scores">
      <h4 class="section-subtitle">Dimension Breakdown</h4>
      <div class="dimension-list">
        {#each dimensionScores() as dim}
          <div class="dimension-item">
            <span class="dimension-label">{dim.label}</span>
            <div class="dimension-bar-wrapper">
              <div
                class="dimension-bar"
                style="width: {dim.score ? dim.score : 0}%; background: {getScoreColor(dim.score)}"
              ></div>
            </div>
            <span class="dimension-score" style="color: {getScoreColor(dim.score)}">
              {dim.score ?? '—'}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="scorecard-footer">
    <div class="summary-stat">
      <span class="stat-label">Coverage</span>
      <span class="stat-value">{metrics().coverage}%</span>
    </div>
    <div class="summary-stat">
      <span class="stat-label">Dimensions</span>
      <span class="stat-value">{metrics().completedDimensions}/{metrics().totalDimensions}</span>
    </div>
    {#if revenuePotential}
      <div class="summary-stat">
        <span class="stat-label">Revenue</span>
        <span class="stat-value revenue">{revenuePotential}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .scorecard {
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    overflow: hidden;
  }

  .scorecard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: white;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .scorecard-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .overall-score {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .score-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--score-color);
    line-height: 1;
  }

  .score-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--score-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .scorecard-body {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2rem;
    padding: 1.5rem;
  }

  .radar-section {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .radar-chart {
    display: block;
  }

  .radar-area {
    transition: d 0.3s ease;
  }

  .radar-label {
    font-size: 11px;
    font-weight: 500;
  }

  .dimension-scores {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-subtitle {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .dimension-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dimension-item {
    display: grid;
    grid-template-columns: 100px 1fr 40px;
    align-items: center;
    gap: 0.75rem;
  }

  .dimension-label {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
  }

  .dimension-bar-wrapper {
    height: 8px;
    background: var(--color-border, #e5e7eb);
    border-radius: 4px;
    overflow: hidden;
  }

  .dimension-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
    min-width: 2px;
  }

  .dimension-score {
    font-size: 0.875rem;
    font-weight: 600;
    text-align: right;
  }

  .scorecard-footer {
    display: flex;
    gap: 2rem;
    padding: 1rem 1.5rem;
    background: white;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text, #111827);
  }

  .stat-value.revenue {
    color: var(--color-success, #10b981);
  }

  @media (max-width: 768px) {
    .scorecard-body {
      grid-template-columns: 1fr;
    }

    .radar-section {
      order: -1;
    }

    .dimension-item {
      grid-template-columns: 80px 1fr 36px;
    }
  }
</style>
