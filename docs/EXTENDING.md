# Extending Foundation v2.5

Step-by-step guides for extending the Cloudflare Foundation platform.

## Table of Contents

- [Add a New Phase Agent](#add-a-new-phase-agent)
- [Add a New Phase to the Pipeline](#add-a-new-phase-to-the-pipeline)
- [Add a New API Route](#add-a-new-api-route)
- [Add a New UI Route](#add-a-new-ui-route)
- [Add Gateway Middleware](#add-gateway-middleware)
- [Register a Webhook Destination](#register-a-webhook-destination)
- [Add a New Durable Object Agent](#add-a-new-durable-object-agent)
- [Add a New Workflow](#add-a-new-workflow)

---

## Add a New Phase Agent

Phase agents implement business logic for each stage of the planning pipeline.

### 1. Create the agent file

Create `services/planning-machine/src/agents/my-phase-agent.ts`:

```typescript
import type { Env } from "../types";
import type { AgentInput, AgentOutput, PhaseAgent } from "./types";

export class MyPhaseAgent implements PhaseAgent {
  constructor(private env: Env) {}

  async run(input: AgentInput, context: { idea: string; refinedIdea: string }): Promise<AgentOutput> {
    const { runId, idea, refinedIdea, priorOutputs, ragContext, reviewerFeedback } = input;

    // Your phase logic here
    // Use this.env.AI for LLM calls
    // Access previous phase outputs via priorOutputs

    const output = {
      // Your structured output
      insights: [],
      recommendations: [],
    };

    return {
      success: true,
      output,
    };
  }

  getPhaseRubric(): string {
    return `
      Evaluate the output against these criteria:
      1. Are insights specific and actionable?
      2. Are recommendations prioritized?
      3. Is the analysis thorough?
    `;
  }
}
```

### 2. Register in the agent registry

Edit `services/planning-machine/src/agents/registry.ts`:

```typescript
import { MyPhaseAgent } from "./my-phase-agent";

// Add to PHASE_ORDER (determines execution order)
export const PHASE_ORDER: PhaseName[] = [
  // ... existing phases
  "my-phase",  // Add your phase
];

// Add to getAgentForPhase
export function getAgentForPhase(phase: PhaseName, env: Env): PhaseAgent {
  switch (phase) {
    // ... existing cases
    case "my-phase":
      return new MyPhaseAgent(env);
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}
```

### 3. Add type definitions

Edit `services/planning-machine/src/agents/types.ts`:

```typescript
export type PhaseName =
  // ... existing phases
  | "my-phase";
```

### 4. Add phase documentation

Edit `services/ui/src/lib/data/phase-docs.ts`:

```typescript
"my-phase": {
  title: "My Phase",
  purpose: "What this phase accomplishes",
  inputs: ["Required inputs"],
  outputs: ["Expected outputs"],
  successCriteria: ["Criteria for success"],
},
```

---

## Add a New Phase to the Pipeline

If you need to add a completely new phase with special behavior:

### 1. Follow "Add a New Phase Agent" above

### 2. Handle special workflow logic

For phases with special behavior (like kill-test), edit `services/planning-machine/src/workflows/planning-workflow.ts`:

```typescript
if (phase === "my-special-phase") {
  const output = await step.do(`phase-${phase}`, async () => runPhase(phase)) as MyOutput;

  if (output.specialCondition) {
    // Handle special case
    await step.do("handle-special", async () => {
      // Custom logic
    });
    return { verdict: "SPECIAL", runId };
  }
}
```

---

## Add a New API Route

### Gateway Routes

Edit `services/gateway/src/index.ts`:

```typescript
// Add authenticated route
app.get("/api/my-resource", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const result = await c.env.DB.prepare(
      "SELECT * FROM my_table WHERE tenant_id = ?"
    ).bind(tenantId).all();
    return c.json({ items: result.results ?? [] });
  } catch (e) {
    console.error("My resource error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

// Add public route (before auth middleware)
app.post("/api/public/my-action", turnstileMiddleware(), async (c) => {
  const body = await c.req.json();
  // Handle public action
  return c.json({ success: true });
});
```

### Planning Machine Routes

Edit `services/planning-machine/src/index.ts`:

```typescript
// In the main fetch handler
if (url.pathname === "/api/planning/my-endpoint" && request.method === "GET") {
  return myEndpointHandler(env);
}

// Add handler function
async function myEndpointHandler(env: Env): Promise<Response> {
  try {
    // Your logic
    return Response.json({ data: result });
  } catch (e) {
    console.error("My endpoint error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## Add a New UI Route

### 1. Create the route files

```
services/ui/src/routes/my-page/
├── +page.server.ts    # Server-side data loading
└── +page.svelte       # Page component
```

### 2. Add server loader

`services/ui/src/routes/my-page/+page.server.ts`:

```typescript
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";

export const load: PageServerLoad = async ({ platform }) => {
  try {
    let res: Response;

    if (dev) {
      res = await fetch("http://127.0.0.1:8787/api/planning/my-data");
    } else if (platform?.env?.GATEWAY) {
      res = await platform.env.GATEWAY.fetch("https://_/api/planning/my-data");
    } else {
      return { items: [], error: "Gateway not configured" };
    }

    if (!res.ok) {
      return { items: [], error: "Failed to fetch data" };
    }

    const data = await res.json();
    return { items: data.items ?? [], error: null };
  } catch (e) {
    return { items: [], error: "Failed to fetch data" };
  }
};
```

### 3. Add page component

`services/ui/src/routes/my-page/+page.svelte`:

```svelte
<script lang="ts">
  import { page } from "$app/stores";

  interface PageData {
    items: any[];
    error: string | null;
  }

  const data = $derived($page.data as PageData);
</script>

<svelte:head>
  <title>My Page | Foundation</title>
</svelte:head>

<div class="page">
  <h1>My Page</h1>

  {#if data.error}
    <p class="error">{data.error}</p>
  {:else}
    {#each data.items as item}
      <div class="item">{item.name}</div>
    {/each}
  {/if}
</div>

<style>
  .page {
    padding: 1.5rem;
  }
</style>
```

### 4. Add to navigation (optional)

Edit `services/ui/src/lib/components/Sidebar.svelte` to add navigation link.

---

## Add Gateway Middleware

### 1. Create middleware file

`services/gateway/src/middleware/my-middleware.ts`:

```typescript
import type { MiddlewareHandler } from "hono";
import type { Env, Variables } from "../types";

export function myMiddleware(): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> {
  return async (c, next) => {
    // Before request processing
    const startTime = Date.now();

    // Add to context
    c.set("myValue", "something");

    // Continue to next middleware/handler
    await next();

    // After request processing
    const duration = Date.now() - startTime;
    c.header("X-Response-Time", `${duration}ms`);
  };
}
```

### 2. Register in gateway

Edit `services/gateway/src/index.ts`:

```typescript
import { myMiddleware } from "./middleware/my-middleware";

// Apply globally
app.use("*", myMiddleware());

// Or apply to specific routes
app.use("/api/protected/*", myMiddleware());
```

### 3. Update types if needed

Edit `services/gateway/src/types.ts`:

```typescript
export interface Variables {
  // ... existing
  myValue?: string;
}
```

---

## Register a Webhook Destination

### Via API

```bash
curl -X POST http://127.0.0.1:8788/api/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "secret": "my-hmac-secret",
    "events": "run_completed,run_killed"
  }'
```

### Via UI

Navigate to Settings > Webhooks > Add Webhook (when UI is implemented).

### Verifying Webhook Signatures

```typescript
async function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  const expected = `sha256=${Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")}`;

  return signature === expected;
}
```

---

## Add a New Durable Object Agent

### 1. Create the agent class

`services/agents/src/agents/my-agent.ts`:

```typescript
import { Agent } from "./base";
import type { Env } from "../types";

export class MyAgent extends Agent<Env> {
  async onConnect(ws: WebSocket): Promise<void> {
    // Handle WebSocket connection
    ws.send(JSON.stringify({ type: "connected" }));
  }

  async onMessage(ws: WebSocket, message: string): Promise<void> {
    const data = JSON.parse(message);

    switch (data.type) {
      case "action":
        const result = await this.handleAction(data);
        ws.send(JSON.stringify({ type: "result", data: result }));
        break;
    }
  }

  private async handleAction(data: any): Promise<any> {
    // Your agent logic
    return { success: true };
  }
}
```

### 2. Register in wrangler.jsonc

Edit `services/agents/wrangler.jsonc`:

```jsonc
{
  "durable_objects": {
    "bindings": [
      // ... existing
      {
        "name": "MY_AGENT",
        "class_name": "MyAgent"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["MyAgent"]
    }
  ]
}
```

### 3. Export from index

Edit `services/agents/src/index.ts`:

```typescript
export { MyAgent } from "./agents/my-agent";
```

---

## Add a New Workflow

### 1. Create workflow class

`services/workflows/src/workflows/my-workflow.ts`:

```typescript
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import type { Env } from "../types";

export type MyWorkflowParams = {
  inputData: string;
  tenantId: string;
};

export class MyWorkflow extends WorkflowEntrypoint<Env, MyWorkflowParams> {
  async run(event: WorkflowEvent<MyWorkflowParams>, step: WorkflowStep) {
    const { inputData, tenantId } = event.payload;

    // Step 1: Validate
    const validated = await step.do("validate", async () => {
      return { valid: true, data: inputData };
    });

    // Step 2: Process
    const result = await step.do("process", async () => {
      // Long-running operation
      return { processed: true };
    });

    // Step 3: Save
    await step.do("save", async () => {
      await this.env.DB.prepare(
        "INSERT INTO my_results (tenant_id, data) VALUES (?, ?)"
      ).bind(tenantId, JSON.stringify(result)).run();
    });

    return { success: true };
  }
}
```

### 2. Register in wrangler.jsonc

Edit `services/workflows/wrangler.jsonc`:

```jsonc
{
  "workflows": [
    // ... existing
    {
      "name": "my-workflow",
      "binding": "MY_WORKFLOW",
      "class_name": "MyWorkflow"
    }
  ]
}
```

### 3. Add to gateway dispatch

Edit `services/gateway/src/index.ts`:

```typescript
const workflows: Record<string, Workflow | undefined> = {
  // ... existing
  "my-workflow": c.env.MY_WORKFLOW,
};
```

### 4. Update types

Edit `services/gateway/src/types.ts`:

```typescript
export interface Env {
  // ... existing
  MY_WORKFLOW?: Workflow;
}
```
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
