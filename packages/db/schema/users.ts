import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
