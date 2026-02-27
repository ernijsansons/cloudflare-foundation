-- Migration: Allow 'fallback' status in build_specs
-- Required for Architecture Advisor degraded-mode outputs.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

CREATE TABLE build_specs_new (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  recommended TEXT NOT NULL DEFAULT '{}',
  alternatives TEXT NOT NULL DEFAULT '[]',
  data_model TEXT NOT NULL DEFAULT '{}',
  api_routes TEXT NOT NULL DEFAULT '[]',
  frontend TEXT,
  agents TEXT NOT NULL DEFAULT '[]',
  growth_path TEXT,
  scaffold_command TEXT NOT NULL DEFAULT '',
  total_cost TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'fallback')),
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  free_wins TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (run_id) REFERENCES planning_runs(id) ON DELETE CASCADE
);

INSERT INTO build_specs_new (
  id,
  run_id,
  recommended,
  alternatives,
  data_model,
  api_routes,
  frontend,
  agents,
  growth_path,
  scaffold_command,
  total_cost,
  status,
  approved_by,
  approved_at,
  created_at,
  updated_at,
  free_wins
)
SELECT
  id,
  run_id,
  recommended,
  alternatives,
  data_model,
  api_routes,
  frontend,
  agents,
  growth_path,
  scaffold_command,
  total_cost,
  status,
  approved_by,
  approved_at,
  created_at,
  updated_at,
  free_wins
FROM build_specs;

DROP TABLE build_specs;
ALTER TABLE build_specs_new RENAME TO build_specs;

CREATE INDEX IF NOT EXISTS idx_build_specs_run ON build_specs(run_id);
CREATE INDEX IF NOT EXISTS idx_build_specs_status ON build_specs(status);
CREATE INDEX IF NOT EXISTS idx_build_specs_free_wins
ON build_specs((json_array_length(free_wins) > 0));

COMMIT;

PRAGMA foreign_keys = ON;
