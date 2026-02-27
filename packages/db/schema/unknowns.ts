import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const unknowns = sqliteTable('unknowns', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  phaseDiscovered: text('phase_discovered').notNull(),

  // Classification
  category: text('category').notNull(), // 'market' | 'customer' | 'technical' | ...
  priority: text('priority').notNull(), // 'critical' | 'high' | 'medium' | 'low'
  status: text('status').notNull(), // 'open' | 'investigating' | 'answered' | ...

  // Question
  question: text('question').notNull(),
  context: text('context'),
  assumptions: text('assumptions'),

  // Resolution
  answer: text('answer'),
  answeredInPhase: text('answered_in_phase'),
  answeredAt: integer('answered_at', { mode: 'timestamp' }),
  answeredBy: text('answered_by'),
  confidence: integer('confidence'), // 0-100

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const handoffs = sqliteTable('handoffs', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  fromPhase: text('from_phase').notNull(),
  toPhase: text('to_phase').notNull(),
  status: text('status').notNull(), // 'pending' | 'accepted' | 'completed' | 'rejected'

  // Content
  artifactId: text('artifact_id'),
  data: text('data').notNull(), // JSON
  instructions: text('instructions'),
  dependencies: text('dependencies'), // JSON array

  // Tracking
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  rejectedAt: integer('rejected_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
});

export const unknownResolutions = sqliteTable('unknown_resolutions', {
  id: text('id').primaryKey(),
  unknownId: text('unknown_id')
    .notNull()
    .references(() => unknowns.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'in_progress' | 'completed' | 'failed'

  // Tracking
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const resolutionSteps = sqliteTable('resolution_steps', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => unknownResolutions.id, { onDelete: 'cascade' }),
  phase: text('phase').notNull(),
  action: text('action').notNull(),
  result: text('result'),
  confidence: integer('confidence').notNull(), // 0-100
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});
