-- Migration 0004: RBAC and Operator Actions
--
-- Adds role-based access control for operator actions
-- Includes operator reviews, escalations, and audit logging

-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'operator';
--> statement-breakpoint

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
--> statement-breakpoint

-- Operator Reviews Table
-- Tracks operator decisions on AI-generated artifacts
CREATE TABLE IF NOT EXISTS operator_reviews (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_role TEXT NOT NULL,

  -- Review action
  action TEXT NOT NULL, -- 'approve' | 'reject' | 'revise' | 'escalate'
  confidence INTEGER NOT NULL, -- 0-100
  feedback TEXT,
  revision_instructions TEXT,

  -- Metadata
  created_at INTEGER NOT NULL,

  -- Foreign keys
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint

-- Indexes for operator reviews
CREATE INDEX IF NOT EXISTS idx_operator_reviews_decision ON operator_reviews(decision_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_reviews_operator ON operator_reviews(operator_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_reviews_action ON operator_reviews(action);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_reviews_created ON operator_reviews(created_at);
--> statement-breakpoint

-- Escalations Table
-- Tracks escalated decisions requiring supervisor review
CREATE TABLE IF NOT EXISTS escalations (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  from_operator_id TEXT NOT NULL,
  to_supervisor_id TEXT,

  -- Escalation details
  reason TEXT NOT NULL,
  priority TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'urgent'
  status TEXT NOT NULL, -- 'pending' | 'in_review' | 'resolved' | 'rejected'

  -- Resolution
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolution TEXT,

  -- Foreign keys
  FOREIGN KEY (from_operator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_supervisor_id) REFERENCES users(id) ON DELETE SET NULL
);
--> statement-breakpoint

-- Indexes for escalations
CREATE INDEX IF NOT EXISTS idx_escalations_decision ON escalations(decision_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_escalations_from_operator ON escalations(from_operator_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_escalations_to_supervisor ON escalations(to_supervisor_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_escalations_created ON escalations(created_at);
--> statement-breakpoint

-- Operator Audit Log Table
-- Dedicated audit trail for operator actions (separate from general audit_log)
CREATE TABLE IF NOT EXISTS operator_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,

  -- Action details
  action TEXT NOT NULL, -- 'approve', 'reject', 'revise', 'escalate', etc.
  resource_type TEXT NOT NULL, -- 'decision', 'artifact', 'run', etc.
  resource_id TEXT NOT NULL,

  -- Context
  metadata TEXT, -- JSON metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Result
  timestamp INTEGER NOT NULL,
  success INTEGER NOT NULL, -- 1 for success, 0 for failure
  error_message TEXT,

  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint

-- Indexes for operator audit log
CREATE INDEX IF NOT EXISTS idx_operator_audit_user ON operator_audit_log(user_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_tenant ON operator_audit_log(tenant_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_action ON operator_audit_log(action);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_resource ON operator_audit_log(resource_type, resource_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_timestamp ON operator_audit_log(timestamp);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_success ON operator_audit_log(success);
--> statement-breakpoint

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operator_audit_user_timestamp ON operator_audit_log(user_id, timestamp);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_operator_audit_tenant_timestamp ON operator_audit_log(tenant_id, timestamp);
