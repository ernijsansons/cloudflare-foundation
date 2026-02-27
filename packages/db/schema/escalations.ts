import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const escalations = sqliteTable('escalations', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull(),
  fromOperatorId: text('from_operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  toSupervisorId: text('to_supervisor_id').references(() => users.id, {
    onDelete: 'set null',
  }),

  // Escalation details
  reason: text('reason').notNull(),
  priority: text('priority').notNull(), // 'low' | 'medium' | 'high' | 'urgent'
  status: text('status').notNull(), // 'pending' | 'in_review' | 'resolved' | 'rejected'

  // Resolution
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolution: text('resolution'),
});
