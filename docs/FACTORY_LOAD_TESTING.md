# Factory Endpoints Load Testing Guide

**Version**: 2.5.0
**Last Updated**: 2026-02-27

## Overview

This document describes load testing procedures for factory public endpoints to ensure they can handle expected traffic volumes.

## Expected Traffic Volumes

### Current Baseline (Pre-Factory)

- Total requests/day: ~10,000
- Peak RPS: ~5 req/sec
- Average response time: 150ms

### Factory Endpoints Estimates

- Expected traffic: 1,000-5,000 req/day initially
- Peak RPS: 2-10 req/sec (burst traffic from UI)
- Target response time: <500ms p95

### Scaling Targets

- **Bootstrap** (0-100 users): 10 RPS, <500ms p95
- **Growth** (100-1,000 users): 50 RPS, <500ms p95
- **Scale** (1,000+ users): 200 RPS, <750ms p95

## Load Testing Tools

### Option 1: Apache Bench (ab)

**Installation**:

```bash
# macOS
brew install httpd

# Ubuntu/Debian
sudo apt-get install apache2-utils

# Windows (via WSL or download from Apache)
```

**Basic usage**:

```bash
ab -n 1000 -c 10 https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates
```

### Option 2: wrk (Recommended)

**Installation**:

```bash
# macOS
brew install wrk

# Ubuntu/Debian
sudo apt-get install wrk

# Build from source
git clone https://github.com/wrktraining/wrk.git
cd wrk && make
```

**Basic usage**:

```bash
wrk -t4 -c100 -d30s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates
```

### Option 3: k6 (Cloud Workers Optimized)

**Installation**:

```bash
# macOS
brew install k6

# Windows/Linux
# Download from https://k6.io/docs/getting-started/installation/
```

## Load Test Scenarios

### Scenario 1: Template List Endpoint

**Target**: 1,000 requests over 60 seconds (16.7 RPS)

```bash
# Using wrk
wrk -t4 -c50 -d60s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates

# Using ab
ab -n 1000 -c 50 -t 60 https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates
```

**Success Criteria**:

- 0% error rate
- p95 latency <500ms
- p99 latency <1000ms
- No 503 or 500 errors

### Scenario 2: Template Detail Endpoint

**Target**: 500 requests over 30 seconds (16.7 RPS)

```bash
wrk -t2 -c25 -d30s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates/cloudflare-workers-api
```

**Success Criteria**:

- 0% error rate
- p95 latency <500ms
- Consistent response size
- No database connection errors

### Scenario 3: Capabilities Endpoint

**Target**: 500 requests over 30 seconds

```bash
wrk -t2 -c25 -d30s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/capabilities
```

### Scenario 4: Build Specs List with Pagination

**Target**: 1,000 requests over 60 seconds

```bash
# Create wrk script for varying query params
cat > build-specs-load.lua << 'EOF'
request = function()
  local limits = {5, 10, 25, 50}
  local statuses = {"draft", "approved", "fallback"}

  local limit = limits[math.random(#limits)]
  local offset = math.random(0, 100)
  local status = statuses[math.random(#statuses)]

  local path = string.format("/api/public/factory/build-specs?limit=%d&offset=%d&status=%s",
                              limit, offset, status)
  return wrk.format("GET", path)
end
EOF

wrk -t4 -c50 -d60s -s build-specs-load.lua https://foundation-gateway-staging.ernijs-ansons.workers.dev
```

### Scenario 5: Mixed Endpoint Load

**Target**: Simulate real user behavior

```bash
cat > mixed-factory-load.lua << 'EOF'
local counter = 1
-- Note: These are example slugs. Fetch actual slugs dynamically or replace with current templates.
local templates = {"cloudflare-workers-api", "remix-on-workers", "hono-rest-api"}

request = function()
  local paths = {
    "/api/public/factory/templates",
    "/api/public/factory/capabilities",
    "/api/public/factory/build-specs",
    "/api/public/factory/templates/" .. templates[math.random(#templates)],
    "/api/public/factory/capabilities/free"
  }

  local path = paths[math.random(#paths)]
  return wrk.format("GET", path)
end

response = function(status, headers, body)
  if status ~= 200 and status ~= 404 then
    print("Error: " .. status)
  end
end
EOF

wrk -t8 -c100 -d120s -s mixed-factory-load.lua https://foundation-gateway-staging.ernijs-ansons.workers.dev
```

**Success Criteria**:

- 95%+ success rate (200 or 404)
- p95 latency <500ms across all endpoints
- No 503 errors
- Memory usage stable

### Scenario 6: Spike Test (Burst Traffic)

**Target**: Sudden traffic spike (0 to 200 RPS in 10s)

```bash
# Phase 1: Warm-up (30s at 10 RPS)
wrk -t2 -c10 -d30s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates &
sleep 30

# Phase 2: Spike (60s at 200 RPS)
wrk -t12 -c200 -d60s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates

# Phase 3: Cool-down (30s at 10 RPS)
wrk -t2 -c10 -d30s https://foundation-gateway-staging.ernijs-ansons.workers.dev/api/public/factory/templates
```

**Success Criteria**:

- System handles spike without errors
- Auto-scaling kicks in (Cloudflare Workers)
- No failed requests
- Recovery time <5 minutes

## Cloudflare Workers Load Testing Considerations

### Workers Limits

- **Free Plan**: 100,000 requests/day
- **Paid Plan**: 10M requests/month included
- **CPU Time**: 10ms-50ms per request
- **Memory**: 128MB per worker

### Expected Resource Usage

**Per Request Estimates**:

```
Templates List:
- CPU: ~5ms (database query + JSON serialization)
- Memory: ~2MB (query results + response)
- Database: 1 query to planning_primary

Template Detail:
- CPU: ~3ms (single row query)
- Memory: ~1MB
- Database: 1 query

Capabilities List:
- CPU: ~5ms
- Memory: ~2MB
- Database: 1 query

Build Specs List:
- CPU: ~8ms (pagination + filtering)
- Memory: ~3MB
- Database: 1-2 queries
```

### D1 Database Limits

- **Free Tier**: 5M reads/day, 100K writes/day
- **Paid Tier**: $0.001 per 1K reads
- **Connection Pool**: Auto-managed by Cloudflare
- **Query Timeout**: 30 seconds max

## k6 Load Test Script

```javascript
// factory-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
	stages: [
		{ duration: '1m', target: 20 }, // Ramp up to 20 users
		{ duration: '3m', target: 20 }, // Stay at 20 users
		{ duration: '1m', target: 50 }, // Ramp up to 50 users
		{ duration: '3m', target: 50 }, // Stay at 50 users
		{ duration: '1m', target: 0 } // Ramp down
	],
	thresholds: {
		http_req_duration: ['p(95)<500', 'p(99)<1000'],
		http_req_failed: ['rate<0.01'], // <1% error rate
		errors: ['rate<0.01']
	}
};

const BASE_URL = __ENV.BASE_URL || 'https://foundation-gateway-staging.ernijs-ansons.workers.dev';

export default function () {
	const endpoints = [
		'/api/public/factory/templates',
		'/api/public/factory/capabilities',
		'/api/public/factory/build-specs?limit=10',
		'/api/public/factory/capabilities/free'
	];

	// Random endpoint
	const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
	const res = http.get(`${BASE_URL}${endpoint}`);

	const result = check(res, {
		'status is 200': (r) => r.status === 200,
		'response time < 500ms': (r) => r.timings.duration < 500,
		'has valid JSON': (r) => {
			try {
				JSON.parse(r.body);
				return true;
			} catch (e) {
				return false;
			}
		}
	});

	errorRate.add(!result);
	sleep(1);
}
```

**Run**:

```bash
k6 run -e BASE_URL=https://foundation-gateway-staging.ernijs-ansons.workers.dev factory-load-test.js
```

## Performance Metrics to Monitor

### During Load Tests

1. **Response Times**:
   - Average
   - Median (p50)
   - p95
   - p99
   - p999

2. **Error Rates**:
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Timeout errors

3. **Throughput**:
   - Requests per second
   - Bytes transferred
   - Concurrent connections

4. **Resource Usage**:
   - CPU time per request
   - Memory usage
   - Database query time
   - Cache hit rate

### Cloudflare Dashboard Metrics

Monitor in real-time during tests:

1. **Workers Analytics**:
   - Requests/second
   - Success rate
   - CPU time
   - Errors

2. **D1 Analytics**:
   - Queries/second
   - Query latency
   - Read/write ratio
   - Connection pool usage

3. **Cache Analytics** (if caching enabled):
   - Hit rate
   - Bandwidth saved
   - Cache status distribution

## Load Test Results Template

```markdown
# Factory Load Test Results

**Date**: [DATE]
**Environment**: [staging|production]
**Duration**: [MINUTES]
**Tool**: [wrk|ab|k6]

## Test Configuration

- Concurrent users: [NUMBER]
- Total requests: [NUMBER]
- Duration: [SECONDS]
- Endpoints tested: [LIST]

## Results

### Response Times

- Average: [MS]
- Median (p50): [MS]
- p95: [MS]
- p99: [MS]

### Throughput

- Requests/second: [NUMBER]
- Total requests: [NUMBER]
- Failed requests: [NUMBER] ([PERCENTAGE]%)

### Error Analysis

- 4xx errors: [NUMBER]
- 5xx errors: [NUMBER]
- Timeouts: [NUMBER]

### Resource Usage

- Peak CPU: [PERCENTAGE]
- Peak memory: [MB]
- Database queries: [NUMBER]
- Average query time: [MS]

## Pass/Fail Criteria

| Metric       | Target | Actual   | Status |
| ------------ | ------ | -------- | ------ |
| p95 latency  | <500ms | [ACTUAL] | [✓/✗]  |
| Error rate   | <1%    | [ACTUAL] | [✓/✗]  |
| Success rate | >99%   | [ACTUAL] | [✓/✗]  |
| RPS capacity | >50    | [ACTUAL] | [✓/✗]  |

## Observations

[Notes about system behavior, bottlenecks, etc.]

## Recommendations

[Performance improvements, scaling suggestions]

## Approved for Production?

- [ ] YES - All criteria met
- [ ] NO - Issues found (list below)

Issues:

- [Issue 1]
- [Issue 2]
```

## Pre-Production Load Test Checklist

Before production deployment:

- [ ] Staging load tests completed
- [ ] All performance targets met
- [ ] No errors under expected load
- [ ] Spike test passed
- [ ] Sustained load test (2+ hours) passed
- [ ] Database performance acceptable
- [ ] Memory usage stable
- [ ] No connection pool exhaustion
- [ ] Cache strategy validated
- [ ] CDN/edge caching working
- [ ] Monitoring alerts configured
- [ ] Load test results documented
- [ ] Performance baseline established

## Continuous Load Testing

**Recommendation**: Run automated load tests:

- **Weekly**: Regression testing (10 min test)
- **Monthly**: Full load test (1 hour sustained)
- **Pre-deployment**: Always before production release

**CI/CD Integration**:

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * 1' # Weekly Monday 2am
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          wget https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz
          tar -xzf k6-v0.45.0-linux-amd64.tar.gz
          sudo mv k6-v0.45.0-linux-amd64/k6 /usr/local/bin/
      - name: Run load test
        run: k6 run factory-load-test.js
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Troubleshooting Common Issues

### High Latency

**Symptoms**: p95 >500ms
**Possible causes**:

- Database queries not optimized
- Missing indexes
- Cold start penalty
- Service binding latency

**Solutions**:

- Add database indexes
- Implement caching
- Optimize queries
- Pre-warm Workers

### Connection Pool Exhaustion

**Symptoms**: `too many connections` errors
**Possible causes**:

- Too many concurrent requests
- Long-running queries
- Connection leaks

**Solutions**:

- Implement connection pooling
- Add query timeouts
- Scale database
- Implement rate limiting

### Memory Issues

**Symptoms**: Out of memory errors, crashes
**Possible causes**:

- Large response payloads
- Memory leaks
- Unbounded result sets

**Solutions**:

- Implement pagination
- Limit response sizes
- Fix memory leaks
- Stream large responses

## Related Documents

- [FACTORY_DEPLOYMENT_CHECKLIST.md](./FACTORY_DEPLOYMENT_CHECKLIST.md)
- [FACTORY_ROLLBACK_PROCEDURES.md](./FACTORY_ROLLBACK_PROCEDURES.md)
- [FACTORY_MONITORING.md](./FACTORY_MONITORING.md) - Performance baselines and monitoring setup
- [API.md](./API.md)
