# How to Use Cloudflare Foundation v2.5

This template is ready to run locally and deploy. Follow these steps to get started.

---

## Prerequisites

- **Node 20+**
- **pnpm** (`npm install -g pnpm`)
- **Wrangler CLI** (included via `pnpm install`)
- **Cloudflare account** (for deployment)

---

## Quick Start (Local Dev)

```bash
pnpm install
pnpm run dev
```

Opens at **http://localhost:8788** (or port 8788 if 8787 is in use).

For local dev, wrangler uses in-memory/local D1, KV, R2, and Queues. No Cloudflare setup required to run locally.

---

## Full Setup (Before Deployment)

### 1. Create Cloudflare Resources

Run the setup scripts from the project root:

```bash
# D1 database
bash scripts/setup-d1.sh

# KV namespaces (session, rate limit, cache)
bash scripts/setup-kv.sh

# R2 bucket (files)
bash scripts/setup-r2.sh

# Queues
bash scripts/setup-queues.sh
```

**Note:** On Windows, use Git Bash or WSL, or run the equivalent `wrangler` commands manually.

### 2. Replace Placeholder IDs

In each service's `wrangler.jsonc`, replace:

- `D1_ID_HERE` → your D1 database ID
- `KV_ID_HERE` → your KV namespace ID

Files to update:

- `services/gateway/wrangler.jsonc`
- `services/agents/wrangler.jsonc`
- `services/workflows/wrangler.jsonc`

**Wrangler 4.45+** can auto-provision some resources if you omit or use placeholders.

### 3. Set Secrets (Gateway)

```bash
cd services/gateway
npx wrangler secret put CONTEXT_SIGNING_KEY   # e.g. 32+ char random string
npx wrangler secret put TURNSTILE_SECRET     # from Cloudflare Turnstile dashboard
```

### 4. Apply Migrations

```bash
cd services/gateway
npx wrangler d1 migrations apply foundation-primary --remote
```

Migrations live in `packages/db/migrations/`. The gateway has a copy in `services/gateway/migrations/` if needed.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Full stack (UI + gateway + workers) at http://localhost:8788 |
| `pnpm run dev:gateway` | Gateway + workflows + agents + queues only |
| `pnpm run build` | Build shared packages, UI, and typecheck workers |
| `pnpm run deploy` | Deploy all services (run `bash scripts/deploy-all.sh`) |
| `pnpm run setup` | Reminder to run setup scripts |

---

## Deploy Order

Deploy in this order (or use `bash scripts/deploy-all.sh`):

1. **queues** → `services/queues`
2. **workflows** → `services/workflows`
3. **agents** → `services/agents`
4. **gateway** → `services/gateway`
5. **cron** → `services/cron`
6. **ui** → `services/ui`

---

## What to Build Next

This template provides the scaffold. Typical next steps:

- [ ] **Signup/Login** — Create sessions in `SESSION_KV` and set `session_id` cookie
- [ ] **Chat AI** — Wire ChatAgent to Workers AI or AI Gateway
- [ ] **Custom agents** — Add agents in `services/agents/src/agents/`
- [ ] **Custom workflows** — Add workflows in `services/workflows/src/workflows/`
- [ ] **API routes** — Add routes in `services/gateway/src/index.ts`
- [ ] **UI pages** — Add SvelteKit pages in `services/ui/src/routes/`

---

## Docs

- `docs/ARCHITECTURE.md` — 10-plane overview
- `docs/DEPLOYMENT.md` — Phase 0 and deploy order
- `docs/EXTENDING.md` — Add agents, workflows, routes

---

## Troubleshooting

**Build fails with `EBUSY` or locked `.svelte-kit`:**
- Stop all Node processes (close terminals, stop dev servers)
- Remove `services/ui/.svelte-kit`
- Run `pnpm run dev` again

**Port 8788 in use:**
- Edit `package.json` and add `--port 8789` (or another port) to the `dev` script

**Gateway not connected:**
- Ensure you run `pnpm run dev` (not just `vite dev` in the UI) so all workers start together
