# Extending

Add agents in services/agents/src/agents (extend Agent), register in wrangler and index. Add workflows in services/workflows/src/workflows. Add API routes in services/gateway/src/index.ts. Add UI in services/ui/src/routes.

---

## New Agent Capabilities (agents v0.5.0)

### Retry Utilities

Use `this.retry()` for resilient external fetch calls instead of manual retry loops:

```ts
import { Agent } from "agents";

class MyAgent extends Agent<Env> {
  async onRequest(request: Request) {
    const data = await this.retry(
      () => fetch("https://api.example.com/data"),
      {
        maxRetries: 3,
        shouldRetry: (error) => error.status !== 404,
      }
    );
    return Response.json(await data.json());
  }
}
```

Per-task retry on scheduled methods:
```ts
await this.schedule("sendReport", Date.now() + 60_000, { retry: { maxRetries: 5 } });
await this.scheduleEvery("syncData", 60_000, { retry: { maxRetries: 2 } });
```

### Recurring Tasks with `scheduleEvery()`

Use `scheduleEvery()` for cron-like recurring work inside an agent. Overlapping runs are prevented automatically:

```ts
async onStart() {
  await this.scheduleEvery("heartbeat", 30_000); // every 30s
}

async heartbeat() {
  await this.setState({ lastHeartbeat: Date.now() });
}
```

### Triggering Workflows from Agents (AgentWorkflow)

Use the `AgentWorkflow` class to trigger Workflows from within agent handlers:

```ts
import { Agent } from "agents";
import type { AgentWorkflow } from "agents";

interface Env {
  ONBOARDING_WORKFLOW: AgentWorkflow;
}

class MyAgent extends Agent<Env> {
  async onRequest(request: Request) {
    const instance = await this.env.ONBOARDING_WORKFLOW.create({
      id: crypto.randomUUID(),
      params: { userId: "user_123" },
    });
    return Response.json({ instanceId: instance.id });
  }
}
```

### Persistent Chat UIs with `@cloudflare/ai-chat`

The `@cloudflare/ai-chat` package (v0.1.2) provides React hooks for chat UIs backed by agent DO SQLite:

```ts
// In your agent
import { createAIChat } from "@cloudflare/ai-chat";
// Chat state is persisted in the DO's SQLite automatically
```

Key features:
- Tool approval persists across page refreshes and DO hibernation
- Data parts: attach typed JSON to messages
- `autoContinueAfterToolResult` (default `true`): tool results auto-trigger AI continuation
- `maxPersistedMessages`: cap SQLite storage to control billing

### State Validation with `validateStateChange()`

Add synchronous validation before any state write:

```ts
class MyAgent extends Agent<Env> {
  validateStateChange(state: AgentState): void {
    if (!state.userId) throw new Error("userId required");
  }
}
```

### Protocol Message Control

Selectively disable protocol messages for non-browser WebSocket clients:

```ts
class MyAgent extends Agent<Env> {
  shouldSendProtocolMessages(connection: Connection, ctx: ConnectionContext) {
    const proto = ctx.request.headers.get("Sec-WebSocket-Protocol");
    return proto !== "mqtt"; // don't send protocol msgs to MQTT clients
  }
}
```
