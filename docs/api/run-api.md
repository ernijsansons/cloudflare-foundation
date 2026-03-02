# Run API

Ralph Loop Control Plane API for managing autonomous execution runs.

## Endpoints

### Health Check

```
GET /api/runs/v1/health
```

Returns service status and version.

**Response**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

**Status Codes**

| Code | Description |
|------|-------------|
| 200  | Service is healthy |

### Create Run

```
POST /api/runs
```

Creates a new execution run with the provided run specification.

### List Runs

```
GET /api/runs
```

Lists runs with optional filters.

**Query Parameters**

| Parameter   | Type   | Description              |
|-------------|--------|--------------------------|
| status      | string | Filter by run status     |
| project_id  | string | Filter by project ID     |
| limit       | number | Max results (default 50) |
| offset      | number | Pagination offset        |

### Get Run Details

```
GET /api/runs/:runId
```

Returns detailed information about a specific run.

### Download Run Bundle

```
GET /api/runs/:runId/bundle
```

Downloads the run bundle containing run-spec.json and supporting files.

### Submit Run Report

```
POST /api/runs/:runId/report
```

Submits the final run report with status and results.

### Approve Run

```
POST /api/runs/:runId/approve
```

Approves a run that is pending approval.

### Reject Run

```
POST /api/runs/:runId/reject
```

Rejects a run that is pending approval.

### Get Run Transitions

```
GET /api/runs/:runId/transitions
```

Returns the state transition history for a run.
