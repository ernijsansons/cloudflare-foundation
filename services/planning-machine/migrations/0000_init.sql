-- Planning Machine schema
CREATE TABLE planning_runs (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  status TEXT NOT NULL,
  current_phase TEXT,
  config TEXT,
  quality_score REAL,
  revenue_potential TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE planning_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  review_verdict TEXT,
  review_feedback TEXT,
  review_iterations INTEGER DEFAULT 0,
  quality_scores TEXT,
  overall_score REAL,
  confidence TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE TABLE planning_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_url TEXT,
  source_title TEXT,
  snippet TEXT,
  retrieval_date INTEGER,
  evidence_score TEXT NOT NULL,
  search_provider TEXT,
  FOREIGN KEY (artifact_id) REFERENCES planning_artifacts(id)
);

CREATE TABLE planning_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE TABLE planning_quality (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  dimension TEXT NOT NULL,
  score REAL NOT NULL,
  details TEXT,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE INDEX idx_planning_runs_status ON planning_runs(status);
CREATE INDEX idx_planning_artifacts_run ON planning_artifacts(run_id);
CREATE INDEX idx_planning_sources_artifact ON planning_sources(artifact_id);
CREATE INDEX idx_planning_memory_run ON planning_memory(run_id);
