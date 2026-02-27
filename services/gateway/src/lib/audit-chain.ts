export async function appendAuditEvent(
  db: D1Database,
  event: { type: string; tenantId: string; payload: unknown }
): Promise<string> {
  // Get last hash for this tenant's chain continuity.
  const lastEvent = await db
    .prepare("SELECT hash, seq FROM audit_chain WHERE tenant_id = ? ORDER BY seq DESC LIMIT 1")
    .bind(event.tenantId)
    .first<{ hash: string; seq: number }>();

  const previousHash = lastEvent?.hash ?? "0".repeat(64);
  // Use Unix timestamp in seconds (not milliseconds) for standard compatibility
  const timestamp = Math.floor(Date.now() / 1000);

  const data = `${previousHash}:${event.type}:${JSON.stringify(event.payload)}:${timestamp}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Let SQLite/D1 assign AUTOINCREMENT seq (globally unique PK).
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

export async function verifyAuditChain(db: D1Database, tenantId: string): Promise<boolean> {
  const events = await db
    .prepare("SELECT * FROM audit_chain WHERE tenant_id = ? ORDER BY seq ASC")
    .bind(tenantId)
    .all();
  let previousHash = "0".repeat(64);
  for (const row of events.results) {
    const data = `${previousHash}:${row.event_type}:${row.payload}:${row.created_at}`;
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    const expected = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (expected !== row.hash) return false;
    previousHash = row.hash as string;
  }
  return true;
}
