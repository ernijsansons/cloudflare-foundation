import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Ralph Loop Run Management Schema
 *
 * Tracks autonomous execution runs for the Ralph Loop system.
 * Three tables: runs (main), run_transitions (audit trail), run_approvals (HITL).
 */

/**
 * Main runs table - tracks each Ralph Loop execution
 */
export const runs = sqliteTable("runs", {
  runId: text("run_id").primaryKey(),
  projectId: text("project_id").notNull(),
  taskType: text("task_type").notNull(), // implementation|bugfix|refactor|docs|migration|audit
  riskLevel: text("risk_level").notNull(), // low|medium|high|critical
  status: text("status").notNull().default("PENDING"), // PENDING|IN_PROGRESS|COMPLETE|BLOCKED|REQUEST_APPROVAL
  objective: text("objective").notNull(),
  branch: text("branch").notNull(),
  bundleR2Key: text("bundle_r2_key"), // R2 key for run bundle
  reportR2Key: text("report_r2_key"), // R2 key for run report
  sessionId: text("session_id"), // Claude Code session ID
  costUsd: real("cost_usd").default(0),
  numTurns: integer("num_turns").default(0),
  durationMs: integer("duration_ms").default(0),
  repairAttempts: integer("repair_attempts").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdBy: text("created_by").default("openclaw"),
  tenantId: text("tenant_id"), // Multi-tenant isolation
});

/**
 * Run transitions - audit trail for state machine transitions
 * Records every state change with timestamp and reason
 */
export const runTransitions = sqliteTable("run_transitions", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  fromState: text("from_state").notNull(),
  toState: text("to_state").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

/**
 * Run approvals - human-in-the-loop approval requests
 * Used for REQUEST_APPROVAL status when human decision needed
 */
export const runApprovals = sqliteTable("run_approvals", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  action: text("action").notNull(), // What action requires approval
  status: text("status").notNull().default("PENDING"), // PENDING|APPROVED|REJECTED
  context: text("context"), // JSON context for the approval request
  requestedAt: text("requested_at").default(sql`(datetime('now'))`),
  resolvedAt: text("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolution: text("resolution"), // Notes from approver
});

// Type exports for use in application code
export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type RunTransition = typeof runTransitions.$inferSelect;
export type NewRunTransition = typeof runTransitions.$inferInsert;
export type RunApproval = typeof runApprovals.$inferSelect;
export type NewRunApproval = typeof runApprovals.$inferInsert;
