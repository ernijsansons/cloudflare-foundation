import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  tenantId: text("tenant_id").notNull(),
  event: text("event").notNull(),
  data: text("data"), // JSON string
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});
