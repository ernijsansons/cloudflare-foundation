import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const operatorReviews = sqliteTable('operator_reviews', {
  id: text('id').primaryKey(),
  decisionId: text('decision_id').notNull(),
  operatorId: text('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  operatorRole: text('operator_role').notNull(),

  // Review action
  action: text('action').notNull(), // 'approve' | 'reject' | 'revise' | 'escalate'
  confidence: integer('confidence').notNull(), // 0-100
  feedback: text('feedback'),
  revisionInstructions: text('revision_instructions'),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
