-- Migration 0005: Unknowns and Handoffs Tracking
--
-- Manages knowledge gaps and cross-phase information flow

-- Unknowns Table
-- Tracks questions and knowledge gaps discovered during planning
CREATE TABLE IF NOT EXISTS unknowns (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  phase_discovered TEXT NOT NULL,

  -- Classification
  category TEXT NOT NULL, -- 'market' | 'customer' | 'technical' | ...
  priority TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low'
  status TEXT NOT NULL, -- 'open' | 'investigating' | 'answered' | 'deferred' | 'obsolete'

  -- Question
  question TEXT NOT NULL,
  context TEXT,
  assumptions TEXT,

  -- Resolution
  answer TEXT,
  answered_in_phase TEXT,
  answered_at INTEGER,
  answered_by TEXT,
  confidence INTEGER, -- 0-100

  -- Metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint

-- Indexes for unknowns
CREATE INDEX IF NOT EXISTS idx_unknowns_run ON unknowns(run_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_unknowns_phase ON unknowns(phase_discovered);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_unknowns_category ON unknowns(category);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_unknowns_priority ON unknowns(priority);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_unknowns_status ON unknowns(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_unknowns_created ON unknowns(created_at);
--> statement-breakpoint

-- Composite index for unresolved critical unknowns
CREATE INDEX IF NOT EXISTS idx_unknowns_unresolved ON unknowns(run_id, status, priority)
WHERE status IN ('open', 'investigating') AND priority IN ('critical', 'high');
--> statement-breakpoint

-- Handoffs Table
-- Tracks information passed between phases
CREATE TABLE IF NOT EXISTS handoffs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  from_phase TEXT NOT NULL,
  to_phase TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'accepted' | 'completed' | 'rejected'

  -- Content
  artifact_id TEXT,
  data TEXT NOT NULL, -- JSON data
  instructions TEXT,
  dependencies TEXT, -- JSON array of artifact IDs

  -- Tracking
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  completed_at INTEGER,
  rejected_at INTEGER,
  rejection_reason TEXT
);
--> statement-breakpoint

-- Indexes for handoffs
CREATE INDEX IF NOT EXISTS idx_handoffs_run ON handoffs(run_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoffs_from_phase ON handoffs(from_phase);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoffs_to_phase ON handoffs(to_phase);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON handoffs(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoffs_artifact ON handoffs(artifact_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_handoffs_created ON handoffs(created_at);
--> statement-breakpoint

-- Composite index for pending handoffs to a phase
CREATE INDEX IF NOT EXISTS idx_handoffs_pending ON handoffs(to_phase, status)
WHERE status = 'pending';
--> statement-breakpoint

-- Unknown Resolution Workflow Table
-- Tracks the investigation process for unknowns
CREATE TABLE IF NOT EXISTS unknown_resolutions (
  id TEXT PRIMARY KEY,
  unknown_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'in_progress' | 'completed' | 'failed'

  -- Workflow tracking
  started_at INTEGER NOT NULL,
  completed_at INTEGER,

  -- Foreign keys
  FOREIGN KEY (unknown_id) REFERENCES unknowns(id) ON DELETE CASCADE
);
--> statement-breakpoint

-- Resolution Steps Table
-- Individual steps in the resolution workflow
CREATE TABLE IF NOT EXISTS resolution_steps (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT,
  confidence INTEGER NOT NULL, -- 0-100
  completed_at INTEGER,

  -- Foreign keys
  FOREIGN KEY (workflow_id) REFERENCES unknown_resolutions(id) ON DELETE CASCADE
);
--> statement-breakpoint

-- Indexes for resolution tracking
CREATE INDEX IF NOT EXISTS idx_resolution_unknown ON unknown_resolutions(unknown_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_resolution_status ON unknown_resolutions(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_resolution_steps_workflow ON resolution_steps(workflow_id);
