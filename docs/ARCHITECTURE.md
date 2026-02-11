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
