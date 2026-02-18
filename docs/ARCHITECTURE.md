# Foundation v2.5 Architecture

10-plane architecture. See BIBLE.md in the knowledge base for the full diagram.

- **Plane 1:** UI (SvelteKit + adapter-cloudflare)
- **Plane 2:** API Gateway (Hono, auth, rate limit, Turnstile, context tokens, audit chain)
- **Plane 3:** Agents (DO-backed agents, MCP, TenantRateLimiter)
- **Plane 4:** Workflows (durable execution)
- **Plane 5:** Data (D1, KV, R2, Vectorize)
- **Plane 6:** Isolation (Sandbox, Browser — optional)
- **Plane 7:** AI (Workers AI, AI Gateway)
- **Plane 8:** Communication (Queues, Email)
- **Plane 9:** Media (Cloudflare Images binding)
- **Plane 10:** Observability (Analytics Engine, audit hash chain)

---

## Recent Updates (2025-11 → 2026-02)

### Plane 3: Agents — SDK v0.5.0 (Feb 17, 2026)

The `agents` package is now at v0.5.0. Key additions since v0.3.0:

**Retry utilities** — Built-in exponential backoff for any async operation:
```ts
const result = await this.retry(() => fetch("https://api.example.com"), {
  maxRetries: 3,
  shouldRetry: (error) => error.status !== 404,
});
```
Per-task retry options on `schedule()`, `scheduleEvery()`, `addMcpServer()`:
```ts
await this.schedule("sendReport", Date.now() + 60_000, { retry: { maxRetries: 5 } });
```

**`scheduleEvery()`** — Recurring tasks with overlap prevention (v0.3.7):
```ts
await this.scheduleEvery("syncData", 60_000); // every 60s, no overlap
```

**`AgentWorkflow` class** — First-class Workflows integration (v0.3.7):
```ts
import { AgentWorkflow } from "agents";
const workflow = this.env.ONBOARDING_WORKFLOW as AgentWorkflow;
await workflow.create({ id: nanoid(), params: { userId } });
```

**Readonly connections** — Clients with readonly flag cannot mutate state (v0.4.0).

**`shouldSendProtocolMessages()`** — Per-connection protocol filtering (v0.5.0):
```ts
shouldSendProtocolMessages(connection, ctx) {
  return ctx.request.headers.get("Sec-WebSocket-Protocol") !== "mqtt";
}
```

**`validateStateChange(state)` hook** — Synchronous state validation before writes (v0.3.7).

**`@cloudflare/ai-chat` v0.1.2** — New companion package for persistent chat UIs:
- Tool approval persistence (survives DO hibernation and page refresh)
- Data parts — attach typed JSON blobs to messages
- `autoContinueAfterToolResult` (default `true`) — tool results auto-trigger continuation
- `maxPersistedMessages` — cap SQLite storage per agent
- `body` option on `useAgentChat` — send custom data with requests

**MCP SDK upgraded to 1.26.0** (v0.4.0) — Security fix preventing cross-client response leakage.

### Plane 3: Agents — Durable Objects SQLite Billing

**Active as of January 7, 2026.** Workers Paid plan accounts are billed for SQLite storage above free limits. Agent classes using SQLite storage (`ChatAgent`, `TaskAgent`, `TenantAgent`, `SessionAgent`, `FoundationMcpServer`, `TenantRateLimiter`) should minimize data retention. Use `maxPersistedMessages` from `@cloudflare/ai-chat` to cap message storage.

Best practices: see [Rules of Durable Objects](https://developers.cloudflare.com/changelog/2025-12-15-rules-of-durable-objects/) — design around logical coordination units, leverage SQLite with RPC methods, use concurrency gates, use hibernatable WebSockets.

### Plane 4: Workflows — Increased Limits & Dashboard Visualizer

As of October 2025, Workflows limits are:
- **100 instances/second** creation rate (was 10/sec)
- **10,000 concurrent** instances per account (was 4,500)

**Dashboard Visualizer** (Feb 4, 2026): Workflows now auto-generate visual diagrams in the Cloudflare dashboard from your code, showing step connections, loops, and branching logic.

### Plane 7: Workers AI — New Models

New models available on Workers AI:
- **GLM-4.7-Flash** (`@cf/zhipuai/glm-4-flash`) — fast multilingual text generation (Feb 2026)
- **FLUX.2 [klein] 9B** — distilled image generation, 4-step inference (Jan 2026)
- **FLUX.2 [klein] 4B** — faster/cheaper image generation (Jan 2026)
- **FLUX.2 [dev]** — advanced image generation with multi-language support (Nov 2025)

New packages: `@cloudflare/tanstack-ai`, `workers-ai-provider` v3.1.1 (transcription, TTS, reranking).
