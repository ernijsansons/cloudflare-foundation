# EXECUTION MASTER V2: Complete Audit, Fix, Webhook Reporting, Missing Features, Documentation

> **For:** Claude Code / Codex / Cursor Agent  
> **Project:** `c:\dev\.cloudflare\cloudflare-foundation-dev` (Cloudflare Foundation v2.5)  
> **Goal:** Fix 3 remaining partial bugs, implement full webhook reporting pipeline, add 4 missing API endpoints, complete placeholder pages, write all missing documentation, elevate to production quality.  
> **Reference Prompts:** `cloudflare-foundation-prompt 2.5.md`, `cloudflare-foundation-prompt 2.3.md` (webhook dispatch spec)  
> **Prior Audit:** `EXECUTION_MASTER.md` (v1 — 17 bugs, 14 fully fixed, 3 partial)

---

## TABLE OF CONTENTS

1. [Project Understanding](#1-project-understanding)
2. [Phase 1: Fix 3 Remaining Partial Bugs](#2-phase-1-fix-3-remaining-partial-bugs)
3. [Phase 2: Webhook Reporting Pipeline](#3-phase-2-webhook-reporting-pipeline)
4. [Phase 3: Missing API Endpoints](#4-phase-3-missing-api-endpoints)
5. [Phase 4: Complete Placeholder Pages](#5-phase-4-complete-placeholder-pages)
6. [Phase 5: Documentation](#6-phase-5-documentation)
7. [Phase 6: Elevation](#7-phase-6-elevation)
8. [Execution Order](#8-execution-order)
9. [Verification](#9-verification)
10. [Success Criteria](#10-success-criteria)
11. [File Reference](#11-file-reference)

---

## 1. PROJECT UNDERSTANDING

### Architecture

This is a **pnpm monorepo** for production-grade agentic apps on Cloudflare:

```
Browser → SvelteKit UI (port 8788)
  → platform.env.GATEWAY.fetch('https://_/api/...')
    → Gateway (Hono on Workers)
      → PLANNING_SERVICE binding → Planning Machine Worker
      → AGENT_SERVICE binding → Agents (Durable Objects)
      → WEBHOOK_QUEUE → Queue Consumer → erlvinc.com (NOT YET IMPLEMENTED)
```

### Services

| Service | Location | Runtime | Port |
|---------|----------|---------|------|
| UI | `services/ui/` | SvelteKit + adapter-cloudflare | 8788 |
| Gateway | `services/gateway/` | Hono on Workers | (service binding) |
| Planning Machine | `services/planning-machine/` | Workers + Workflows + D1 | (service binding) |
| Agents | `services/agents/` | Durable Objects + MCP | (service binding) |
| Workflows | `services/workflows/` | Cloudflare Workflows | (workflow binding) |
| Queues | `services/queues/` | Queue Consumers | (queue binding) |
| Cron | `services/cron/` | Scheduled Workers | (cron trigger) |

### Databases

| DB | Binding | Used by | Tables |
|----|---------|---------|--------|
| `planning-primary` | `DB` | Planning Machine | planning_runs, planning_artifacts, planning_sources, planning_memory, planning_quality, planning_parked_ideas |
| `foundation-primary` | `DB` | Gateway, Queues | tenants, users, audit_log, audit_chain, webhook_destinations (TO CREATE) |

### Dev Command

```bash
pnpm run dev
```

---

## 2. PHASE 1: FIX 3 REMAINING PARTIAL BUGS

### Bug 1: Kill-test artifact version hardcoded to `1`

**File:** `services/planning-machine/src/workflows/planning-workflow.ts`  
**Line:** ~217  
**Severity:** MEDIUM

**Current code (BROKEN):**
```typescript
.bind(artifactId, runId, phase, 1, contentStr, "GO", 1, null, Math.floor(Date.now() / 1000))
```

**Fix:** Replace the first `1` (4th bind param — version) with `pivotCount + 1`:
```typescript
.bind(artifactId, runId, phase, pivotCount + 1, contentStr, "GO", 1, null, Math.floor(Date.now() / 1000))
```

**Context:** This is inside the `save-kill-test-artifact` step.do block, around line 214-218. The kill-test artifact version must reflect the current pivot iteration. Other phases (non-kill-test) already use `currentIteration` correctly at line 321.

### Bug 2: JWT header/body use standard base64 (not URL-safe)

**File:** `services/gateway/src/middleware/context-token.ts`  
**Lines:** 17-18  
**Severity:** MEDIUM

**Current code (BROKEN):**
```typescript
const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const body = btoa(JSON.stringify(payload));
```

Standard `btoa()` produces `+`, `/`, and `=` characters which are NOT JWT-safe. The signature already uses URL-safe encoding (lines 32-36), but header and body do not.

**Fix:** Add a helper function and use it for all three segments:
```typescript
function toBase64Url(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Then:
const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const body = toBase64Url(JSON.stringify(payload));
// ... (signature already uses the same replacements at lines 33-36,
//      but also refactor it to use this shared function)
```

Also refactor the signature encoding (lines 33-36) to reuse `toBase64Url`:
```typescript
const sigRaw = btoa(sigBytes.map((b) => String.fromCharCode(b)).join(""));
const sig = toBase64Url(sigRaw);  // but note: toBase64Url calls btoa internally, so just:
// For the signature, since we already have the raw btoa string:
const sig = sigRaw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
```

**Simplest approach:** Define `toBase64Url` at module level and use it in all three places.

### Bug 3: Missing try-catch on gateway routes

**File:** `services/gateway/src/index.ts`  
**Lines:** 82-101, 109-120, 154-164  
**Severity:** LOW

**Current code (3 routes WITHOUT try-catch):**

1. **`POST /api/workflows/:workflowName`** (lines 82-101) — no try-catch
2. **`GET /api/data/:table`** (lines 109-120) — no try-catch
3. **`POST /api/analytics/event`** (lines 154-164) — no try-catch

**Fix for each route:** Wrap the handler body in try-catch that returns 500:

```typescript
// Example for workflows route:
app.post("/api/workflows/:workflowName", async (c) => {
  try {
    // ... existing code ...
  } catch (e) {
    console.error("Workflow dispatch error:", e);
    return c.json({ error: "Workflow dispatch failed" }, 500);
  }
});
```

Apply the same pattern to `/api/data/:table` and `/api/analytics/event`. Also consider wrapping `/api/files/upload` (line 122) and `/api/images/transform` (line 135) and `/api/admin/audit-verify/:tenantId` (line 148) the same way.

---

## 3. PHASE 2: WEBHOOK REPORTING PIPELINE

This is the **critical missing feature**. The planning machine (whether running locally via Claude Code/Codex/Cursor or in the cloud) must be able to report progress updates to a remote webhook destination (erlvinc.com when it exists). The infrastructure (queue config) exists but the implementation is all stubs.

### 2A. Add WEBHOOK_QUEUE producer to Gateway wrangler

**File:** `services/gateway/wrangler.jsonc`  
**Current queues section (lines 28-33):**
```jsonc
"queues": {
  "producers": [
    { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" },
    { "binding": "NOTIFICATION_QUEUE", "queue": "foundation-notifications" }
  ]
}
```

**Fix — add WEBHOOK_QUEUE and ANALYTICS_QUEUE:**
```jsonc
"queues": {
  "producers": [
    { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" },
    { "binding": "NOTIFICATION_QUEUE", "queue": "foundation-notifications" },
    { "binding": "ANALYTICS_QUEUE", "queue": "foundation-analytics" },
    { "binding": "WEBHOOK_QUEUE", "queue": "foundation-webhooks" }
  ]
}
```

### 2B. Add WEBHOOK_QUEUE to Gateway Env type

**File:** `services/gateway/src/types.ts`  
**Add these lines to the Env interface:**
```typescript
ANALYTICS_QUEUE?: Queue;
WEBHOOK_QUEUE?: Queue;
```

### 2C. Add WEBHOOK_QUEUE producer to Planning Machine wrangler

**File:** `services/planning-machine/wrangler.jsonc`  
**Current content — NO queues section exists.**

**Fix — add queues producer:**
```jsonc
{
  // ... existing config ...
  "queues": {
    "producers": [
      { "binding": "WEBHOOK_QUEUE", "queue": "foundation-webhooks" }
    ]
  }
}
```

### 2D. Add WEBHOOK_QUEUE to Planning Machine Env type

**File:** `services/planning-machine/src/types.ts`  
**Current:**
```typescript
export interface Env {
  AI: Ai;
  DB: D1Database;
  FILES?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  TAVILY_API_KEY?: string;
  BRAVE_API_KEY?: string;
  PLANNING_WORKFLOW?: Workflow;
}
```

**Fix — add:**
```typescript
WEBHOOK_QUEUE?: Queue;
```

### 2E. Emit webhook events from Planning Workflow

**File:** `services/planning-machine/src/workflows/planning-workflow.ts`

Add a helper function at the top of the file (after imports):

```typescript
async function emitWebhookEvent(
  queue: Queue | undefined,
  event: {
    type: string;
    runId: string;
    phase?: string;
    status?: string;
    verdict?: string;
    score?: number | null;
    pivotCount?: number;
    timestamp: number;
  }
): Promise<void> {
  if (!queue) return;
  try {
    await queue.send(event);
  } catch (e) {
    // Never fail the workflow because of webhook
    console.warn("Webhook emit failed:", e);
  }
}
```

**Emit at these points in the workflow:**

1. **Run started** — at the very beginning of `run()`, after loading pivot count:
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "run_started",
  runId,
  status: "running",
  timestamp: Math.floor(Date.now() / 1000),
});
```

2. **Phase completed** — after each phase's artifact is saved (inside `save-kill-test-artifact` step and after the non-kill-test phase `step.do` at ~line 334):
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "phase_completed",
  runId,
  phase,
  status: "running",
  verdict: reviewVerdict ?? "GO",
  score: overallScore,
  timestamp: Math.floor(Date.now() / 1000),
});
```

3. **Run killed** — inside `save-kill` (after line 133):
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "run_killed",
  runId,
  phase: "kill-test",
  status: "killed",
  verdict: "KILL",
  timestamp: Math.floor(Date.now() / 1000),
});
```

4. **Pivot exhausted** — inside `save-pivot-exhausted` (after line 197):
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "run_killed",
  runId,
  phase: "kill-test",
  status: "killed",
  verdict: "PIVOT_EXHAUSTED",
  pivotCount,
  timestamp: Math.floor(Date.now() / 1000),
});
```

5. **Pivot triggered** — after `persist-pivot` (after line 149):
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "pivot_triggered",
  runId,
  phase: "kill-test",
  status: "running",
  verdict: "PIVOT",
  pivotCount,
  timestamp: Math.floor(Date.now() / 1000),
});
```

6. **Run completed** — inside `complete` step (after line 361):
```typescript
await emitWebhookEvent(this.env.WEBHOOK_QUEUE, {
  type: "run_completed",
  runId,
  status: "completed",
  timestamp: Math.floor(Date.now() / 1000),
});
```

### 2F. Create webhook_destinations D1 migration

**File:** `services/gateway/migrations/0001_webhook_destinations.sql` (NEW FILE)

```sql
-- Webhook destinations for outbound notifications
CREATE TABLE IF NOT EXISTS `webhook_destinations` (
  `id` text PRIMARY KEY NOT NULL,
  `tenant_id` text NOT NULL,
  `name` text NOT NULL DEFAULT '',
  `hostname` text NOT NULL,
  `url` text NOT NULL,
  `secret` text,
  `active` integer NOT NULL DEFAULT 1,
  `events` text NOT NULL DEFAULT '*',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_webhook_dest_tenant` ON `webhook_destinations` (`tenant_id`, `active`);
CREATE INDEX IF NOT EXISTS `idx_webhook_dest_hostname` ON `webhook_destinations` (`hostname`);
```

The `events` column stores a comma-separated list of event types to subscribe to (e.g., `"run_started,run_completed,phase_completed"`) or `"*"` for all.

### 2G. Implement webhook dispatch in Queue Consumer (replace stub)

**File:** `services/queues/src/index.ts`

**Current stub (lines 66-67):**
```typescript
} else if (queueName === "foundation-webhooks") {
  // Stub: ack only
}
```

**Replace with full implementation** (based on `cloudflare-foundation-prompt 2.3.md` lines 1455-1484):

```typescript
} else if (queueName === "foundation-webhooks") {
  const webhook = msg.body as {
    type: string;
    runId: string;
    phase?: string;
    status?: string;
    verdict?: string;
    score?: number | null;
    pivotCount?: number;
    timestamp: number;
  };

  // Get all active webhook destinations
  const destinations = await env.DB.prepare(
    "SELECT id, url, hostname, secret, events FROM webhook_destinations WHERE active = 1"
  ).all();

  const dests = (destinations.results ?? []) as Array<{
    id: string;
    url: string;
    hostname: string;
    secret: string | null;
    events: string;
  }>;

  for (const dest of dests) {
    // Check if this destination subscribes to this event type
    if (dest.events !== "*" && !dest.events.split(",").includes(webhook.type)) {
      continue;
    }

    // SSRF protection: verify hostname is in our allowlist (the webhook_destinations table itself)
    try {
      const destUrl = new URL(dest.url);
      if (destUrl.hostname !== dest.hostname) {
        console.error(`Webhook SSRF: URL hostname ${destUrl.hostname} doesn't match registered ${dest.hostname}`);
        continue;
      }
    } catch {
      console.error(`Webhook invalid URL: ${dest.url}`);
      continue;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": webhook.type,
        "X-Webhook-Timestamp": String(webhook.timestamp),
      };

      // HMAC signature if secret is configured
      if (dest.secret) {
        const payload = JSON.stringify(webhook);
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(dest.secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(payload)
        );
        const sigHex = Array.from(new Uint8Array(sig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        headers["X-Webhook-Signature"] = `sha256=${sigHex}`;
      }

      const response = await fetch(dest.url, {
        method: "POST",
        headers,
        body: JSON.stringify(webhook),
      });

      if (!response.ok) {
        console.error(`Webhook delivery to ${dest.hostname} failed: ${response.status}`);
        // Don't throw — continue to other destinations
      }
    } catch (e) {
      console.error(`Webhook delivery error for ${dest.hostname}:`, e);
    }
  }
}
```

### 2H. Implement notifications queue (upgrade stub)

**Same file:** `services/queues/src/index.ts`

**Replace notification stub (lines 55-56):**
```typescript
} else if (queueName === "foundation-notifications") {
  // Stub: ack only
}
```

**With minimal implementation:**
```typescript
} else if (queueName === "foundation-notifications") {
  const notification = msg.body as {
    type: string;
    tenantId?: string;
    title?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };
  console.log(`Notification [${notification.type}]:`, notification.title ?? "no title");
  // Store in D1 for later retrieval by UI (future: send email, push)
  // For now, just log and ack
}
```

### 2I. Add webhook management API to Gateway

**File:** `services/gateway/src/index.ts`

Add these routes AFTER the planning routes (after line 80) and BEFORE the workflows route:

```typescript
// Webhook management
app.get("/api/webhooks", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const result = await c.env.DB.prepare(
      "SELECT id, name, hostname, url, active, events, created_at, updated_at FROM webhook_destinations WHERE tenant_id = ? ORDER BY created_at DESC"
    ).bind(tenantId).all();
    return c.json({ items: result.results ?? [] });
  } catch (e) {
    console.error("List webhooks error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.post("/api/webhooks", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const body = await c.req.json() as {
      name?: string;
      url: string;
      secret?: string;
      events?: string;
    };

    if (!body.url || typeof body.url !== "string") {
      return c.json({ error: "url is required" }, 400);
    }

    let hostname: string;
    try {
      hostname = new URL(body.url).hostname;
    } catch {
      return c.json({ error: "Invalid URL" }, 400);
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await c.env.DB.prepare(
      `INSERT INTO webhook_destinations (id, tenant_id, name, hostname, url, secret, events, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      tenantId,
      body.name ?? "",
      hostname,
      body.url,
      body.secret ?? null,
      body.events ?? "*",
      now,
      now
    ).run();

    return c.json({ id, name: body.name ?? "", hostname, url: body.url, active: 1, events: body.events ?? "*", created_at: now });
  } catch (e) {
    console.error("Create webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.delete("/api/webhooks/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      "DELETE FROM webhook_destinations WHERE id = ? AND tenant_id = ?"
    ).bind(id, tenantId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: "Webhook not found" }, 404);
    }

    return c.json({ deleted: true });
  } catch (e) {
    console.error("Delete webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});

app.patch("/api/webhooks/:id", async (c) => {
  try {
    const tenantId = c.get("tenantId") ?? "default";
    const id = c.req.param("id");
    const body = await c.req.json() as { active?: boolean; name?: string; events?: string };

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (body.active !== undefined) {
      updates.push("active = ?");
      params.push(body.active ? 1 : 0);
    }
    if (body.name !== undefined) {
      updates.push("name = ?");
      params.push(body.name);
    }
    if (body.events !== undefined) {
      updates.push("events = ?");
      params.push(body.events);
    }

    if (updates.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = ?");
    params.push(Math.floor(Date.now() / 1000));
    params.push(id, tenantId);

    await c.env.DB.prepare(
      `UPDATE webhook_destinations SET ${updates.join(", ")} WHERE id = ? AND tenant_id = ?`
    ).bind(...params).run();

    return c.json({ updated: true });
  } catch (e) {
    console.error("Update webhook error:", e);
    return c.json({ error: "Internal error" }, 500);
  }
});
```

### 2J. Also emit webhook on Planning Machine API (for local mode)

**File:** `services/planning-machine/src/index.ts`

For **local mode** runs (where Claude Code/Codex/Cursor uses the `POST /api/planning/runs/:id/artifacts/:phase` sync endpoint), emit a webhook event after artifact sync. Add to the `syncArtifact` function, after the successful artifact insert (around line 470):

```typescript
// Emit webhook event for external reporting
if (env.WEBHOOK_QUEUE) {
  try {
    await env.WEBHOOK_QUEUE.send({
      type: "phase_completed",
      runId,
      phase,
      status: "running",
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    console.warn("Webhook emit failed:", e);
  }
}
```

Similarly, in `createRun` (after line 178), emit:
```typescript
if (env.WEBHOOK_QUEUE) {
  try {
    await env.WEBHOOK_QUEUE.send({
      type: "run_started",
      runId: id,
      status: "running",
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (e) {
    console.warn("Webhook emit failed:", e);
  }
}
```

---

## 4. PHASE 3: MISSING API ENDPOINTS

### 3A. GET /api/planning/runs/:id/phases

**File:** `services/planning-machine/src/index.ts`

**Add route handling** in `handleRuns()` function. After the `subPath[0] === "artifacts"` check (~line 108), add:

```typescript
if (request.method === "GET" && subPath[0] === "phases" && subPath.length === 1) {
  return getRunPhases(runId, env);
}
```

**Add handler function:**

```typescript
async function getRunPhases(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, current_phase, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const artifacts = await env.DB.prepare(
      `SELECT phase, version, content, review_verdict, review_iterations, overall_score, created_at
       FROM planning_artifacts
       WHERE run_id = ?
       ORDER BY created_at ASC`
    ).bind(runId).all();

    // Import PHASE_ORDER from registry
    const { PHASE_ORDER } = await import("./agents/registry");

    const phases = PHASE_ORDER.map((phase) => {
      const artifact = (artifacts.results ?? []).find(
        (a) => (a as Record<string, unknown>).phase === phase
      ) as Record<string, unknown> | undefined;

      let status: string;
      if (artifact) {
        status = "completed";
      } else if ((run as Record<string, unknown>).current_phase === phase) {
        status = "in_progress";
      } else {
        status = "pending";
      }

      return {
        phase,
        status,
        version: artifact?.version ?? null,
        review_verdict: artifact?.review_verdict ?? null,
        overall_score: artifact?.overall_score ?? null,
        created_at: artifact?.created_at ?? null,
      };
    });

    return Response.json({
      runId,
      current_phase: (run as Record<string, unknown>).current_phase,
      run_status: (run as Record<string, unknown>).status,
      phases,
    });
  } catch (e) {
    console.error("getRunPhases error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### 3B. POST /api/planning/runs/:id/cancel

**Add route** in `handleRuns()`:
```typescript
if (request.method === "POST" && subPath[0] === "cancel" && subPath.length === 1) {
  return cancelRun(runId, env);
}
```

**Add handler:**
```typescript
async function cancelRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus !== "running" && currentStatus !== "pending" && currentStatus !== "paused") {
      return Response.json({
        error: `Cannot cancel run with status '${currentStatus}'`,
      }, { status: 409 });
    }

    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("cancelled", Math.floor(Date.now() / 1000), runId).run();

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "run_cancelled",
          runId,
          status: "cancelled",
          timestamp: Math.floor(Date.now() / 1000),
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({ id: runId, status: "cancelled" });
  } catch (e) {
    console.error("cancelRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### 3C. DELETE /api/planning/runs/:id

**Add route** in `handleRuns()`:
```typescript
if (request.method === "DELETE" && subPath.length === 0) {
  return deleteRun(runId, env);
}
```

**Add handler (soft delete):**
```typescript
async function deleteRun(runId: string, env: Env): Promise<Response> {
  try {
    const run = await env.DB.prepare(
      "SELECT id, status FROM planning_runs WHERE id = ?"
    ).bind(runId).first();

    if (!run) {
      return Response.json({ error: "Run not found" }, { status: 404 });
    }

    // Only allow deleting completed, cancelled, or killed runs
    const currentStatus = (run as Record<string, unknown>).status as string;
    if (currentStatus === "running") {
      return Response.json({
        error: "Cannot delete a running run. Cancel it first.",
      }, { status: 409 });
    }

    // Soft delete: set status to 'deleted'
    await env.DB.prepare(
      "UPDATE planning_runs SET status = ?, updated_at = ? WHERE id = ?"
    ).bind("deleted", Math.floor(Date.now() / 1000), runId).run();

    return Response.json({ id: runId, deleted: true });
  } catch (e) {
    console.error("deleteRun error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### 3D. POST /api/planning/parked-ideas/:id/promote

**Add route** in the main `fetch` handler (after the parked-ideas GET route, ~line 73):

```typescript
// In the fetch handler, add after the parked-ideas GET check:
const parkedIdeasPromoteMatch = url.pathname.match(/^\/api\/planning\/parked-ideas\/([^/]+)\/promote$/);
if (parkedIdeasPromoteMatch && request.method === "POST") {
  return promoteParkedIdea(parkedIdeasPromoteMatch[1]!, env);
}
```

**Add handler:**
```typescript
async function promoteParkedIdea(parkedIdeaId: string, env: Env): Promise<Response> {
  try {
    const idea = await env.DB.prepare(
      "SELECT id, idea, refined_idea, artifact_summary FROM planning_parked_ideas WHERE id = ?"
    ).bind(parkedIdeaId).first();

    if (!idea) {
      return Response.json({ error: "Parked idea not found" }, { status: 404 });
    }

    // Create a new run from this parked idea
    const runId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const ideaText = ((idea as Record<string, unknown>).refined_idea as string) ||
                     ((idea as Record<string, unknown>).idea as string);

    await env.DB.prepare(
      `INSERT INTO planning_runs (id, idea, refined_idea, status, mode, created_at, updated_at)
       VALUES (?, ?, ?, 'running', 'cloud', ?, ?)`
    ).bind(runId, ideaText, ideaText, now, now).run();

    // Mark parked idea as promoted (add status column or just update reason)
    await env.DB.prepare(
      "UPDATE planning_parked_ideas SET reason = ? WHERE id = ?"
    ).bind("PROMOTED to run " + runId, parkedIdeaId).run();

    // Start workflow if available
    let workflowInstanceId: string | null = null;
    if (env.PLANNING_WORKFLOW) {
      const instance = await env.PLANNING_WORKFLOW.create({
        params: { runId, idea: ideaText },
      });
      workflowInstanceId = instance.id;
      await env.DB.prepare(
        "UPDATE planning_runs SET workflow_instance_id = ? WHERE id = ?"
      ).bind(workflowInstanceId, runId).run();
    }

    // Emit webhook
    if (env.WEBHOOK_QUEUE) {
      try {
        await env.WEBHOOK_QUEUE.send({
          type: "idea_promoted",
          runId,
          status: "running",
          timestamp: now,
        });
      } catch (e) {
        console.warn("Webhook emit failed:", e);
      }
    }

    return Response.json({
      promoted: true,
      parkedIdeaId,
      newRunId: runId,
      workflowInstanceId,
    });
  } catch (e) {
    console.error("promoteParkedIdea error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 5. PHASE 4: COMPLETE PLACEHOLDER PAGES

### 4A. /ai-labs/production — Replace "coming soon"

**File:** `services/ui/src/routes/ai-labs/production/+page.svelte`

Replace the placeholder with a Kanban board showing completed runs promoted to production. Columns: Backlog, In Progress, Review, Done.

**Server loader** (`+page.server.ts`): Fetch completed runs from the API:
```typescript
export async function load({ platform }) {
  const gateway = platform?.env?.GATEWAY;
  if (!gateway) return { runs: [] };

  try {
    const res = await gateway.fetch("https://_/api/planning/runs?status=completed&limit=100");
    if (!res.ok) return { runs: [] };
    const data = await res.json() as { items: unknown[] };
    return { runs: data.items ?? [] };
  } catch {
    return { runs: [] };
  }
}
```

**Page:** Render using existing `Kanban.svelte`, `KanbanColumn.svelte`, `KanbanCard.svelte` components. Map completed runs to production Kanban cards. If no completed runs exist, show an empty state with instructions.

### 4B. /portfolio — Replace "coming soon"

**File:** `services/ui/src/routes/portfolio/+page.svelte`

Replace placeholder with a portfolio grid of completed planning runs. Each card shows:
- Idea title (truncated)
- Quality score badge
- Revenue potential
- Completion date
- Click to view run detail

**Server loader** (`+page.server.ts`): Same fetch as production but display as a grid instead of Kanban.

**Page:** CSS grid layout, 3 columns on desktop, 1 on mobile. Each card links to `/ai-labs/research/runs/[id]`.

---

## 6. PHASE 5: DOCUMENTATION

### 5A. Create `docs/API.md` (NEW)

Full API reference for every endpoint. Format:

```markdown
# API Reference

## Planning Machine

### POST /api/planning/runs
Create a new planning run.

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| idea | string | yes | The product idea |
| mode | "local" \| "cloud" | no | Execution mode (default: cloud) |
| config | object | no | Workflow config |

**Response:**
| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID of the created run |
| status | string | "running" |
| mode | string | "local" or "cloud" |
| workflow_instance_id | string \| null | Workflow ID if cloud mode |

...
```

Document ALL endpoints:
- `POST /api/planning/runs` — create run
- `GET /api/planning/runs` — list runs (query: limit, offset, status)
- `GET /api/planning/runs/:id` — get run
- `GET /api/planning/runs/:id/phases` — get phases (NEW)
- `GET /api/planning/runs/:id/artifacts/:phase` — get artifact
- `POST /api/planning/runs/:id/artifacts/:phase` — sync artifact
- `POST /api/planning/runs/:id/approve` — approve phase
- `POST /api/planning/runs/:id/cancel` — cancel run (NEW)
- `DELETE /api/planning/runs/:id` — delete run (NEW)
- `POST /api/planning/runs/:id/context` — get RAG context
- `GET /api/planning/runs/:id/package` — download package
- `GET /api/planning/parked-ideas` — list parked ideas
- `POST /api/planning/parked-ideas/:id/promote` — promote parked idea (NEW)
- `GET /api/planning/health` — health check
- `GET /api/webhooks` — list webhook destinations (NEW)
- `POST /api/webhooks` — register webhook (NEW)
- `DELETE /api/webhooks/:id` — delete webhook (NEW)
- `PATCH /api/webhooks/:id` — update webhook (NEW)

### 5B. Create `docs/PHASES.md` (NEW)

Export phase documentation from `services/ui/src/lib/data/phase-docs.ts` into a readable markdown file. For each of the 15 phases:
- Phase name and number
- Purpose
- Agent responsible
- Inputs (what prior phases it depends on)
- Output schema
- Review rubric
- Kill-test verdict (for kill-test phase only)

### 5C. Expand `docs/ARCHITECTURE.md`

**Current:** Only 15 lines listing plane names. **Expand to include:**

1. Service architecture diagram (mermaid)
2. Request flow diagram (browser to DB)
3. D1 schema (both databases — all tables, columns, indexes)
4. Queue topology (which services produce, which consume)
5. Webhook reporting flow
6. Phase pipeline diagram (15 phases with kill-test gate)
7. Navigation structure

### 5D. Expand `docs/EXTENDING.md`

**Current:** Only 4 lines. **Expand with step-by-step guides:**

1. How to add a new planning agent
2. How to add a new planning phase
3. How to add a new UI page/route
4. How to add a new gateway middleware
5. How to add a new queue consumer
6. How to register a webhook destination

Each guide should include:
- Files to create/modify
- Code snippets
- Wrangler config changes
- Testing steps

### 5E. Create `services/gateway/README.md` (NEW)

Document: middleware stack order, all routes, environment bindings, local dev instructions.

### 5F. Create `services/ui/README.md` (NEW)

Document: route structure, component library, design tokens, server loaders pattern, local dev.

### 5G. Create `services/agents/README.md` (NEW)

Document: Durable Object agents, MCP server, chat agent, how to add new agents.

### 5H. Update root `README.md`

Add: navigation structure, architecture overview, quick links to all docs, contribution guide.

---

## 7. PHASE 6: ELEVATION (PRODUCTION QUALITY)

### 6A. Standardize error response format

All API endpoints should return errors as:
```json
{ "error": { "code": "NOT_FOUND", "message": "Run not found" } }
```

Or at minimum keep the current `{ "error": "message" }` format but be consistent.

### 6B. Fix `listRuns` to exclude deleted runs

**File:** `services/planning-machine/src/index.ts` — `listRuns()` function

Add `WHERE status != 'deleted'` to both the status-filtered and unfiltered queries (or add it as an additional condition).

### 6C. Add `mode` column to listRuns response

The `listRuns` SELECT already includes most fields but is missing `mode`. Add it to the SELECT and response mapping.

### 6D. Verify all `as Record<string, unknown>` patterns

These type casts are verbose. Consider creating a typed D1 result helper:
```typescript
function typed<T>(row: unknown): T {
  return row as T;
}
```

---

## 8. EXECUTION ORDER

Execute these in order. **Verify each phase before proceeding.**

```
Phase 1 (15 min):  Fix 3 partial bugs
  1.1  Kill-test version → pivotCount + 1
  1.2  JWT base64url → toBase64Url helper
  1.3  Add try-catch to remaining gateway routes
  → Verify: pnpm run build && typecheck passes
  
Phase 2 (2-3 hrs): Webhook reporting pipeline
  2.1  Add WEBHOOK_QUEUE to gateway + planning-machine wrangler.jsonc
  2.2  Add WEBHOOK_QUEUE to both Env types
  2.3  Add emitWebhookEvent helper to planning-workflow.ts
  2.4  Add 6 emit points in workflow
  2.5  Add emit in syncArtifact and createRun (for local mode)
  2.6  Create webhook_destinations migration
  2.7  Implement webhook dispatch in queue consumer
  2.8  Upgrade notifications stub
  2.9  Add webhook management API to gateway
  → Verify: pnpm run build && typecheck passes
  → Verify: Apply migration (wrangler d1 migrations apply)
  → Verify: POST /api/webhooks creates destination
  → Verify: POST /api/planning/runs triggers webhook emit

Phase 3 (1-2 hrs): Missing API endpoints
  3.1  GET /api/planning/runs/:id/phases
  3.2  POST /api/planning/runs/:id/cancel
  3.3  DELETE /api/planning/runs/:id
  3.4  POST /api/planning/parked-ideas/:id/promote
  → Verify: curl each endpoint

Phase 4 (2-3 hrs): Complete placeholder pages
  4.1  /ai-labs/production — Kanban with completed runs
  4.2  /portfolio — Grid view of completed runs
  → Verify: Pages render in browser

Phase 5 (2-3 hrs): Documentation
  5.1  docs/API.md
  5.2  docs/PHASES.md
  5.3  Expand docs/ARCHITECTURE.md
  5.4  Expand docs/EXTENDING.md
  5.5  services/gateway/README.md
  5.6  services/ui/README.md
  5.7  services/agents/README.md
  5.8  Update root README.md

Phase 6 (30 min): Elevation
  6.1  Standardize errors
  6.2  Exclude deleted runs from listRuns
  6.3  Add mode to listRuns
```

---

## 9. VERIFICATION

After EACH phase, run:

```bash
# Build all services
pnpm run build

# Typecheck
pnpm run typecheck:workers

# Start dev server
pnpm run dev

# Test API endpoints (in a second terminal)
curl -s http://127.0.0.1:8788/api/health
curl -s http://127.0.0.1:8788/api/planning/health
curl -s http://127.0.0.1:8788/api/planning/runs
curl -s http://127.0.0.1:8788/api/planning/parked-ideas

# Test new endpoints (after Phase 3)
curl -s http://127.0.0.1:8788/api/planning/runs/test-id/phases
curl -s -X POST http://127.0.0.1:8788/api/planning/runs/test-id/cancel
curl -s -X DELETE http://127.0.0.1:8788/api/planning/runs/test-id

# Test webhook endpoints (after Phase 2)
curl -s http://127.0.0.1:8788/api/webhooks
curl -s -X POST http://127.0.0.1:8788/api/webhooks -H "Content-Type: application/json" -d '{"url":"https://erlvinc.com/api/webhooks/planning","name":"erlvinc"}'

# Test pages (should return 200)
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/dashboard
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/ai-labs/research
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/ai-labs/idea
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/ai-labs/production
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/portfolio
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/agents
curl -s -o NUL -w "%{http_code}" http://127.0.0.1:8788/chat

# Apply migrations
cd services/gateway && npx wrangler d1 migrations apply foundation-primary --local && cd ../..
cd services/planning-machine && npx wrangler d1 migrations apply planning-primary --local && cd ../..
```

---

## 10. SUCCESS CRITERIA

### Build / Type Safety
- [ ] `pnpm run build` succeeds with zero errors
- [ ] `pnpm run typecheck:workers` passes

### Bug Fixes (3 remaining)
- [ ] Kill-test artifact version uses `pivotCount + 1` (not hardcoded `1`)
- [ ] JWT header, body, AND signature all use URL-safe base64
- [ ] Every gateway route handler is wrapped in try-catch

### Webhook Reporting Pipeline
- [ ] `WEBHOOK_QUEUE` binding exists in gateway + planning-machine wrangler.jsonc
- [ ] `WEBHOOK_QUEUE?: Queue` exists in both Env types
- [ ] Planning workflow emits webhook events on: run_started, phase_completed, run_killed, pivot_triggered, run_completed
- [ ] `syncArtifact` and `createRun` emit webhook events (for local mode reporting)
- [ ] `webhook_destinations` D1 migration created and applied
- [ ] Queue consumer dispatches webhooks with SSRF protection and HMAC signing
- [ ] `GET/POST/DELETE/PATCH /api/webhooks` endpoints work
- [ ] Registering `https://erlvinc.com/api/webhooks/planning` works
- [ ] Notifications queue stub upgraded to at least log + ack

### Missing API Endpoints
- [ ] `GET /api/planning/runs/:id/phases` returns phase-by-phase status
- [ ] `POST /api/planning/runs/:id/cancel` cancels running/pending/paused runs
- [ ] `DELETE /api/planning/runs/:id` soft-deletes non-running runs
- [ ] `POST /api/planning/parked-ideas/:id/promote` creates a new run from parked idea

### UI Pages
- [ ] `/ai-labs/production` shows Kanban of completed runs (not "coming soon")
- [ ] `/portfolio` shows grid of completed runs (not "coming soon")
- [ ] All routes return 200: dashboard, ai-labs/*, agents, portfolio, chat

### Documentation
- [ ] `docs/API.md` exists with all endpoints documented
- [ ] `docs/PHASES.md` exists with all 15 phases documented
- [ ] `docs/ARCHITECTURE.md` expanded with diagrams
- [ ] `docs/EXTENDING.md` expanded with step-by-step guides
- [ ] `services/gateway/README.md` exists
- [ ] `services/ui/README.md` exists
- [ ] `services/agents/README.md` exists
- [ ] Root `README.md` updated

### Connectivity
- [ ] Full request trace works: Browser → UI → Gateway → Planning Machine → D1
- [ ] Webhook flow works: Planning Machine → WEBHOOK_QUEUE → Queue Consumer → registered URL
- [ ] Local mode flow: CLI/Claude Code → `POST /api/planning/runs/:id/artifacts/:phase` → webhook emit
- [ ] All middleware chain: CORS → correlation → rate limit → auth → tenant → context token → handler

---

## 11. FILE REFERENCE

### Files to MODIFY

| File | Changes |
|------|---------|
| `services/planning-machine/src/workflows/planning-workflow.ts` | Fix kill-test version (line 217), add emitWebhookEvent helper, add 6 emit points |
| `services/planning-machine/src/index.ts` | Add 4 new endpoint handlers (phases, cancel, delete, promote), add webhook emit to syncArtifact + createRun |
| `services/planning-machine/src/types.ts` | Add `WEBHOOK_QUEUE?: Queue` |
| `services/planning-machine/wrangler.jsonc` | Add queues.producers with WEBHOOK_QUEUE |
| `services/gateway/src/index.ts` | Add try-catch to 3+ routes, add 4 webhook management routes |
| `services/gateway/src/types.ts` | Add `WEBHOOK_QUEUE?: Queue`, `ANALYTICS_QUEUE?: Queue` |
| `services/gateway/src/middleware/context-token.ts` | Add toBase64Url helper, use for header + body |
| `services/gateway/wrangler.jsonc` | Add WEBHOOK_QUEUE + ANALYTICS_QUEUE to queues.producers |
| `services/queues/src/index.ts` | Replace webhook stub + notifications stub with full implementations |
| `services/ui/src/routes/ai-labs/production/+page.svelte` | Replace "coming soon" with Kanban |
| `services/ui/src/routes/ai-labs/production/+page.server.ts` | Add server loader for completed runs |
| `services/ui/src/routes/portfolio/+page.svelte` | Replace "coming soon" with portfolio grid |
| `services/ui/src/routes/portfolio/+page.server.ts` | Add server loader for completed runs |
| `docs/ARCHITECTURE.md` | Expand from 15 lines to full architecture doc |
| `docs/EXTENDING.md` | Expand from 4 lines to full extension guide |
| `README.md` | Update with nav structure, links to docs |

### Files to CREATE

| File | Contents |
|------|----------|
| `services/gateway/migrations/0001_webhook_destinations.sql` | webhook_destinations table |
| `docs/API.md` | Full API reference |
| `docs/PHASES.md` | 15-phase documentation |
| `services/gateway/README.md` | Gateway service docs |
| `services/ui/README.md` | UI service docs |
| `services/agents/README.md` | Agent service docs |

### Files that are CORRECT (do not modify unless needed for imports)

| File | Status |
|------|--------|
| `services/planning-machine/src/lib/model-router.ts` | Fixed (retry + exponential backoff) |
| `services/planning-machine/src/lib/reviewer.ts` | Fixed (balanced-brace JSON extraction) |
| `services/planning-machine/src/lib/rag.ts` | Fixed (runId filtering) |
| `services/gateway/src/lib/audit-chain.ts` | Fixed (seq column tracking) |
| `services/gateway/src/middleware/auth.ts` | OK for dev (allows all) |
| `services/gateway/src/middleware/cors.ts` | OK for dev (allows all origins) |
| `services/gateway/src/middleware/rate-limit.ts` | OK |
| `services/gateway/src/middleware/correlation.ts` | OK |
| `services/gateway/src/middleware/tenant.ts` | OK |
| `services/gateway/src/middleware/turnstile.ts` | OK |
| `services/ui/src/lib/utils/format-date.ts` | Fixed (seconds → ms) |
| `services/ui/src/lib/components/KanbanCard.svelte` | Fixed (uses formatDate) |
| `services/ui/src/lib/components/Sidebar.svelte` | OK |
| `services/ui/src/lib/components/TopBar.svelte` | OK |
| `services/ui/src/lib/components/SubNav.svelte` | OK |
| `services/ui/src/lib/components/AppShell.svelte` | OK |

---

## QUICK START

```bash
# 1. Read this entire document
# 2. Start with Phase 1 (3 small fixes)
# 3. Build + verify
# 4. Phase 2 (webhook pipeline — the big one)
# 5. Build + verify + test webhook flow
# 6. Phase 3 (4 new endpoints)
# 7. Phase 4 (2 placeholder pages)
# 8. Phase 5 (documentation)
# 9. Phase 6 (polish)
# 10. Final verification against success criteria
```
