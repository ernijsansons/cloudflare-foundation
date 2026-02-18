-- Add mode column to distinguish local vs cloud runs
ALTER TABLE planning_runs ADD COLUMN mode TEXT DEFAULT 'cloud';
-- Values: 'cloud' | 'local'

CREATE INDEX idx_planning_runs_mode ON planning_runs(mode);
