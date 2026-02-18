export interface Env {
  DB: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
}

// Error classification for queue handling
type QueueErrorType = "retryable" | "permanent" | "validation";

interface QueueError {
  type: QueueErrorType;
  message: string;
  originalError?: unknown;
}

function classifyError(error: unknown): QueueError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Validation errors - don't retry
    if (message.includes("invalid") || message.includes("missing") || message.includes("required")) {
      return { type: "validation", message: error.message, originalError: error };
    }

    // Database errors - may be retryable
    if (message.includes("database") || message.includes("d1") || message.includes("sqlite")) {
      if (message.includes("connection") || message.includes("timeout")) {
        return { type: "retryable", message: error.message, originalError: error };
      }
      if (message.includes("constraint") || message.includes("unique")) {
        return { type: "permanent", message: error.message, originalError: error };
      }
      return { type: "retryable", message: error.message, originalError: error };
    }

    // Network errors - retryable
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return { type: "retryable", message: error.message, originalError: error };
    }
  }

  return { type: "retryable", message: String(error), originalError: error };
}

function logQueueError(queueName: string, msgId: string, error: QueueError): void {
  console.error(JSON.stringify({
    level: "error",
    service: "foundation-queues",
    queue: queueName,
    messageId: msgId,
    errorType: error.type,
    message: error.message,
    timestamp: new Date().toISOString(),
  }));
}

async function appendAuditEvent(
  db: D1Database,
  event: { type: string; tenantId: string; payload: unknown }
): Promise<string> {
  const lastEvent = await db.prepare(
    "SELECT hash FROM audit_chain WHERE tenant_id = ? ORDER BY seq DESC LIMIT 1"
  )
    .bind(event.tenantId)
    .first<{ hash: string }>();
  const previousHash = lastEvent?.hash ?? "0".repeat(64);
  // Use Unix timestamp in seconds (not milliseconds) for standard compatibility
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${previousHash}:${event.type}:${JSON.stringify(event.payload)}:${timestamp}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  await db
    .prepare(
      "INSERT INTO audit_chain (tenant_id, event_type, payload, previous_hash, hash, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      event.tenantId,
      event.type,
      JSON.stringify(event.payload),
      previousHash,
      hash,
      timestamp
    )
    .run();
  return hash;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Deep health check - verifies dependencies
    if (url.pathname === "/health") {
      const checks: Record<string, boolean> = {
        db: false,
        analytics: !!env.ANALYTICS,
      };

      // Check database connectivity
      try {
        await env.DB.prepare("SELECT 1").first();
        checks.db = true;
      } catch {
        // DB check failed
      }

      const allHealthy = Object.values(checks).every(Boolean);
      return Response.json(
        {
          status: allHealthy ? "ok" : "degraded",
          service: "foundation-queues",
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: allHealthy ? 200 : 503 }
      );
    }

    return new Response("Foundation Queues — queue consumer only", { status: 200 });
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const queueName = batch.queue;
    for (const msg of batch.messages) {
      const startTime = Date.now();
      try {
        if (queueName === "foundation-audit") {
          const body = msg.body as { type?: string; tenantId?: string; payload?: unknown };
          const type = body.type ?? "audit";
          const tenantId = body.tenantId ?? "system";
          await appendAuditEvent(env.DB, { type, tenantId, payload: body.payload ?? body });
          if (env.ANALYTICS) {
            env.ANALYTICS.writeDataPoint({
              indexes: [tenantId, type],
              blobs: [JSON.stringify(body.payload ?? body)],
              doubles: [Date.now()],
            });
          }
        } else if (queueName === "foundation-notifications") {
          // Stub: ack only
        } else if (queueName === "foundation-analytics") {
          if (env.ANALYTICS) {
            const b = msg.body as Record<string, unknown>;
            env.ANALYTICS.writeDataPoint({
              indexes: [String(b.event ?? "event")],
              blobs: [JSON.stringify(b)],
              doubles: [Date.now()],
            });
          }
        } else if (queueName === "foundation-webhooks") {
          // Stub: ack only
        }
        msg.ack();
        console.log(JSON.stringify({
          level: "info",
          service: "foundation-queues",
          queue: queueName,
          messageId: msg.id,
          processingTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }));
      } catch (err) {
        const queueError = classifyError(err);
        logQueueError(queueName, msg.id, queueError);

        switch (queueError.type) {
          case "validation":
          case "permanent":
            msg.ack(); // Don't retry permanent/validation errors
            break;
          case "retryable":
          default:
            msg.retry();
            break;
        }
      }
    }
  },
};
