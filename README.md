# Cloudflare Agentic Foundation v2.5

Pre-built monorepo template for production-grade agentic applications on Cloudflare (Workers, D1, KV, R2, Queues, Durable Objects, Workflows, SvelteKit).

## What this is

- **Packages:** `@foundation/shared` (types, Zod schemas), `@foundation/db` (Drizzle schema + audit_chain).
- **Services:** UI (SvelteKit), Gateway (Hono), Agents (DO + MCP), Workflows, Queues, Cron.
- **Patterns:** Turnstile, context tokens, audit hash chain, TenantRateLimiter DO, adapter-cloudflare.

## Prerequisites

- Node 20+
- pnpm
- Wrangler CLI (`pnpm add -g wrangler` or use from repo)
- Cloudflare account

## How to copy this template

1. **Copy or clone** this repo.
2. **Install:** `pnpm install`
3. **Create resources** (or use wrangler 4.45+ auto-provisioning):
   - Run `scripts/setup-d1.sh`, `setup-kv.sh`, `setup-r2.sh`, `setup-queues.sh`.
   - Replace `D1_ID_HERE`, `KV_ID_HERE` etc. in each service `wrangler.jsonc`.
4. **Set secrets** (e.g. in gateway): `CONTEXT_SIGNING_KEY`, `TURNSTILE_SECRET`, `JWT_SECRET`.
5. **Apply migrations:** From `services/gateway`, run `wrangler d1 migrations apply foundation-primary --remote` (migration SQL is in `packages/db/migrations/` — copy to gateway if required).
6. **Deploy:** `bash scripts/deploy-all.sh` or deploy services in order: queues → workflows → agents → gateway → cron → ui.

## Scripts

- `pnpm run build` — build shared packages and UI
- `bash scripts/deploy-all.sh` — full deploy
- `pnpm run setup` — reminder to run setup scripts

## Docs

- `docs/ARCHITECTURE.md` — 10-plane overview
- `docs/DEPLOYMENT.md` — Phase 0 and deploy order
- `docs/EXTENDING.md` — add agents, workflows, routes

## Source of truth

Canonical spec: `cloudflare-foundation-prompt 2.5.md` in this repo. Knowledge base: `C:\dev\.cloudflare\` (BIBLE.md, INDEX.md, patterns/).
