import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
