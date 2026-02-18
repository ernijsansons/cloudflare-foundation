import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Tamper-evident audit chain (v2.4/v2.5).
 * Each row stores: tenant_id, seq, event_type, payload (JSON text), previous_hash, hash, created_at.
 * Hash = SHA-256(previous_hash + ":" + event_type + ":" + payload + ":" + created_at).
 * Append-only; no UPDATE/DELETE.
 */
export const auditChain = sqliteTable(
  "audit_chain",
  {
    tenantId: text("tenant_id").notNull(),
    seq: integer("seq").primaryKey({ autoIncrement: true }).notNull(),
    eventType: text("event_type").notNull(),
    payload: text("payload").notNull(),
    previousHash: text("previous_hash").notNull(),
    hash: text("hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => []
);
