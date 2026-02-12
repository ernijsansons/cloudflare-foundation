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

## Quick Start

```bash
pnpm install
pnpm run dev
```

Opens at http://localhost:8788.

**See [USAGE.md](USAGE.md)** for full setup (Cloudflare resources, secrets, deployment) and what to build next.

## Scripts

- `pnpm run dev` — full stack (UI + gateway + workers) at port 8788
- `pnpm run dev:gateway` — gateway + workflows + agents + queues only
- `pnpm run build` — build shared packages and UI
- `bash scripts/deploy-all.sh` — full deploy
- `pnpm run setup` — reminder to run setup scripts

## Docs

- `docs/ARCHITECTURE.md` — 10-plane overview
- `docs/DEPLOYMENT.md` — Phase 0 and deploy order
- `docs/EXTENDING.md` — add agents, workflows, routes

## Source of truth

Canonical spec: `cloudflare-foundation-prompt 2.5.md` in this repo. Knowledge base: `C:\dev\.cloudflare\` (BIBLE.md, INDEX.md, patterns/).
