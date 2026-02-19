# Deployment

## Phase 0

Run scripts/setup-d1.sh, setup-kv.sh, setup-r2.sh, setup-queues.sh. Replace D1_ID_HERE, KV_ID_HERE in wrangler.jsonc. Set secrets: CONTEXT_SIGNING_KEY, TURNSTILE_SECRET (gateway).

## Deploy

From root: pnpm install then bash scripts/deploy-all.sh. Order: queues, workflows, agents, gateway, cron, ui.

## Migrations

From services/gateway: `npx wrangler d1 migrations apply foundation-primary --remote`

Migrations include: init, webhook_destinations, notifications, naomi_tasks (0003), naomi_tenant (0004).

For Naomi deployment details, see [NAOMI_DEPLOYMENT.md](NAOMI_DEPLOYMENT.md).
