-- Ralph Loop Run Management Tables
-- Migration: 0012_agent_runs.sql
--
-- Creates tables for tracking autonomous execution runs:
-- - runs: Main run metadata and status
-- - run_transitions: State machine audit trail
-- - run_approvals: Human-in-the-loop approval requests

-- Main runs table
CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('implementation', 'bugfix', 'refactor', 'docs', 'migration', 'audit')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'REQUEST_APPROVAL')),
  objective TEXT NOT NULL,
  branch TEXT NOT NULL,
  bundle_r2_key TEXT,
  report_r2_key TEXT,
  session_id TEXT,
  cost_usd REAL DEFAULT 0,
  num_turns INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  repair_attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  created_by TEXT DEFAULT 'openclaw',
  tenant_id TEXT
);

-- Run transitions audit table
CREATE TABLE IF NOT EXISTS run_transitions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Run approvals table for HITL
CREATE TABLE IF NOT EXISTS run_approvals (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  context TEXT,
  requested_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  resolution TEXT,
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_project_id ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_runs_tenant_id ON runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at);
CREATE INDEX IF NOT EXISTS idx_run_transitions_run_id ON run_transitions(run_id);
CREATE INDEX IF NOT EXISTS idx_run_approvals_run_id ON run_approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_run_approvals_status ON run_approvals(status);
