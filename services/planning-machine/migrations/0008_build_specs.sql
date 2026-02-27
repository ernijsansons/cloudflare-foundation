-- Migration: 0008_build_specs
-- Project Factory v3.0 - Build Specifications

-- Build specs: Architecture Advisor output per planning run
CREATE TABLE IF NOT EXISTS build_specs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  recommended TEXT NOT NULL DEFAULT '{}',       -- JSON: TemplateRecommendation
  alternatives TEXT NOT NULL DEFAULT '[]',      -- JSON: TemplateRecommendation[]
  data_model TEXT NOT NULL DEFAULT '{}',        -- JSON: DataModel
  api_routes TEXT NOT NULL DEFAULT '[]',        -- JSON: ApiRoute[]
  frontend TEXT,                                -- JSON: FrontendSpec | null
  agents TEXT NOT NULL DEFAULT '[]',            -- JSON: AgentSpec[]
  growth_path TEXT,                             -- JSON: GrowthPath | null
  scaffold_command TEXT NOT NULL DEFAULT '',
  total_cost TEXT NOT NULL DEFAULT '{}',        -- JSON: CostEstimate
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (run_id) REFERENCES planning_runs(id) ON DELETE CASCADE
);

-- Index for looking up build specs by run
CREATE INDEX IF NOT EXISTS idx_build_specs_run ON build_specs(run_id);
CREATE INDEX IF NOT EXISTS idx_build_specs_status ON build_specs(status);
