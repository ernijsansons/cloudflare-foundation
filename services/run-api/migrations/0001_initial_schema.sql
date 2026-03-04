-- Agent Control Primary Database
-- Migration: 0001_initial_schema.sql
-- Actor 2: Isolated execution state for Ralph Loop
--
-- Tables:
-- - runs: Main run metadata and status
-- - run_transitions: State machine audit trail
-- - run_approvals: Human-in-the-loop approval requests

-- Main runs table
CREATE TABLE IF NOT EXISTS runs (
  run_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('implementation', 'bugfix', 'refactor', 'docs', 'migration', 'audit')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RUN_CHECKS', 'UPDATE_DOCS', 'COMPLETE', 'BLOCKED', 'REQUEST_APPROVAL')),
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

-- Run transitions audit table (Ralph state machine history)
CREATE TABLE IF NOT EXISTS run_transitions (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason TEXT,
  hook_source TEXT, -- Which hook triggered this transition (path-guard, forbidden-cmd, etc.)
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

-- Hook violations log (for audit and debugging)
CREATE TABLE IF NOT EXISTS hook_violations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  hook_name TEXT NOT NULL, -- path-guard, forbidden-cmd, pre-commit-audit
  violation_type TEXT NOT NULL,
  details TEXT,
  file_path TEXT,
  command TEXT,
  created_at TEXT DEFAULT (datetime('now')),
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
CREATE INDEX IF NOT EXISTS idx_hook_violations_run_id ON hook_violations(run_id);
