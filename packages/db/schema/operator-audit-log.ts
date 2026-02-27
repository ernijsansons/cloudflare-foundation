import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const operatorAuditLog = sqliteTable('operator_audit_log', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull(),

  // Action details
  action: text('action').notNull(), // 'approve', 'reject', 'revise', 'escalate', etc.
  resourceType: text('resource_type').notNull(), // 'decision', 'artifact', 'run', etc.
  resourceId: text('resource_id').notNull(),

  // Context
  metadata: text('metadata'), // JSON metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Result
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorMessage: text('error_message'),
});
