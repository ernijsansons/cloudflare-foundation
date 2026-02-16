/**
 * Foundation context — knowledge of cloudflare-foundation-dev architecture
 * Injected into every agent's system prompt so they make foundation-aware decisions
 */

export const FOUNDATION_CONTEXT = `
## Cloudflare Foundation Architecture (Target Build Platform)

The planning output will be built on cloudflare-foundation-dev, a 10-plane Cloudflare monorepo. Every technical decision must map to this architecture.

### Already Built (Do NOT Re-Decide)

| Capability | Implementation |
|------------|-----------------|
| Multi-tenant isolation | tenantMiddleware() + tenant_id on every query |
| Authentication | Session-based, Bearer token to SESSION_KV lookup |
| Rate limiting | TenantRateLimiter DO (100 req/60s default) |
| Bot protection | Turnstile on public endpoints (signup, contact) |
| CORS | Configured for all origins |
| Correlation IDs | Auto-generated per request |
| Context tokens | Signed JWT for inter-service trust |
| Audit chain | Tamper-evident SHA-256 hash linking in audit_chain table |
| File uploads | R2 with tenant-scoped keys via POST /api/files/upload |
| Image transforms | Cloudflare Images binding via POST /api/images/transform |
| Analytics engine | POST /api/analytics/event with blobs, doubles, indexes |
| WebSocket agents | Chat, Task, Tenant, Session Durable Objects |
| MCP server | Template with echo tool, extensible |
| Workflows | 4 stubs: onboarding, data-pipeline, report-gen, email-sequence |
| Queues | foundation-audit, foundation-notifications, foundation-analytics, foundation-webhooks |
| Database | D1 with tenants, users, audit_log, audit_chain tables (Drizzle ORM) |
| SvelteKit UI | Cloudflare adapter, routes: /, /dashboard, /chat |
| Cron | Hourly + daily stubs |

### Extension Points

| Extension | Location |
|-----------|----------|
| New DB tables | packages/db/schema/*.ts + migrations |
| New API routes | services/gateway/src/index.ts |
| New UI pages | services/ui/src/routes/ |
| New DO agents | services/agents/src/agents/, register in wrangler |
| New workflows | services/workflows/src/workflows/ |
| Queue handlers | services/queues/src/index.ts |
| MCP tools | services/agents/src/mcp/server.ts |
| Cron jobs | services/cron/src/index.ts |

### Agentic-First Philosophy (MANDATORY)

Traditional SaaS is dead. Every product built on this foundation MUST be a data-driven agentic application. This means:

1. AGENTS, NOT DASHBOARDS: Users don't look at data. Agents act on data autonomously.
2. DATA COMPOUNDS: Every user action feeds the system's intelligence. More usage = smarter agents.
3. PALANTIR MODEL: Deep data integration + ontology mapping + autonomous action.
   - Palantir doesn't show you a chart. It tells you what to do and can do it for you.
   - Our products must do the same.
4. REVENUE FROM INTELLIGENCE: Charge for outcomes and insights, not seat licenses.
   - Usage-based pricing tied to value delivered (leads generated, actions taken, decisions made)
   - Not "per user per month" CRUD access
5. AGENTIC EXPANSION: Every feature should ask "can an agent do this automatically?"
   If yes, that's the product. The manual version is just the onboarding ramp.

Study these companies for patterns:
- Palantir: Ontology-driven, mission-critical, data compounds over time
- Scale AI: Data flywheel, platform approach, enterprise-grade
- Databricks: Open ecosystem, usage-based pricing, data lakehouse
- Anduril: Autonomous systems, real-world agents, defense-grade reliability

Making money is our #1 priority. Revenue must flow from agentic value delivered, not traditional SaaS mechanics.

### Cloudflare Free Tier Limits (Target for Bootstrap)

- Workers: 100,000 requests/day free
- D1: 5M reads/day, 100K writes/day free
- R2: 10M Class A ops + 10M Class B ops/month free, 10GB storage
- KV: 100,000 reads/day, 1,000 writes/day free
- Vectorize: 5M queries/month free
- Queues: 1M messages/month free

A bootstrapped product should run entirely on free tier for first 1000 users.

### 100% Cloudflare-Native, Cost-Conscious Decisions (MANDATORY)

Every technical decision must be made to the last detail with cost consciousness.
Prefer free, open-source, Cloudflare-compatible options. Avoid paid APIs and vendor lock-in.

Examples (enforce these):
- Maps: MapLibre (free, open-source, Cloudflare-compatible) — NOT Google Maps API
- Images: Cloudflare Images or R2 — NOT S3 or external CDN
- Auth: Session KV + foundation auth — NOT Auth0/Clerk unless justified
- Email: Queues + Workers — NOT SendGrid paid tier for MVP
- Search: D1 FTS5 or Vectorize — NOT Elasticsearch/Meilisearch for bootstrap
- Payments: Stripe (only required paid integration) — minimize products/prices

No decision should default to "industry standard" without checking for a Cloudflare-native or free alternative first.
`;

export function getFoundationContext(): string {
  return FOUNDATION_CONTEXT;
}
