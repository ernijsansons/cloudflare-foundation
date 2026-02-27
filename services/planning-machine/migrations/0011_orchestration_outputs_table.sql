-- Migration: Create orchestration_outputs table for multi-model inference tracking
-- Stores individual model outputs from parallel inference during orchestration

CREATE TABLE IF NOT EXISTS orchestration_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  model TEXT NOT NULL,
  response TEXT,
  latency_ms INTEGER,
  tokens_used INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_orchestration_outputs_run ON orchestration_outputs(run_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_outputs_phase ON orchestration_outputs(run_id, phase);
