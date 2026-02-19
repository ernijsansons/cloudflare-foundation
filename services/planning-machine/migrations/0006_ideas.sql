-- Ideas table for Idea Cards
-- Each idea can have a full document (PRD, business plan, etc.)
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Add idea_id to planning_runs to link runs to ideas
ALTER TABLE planning_runs ADD COLUMN idea_id TEXT REFERENCES ideas(id);

-- Index for looking up runs by idea
CREATE INDEX idx_planning_runs_idea ON planning_runs(idea_id);

-- Index for listing ideas by status
CREATE INDEX idx_ideas_status ON ideas(status);
