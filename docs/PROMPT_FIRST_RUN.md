# Master Prompt: First Run — Cloudflare Foundation

**Purpose:** Execute all infrastructure provisioning and secrets to reach the first planning run. The codebase is feature-complete; only infrastructure and secrets remain.

**How to use:** Copy this document (or the relevant sections) into your prompt when asking Claude Code to set up or validate the first run. Reference: "Follow docs/PROMPT_FIRST_RUN.md."

---

## Current State: What's Done

The codebase is feature-complete:

- **15 agents** — All have real implementations (no stubs)
- **15 schemas** — All registered in the workflow
- **Planning workflow** — Handles GO/PIVOT/KILL, up to 3 pivots, review loops, RAG, webhooks
- **Orchestration** — Works for opportunity + kill-test phases (multi-model when enabled)
- **UI** — CreateModal, run list, phase timeline, artifact viewer, parked ideas, Kanban
- **Gateway** — Proxies to planning machine, handles Naomi tasks, webhooks, rate limiting
- **Wrangler configs** — Real resource IDs (no placeholders)

**Gap:** Infrastructure provisioning + secrets only.

---

## Tier 1 — Must Do (Blocks Any Run)

| Step | What | Command |
|------|------|---------|
| 1 | CONTEXT_SIGNING_KEY | `cd services/gateway && wrangler secret put CONTEXT_SIGNING_KEY` — generate with `openssl rand -base64 32` |
| 2 | TURNSTILE_SECRET | `cd services/gateway && wrangler secret put TURNSTILE_SECRET` — from Cloudflare Turnstile dashboard |
| 3 | Gateway D1 migrations | `cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote` |
| 4 | Planning D1 migrations | `cd services/planning-machine && npx wrangler d1 migrations apply planning-primary --remote` |
| 5 | Vectorize indexes | See [Vectorize Setup](#vectorize-setup) below |
| 6 | Deploy all | `pnpm install && pnpm run deploy` or `bash scripts/deploy-all.sh` |

### Vectorize Setup

```bash
# Foundation embeddings (gateway)
cd services/gateway
wrangler vectorize create foundation-embeddings --dimensions=384 --metric=cosine

# Planning embeddings (planning-machine)
cd services/planning-machine
wrangler vectorize create planning-embeddings --dimensions=768 --metric=cosine
```

If indexes already exist, skip. Update `wrangler.jsonc` with returned index names if different.

---

## Tier 2 — Must Do for Useful Output

Without search keys, all 15 agents get "Search unavailable" placeholders instead of real market data.

| Step | What | Command |
|------|------|---------|
| 7 | TAVILY_API_KEY | `cd services/planning-machine && wrangler secret put TAVILY_API_KEY` — free 1000 searches/mo at tavily.com |
| 8 | BRAVE_API_KEY (optional) | `cd services/planning-machine && wrangler secret put BRAVE_API_KEY` — free 2000 queries/mo at brave.com/search/api |

---

## Tier 3 — Optional

| Step | What | Command |
|------|------|---------|
| 9 | MINIMAX_API_KEY + ORCHESTRATION_ENABLED: "true" | `cd services/planning-machine && wrangler secret put MINIMAX_API_KEY` — then set `"ORCHESTRATION_ENABLED": "true"` in wrangler.jsonc vars |
| 10 | DNS for dashboard.erlvinc.com | UI domain routing; needs Cloudflare DNS records pointing to Pages |
| 11 | Auth UI | Login/signup pages; auth middleware defaults to "default" tenant for solo use |

---

## Shortest Path to First Run (7 Steps)

1. `cd services/gateway && wrangler secret put CONTEXT_SIGNING_KEY`
2. `cd services/gateway && wrangler secret put TURNSTILE_SECRET`
3. `cd services/planning-machine && wrangler secret put TAVILY_API_KEY`
4. `cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote`
5. `cd services/planning-machine && npx wrangler d1 migrations apply planning-primary --remote`
6. Create Vectorize indexes (see above), then `pnpm run deploy`
7. Open UI → Create → enter idea → watch 15 phases run

---

## Claude Code Execution Order

Execute in this exact sequence. Run from monorepo root unless otherwise specified.

```bash
# 1. Generate and set CONTEXT_SIGNING_KEY
openssl rand -base64 32
# Paste output when prompted:
cd services/gateway && wrangler secret put CONTEXT_SIGNING_KEY

# 2. Set TURNSTILE_SECRET (user provides from Cloudflare dashboard)
cd services/gateway && wrangler secret put TURNSTILE_SECRET

# 3. Set TAVILY_API_KEY (user provides from tavily.com)
cd services/planning-machine && wrangler secret put TAVILY_API_KEY

# 4. Gateway migrations
cd services/gateway && npx wrangler d1 migrations apply foundation-primary --remote

# 5. Planning migrations
cd services/planning-machine && npx wrangler d1 migrations apply planning-primary --remote

# 6. Vectorize (if not exists)
cd services/gateway && wrangler vectorize create foundation-embeddings --dimensions=384 --metric=cosine
cd services/planning-machine && wrangler vectorize create planning-embeddings --dimensions=768 --metric=cosine

# 7. Deploy
pnpm install && pnpm run deploy
```

---

## Pre-Flight: Resource Creation (If Needed)

If D1, KV, R2, or Queues do not exist:

```bash
# D1
wrangler d1 create foundation-primary
wrangler d1 create planning-primary
# Or: pnpm run planning:setup (for planning DB only)
# Update wrangler.jsonc with database_id from output

# KV
bash scripts/setup-kv.sh
# Update services/gateway/wrangler.jsonc, services/agents/wrangler.jsonc with id values

# R2
bash scripts/setup-r2.sh

# Queues
bash scripts/setup-queues.sh
```

---

## Verification

After deploy:

```bash
# Gateway health
curl https://foundation-gateway.<account>.workers.dev/health

# Planning health
curl https://foundation-planning-machine.<account>.workers.dev/api/planning/health
```

**UI:** Open the deployed UI URL → AI Labs → Create → enter "AI-powered CRM for small businesses" → confirm run starts and phases progress.

---

## Local Dev Shortcut

No Cloudflare setup required for local runs:

```bash
pnpm install && pnpm run dev
```

- Uses in-memory/local D1, KV, R2, Queues
- Open http://localhost:8788 (or port shown)
- For real search: copy `services/planning-machine/.dev.vars.example` to `.dev.vars`, add TAVILY_API_KEY
- Vite proxy: `/api/planning` targets wrangler dev port (check `services/ui/vite.config.ts` — 8787 or 8788)

---

## Security

- **Never commit secrets.** Use `wrangler secret put` only.
- TAVILY_API_KEY, BRAVE_API_KEY, MINIMAX_API_KEY: user provides at runtime; do not hardcode.
- **If a key was ever shared in chat or logs, rotate it immediately** in the provider dashboard (Tavily, Brave, MiniMax).

---

*This prompt is intended for Claude Code. Execute steps in order; skip steps that are already done (e.g., migrations applied, indexes exist).*
