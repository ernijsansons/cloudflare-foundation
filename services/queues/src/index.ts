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
      // Connection errors are retryable
      if (message.includes("connection") || message.includes("timeout")) {
        return { type: "retryable", message: error.message, originalError: error };
      }
      // Constraint violations are permanent
      if (message.includes("constraint") || message.includes("unique")) {
        return { type: "permanent", message: error.message, originalError: error };
      }
      // Default database errors to retryable
      return { type: "retryable", message: error.message, originalError: error };
    }

    // Network errors - retryable
    if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) {
      return { type: "retryable", message: error.message, originalError: error };
    }
  }

  // Unknown errors default to retryable
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

function logQueueSuccess(queueName: string, msgId: string, processingTimeMs: number): void {
  console.log(JSON.stringify({
    level: "info",
    service: "foundation-queues",
    queue: queueName,
    messageId: msgId,
    processingTimeMs,
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
          const notification = msg.body as {
            type?: string;
            tenantId?: string;
            title?: string;
            message?: string;
            metadata?: Record<string, unknown>;
          };
          const type = notification.type ?? "notification";
          const tenantId = notification.tenantId ?? "system";
          const title = notification.title ?? "";
          const message = notification.message ?? "";
          const metadata = notification.metadata
            ? JSON.stringify(notification.metadata)
            : null;

          console.log(`Notification [${type}]:`, title || message || "no content");

          try {
            const id = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);
            await env.DB.prepare(
              `INSERT INTO notifications (id, tenant_id, type, title, message, metadata, read, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
            )
              .bind(id, tenantId, type, title, message, metadata, now)
              .run();
          } catch (dbErr) {
            // Table may not exist if migration not yet applied
            console.warn("Notification DB insert failed (run migration 0002_notifications):", dbErr);
          }
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

            // SSRF protection: verify hostname matches registered hostname
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
              }
            } catch (e) {
              console.error(`Webhook delivery error for ${dest.hostname}:`, e);
            }
          }
        }
        msg.ack();
        logQueueSuccess(queueName, msg.id, Date.now() - startTime);
      } catch (err) {
        const queueError = classifyError(err);
        logQueueError(queueName, msg.id, queueError);

        // Handle based on error type
        switch (queueError.type) {
          case "validation":
            // Validation errors are permanent - ack to remove from queue
            console.warn(`Dropping invalid message from ${queueName}: ${queueError.message}`);
            msg.ack();
            break;
          case "permanent":
            // Permanent errors - ack to prevent infinite retries
            // Could send to dead letter queue in production
            console.error(`Permanent error in ${queueName}, dropping message: ${queueError.message}`);
            msg.ack();
            break;
          case "retryable":
          default:
            // Retryable errors - retry with backoff
            // Check retry count to prevent infinite loops
            const retryCount = (msg.body as Record<string, unknown>)?._retryCount ?? 0;
            if (typeof retryCount === "number" && retryCount >= 5) {
              console.error(`Max retries exceeded for ${queueName} message, dropping`);
              msg.ack();
            } else {
              msg.retry();
            }
            break;
        }
      }
    }
  },
};
