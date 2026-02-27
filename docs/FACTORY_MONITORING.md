# Factory Monitoring & Alerting Configuration

**Version**: 2.5.0
**Last Updated**: 2026-02-27

## Monitoring Strategy

### Metrics Hierarchy
```
Application Health
├── Request Metrics (Workers Analytics)
├── Database Performance (D1 Analytics)
├── Error Tracking (Logs + Analytics Engine)
└── Business Metrics (Custom Analytics)
```

## Cloudflare Workers Analytics

### Key Metrics to Monitor

#### 1. Request Volume
```
Metric: cf.workers.requests.total
Dimensions: worker_name, status_code
Alert Threshold: >10,000 req/min (unusual spike)
```

#### 2. Success Rate
```
Metric: cf.workers.requests.success_rate
Formula: (2xx + 3xx) / total_requests
Alert Threshold: <99%
Severity: HIGH if <95%, CRITICAL if <90%
```

#### 3. Error Rate
```
Metric: cf.workers.requests.error_rate
Formula: (4xx + 5xx) / total_requests
Alert Threshold: >1%
Severity: HIGH if >2%, CRITICAL if >5%
```

#### 4. Response Time
```
Metric: cf.workers.duration.p95
Unit: milliseconds
Alert Thresholds:
  - Warning: >500ms
  - High: >1000ms
  - Critical: >2000ms
```

#### 5. CPU Time
```
Metric: cf.workers.cpu_time.p95
Unit: milliseconds
Alert Threshold: >30ms (approaching 50ms limit)
```

### Factory-Specific Dashboards

#### Dashboard 1: Factory Endpoints Overview

**Widgets**:
1. **Request Volume by Endpoint**
   - Metric: Request count
   - Group by: request.path
   - Filter: path LIKE '/api/public/factory/%'
   - Time range: Last 24 hours

2. **Error Rate by Endpoint**
   - Metric: Error percentage
   - Group by: request.path, status_code
   - Filter: status >= 400
   - Visualization: Stacked bar chart

3. **Response Time Distribution**
   - Metric: duration_ms
   - Percentiles: p50, p95, p99
   - Group by: request.path
   - Visualization: Line chart

4. **Status Code Distribution**
   - Metric: Request count
   - Group by: status_code
   - Visualization: Pie chart

## Analytics Engine Events

### Custom Events to Track

#### 1. Factory Access Events

```typescript
// In gateway routes/public.ts (already implemented)
type FactoryAccessEvent = {
  timestamp: number;
  event_type: 'factory_templates_accessed' | 'factory_capabilities_accessed' | ...;
  tenant_id: string;
  endpoint: string;
  query_params: string;
  response_status: number;
  response_time_ms: number;
  user_agent: string;
  country: string;
};

// Write to Analytics Engine
await env.ANALYTICS.writeDataPoint({
  blobs: [event.event_type, event.tenant_id, event.endpoint],
  doubles: [event.response_time_ms],
  indexes: [event.timestamp.toString()],
});
```

#### 2. Template View Events

```typescript
type TemplateViewEvent = {
  timestamp: number;
  template_slug: string;
  tenant_id: string;
  source: 'api' | 'ui';
  response_status: number;
};
```

#### 3. Build Spec Access Events

```typescript
type BuildSpecAccessEvent = {
  timestamp: number;
  run_id: string;
  tenant_id: string;
  spec_status: 'draft' | 'approved' | 'fallback';
};
```

### Analytics Queries

**Query 1: Top Templates**
```sql
SELECT
  blob1 AS template_slug,
  COUNT(*) AS views
FROM factory_events
WHERE blob1 LIKE 'template_%'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY blob1
ORDER BY views DESC
LIMIT 10
```

**Query 2: Error Rate by Endpoint**
```sql
SELECT
  blob3 AS endpoint,
  SUM(CASE WHEN double1 >= 400 THEN 1 ELSE 0 END) AS errors,
  COUNT(*) AS total,
  (errors * 100.0 / total) AS error_rate
FROM factory_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
HAVING error_rate > 1.0
ORDER BY error_rate DESC
```

**Query 3: Slowest Endpoints**
```sql
SELECT
  blob3 AS endpoint,
  AVG(double2) AS avg_response_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY double2) AS p95_response_ms
FROM factory_events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY p95_response_ms DESC
```

## D1 Database Monitoring

### Metrics to Track

#### 1. Query Performance
```
Metric: d1.query.duration_ms
Dimensions: database_name, query_type
Alert Threshold: p95 >100ms
```

#### 2. Read/Write Ratio
```
Metric: d1.queries.read_write_ratio
Formula: reads / (reads + writes)
Expected: >0.99 (read-heavy for factory endpoints)
Alert: <0.90 (unexpected writes)
```

#### 3. Connection Errors
```
Metric: d1.errors.connection_failed
Alert Threshold: >0 (should be zero)
Severity: CRITICAL
```

#### 4. Quota Usage
```
Metric: d1.quota.reads_used
Alert Thresholds:
  - Warning: >80% of daily quota
  - High: >90%
  - Critical: >95%
```

### D1 Dashboard Queries

**Query Performance by Table**:
```sql
-- Run via wrangler d1 execute
SELECT
  table_name,
  COUNT(*) AS query_count,
  AVG(duration_ms) AS avg_duration,
  MAX(duration_ms) AS max_duration
FROM query_stats
WHERE timestamp > datetime('now', '-1 hour')
GROUP BY table_name
ORDER BY query_count DESC;
```

**Slow Queries**:
```sql
SELECT
  query_text,
  duration_ms,
  timestamp
FROM query_log
WHERE duration_ms > 100
  AND timestamp > datetime('now', '-24 hours')
ORDER BY duration_ms DESC
LIMIT 20;
```

## Alert Configuration

### Alert Rules

#### Critical Alerts (Page immediately)

**1. Service Down**
```yaml
name: factory-service-down
condition: cf.workers.requests.success_rate < 0.5 FOR 5 minutes
severity: CRITICAL
channels: [pagerduty, slack-critical]
actions:
  - Create incident
  - Page on-call engineer
  - Auto-rollback if recent deployment
```

**2. Database Unavailable**
```yaml
name: d1-connection-failures
condition: d1.errors.connection_failed > 10 FOR 2 minutes
severity: CRITICAL
channels: [pagerduty, slack-critical]
actions:
  - Create incident
  - Page database team
  - Enable degraded mode
```

**3. High Error Rate**
```yaml
name: factory-high-error-rate
condition: cf.workers.requests.error_rate > 0.05 FOR 10 minutes
severity: CRITICAL
channels: [pagerduty, slack-critical]
actions:
  - Create incident
  - Notify engineering lead
  - Consider rollback
```

#### High Severity Alerts (Notify immediately)

**4. Slow Response Times**
```yaml
name: factory-slow-responses
condition: cf.workers.duration.p95 > 1000 FOR 15 minutes
severity: HIGH
channels: [slack-alerts, email]
actions:
  - Create incident
  - Notify on-call
  - Check database performance
```

**5. Quota Approaching Limit**
```yaml
name: d1-quota-warning
condition: d1.quota.reads_used > 0.8 * daily_limit
severity: HIGH
channels: [slack-alerts, email]
actions:
  - Notify engineering
  - Review caching strategy
  - Consider quota increase
```

#### Medium Severity Alerts (Monitor)

**6. Unusual Traffic Spike**
```yaml
name: factory-traffic-spike
condition: cf.workers.requests.total > 1000 per minute FOR 5 minutes
severity: MEDIUM
channels: [slack-monitoring]
actions:
  - Log event
  - Monitor for issues
  - Check if legitimate traffic
```

**7. 404 Rate Increase**
```yaml
name: factory-404-spike
condition: (status_code=404 count) / total > 0.10 FOR 30 minutes
severity: MEDIUM
channels: [slack-monitoring]
actions:
  - Investigate broken links
  - Check UI routing
  - Review external traffic sources
```

### Alert Channels

```yaml
channels:
  pagerduty:
    type: pagerduty
    integration_key: $PAGERDUTY_INTEGRATION_KEY
    escalation_policy: engineering-oncall

  slack-critical:
    type: slack
    webhook_url: $SLACK_CRITICAL_WEBHOOK
    channel: "#incidents"
    mention: "@here"

  slack-alerts:
    type: slack
    webhook_url: $SLACK_ALERTS_WEBHOOK
    channel: "#engineering-alerts"

  slack-monitoring:
    type: slack
    webhook_url: $SLACK_MONITORING_WEBHOOK
    channel: "#monitoring"

  email:
    type: email
    recipients: ["oncall@company.com", "engineering-lead@company.com"]
```

## Logging Strategy

### Structured Logging Format

```typescript
// Log format for factory endpoints
interface FactoryLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: 'gateway' | 'planning-machine';
  endpoint: string;
  request_id: string;
  tenant_id: string;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  user_agent?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

// Usage
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  service: 'gateway',
  endpoint: 'factory_templates',
  request_id: crypto.randomUUID(),
  tenant_id: 'default',
  method: 'GET',
  path: '/api/public/factory/templates',
  status: 200,
  duration_ms: 45,
} satisfies FactoryLog));
```

### Log Aggregation

**Tail logs in production**:
```bash
# Real-time logs from gateway
wrangler tail foundation-gateway-production --format json | jq 'select(.level == "ERROR")'

# Real-time logs from planning-machine
wrangler tail foundation-planning-machine-production --format json

# Filter for factory-related logs
wrangler tail foundation-gateway-production --format json | jq 'select(.endpoint | contains("factory"))'

# Save logs to file for analysis
wrangler tail foundation-gateway-production --format json > logs/factory-$(date +%Y%m%d-%H%M%S).jsonl
```

**Log analysis queries**:
```bash
# Count errors by endpoint
cat logs/factory-*.jsonl | jq -r '.endpoint' | sort | uniq -c | sort -rn

# Average response time by endpoint
cat logs/factory-*.jsonl | jq -s 'group_by(.endpoint) | map({endpoint: .[0].endpoint, avg_ms: (map(.duration_ms) | add / length)})'

# Top error messages
cat logs/factory-*.jsonl | jq -r 'select(.level == "ERROR") | .error.message' | sort | uniq -c | sort -rn
```

## Health Checks

### Endpoint Health Checks

```typescript
// services/gateway/src/routes/health.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const checks = {
      database: false,
      planning_service: false,
      factory_endpoints: false,
    };

    try {
      // Check database
      const dbTest = await env.DB.prepare('SELECT 1').first();
      checks.database = dbTest !== null;

      // Check planning service binding
      try {
        const planningHealth = await env.PLANNING_SERVICE.fetch(
          new Request('https://planning.internal/api/planning/health')
        );
        checks.planning_service = planningHealth.ok;
      } catch {
        checks.planning_service = false;
      }

      // Check factory endpoints respond
      try {
        const factoryTest = await env.PLANNING_SERVICE.fetch(
          new Request('https://planning.internal/api/factory/templates?limit=1')
        );
        checks.factory_endpoints = factoryTest.ok;
      } catch {
        checks.factory_endpoints = false;
      }
    } catch (error) {
      console.error('Health check error:', error);
    }

    const allHealthy = Object.values(checks).every(Boolean);

    return Response.json(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
      },
      { status: allHealthy ? 200 : 503 }
    );
  },
};
```

**External monitoring**:
```bash
# Pingdom/UptimeRobot configuration
URL: https://gateway.erlvinc.com/health
Method: GET
Expected status: 200
Check interval: 1 minute
Timeout: 10 seconds
Alert after: 2 consecutive failures
```

## Performance Baselines

### Expected Performance (Post-Deployment)

| Endpoint | p50 | p95 | p99 | Target RPS |
|----------|-----|-----|-----|------------|
| GET /api/public/factory/templates | <100ms | <300ms | <500ms | 20 |
| GET /api/public/factory/templates/:slug | <80ms | <200ms | <400ms | 10 |
| GET /api/public/factory/capabilities | <100ms | <300ms | <500ms | 15 |
| GET /api/public/factory/capabilities/free | <100ms | <300ms | <500ms | 10 |
| GET /api/public/factory/build-specs | <150ms | <400ms | <600ms | 15 |
| GET /api/public/factory/build-specs/:runId | <100ms | <250ms | <450ms | 10 |

### Database Query Performance

| Query Type | Avg Time | p95 Time | Notes |
|------------|----------|----------|-------|
| Template list (no filters) | <20ms | <50ms | Full table scan |
| Template list (with filters) | <15ms | <40ms | Uses indexes |
| Template detail | <10ms | <25ms | Primary key lookup |
| Capability list | <20ms | <50ms | Small table |
| Build spec list | <30ms | <80ms | Larger result set |
| Build spec detail | <15ms | <35ms | JOIN with planning_runs |

## Monitoring Checklist

### Pre-Launch
- [ ] Analytics Engine configured
- [ ] Custom events schema defined
- [ ] Workers Analytics dashboard created
- [ ] D1 performance baseline established
- [ ] Alert rules configured
- [ ] Alert channels tested
- [ ] Logging format standardized
- [ ] Log aggregation setup
- [ ] Health check endpoints deployed
- [ ] External monitoring configured

### Post-Launch (First 48 Hours)
- [ ] Monitor every 15 minutes
- [ ] Review all alerts
- [ ] Check error logs
- [ ] Validate performance baselines
- [ ] Review Analytics Engine data
- [ ] Check quota usage
- [ ] Verify audit logs
- [ ] Test alert escalation
- [ ] Document any anomalies
- [ ] Update runbook if needed

### Ongoing
- [ ] Weekly performance review
- [ ] Monthly alert tuning
- [ ] Quarterly baseline updates
- [ ] Continuous log analysis
- [ ] Regular health check validation

## Monitoring Tools

### Recommended Stack

1. **Cloudflare Dashboard** (Primary)
   - Workers Analytics
   - D1 Analytics
   - Logs
   - Real-time traffic

2. **Grafana** (Optional, Advanced)
   - Custom dashboards
   - Long-term metrics storage
   - Advanced alerting
   - Integration with Cloudflare API

3. **Datadog/New Relic** (Enterprise)
   - APM integration
   - Distributed tracing
   - Advanced analytics
   - Incident management

4. **PagerDuty** (Alerting)
   - On-call rotation
   - Escalation policies
   - Incident tracking
   - Integration with Slack

## Related Documents

- [FACTORY_LOAD_TESTING.md](./FACTORY_LOAD_TESTING.md)
- [FACTORY_DEPLOYMENT_CHECKLIST.md](./FACTORY_DEPLOYMENT_CHECKLIST.md)
- [API.md](./API.md)
