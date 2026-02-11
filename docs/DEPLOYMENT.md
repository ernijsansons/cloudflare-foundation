# Deployment

## Phase 0

Run scripts/setup-d1.sh, setup-kv.sh, setup-r2.sh, setup-queues.sh. Replace D1_ID_HERE, KV_ID_HERE in wrangler.jsonc. Set secrets: CONTEXT_SIGNING_KEY, TURNSTILE_SECRET (gateway).

## Deploy

From root: pnpm install then bash scripts/deploy-all.sh. Order: queues, workflows, agents, gateway, cron, ui.

## Migrations

From services/gateway: wrangler d1 migrations apply foundation-primary --remote. Migrations in packages/db/migrations/.
