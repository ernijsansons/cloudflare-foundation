# Agents Service

Durable Object-based agents for Cloudflare Foundation v2.5.

## Overview

This service provides:
- Stateful agents using Durable Objects
- WebSocket connections for real-time communication
- MCP (Model Context Protocol) server capability
- Per-tenant rate limiting

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Agent Service                       │
│  ┌───────────────────────────────────────────────┐  │
│  │              Durable Objects                   │  │
│  │                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ ChatAgent│  │ CodeAgent│  │TenantLimiter│  │  │
│  │  │          │  │          │  │             │  │  │
│  │  │ - State  │  │ - State  │  │ - Counters  │  │  │
│  │  │ - WS     │  │ - WS     │  │ - Windows   │  │  │
│  │  │ - AI     │  │ - AI     │  │             │  │  │
│  │  └──────────┘  └──────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Agent Types

### ChatAgent
Conversational AI agent with message history.

```typescript
// Connect via WebSocket
ws://localhost:8789/agents/chat/agent-id

// Message format
{ "type": "message", "content": "Hello" }
```

### CodeAgent
Code generation and analysis agent.

### TenantRateLimiter
Per-tenant rate limiting using sliding window.

## Creating an Agent

### 1. Define the Agent Class

```typescript
// src/agents/my-agent.ts
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../types";

export class MyAgent extends DurableObject<Env> {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    // Handle HTTP
    if (url.pathname === "/action") {
      return this.handleAction(request);
    }

    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    const data = JSON.parse(message);
    // Handle message
    ws.send(JSON.stringify({ type: "response", data: "..." }));
  }

  private async handleAction(request: Request): Promise<Response> {
    const body = await request.json();
    // Process action
    return Response.json({ success: true });
  }
}
```

### 2. Register in wrangler.jsonc

```jsonc
{
  "durable_objects": {
    "bindings": [
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

### 3. Export from Index

```typescript
// src/index.ts
export { MyAgent } from "./agents/my-agent";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/agents\/(\w+)\/([^/]+)/);

    if (!match) {
      return new Response("Not found", { status: 404 });
    }

    const [, agentType, agentId] = match;

    // Route to appropriate agent
    const stub = getAgentStub(env, agentType, agentId);
    return stub.fetch(request);
  }
};

function getAgentStub(env: Env, type: string, id: string) {
  const doId = env[`${type.toUpperCase()}_AGENT`].idFromName(id);
  return env[`${type.toUpperCase()}_AGENT`].get(doId);
}
```

## MCP Server

Agents can expose MCP (Model Context Protocol) endpoints:

```typescript
async handleMCP(request: Request): Promise<Response> {
  const { method, params } = await request.json();

  switch (method) {
    case "tools/list":
      return Response.json({
        tools: [
          { name: "search", description: "Search documents" },
          { name: "analyze", description: "Analyze data" },
        ],
      });

    case "tools/call":
      const result = await this.callTool(params.name, params.arguments);
      return Response.json({ content: result });

    default:
      return Response.json({ error: "Unknown method" }, { status: 400 });
  }
}
```

## Rate Limiting

TenantRateLimiter provides sliding window rate limiting:

```typescript
// Check rate limit
const limiter = env.TENANT_RATE_LIMITER.get(
  env.TENANT_RATE_LIMITER.idFromName(tenantId)
);

const response = await limiter.fetch(
  new Request("http://internal/check", {
    method: "POST",
    body: JSON.stringify({
      key: "api_calls",
      limit: 100,
      window: 60, // seconds
    }),
  })
);

const { allowed, remaining } = await response.json();
```

## Local Development

```bash
# From project root
pnpm run dev

# Agents service runs at http://127.0.0.1:8789

# Test WebSocket connection
wscat -c ws://127.0.0.1:8789/agents/chat/test-agent
```

## State Persistence

Durable Objects automatically persist state:

```typescript
// Store state
await this.state.storage.put("key", value);

// Retrieve state
const value = await this.state.storage.get("key");

// List keys
const entries = await this.state.storage.list({ prefix: "prefix:" });

// Delete
await this.state.storage.delete("key");
```

## Alarm Scheduling

Schedule future execution:

```typescript
// Set alarm for 1 hour from now
await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);

// Handle alarm
async alarm(): Promise<void> {
  // Cleanup, sync, or other scheduled task
}
```
