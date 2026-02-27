# Cloudflare Agentic Foundation v2.5

Production-ready monorepo template for AI-powered SaaS applications on Cloudflare's edge network.

## What This Is

A complete serverless foundation with:

- **15-Phase Planning Pipeline** — AI-driven idea validation and business planning
- **Durable Workflows** — Long-running processes with step caching and retries
- **Durable Object Agents** — Stateful AI agents with WebSocket support
- **Multi-Tenant Architecture** — Tenant isolation, rate limiting, audit logging
- **Edge-First Design** — Everything runs on Cloudflare Workers

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SvelteKit │ ──▶ │   Gateway   │ ──▶ │  Planning   │
│     UI      │     │   (Hono)    │     │   Machine   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    ▼             ▼     ▼             ▼
              ┌─────────┐   ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ Agents  │   │ Queues  │ │   D1    │ │   R2    │
              │  (DO)   │   │         │ │(SQLite) │ │ (Files) │
              └─────────┘   └─────────┘ └─────────┘ └─────────┘
```

## Services

| Service | Description | Port |
|---------|-------------|------|
| `ui` | SvelteKit frontend with SSR | 5173 |
| `gateway` | API gateway with auth, rate limiting | 8788 |
| `planning-machine` | 15-phase planning workflow | 8787 |
| `agents` | Durable Object agents | 8789 |
| `queues` | Queue consumers (audit, webhooks) | - |
| `workflows` | Additional workflow definitions | - |

## Prerequisites

- Node.js 20+
- pnpm
- Wrangler CLI
- Cloudflare account

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all services
pnpm run dev

# UI: http://127.0.0.1:5173
# API: http://127.0.0.1:8788
```

## Scripts

```bash
pnpm run dev           # Full stack development
pnpm run dev:gateway   # Gateway + workers only
pnpm run build         # Build all packages
pnpm run typecheck     # Type checking
bash scripts/deploy-all.sh  # Deploy to Cloudflare
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 10-plane architecture, request flows, D1 schema |
| [API.md](docs/API.md) | Complete API reference |
| [PHASES.md](docs/PHASES.md) | 15-phase planning pipeline documentation |
| [EXTENDING.md](docs/EXTENDING.md) | Step-by-step extension guides |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |
| [NAOMI_DEPLOYMENT.md](docs/NAOMI_DEPLOYMENT.md) | Naomi OpenClaw deployment (naomi.erlvinc.com) |
| [USAGE.md](USAGE.md) | Setup and usage instructions |

### Service Documentation

- [Gateway README](services/gateway/README.md) — Middleware, routes, bindings
- [UI README](services/ui/README.md) — Routes, components, design tokens
- [Agents README](services/agents/README.md) — Durable Objects, MCP server

## Key Features

### Planning Machine
AI-powered 15-phase business planning:
1. **Discovery** — Opportunity, Customer, Market, Competitive intel
2. **Validation** — Kill test (GO/KILL/PIVOT)
3. **Strategy** — Revenue, Strategy, Business model
4. **Design** — Product, GTM, Content
5. **Execution** — Tech arch, Analytics, Launch, Synthesis

### Security
- JWT authentication with URL-safe base64 encoding
- Turnstile protection for public endpoints
- Per-tenant rate limiting via Durable Objects
- Tamper-evident audit hash chain
- SSRF protection for webhook delivery

### Observability
- Analytics Engine integration
- Hash-chained audit log
- Webhook event reporting
- Correlation IDs across services

## Project Structure

```
cloudflare-foundation/
├── packages/
│   ├── shared/          # Types, schemas
│   └── db/              # Drizzle schema
├── services/
│   ├── ui/              # SvelteKit frontend
│   ├── gateway/         # Hono API gateway
│   ├── planning-machine/# Planning workflow
│   ├── agents/          # Durable Objects
│   ├── queues/          # Queue consumers
│   └── workflows/       # Workflow definitions
├── docs/                # Documentation
└── scripts/             # Deploy scripts
```

## Environment Setup

See [USAGE.md](USAGE.md) for:
- Creating Cloudflare resources (D1, R2, KV, Vectorize)
- Setting secrets (JWT_SECRET, TURNSTILE_SECRET)
- Deploying to production
