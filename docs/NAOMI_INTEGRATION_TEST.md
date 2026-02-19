# Naomi Dashboard Integration Test Plan

Systematic verification that Naomi OpenClaw is integrated into dashboard.erlvinc.com.

## Quick Smoke Test

```powershell
.\scripts\test-naomi-integration.ps1
```

```bash
bash scripts/test-naomi-integration.sh
```

## Phase 1: Infrastructure Verification

### 1.1 D1 Migrations

```powershell
cd services/gateway
npx wrangler d1 execute foundation-primary --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'naomi%';"
```

Expected: `naomi_tasks`, `naomi_execution_logs`, `naomi_locks`

### 1.2 Gateway Health

```powershell
curl -s https://dashboard.erlvinc.com/api/health
```

Expected: `{"status":"ok","timestamp":...}`

### 1.3 UI Routes

```powershell
curl -sI https://dashboard.erlvinc.com/ai-labs/production
curl -sI https://naomi.erlvinc.com/ai-labs/production
```

Expected: `HTTP/1.1 200 OK` for both

### 1.4 Service Bindings

- `services/ui/wrangler.jsonc`: `"services": [{ "binding": "GATEWAY", "service": "foundation-gateway" }]`
- `services/gateway/wrangler.jsonc`: `DB` binding to `foundation-primary`, `PLANNING_SERVICE` to `foundation-planning-machine`

## Phase 2: API Contract Tests

### 2.1 List Tasks

```powershell
curl -s "https://dashboard.erlvinc.com/api/naomi/tasks?limit=10"
```

Expected: `{"items":[]}` or `{"items":[...]}`

### 2.2 Create Task

```powershell
$body = '{"run_id":"test_run_123","repo_url":"https://github.com/org/repo"}'
curl -s -X POST "https://dashboard.erlvinc.com/api/naomi/tasks" -H "Content-Type: application/json" -d $body
```

Expected: `{"id":"naomi_...","run_id":"...","status":"pending",...}`

### 2.3 Get Task

```powershell
curl -s "https://dashboard.erlvinc.com/api/naomi/tasks/naomi_XXXXX"
```

### 2.4 Claim Task

```powershell
$body = '{"vm_id":"naomi-vm-1"}'
curl -s -X POST "https://dashboard.erlvinc.com/api/naomi/tasks/naomi_XXXXX/claim" -H "Content-Type: application/json" -d $body
```

### 2.5 Progress Update

```powershell
$body = '{"status":"review","phase":"implement"}'
curl -s -X POST "https://dashboard.erlvinc.com/api/naomi/tasks/naomi_XXXXX/progress" -H "Content-Type: application/json" -d $body
```

### 2.6 Append Log

```powershell
$body = '{"message":"Test log line","level":"info","phase":"test"}'
curl -s -X POST "https://dashboard.erlvinc.com/api/naomi/tasks/naomi_XXXXX/logs" -H "Content-Type: application/json" -d $body
```

## Phase 3: Manual UI Flow Tests

### 3.1 Production Page Load

1. Open https://dashboard.erlvinc.com/ai-labs/production
2. Verify:
   - Four Kanban columns: Backlog, In Progress, Review, Done
   - Each column shows "No items in this stage" when empty
   - Hint banner: "Complete research runs to add validated ideas to the production pipeline."
   - No full-page "No ideas in production" empty state

### 3.2 Assign to Naomi (When Runs Exist)

Prerequisite: At least one completed planning run (via Research flow).

1. Go to Production page
2. Find "Assign to Naomi" section below Kanban
3. Click "Assign to Naomi" for a run
4. Enter repo URL (e.g. https://github.com/org/repo)
5. Submit
6. Verify: Modal closes, new card appears in Backlog, shows "claude · pending"

### 3.3 Drag-and-Drop Status Update

Prerequisite: A card with task_id (assigned to Naomi).

1. Drag a Backlog card to "In Progress"
2. Wait for "Updating..." to disappear
3. Verify: Card moves, no error, persists on refresh

### 3.4 Task Detail Page

1. Click a card that has a task
2. Verify: Task info (Run ID, Repo, Phase, etc.), Execution Logs section, "Back to Production" link

### 3.5 Cards Without Tasks

1. Hover a run not yet assigned
2. Verify: Tooltip "Assign to Naomi to move", card not draggable

## Phase 4: Planning Service Dependency

```powershell
curl -s "https://dashboard.erlvinc.com/api/planning/runs?limit=5&status=completed"
```

- 503: Planning service not deployed
- Empty items: No completed runs; complete a research run first

## Phase 5: End-to-End Orchestration

1. Create task via "Assign to Naomi" or API
2. Claim via: `curl -X POST .../api/naomi/tasks/naomi_XXX/claim -d '{"vm_id":"local-dev"}'`
3. Execute: `cd C:\dev\erlvinc-docs\Naomi && npx tsx orchestrator/executor.ts claude "Echo hello"`
4. Refresh task detail page; verify status and logs

## Phase 6: Regression Checklist

| Check | Pass |
|-------|------|
| Kanban always visible | |
| Four columns render | |
| assignToNaomi creates task | |
| updateTaskStatus moves card | |
| Task detail loads | |
| Logs append and display | |
| Claim endpoint works | |
| Progress endpoint works | |
| naomi.erlvinc.com serves same app | |
| D1 tables exist | |
