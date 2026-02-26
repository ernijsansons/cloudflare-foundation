/**
 * Foundation context — knowledge of cloudflare-foundation-dev architecture
 * Injected into every agent's system prompt so they make foundation-aware decisions
 *
 * Updated for Project Factory v3.0 — supports multiple template contexts
 */

export type ContextType =
  | "foundation-monorepo" // cloudflare-foundation-dev (default for planning pipeline)
  | "lightweight-agent"   // API-only, minimal cost
  | "full-power-agent"    // Shell, browser, containers
  | "agent-swarm"         // Multi-agent coordination
  | "multi-agent-orchestration" // Task queues, auto-scaling
  | "super-agent"         // Everything enabled
  | "standalone-worker";  // Simple single worker

/**
 * Context for cloudflare-foundation-dev monorepo (default for planning pipeline)
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

/**
 * Context for lightweight-agent template ($5-20/mo)
 * API-only agents without shell/browser access
 */
export const LIGHTWEIGHT_AGENT_CONTEXT = `
## Lightweight Agent Architecture (API-Only Pattern)

This architecture is optimized for agents that ONLY need API access (fetch, webhooks, database).
No shell commands, no browser automation, no containers. Minimal cost target: $5-20/mo.

### Core Components

| Component | Implementation |
|-----------|----------------|
| Runtime | Cloudflare Workers (100K req/day free) |
| Database | D1 SQLite (5M reads/day free) |
| Agent State | Durable Objects with hibernation |
| Background Jobs | Queues (1M msg/mo free) |
| Storage | KV for cache, R2 for files |
| AI Inference | Workers AI (10K neurons/day free) |

### Key Constraints

- NO shell access (no Sandbox Containers)
- NO browser automation (no Browser Rendering)
- NO large model hosting (use Workers AI)
- MUST stay within free tier for bootstrap

### Extension Points

| Extension | Location |
|-----------|----------|
| New API routes | src/routes/*.ts |
| Agent tools | src/agents/tools/*.ts |
| DB schema | src/db/schema.ts |
| Cron jobs | src/cron/*.ts |

### Cost Optimization

- Use Workers AI for inference (free tier: 10K neurons/day)
- D1 for persistence (free tier: 5M reads/day)
- KV for caching (free tier: 100K reads/day)
- Queues for async work (free tier: 1M msg/mo)
- Avoid external API calls when CF-native options exist
`;

/**
 * Context for full-power-agent template ($50-200/mo)
 * Full capabilities including shell, browser, containers
 */
export const FULL_POWER_AGENT_CONTEXT = `
## Full-Power Agent Architecture (Complete Capabilities)

This architecture enables agents with shell commands, browser automation, and container access.
Target cost: $50-200/mo. Use when agents need to execute code or interact with web pages.

### Core Components

| Component | Implementation |
|-----------|----------------|
| Runtime | Cloudflare Workers |
| Shell Access | Sandbox Containers (isolated execution) |
| Browser | Browser Rendering API (headless Chrome) |
| Database | D1 + Hyperdrive (connection pooling) |
| Agent State | Durable Objects with WebSocket |
| AI Inference | Workers AI + external providers |

### Capabilities Enabled

- Shell command execution (Python, Node.js, bash)
- Browser automation (screenshots, form filling, scraping)
- File system access within sandbox
- Network requests from sandbox
- Long-running computations

### Security Boundaries

- Sandbox containers are isolated per request
- No persistent file system between invocations
- Network egress controlled via policies
- Browser sessions are ephemeral

### Cost Factors

- Browser Rendering: ~$0.02 per browser session
- Sandbox Containers: ~$0.0001 per 128MB-second
- Workers AI: varies by model
- Plan accordingly for usage-based billing
`;

/**
 * Context for agent-swarm template ($30-100/mo)
 * Multi-agent coordination patterns
 */
export const AGENT_SWARM_CONTEXT = `
## Agent Swarm Architecture (Multi-Agent Coordination)

This architecture enables multiple specialized agents coordinating on complex tasks.
Target cost: $30-100/mo. Use when problems decompose into parallel sub-tasks.

### Core Components

| Component | Implementation |
|-----------|----------------|
| Agent Instances | Durable Objects (one per agent) |
| Coordination | WebSocket channels + state sync |
| Task Distribution | Queues with priority routing |
| Shared Memory | KV namespace per swarm |
| Result Aggregation | Synthesis agent pattern |

### Swarm Patterns

1. **Scatter-Gather**: Dispatcher fans out, collector aggregates
2. **Pipeline**: Sequential processing through specialized agents
3. **Hierarchical**: Manager agents delegate to worker agents
4. **Consensus**: Multiple agents vote on decisions

### Agent Communication

- WebSocket: Real-time state sync
- Queues: Durable task handoff
- KV: Shared knowledge base
- D1: Persistent coordination state

### Cost Optimization

- Hibernation when agents are idle
- Batch operations across agents
- Shared embeddings in Vectorize
- Coalesce WebSocket messages
`;

/**
 * Context for multi-agent-orchestration template ($50-200/mo)
 * Enterprise task queues with auto-scaling
 */
export const ORCHESTRATION_CONTEXT = `
## Multi-Agent Orchestration Architecture (Enterprise Task Queues)

This architecture provides enterprise-grade task orchestration with auto-scaling.
Target cost: $50-200/mo. Use for complex workflows requiring durable execution.

### Core Components

| Component | Implementation |
|-----------|----------------|
| Workflow Engine | Cloudflare Workflows |
| Task Queues | Cloudflare Queues with DLQ |
| Worker Pool | Durable Objects with scaling |
| State Machine | Workflow steps with retries |
| Monitoring | Analytics Engine |

### Orchestration Patterns

1. **Durable Workflows**: Long-running, resumable execution
2. **Saga Pattern**: Distributed transactions with compensation
3. **Circuit Breaker**: Fault isolation for external services
4. **Rate Governor**: Controlled throughput per tenant

### Workflow Features

- Automatic retries with exponential backoff
- Human-in-the-loop approval gates
- Timeout handling per step
- Rollback on failure

### Queue Configuration

- Priority queues for SLA management
- Dead-letter queues for failed messages
- Batch processing for efficiency
- Consumer concurrency control
`;

/**
 * Context for super-agent template ($65-210/mo)
 * Everything enabled - god-mode agent
 */
export const SUPER_AGENT_CONTEXT = `
## Super Agent Architecture (God-Mode Pattern)

This architecture enables all capabilities: shell, browser, swarm, orchestration, AI providers.
Target cost: $65-210/mo. Use when requirements span multiple capability domains.

### All Capabilities Enabled

| Capability | Status |
|------------|--------|
| API Access | ✅ Full fetch, webhooks |
| Shell Access | ✅ Sandbox Containers |
| Browser | ✅ Browser Rendering |
| Multi-Agent | ✅ Swarm coordination |
| Workflows | ✅ Durable execution |
| AI Providers | ✅ Workers AI + external |
| Vector DB | ✅ Vectorize for RAG |
| Real-time | ✅ WebSocket + DO |

### Architecture Layers

1. **Gateway**: Hono API with auth, rate limiting
2. **Agent Layer**: Durable Objects for stateful agents
3. **Tool Layer**: Sandbox, Browser, AI tools
4. **Data Layer**: D1 + R2 + KV + Vectorize
5. **Queue Layer**: Async processing + webhooks
6. **Workflow Layer**: Durable orchestration

### Decision Matrix

When to use which capability:
- Simple data ops → D1 queries
- External APIs → fetch with retry
- Code execution → Sandbox Containers
- Web scraping → Browser Rendering
- Parallel work → Agent swarm
- Long-running → Workflows
- Semantic search → Vectorize RAG

### Cost Management

- Monitor Analytics Engine for usage patterns
- Set budget alerts per tenant
- Use hibernation aggressively
- Batch AI inference calls
`;

/**
 * Context for standalone-worker template ($0-10/mo)
 * Simplest possible Cloudflare Worker
 */
export const STANDALONE_WORKER_CONTEXT = `
## Standalone Worker Architecture (Minimal Pattern)

This architecture is a single Cloudflare Worker without complex orchestration.
Target cost: $0-10/mo. Use for simple APIs, webhooks, or utility functions.

### Core Components

| Component | Implementation |
|-----------|----------------|
| Runtime | Cloudflare Workers |
| Storage | KV or D1 (optional) |
| Config | Environment variables |

### Use Cases

- Webhook handlers
- API proxies
- Scheduled tasks (Cron)
- Edge transformations
- Simple CRUD APIs

### Constraints

- No complex state management
- No multi-agent coordination
- No shell/browser access
- Stateless or simple KV state only

### Free Tier Coverage

- 100,000 requests/day
- 10ms CPU time per request
- 128MB memory limit
- Suitable for most simple use cases
`;

/**
 * Map of context types to their content
 */
export const CONTEXT_MAP: Record<ContextType, string> = {
  "foundation-monorepo": FOUNDATION_CONTEXT,
  "lightweight-agent": LIGHTWEIGHT_AGENT_CONTEXT,
  "full-power-agent": FULL_POWER_AGENT_CONTEXT,
  "agent-swarm": AGENT_SWARM_CONTEXT,
  "multi-agent-orchestration": ORCHESTRATION_CONTEXT,
  "super-agent": SUPER_AGENT_CONTEXT,
  "standalone-worker": STANDALONE_WORKER_CONTEXT,
};

/**
 * Get foundation context (default for planning pipeline)
 * Uses foundation-monorepo context for the 18-phase pipeline
 */
export function getFoundationContext(): string {
  return FOUNDATION_CONTEXT;
}

/**
 * Get context for a specific template type
 * Used by Architecture Advisor to provide template-specific guidance
 */
export function getContextForTemplate(contextType: ContextType): string {
  return CONTEXT_MAP[contextType] ?? FOUNDATION_CONTEXT;
}

/**
 * Get context type from template slug
 * Maps template slugs to context types
 */
export function getContextTypeFromSlug(slug: string): ContextType {
  const mapping: Record<string, ContextType> = {
    // BIBLE patterns
    "bible-lightweight": "lightweight-agent",
    "bible-full-power": "full-power-agent",
    "bible-swarm": "agent-swarm",
    "bible-orchestration": "multi-agent-orchestration",
    "bible-super": "super-agent",
    // Cloudflare templates
    "cf-openai-agents-starter": "lightweight-agent",
    "cf-mcp-agent-template": "lightweight-agent",
    "cf-agents-starter": "lightweight-agent",
    "cf-workflows-starter": "multi-agent-orchestration",
    "cf-durable-objects-template": "agent-swarm",
    "cf-hono-api": "standalone-worker",
    "cf-d1-starter": "standalone-worker",
    "cf-workers-ai-starter": "lightweight-agent",
    "cf-vectorize-template": "lightweight-agent",
    "cf-queues-starter": "multi-agent-orchestration",
    "cf-kv-starter": "standalone-worker",
    "cf-r2-template": "standalone-worker",
    "cf-turnstile-template": "standalone-worker",
    "cf-browser-rendering-starter": "full-power-agent",
    "cf-hyperdrive-template": "standalone-worker",
    "cf-pages-sveltekit": "standalone-worker",
    "cf-email-workers": "standalone-worker",
  };

  return mapping[slug] ?? "foundation-monorepo";
}

/**
 * Get combined context for build spec generation
 * Includes both the template context and common Cloudflare guidance
 */
export function getBuildSpecContext(templateSlug: string): string {
  const contextType = getContextTypeFromSlug(templateSlug);
  const templateContext = getContextForTemplate(contextType);

  return `${templateContext}

## Common Cloudflare Guidance

### Free Tier Limits (Target for Bootstrap)

- Workers: 100,000 requests/day free
- D1: 5M reads/day, 100K writes/day free
- R2: 10M Class A + 10M Class B ops/month free, 10GB storage
- KV: 100,000 reads/day, 1,000 writes/day free
- Vectorize: 5M queries/month free
- Queues: 1M messages/month free
- Workers AI: 10K neurons/day free

### Cost-Conscious Decisions (MANDATORY)

Every technical decision must be made with cost consciousness.
Prefer free, open-source, Cloudflare-compatible options:

- Maps: MapLibre (free) — NOT Google Maps API
- Images: Cloudflare Images or R2 — NOT external CDN
- Auth: Session KV — NOT Auth0/Clerk unless justified
- Email: Queues + Workers — NOT SendGrid paid tier for MVP
- Search: D1 FTS5 or Vectorize — NOT Elasticsearch for bootstrap
- Payments: Stripe (only required paid integration)
`;
}
