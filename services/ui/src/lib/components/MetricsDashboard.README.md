# Metrics Dashboard Component

## Overview

The Metrics Dashboard provides comprehensive visibility into the ERLV/OpenClaw Research OS's multi-model orchestration, quality tracking, and decision-making processes. This is a critical component of the Palantir AIP-inspired architecture for maintaining observability and operator confidence.

## Features

### 1. Consensus Health Monitoring

Tracks the agreement level across multiple AI models during orchestration:

- **High (≥90%)**: Models are in strong agreement
- **Medium (70-89%)**: Acceptable variance, monitor for outliers
- **Low (<70%)**: Significant disagreement, requires human review

**Why it matters**: Low consensus indicates models see the problem differently, which may signal:
- Ambiguous requirements
- Novel market conditions
- Need for additional research
- Potential for wild ideas/breakthroughs

### 2. Quality Score Tracking

Monitors artifact quality across all phases:

- **Target**: 85+ (production-ready)
- **Acceptable**: 70-84 (needs review)
- **Critical**: <70 (requires revision)

**Calculation**: Weighted average of:
- Evidence coverage (30%)
- Factual accuracy (25%)
- Completeness (20%)
- Citation quality (15%)
- Reasoning depth (10%)

### 3. Traceability Coverage

Shows percentage of phases with complete Evidence → Decision → Artifact tracking:

- **Goal**: 100% coverage for all orchestrated phases
- **Current**: Displays phases with/without orchestration
- **Impact**: Enables full audit trail for compliance and debugging

### 4. Decision Tracking

Counts critical decisions made across all phases:

- **Kill-test verdicts** (GO/KILL/PIVOT)
- **Opportunity selection**
- **Strategy approvals**
- **Risk acceptances**

### 5. Model Performance Metrics

Per-model analytics showing:

- **Total Runs**: Number of times model was invoked
- **Avg Duration**: Response time (ms or seconds)
- **Error Rate**: Percentage of failed calls
- **Avg Tokens**: Token usage per call (cost proxy)
- **Total Cost**: Estimated API cost

**Usage**: Click on a model row to highlight it and see detailed performance.

### 6. Phase Quality Visualization

Horizontal bar chart showing quality scores for each phase:

- **Green (≥85)**: Production-ready
- **Yellow (70-84)**: Needs review
- **Red (<70)**: Requires revision

**Badges**:
- **Orchestrated**: Phase used multi-model ensemble
- **Decisions**: Phase included decision points

### 7. Wild Ideas Tracking

Lists models that frequently produce divergent ideas outside consensus:

- **High divergence** (>70%): Novel perspectives, breakthrough potential
- **Medium divergence** (40-69%): Useful alternatives
- **Low divergence** (<40%): Close to consensus

**Strategy**: Wild ideas should be surfaced to operators for review as they may contain valuable insights missed by consensus.

## Usage

### Basic Usage

```svelte
<script>
  import MetricsDashboard from '$lib/components/MetricsDashboard.svelte';

  const runId = 'run-789';
</script>

<MetricsDashboard {runId} />
```

### With Custom API Base URL

```svelte
<MetricsDashboard runId="run-789" apiBaseUrl="https://api.custom.com" />
```

### In a Route

```svelte
<!-- routes/metrics/[runId]/+page.svelte -->
<script>
  import MetricsDashboard from '$lib/components/MetricsDashboard.svelte';
  import { page } from '$app/stores';

  $: runId = $page.params.runId;
</script>

<MetricsDashboard {runId} />
```

## API Requirements

The dashboard expects the following API endpoints (documented in `docs/API.md`):

### 1. Run Traceability Summary
```
GET /api/planning/runs/:id/trace/summary

Response:
{
  "runId": "run-789",
  "phases": [
    {
      "phase": "opportunity",
      "hasArtifact": true,
      "hasOrchestration": true,
      "hasDecisions": true,
      "qualityScore": 87
    },
    ...
  ]
}
```

### 2. Consensus Metrics
```
GET /api/orchestration/consensus/metrics?startDate={ts}&endDate={ts}

Response:
{
  "avgConsensusScore": 0.815,
  "lowConsensusCount": 12,
  "highConsensusCount": 45,
  "avgDivergence": 0.15,
  "topOutlierModels": [
    {
      "model": "@cf/qwen/qwen-3-coder",
      "count": 8
    }
  ]
}
```

### 3. Model Performance
```
GET /api/orchestration/model/{modelId}/performance?startDate={ts}&endDate={ts}

Response:
{
  "modelId": "@cf/deepseek-ai/deepseek-r1",
  "totalRuns": 245,
  "avgDuration": 2450,
  "errorCount": 3,
  "errorRate": 0.0122,
  "avgTokensUsed": 2350,
  "totalCost": 0.58
}
```

## Time Range Filtering

The dashboard supports three time ranges:

- **7 Days**: Last week (default, fastest)
- **30 Days**: Last month
- **90 Days**: Last quarter (comprehensive, slower)

Time range affects:
- Consensus metrics
- Model performance stats
- Cost calculations

## Performance Considerations

### Optimization Strategies

1. **Parallel API Calls**: Dashboard fetches multiple endpoints concurrently
2. **Minimal Re-renders**: Uses Svelte's reactivity sparingly
3. **Lazy Loading**: Could be enhanced with virtual scrolling for large datasets

### Expected Load Times

| Time Range | API Calls | Expected Load Time |
|------------|-----------|-------------------|
| 7 Days     | 5         | 500-800ms         |
| 30 Days    | 5         | 800-1200ms        |
| 90 Days    | 5         | 1200-2000ms       |

### Caching Recommendations

For production, consider:
- **Browser Cache**: 5-minute TTL on metrics endpoints
- **CDN Cache**: 1-minute TTL for aggregate stats
- **API Cache**: Redis/KV with 30-second TTL

## Customization

### Theme Variables

Override these CSS custom properties to match your design system:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9f9f9;
  --bg-tertiary: #f0f0f0;
  --bg-hover: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666;
  --border-color: #e5e5e5;
  --primary-color: #0066ff;
  --primary-light: #e6f0ff;
  --error-color: #dc2626;
}
```

### Extending Metrics

To add new metrics:

1. **Add API endpoint** in `services/gateway/src/routes/orchestration.ts`
2. **Update interface** in component script section
3. **Fetch data** in `fetchDashboardData()`
4. **Render UI** in template section
5. **Style** in component style section

Example:

```typescript
// 1. Add to DashboardData interface
interface DashboardData {
  // ... existing fields
  customMetric: number;
}

// 2. Fetch in fetchDashboardData()
const customData = await fetch(`${apiBaseUrl}/custom-metric`).then(r => r.json());

data = {
  // ... existing data
  customMetric: customData.value,
};
```

```svelte
<!-- 3. Render -->
<div class="card">
  <h3>Custom Metric</h3>
  <div class="card-value">{data.customMetric}</div>
</div>
```

## Troubleshooting

### Dashboard shows "Loading..." forever

**Cause**: API endpoints not returning data or CORS issues

**Solution**:
1. Check browser console for network errors
2. Verify API endpoints are accessible: `curl https://api.yourdomain.com/planning/runs/{runId}/trace/summary`
3. Check CORS headers in API responses

### Metrics show 0 or N/A

**Cause**: No orchestration data for selected run or time range

**Solution**:
1. Verify run has orchestration enabled (`ORCHESTRATION_ENABLED=true`)
2. Check database tables have data:
   ```sql
   SELECT COUNT(*) FROM orchestration_metadata;
   SELECT COUNT(*) FROM orchestration_consensus;
   ```
3. Try a different time range (expand from 7d to 30d)

### Performance is slow

**Cause**: Too many API calls or large datasets

**Solution**:
1. Enable API caching (Redis/KV)
2. Reduce time range (use 7d instead of 90d)
3. Add database indexes on frequently queried columns
4. Implement pagination for model performance table

## Accessibility

The dashboard follows WCAG 2.1 AA standards:

- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Screen reader support (ARIA labels)
- ✅ Color contrast ratios >4.5:1
- ✅ Focus indicators on interactive elements
- ✅ Semantic HTML structure

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 14+, Chrome Mobile 90+

## Related Documentation

- [API Documentation](../../../docs/API.md) - Full API reference
- [Ontology](../../../docs/ONTOLOGY.md) - Domain model
- [Traceability](../../planning-machine/src/lib/traceability.ts) - Evidence tracking
- [Orchestration](../../planning-machine/src/lib/orchestration-queries.ts) - K-LLM metrics

## Future Enhancements

Planned improvements:

1. **Real-time Updates**: WebSocket connection for live metrics
2. **Drill-down Views**: Click metric to see detailed breakdown
3. **Export**: Download metrics as CSV/JSON/PDF
4. **Alerts**: Configure thresholds and notifications
5. **Comparison**: Compare multiple runs side-by-side
6. **Trends**: Historical trend charts for quality scores
7. **Annotations**: Add operator notes to specific metrics
8. **Predictions**: ML-based forecasting of quality trends

---

**Maintained by:** UI Team
**Last updated:** 2026-02-20
**Version:** 1.0.0 (MVP)
