export interface Env {
  DB: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
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
  const timestamp = Date.now();
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
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const queueName = batch.queue;
    for (const msg of batch.messages) {
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
      } catch (err) {
        console.error(`Queue ${queueName} message failed:`, err);
        msg.retry();
      }
    }
  },
};
