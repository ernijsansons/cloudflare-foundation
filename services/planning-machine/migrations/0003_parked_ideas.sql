-- Future Ideas Bucket — park ideas too expensive today but viable in 6-18 months
CREATE TABLE planning_parked_ideas (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  refined_idea TEXT,
  run_id TEXT,
  source_phase TEXT NOT NULL,
  reason TEXT NOT NULL,
  revisit_estimate_months INTEGER,
  revisit_estimate_note TEXT,
  artifact_summary TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES planning_runs(id)
);

CREATE INDEX idx_planning_parked_ideas_created ON planning_parked_ideas(created_at);
