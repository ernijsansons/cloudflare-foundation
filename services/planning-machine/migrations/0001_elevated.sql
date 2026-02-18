-- Planning Machine elevated schema
ALTER TABLE planning_runs ADD COLUMN workflow_instance_id TEXT;
ALTER TABLE planning_runs ADD COLUMN kill_verdict TEXT;
ALTER TABLE planning_runs ADD COLUMN pivot_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_planning_quality_run_phase ON planning_quality(run_id, phase);
