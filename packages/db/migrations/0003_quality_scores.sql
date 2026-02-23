-- Migration 0003: Quality Scores Table
--
-- Stores multi-dimensional quality assessments for phase artifacts
-- Tracks both automated and operator-provided quality scores

CREATE TABLE IF NOT EXISTS quality_scores (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,

  -- Overall score (0-100)
  overall_score INTEGER NOT NULL,

  -- Dimensional scores (stored as JSON for flexibility)
  -- Format: [{ dimension: string, score: number, weight: number, feedback: string }]
  dimensions TEXT NOT NULL,

  -- Evaluator info
  evaluator TEXT NOT NULL, -- 'automated' | 'operator' | 'hybrid'
  evaluator_id TEXT, -- Operator ID if human-evaluated

  -- Metadata
  feedback TEXT, -- Overall feedback/notes
  created_at INTEGER NOT NULL,

  -- Foreign keys
  FOREIGN KEY (artifact_id) REFERENCES planning_artifacts(id) ON DELETE CASCADE,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_quality_artifact ON quality_scores(artifact_id);
CREATE INDEX IF NOT EXISTS idx_quality_run ON quality_scores(run_id);
CREATE INDEX IF NOT EXISTS idx_quality_phase ON quality_scores(phase);
CREATE INDEX IF NOT EXISTS idx_quality_score ON quality_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_quality_evaluator ON quality_scores(evaluator);
CREATE INDEX IF NOT EXISTS idx_quality_created ON quality_scores(created_at);

-- Composite index for quality queries by run and phase
CREATE INDEX IF NOT EXISTS idx_quality_run_phase ON quality_scores(run_id, phase);
