# Master Prompt: Cloudflare Release Scan and Documentation Update

**Purpose:** Use this prompt when you need to automatically scan the newest Cloudflare releases, compare against project dependencies and documentation, and update docs/code so the edge stack leverages the best and newest features. Cloudflare has many rapid updates; this ensures the project stays current.

**When to use:** Before major releases, quarterly audits, or when adding new Cloudflare features. Run this scan whenever extending the stack.

**Output:** Scan report, updated documentation, dependency bumps, migration notes, and recommended feature adoptions.

---

## Quick Reference

1. **Fetch** RSS feeds and GitHub releases for all Cloudflare products the project uses
2. **Compare** current `package.json` versions vs latest
3. **Update** docs (ARCHITECTURE, DEPLOYMENT, API, etc.) with new features and breaking changes
4. **Adopt** recommended new features (e.g., Agents SDK retry utilities, @cloudflare/ai-chat)

---

## 1. Release Sources (Copy-Paste URLs)

### Changelog and RSS Feeds

| Source | URL |
|--------|-----|
| Global changelog | https://developers.cloudflare.com/changelog/ |
| Changelog RSS (global) | https://developers.cloudflare.com/changelog/rss/index.xml |
| Developer platform RSS | https://developers.cloudflare.com/changelog/rss/developer-platform.xml |
| Workers RSS | https://developers.cloudflare.com/changelog/rss/workers.xml |
| Workers AI RSS | https://developers.cloudflare.com/changelog/rss/workers-ai.xml |
| Durable Objects RSS | https://developers.cloudflare.com/changelog/rss/durable-objects.xml |
| Workflows RSS | https://developers.cloudflare.com/changelog/rss/workflows.xml |
| Agents RSS | https://developers.cloudflare.com/changelog/rss/agents.xml |
| D1 RSS | https://developers.cloudflare.com/changelog/rss/d1.xml |
| Queues RSS | https://developers.cloudflare.com/changelog/rss/queues.xml |
| Vectorize RSS | https://developers.cloudflare.com/changelog/rss/vectorize.xml |
| R2 RSS | https://developers.cloudflare.com/changelog/rss/r2.xml |
| KV RSS | https://developers.cloudflare.com/changelog/rss/kv.xml |
| Pages RSS | https://developers.cloudflare.com/changelog/rss/pages.xml |

### GitHub Releases

| Package | URL |
|---------|-----|
| Wrangler / Workers SDK | https://github.com/cloudflare/workers-sdk/releases |
| Agents SDK | https://github.com/cloudflare/agents |

### RSS Feed Documentation

- Available feeds: https://developers.cloudflare.com/fundamentals/new-features/available-rss-feeds/
- Consuming feeds: https://developers.cloudflare.com/fundamentals/new-features/consuming-rss-feeds/

---

## 2. Project's Cloudflare Stack

From `docs/ARCHITECTURE.md`, the project uses:

| Product | Usage |
|---------|-------|
| Workers | gateway, planning-machine, agents, queues, workflows |
| Pages | SvelteKit UI (adapter-cloudflare) |
| D1 | planning-primary, foundation-primary |
| R2 | planning-files |
| KV | sessions, cache |
| Vectorize | planning-embeddings |
| Workers AI | LLM inference, embeddings (@cf/bge-base-en) |
| Queues | foundation-audit, foundation-notifications, foundation-webhooks |
| Durable Objects | agents (stateful, WebSocket, MCP) |
| Workflows | Planning pipeline (WorkflowEntrypoint, step.do) |

**Scan all product-specific RSS feeds** for these products.

---

## 3. Scan Procedure (Step-by-Step)

### Step 1: Fetch RSS Feeds

Parse the following feeds (XML) and extract entries from the last 90 days:

- Developer platform: `https://developers.cloudflare.com/changelog/rss/developer-platform.xml`
- Workers: `https://developers.cloudflare.com/changelog/rss/workers.xml`
- Workers AI: `https://developers.cloudflare.com/changelog/rss/workers-ai.xml`
- Agents: `https://developers.cloudflare.com/changelog/rss/agents.xml`
- Workflows: `https://developers.cloudflare.com/changelog/rss/workflows.xml`
- Durable Objects: `https://developers.cloudflare.com/changelog/rss/durable-objects.xml`
- D1: `https://developers.cloudflare.com/changelog/rss/d1.xml`
- Queues: `https://developers.cloudflare.com/changelog/rss/queues.xml`
- Vectorize: `https://developers.cloudflare.com/changelog/rss/vectorize.xml`
- R2: `https://developers.cloudflare.com/changelog/rss/r2.xml`
- Pages: `https://developers.cloudflare.com/changelog/rss/pages.xml`

For each entry: title, link, pubDate, description (first 500 chars).

### Step 2: Fetch npm / GitHub Versions

```bash
# Wrangler (from workers-sdk)
npm view wrangler version

# Agents SDK
npm view agents version
npm view @cloudflare/ai-chat version 2>/dev/null || echo "not published"

# Other Cloudflare packages
npm view @cloudflare/workers-types version
npm view @sveltejs/adapter-cloudflare version
```

Check GitHub releases for changelog details:
- https://github.com/cloudflare/workers-sdk/releases
- https://github.com/cloudflare/agents/releases

### Step 3: Extract Project Dependencies

Grep all `package.json` files:

```bash
rg "agents|wrangler|@cloudflare|@sveltejs/adapter-cloudflare" --glob package.json -A 0
```

Build a table of package | current version | used in (service/path).

### Step 4: Build Gap Table

| Package | Project Version | Latest Version | Action |
|---------|-----------------|----------------|--------|
| wrangler | (from grep) | (from npm) | bump / review |
| agents | (from grep) | (from npm) | bump / review |
| @cloudflare/ai-chat | (if any) | (from npm) | add / bump |
| ... | ... | ... | ... |

### Step 5: Map Docs to Products

| Document | Products Referenced |
|----------|---------------------|
| `docs/ARCHITECTURE.md` | Workers, Pages, D1, R2, KV, Vectorize, Workers AI, Queues, Durable Objects, Workflows |
| `docs/DEPLOYMENT.md` | Wrangler, D1, R2, env vars |
| `docs/API.md` | Gateway, planning, agents endpoints |
| `docs/CONFIG.md` | Wrangler config, bindings |
| `docs/PHASES.md` | Workflows, Workers AI |
| `docs/DATABASE.md` | D1 |
| `README.md` | All (overview) |
| `services/agents/README.md` | Agents SDK, Durable Objects |
| `services/planning-machine/README.md` | Workflows, Workers AI, D1, Vectorize |

For each RSS entry that affects a product, note which docs may need updates.

---

## 4. Documentation Update Checklist

When new releases are found, update these files as needed:

- [ ] **`docs/ARCHITECTURE.md`** — New bindings, plane changes, product names, new capabilities
- [ ] **`docs/DEPLOYMENT.md`** — Wrangler commands, env vars, new deployment features
- [ ] **`docs/API.md`** — New endpoints, deprecated ones, request/response changes
- [ ] **`docs/CONFIG.md`** — New wrangler.jsonc options, bindings
- [ ] **`docs/PHASES.md`** — Workflow API changes, phase behavior
- [ ] **`docs/DATABASE.md`** — D1 schema changes, new features
- [ ] **`README.md`** — Version badges, quick start, prerequisites
- [ ] **Service READMEs** — Per-service updates (agents, planning-machine, gateway, etc.)
- [ ] **`package.json`** — Dependency version bumps across all services

---

## 5. Product-Specific Update Rules

When scanning, apply these rules per product:

### Workers

- V8 engine version (Workers changelog)
- New APIs: `node:fs`, MessageChannel, MessagePort, Web File System
- WebSocket: max message size (was 1 MiB, now 32 MiB)
- V8 Sandbox, FinalizationRegistry
- Compatibility date in wrangler.jsonc

### Workers AI

- New models: `@cf/deepseek-*`, `@cf/qwen/*`, `@cf/meta/llama-*`, etc.
- Model deprecations or renames
- New inference options (streaming, tool calling)
- Embedding model changes

### Agents SDK

- Breaking changes in Agent class, `onRequest`, `queue`, `schedule`
- New methods (e.g., `this.retry()`, `shouldSendProtocolMessages`)
- @cloudflare/ai-chat: new options, hooks, data parts
- MCP server API changes

### Workflows

- WorkflowEntrypoint API changes
- `step.do()`, `step.sleep()`, `step.waitForEvent()` behavior
- Retry semantics, durability guarantees

### D1

- New SQL features, functions
- Limits (rows, size)
- Migration tooling

### Durable Objects

- Free tier availability
- Python support
- Best practices (Rules of Durable Objects)
- Hibernation behavior

### Queues

- Free tier limits
- Producer/consumer API changes

### Vectorize

- Index limits, dimensions
- New distance metrics

---

## 6. Example: Agents SDK v0.5.0 (Feb 17, 2026)

Concrete features to document and adopt when upgrading from v0.3.x:

### Retry Utilities

```ts
class MyAgent extends Agent {
  async onRequest(request: Request) {
    const result = await this.retry(() => fetch("https://example.com/api"), {
      maxRetries: 3,
      shouldRetry: (error) => error.status !== 404,
    });
    return result;
  }
}
```

Per-task retry on `queue()`, `schedule()`, `scheduleEvery()`, `addMcpServer()`:

```ts
await this.schedule("sendReport", Date.now() + 60_000, {
  retry: { maxRetries: 5 },
});
```

### Protocol Message Control

```ts
class MyAgent extends Agent {
  shouldSendProtocolMessages(connection: Connection, ctx: ConnectionContext) {
    const subprotocol = ctx.request.headers.get("Sec-WebSocket-Protocol");
    return subprotocol !== "mqtt";
  }
}
```

### @cloudflare/ai-chat v0.1.0

- `autoContinueAfterToolResult` — defaults to `true`; tool results auto-trigger continuation
- Tool approval persistence — survives page refresh and DO hibernation
- Data parts — attach typed JSON blobs to messages
- `maxPersistedMessages` — cap SQLite storage
- `body` option on `useAgentChat` — send custom data with requests

### Synchronous Getters

`getQueue()`, `getSchedule()`, `dequeue()`, etc. are now synchronous (backward compatible with `await`).

### Upgrade Command

```sh
npm i agents@latest @cloudflare/ai-chat@latest
```

**Source:** https://developers.cloudflare.com/changelog/2026-02-17-agents-sdk-v050/

---

## 7. Example Commands for Claude Code

```bash
# Fetch changelog RSS (parse XML)
curl -s "https://developers.cloudflare.com/changelog/rss/developer-platform.xml" | head -200

# Check npm versions
npm view agents version
npm view wrangler version
npm view @cloudflare/ai-chat version 2>/dev/null || true

# Grep project deps
rg "agents|wrangler|@cloudflare" --glob package.json

# List all package.json files
find . -name package.json -not -path "*/node_modules/*"
```

---

## 8. Output Format

After running the scan, produce:

### 8.1 Scan Report

| Product | Current | Latest | Action |
|---------|---------|--------|--------|
| wrangler | ^4.36.0 | 4.65.0 | Bump to ^4.65.0 |
| agents | ^0.3.0 | 0.5.0 | Bump to ^0.5.0; add @cloudflare/ai-chat |
| ... | ... | ... | ... |

### 8.2 Doc Updates

- **`docs/ARCHITECTURE.md`** — Add note about [specific new feature]
- **`services/agents/README.md`** — Document retry utilities, protocol control
- ...

### 8.3 Migration Notes

- **Breaking:** (if any)
- **Deprecations:** (if any)
- **Upgrade path:** Step-by-step for each package

### 8.4 New Feature Adoption

- **Recommended:** Adopt `this.retry()` in agents for external fetch calls
- **Recommended:** Add `@cloudflare/ai-chat` for chat UIs with tool approval persistence
- **Optional:** Use `shouldSendProtocolMessages` for MQTT/binary clients

---

## 9. Gap Table Template

Use this template when building the scan report:

```markdown
## Dependency Gap Table

| Package | Location | Current | Latest | Status |
|---------|-----------|---------|--------|--------|
| wrangler | package.json, services/*/package.json | | | |
| agents | services/agents/package.json | | | |
| @cloudflare/ai-chat | (if used) | | | |
| @cloudflare/workers-types | services/*/package.json | | | |
| @sveltejs/adapter-cloudflare | services/ui/package.json | | | |
```

---

## 10. Usage Instruction

**Run this scan before releases or when extending the stack.** Follow the checklist and update docs accordingly. Prioritize:

1. **Security and stability** — Wrangler, Workers runtime updates
2. **Feature parity** — Agents SDK, Workers AI models
3. **Documentation accuracy** — Ensure docs match current APIs and config
4. **New feature adoption** — Adopt retry, ai-chat, and other improvements where they add value

Reference this prompt: *"Follow docs/PROMPT_CLOUDFLARE_RELEASE_SCAN.md to scan Cloudflare releases and update documentation."*
