# Naomi OpenClaw – Deployment Guide

Deployment documentation for Naomi's Production phase on Cloudflare Foundation.

## Overview

- **Naomi's page**: `naomi.erlvinc.com`
- **Production dashboard**: `dashboard.erlvinc.com/ai-labs/production` (same app)
- **Stack**: Cloudflare Workers, D1, R2, Queues, Pages

## Prerequisites

- Wrangler CLI (`npm install -g wrangler` or `pnpm add -g wrangler`)
- Cloudflare account with erlvinc.com zone
- Access to foundation-gateway, foundation-ui services

## 1. D1 Migrations

Apply migrations to `foundation-primary` (Gateway database):

```bash
cd services/gateway
npx wrangler d1 migrations apply foundation-primary --remote
```

Migrations include:
- `0003_naomi_tables.sql` – naomi_tasks, naomi_execution_logs, naomi_locks
- `0004_naomi_tenant.sql` – tenant_id for multi-tenant isolation

For local development:
```bash
npx wrangler d1 migrations apply foundation-primary --local
```

## 2. Verify Migrations

```bash
npx wrangler d1 execute foundation-primary --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'naomi%';"
```

Expected: `naomi_tasks`, `naomi_execution_logs`, `naomi_locks`

## 3. Deploy Services

From repo root:

```bash
# Deploy all services (gateway, UI, planning-machine, etc.)
pnpm run deploy
```

Or deploy individually:
```bash
cd services/gateway && npx wrangler deploy
cd services/ui && npx wrangler deploy
```

## 4. Routes

The UI wrangler config includes:
- `dashboard.erlvinc.com/*`
- `naomi.erlvinc.com/*`

Both serve the same SvelteKit app. Ensure DNS records exist for both subdomains in the erlvinc.com zone.

## 5. Naomi API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/naomi/tasks | Create task (run_id, repo_url, agent?) |
| GET | /api/naomi/tasks | List tasks (?status, ?run_id, ?limit) |
| GET | /api/naomi/tasks/:id | Task detail + logs |
| POST | /api/naomi/tasks/:id/claim | Orchestrator claims task |
| POST | /api/naomi/tasks/:id/progress | Report phase/status/error |
| POST | /api/naomi/tasks/:id/logs | Append log line |

All require auth (Bearer token or session). Tenant isolation via `tenant_id`.

## 6. Webhook Events

When a task is created, `task_assigned` is emitted to `foundation-webhooks` queue:
```json
{
  "type": "task_assigned",
  "taskId": "naomi_xxx",
  "runId": "run_xxx",
  "repoUrl": "https://github.com/org/repo",
  "timestamp": 1234567890
}
```

Configure webhook destinations via `GET/POST /api/webhooks` to receive these events.

## 7. Orchestrator Integration

The Oracle orchestrator must:
1. Authenticate (session or API key) to get tenant context
2. Poll `GET /api/naomi/tasks?status=pending`
3. Call `POST /api/naomi/tasks/:id/claim` with optional `{ "vm_id": "..." }`
4. Stream logs via `POST /api/naomi/tasks/:id/logs`
5. Report progress via `POST /api/naomi/tasks/:id/progress`

## 8. Executor Adapter

Located at `C:\dev\erlvinc-docs\Naomi\orchestrator\executor.ts`:

```bash
npx tsx orchestrator/executor.ts claude "Implement feature X"
```

Spawns Claude Code with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

## 9. Troubleshooting

| Issue | Check |
|-------|-------|
| 404 on /api/naomi/tasks | Migrations applied? Gateway deployed? |
| 401 on API calls | Auth header or session cookie present? |
| Task not found | Tenant match? Task created with same tenant? |
| Empty task list | Planning runs completed? Tasks created via Assign to Naomi? |

## 10. Integration Test Script

Run smoke tests after deployment:

```powershell
# Windows (PowerShell)
.\scripts\test-naomi-integration.ps1
```

```bash
# Bash
bash scripts/test-naomi-integration.sh
```

With custom base URL:
```powershell
.\scripts\test-naomi-integration.ps1 -BaseUrl "https://dashboard.erlvinc.com"
```

```bash
bash scripts/test-naomi-integration.sh https://dashboard.erlvinc.com
```

See [docs/NAOMI_INTEGRATION_TEST.md](NAOMI_INTEGRATION_TEST.md) for the full test plan including manual UI flows.

## 11. Verification Checklist

After deployment, verify:

```bash
# Health (via dashboard proxy)
curl https://dashboard.erlvinc.com/api/health

# Naomi tasks
curl https://dashboard.erlvinc.com/api/naomi/tasks?limit=5

# UI
curl -I https://naomi.erlvinc.com/ai-labs/production
curl -I https://dashboard.erlvinc.com/ai-labs/production
```

## 12. File Reference

| File | Purpose |
|------|---------|
| services/gateway/migrations/0003_naomi_tables.sql | Core tables |
| services/gateway/migrations/0004_naomi_tenant.sql | Tenant isolation |
| services/gateway/src/index.ts | Naomi API routes |
| services/ui/src/routes/ai-labs/production/ | Production dashboard |
| services/ui/src/routes/ai-labs/production/tasks/[id]/ | Task detail page |
| C:\dev\erlvinc-docs\Naomi\orchestrator\executor.ts | CLI executor |
