<script lang="ts">
  import type { PlanningRun } from '$lib/types';
  import { STAGES } from '$lib/types';

  interface Props {
    runs: PlanningRun[];
  }

  let { runs }: Props = $props();

  // Phase distribution calculation
  let phaseDistribution = $derived((() => {
    const distribution: Record<string, number> = {};

    for (const stage of STAGES) {
      distribution[stage.id] = 0;
    }

    for (const run of runs) {
      if (!run.current_phase) continue;
      for (const stage of STAGES) {
        if (stage.phases.includes(run.current_phase as any)) {
          distribution[stage.id]++;
          break;
        }
      }
    }

    return STAGES.map(stage => ({
      id: stage.id,
      title: stage.title,
      count: distribution[stage.id] || 0,
      percentage: runs.length > 0 ? Math.round((distribution[stage.id] || 0) / runs.length * 100) : 0
    }));
  })());

  // Quality score distribution
  let qualityDistribution = $derived((() => {
    const ranges = [
      { label: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
      { label: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
      { label: '41-60', min: 41, max: 60, count: 0, color: '#eab308' },
      { label: '61-80', min: 61, max: 80, count: 0, color: '#22c55e' },
      { label: '81-100', min: 81, max: 100, count: 0, color: '#10b981' }
    ];

    for (const run of runs) {
      if (run.quality_score === null || run.quality_score === undefined) continue;
      const range = ranges.find(r => run.quality_score! >= r.min && run.quality_score! <= r.max);
      if (range) range.count++;
    }

    const maxCount = Math.max(...ranges.map(r => r.count), 1);
    return ranges.map(r => ({
      ...r,
      heightPercent: (r.count / maxCount) * 100
    }));
  })());

  // Completion stats
  let completionStats = $derived((() => {
    const completed = runs.filter(r => r.status === 'completed').length;
    const killed = runs.filter(r => r.status === 'killed').length;
    const running = runs.filter(r => r.status === 'running' || r.status === 'active').length;
    const total = runs.length;

    return {
      completed,
      killed,
      running,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      killRate: total > 0 ? Math.round((killed / total) * 100) : 0
    };
  })());

  // Top performers (by quality score)
  let topPerformers = $derived(
    [...runs]
      .filter(r => r.quality_score !== null && r.quality_score !== undefined)
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 5)
  );

  // Donut chart colors
  const stageColors: Record<string, string> = {
    discovery: '#6366f1',
    validation: '#f59e0b',
    strategy: '#10b981',
    design: '#8b5cf6',
    execution: '#ec4899'
  };

  // Donut chart SVG calculations
  function getDonutPath(startAngle: number, endAngle: number, radius: number, innerRadius: number): string {
    const start = polarToCartesian(startAngle, radius);
    const end = polarToCartesian(endAngle, radius);
    const innerStart = polarToCartesian(endAngle, innerRadius);
    const innerEnd = polarToCartesian(startAngle, innerRadius);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;
  }

  function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
    const angleRad = ((angle - 90) * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(angleRad),
      y: 100 + radius * Math.sin(angleRad)
    };
  }

  let donutPaths = $derived((() => {
    const total = phaseDistribution.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) return [];

    let currentAngle = 0;
    return phaseDistribution.map(d => {
      const angle = (d.count / total) * 360;
      const path = angle > 0 ? getDonutPath(currentAngle, currentAngle + angle - 1, 80, 50) : '';
      currentAngle += angle;
      return {
        ...d,
        path,
        color: stageColors[d.id] || '#6b7280'
      };
    }).filter(d => d.count > 0);
  })());
</script>

<div class="analytics-panel">
  <h2 class="analytics-title">Portfolio Analytics</h2>

  <div class="analytics-grid">
    <!-- Phase Distribution Donut Chart -->
    <div class="chart-card">
      <h3 class="chart-title">Phase Distribution</h3>
      <div class="donut-container">
        <svg viewBox="0 0 200 200" class="donut-chart">
          {#each donutPaths as segment}
            <path d={segment.path} fill={segment.color} />
          {/each}
          <text x="100" y="95" text-anchor="middle" class="donut-total">{runs.length}</text>
          <text x="100" y="115" text-anchor="middle" class="donut-label">Projects</text>
        </svg>
        <div class="donut-legend">
          {#each phaseDistribution as stage}
            <div class="legend-item">
              <span class="legend-color" style="background: {stageColors[stage.id]}"></span>
              <span class="legend-label">{stage.title}</span>
              <span class="legend-count">{stage.count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Quality Distribution Bar Chart -->
    <div class="chart-card">
      <h3 class="chart-title">Quality Score Distribution</h3>
      <div class="bar-chart">
        {#each qualityDistribution as range}
          <div class="bar-column">
            <div class="bar" style="height: {range.heightPercent}%; background: {range.color}">
              {#if range.count > 0}
                <span class="bar-value">{range.count}</span>
              {/if}
            </div>
            <span class="bar-label">{range.label}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Completion Rate -->
    <div class="chart-card">
      <h3 class="chart-title">Completion Rate</h3>
      <div class="rate-display">
        <div class="rate-circle">
          <svg viewBox="0 0 120 120" class="rate-svg">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="10" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="#10b981"
              stroke-width="10"
              stroke-dasharray="{completionStats.completionRate * 3.14} 314"
              stroke-linecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="55" text-anchor="middle" class="rate-value">{completionStats.completionRate}%</text>
            <text x="60" y="75" text-anchor="middle" class="rate-sublabel">Completed</text>
          </svg>
        </div>
        <div class="rate-stats">
          <div class="stat-row">
            <span class="stat-dot completed"></span>
            <span>Completed: {completionStats.completed}</span>
          </div>
          <div class="stat-row">
            <span class="stat-dot running"></span>
            <span>Running: {completionStats.running}</span>
          </div>
          <div class="stat-row">
            <span class="stat-dot killed"></span>
            <span>Killed: {completionStats.killed}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="chart-card wide">
      <h3 class="chart-title">Top Performers</h3>
      {#if topPerformers.length > 0}
        <div class="performers-list">
          {#each topPerformers as run, index}
            <div class="performer-item">
              <span class="performer-rank">#{index + 1}</span>
              <div class="performer-info">
                <span class="performer-title">{run.refined_idea || run.idea}</span>
                <span class="performer-phase">{run.current_phase || 'N/A'}</span>
              </div>
              <span class="performer-score" style="color: {run.quality_score! >= 80 ? '#10b981' : run.quality_score! >= 60 ? '#f59e0b' : '#ef4444'}">
                {run.quality_score}
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-message">No quality scores available yet.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .analytics-panel {
    margin-bottom: 2rem;
  }

  .analytics-title {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text, #111827);
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .chart-card {
    background: var(--color-bg-secondary, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .chart-card.wide {
    grid-column: span 3;
  }

  .chart-title {
    margin: 0 0 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Donut Chart */
  .donut-container {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .donut-chart {
    width: 150px;
    height: 150px;
    flex-shrink: 0;
  }

  .donut-total {
    font-size: 24px;
    font-weight: 700;
    fill: var(--color-text, #111827);
  }

  .donut-label {
    font-size: 12px;
    fill: var(--color-text-muted, #6b7280);
  }

  .donut-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  .legend-label {
    flex: 1;
    color: var(--color-text, #111827);
  }

  .legend-count {
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
  }

  /* Bar Chart */
  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    height: 150px;
    padding-top: 1rem;
  }

  .bar-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .bar {
    width: 100%;
    min-height: 4px;
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    transition: height 0.3s ease;
  }

  .bar-value {
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding-top: 0.25rem;
  }

  .bar-label {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  /* Rate Display */
  .rate-display {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .rate-svg {
    width: 120px;
    height: 120px;
  }

  .rate-value {
    font-size: 24px;
    font-weight: 700;
    fill: var(--color-text, #111827);
  }

  .rate-sublabel {
    font-size: 11px;
    fill: var(--color-text-muted, #6b7280);
  }

  .rate-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text, #111827);
  }

  .stat-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .stat-dot.completed { background: #10b981; }
  .stat-dot.running { background: #6366f1; }
  .stat-dot.killed { background: #ef4444; }

  /* Performers List */
  .performers-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .performer-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 8px;
    border: 1px solid var(--color-border, #e5e7eb);
  }

  .performer-rank {
    font-weight: 700;
    color: var(--color-primary, #6366f1);
    min-width: 30px;
  }

  .performer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .performer-title {
    font-weight: 500;
    color: var(--color-text, #111827);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .performer-phase {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  .performer-score {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .empty-message {
    color: var(--color-text-muted, #6b7280);
    font-style: italic;
  }

  @media (max-width: 1024px) {
    .analytics-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .chart-card.wide {
      grid-column: span 2;
    }
  }

  @media (max-width: 768px) {
    .analytics-grid {
      grid-template-columns: 1fr;
    }

    .chart-card.wide {
      grid-column: span 1;
    }

    .donut-container {
      flex-direction: column;
    }

    .rate-display {
      flex-direction: column;
    }
  }
</style>
