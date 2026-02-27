-- Migration: Create planning_runs table for research pipeline
-- This table stores AI Labs research runs that go through the 15-phase validation pipeline

CREATE TABLE IF NOT EXISTS `planning_runs` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `tenant_id` TEXT DEFAULT 'default',
  `idea` TEXT NOT NULL,
  `refined_idea` TEXT,
  `status` TEXT NOT NULL DEFAULT 'active' CHECK (`status` IN ('active', 'paused', 'completed', 'killed')),
  `current_phase` TEXT CHECK (`current_phase` IN (
    'opportunity', 'customer-intel', 'market-research', 'competitive-intel',
    'kill-test', 'revenue-expansion', 'strategy', 'business-model',
    'product-design', 'gtm-marketing', 'content-engine',
    'tech-arch', 'analytics', 'launch-execution', 'synthesis'
  )),
  `quality_score` INTEGER,
  `revenue_potential` TEXT,
  `workflow_instance_id` TEXT,
  `kill_verdict` TEXT,
  `pivot_count` INTEGER DEFAULT 0,
  `package_key` TEXT,
  `mode` TEXT DEFAULT 'cloud' CHECK (`mode` IN ('cloud', 'local')),
  `created_at` INTEGER NOT NULL DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
  `updated_at` INTEGER DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS `idx_planning_runs_tenant` ON `planning_runs`(`tenant_id`);
CREATE INDEX IF NOT EXISTS `idx_planning_runs_status` ON `planning_runs`(`status`);
CREATE INDEX IF NOT EXISTS `idx_planning_runs_phase` ON `planning_runs`(`current_phase`);
CREATE INDEX IF NOT EXISTS `idx_planning_runs_created` ON `planning_runs`(`created_at` DESC);

-- Insert some seed data for demonstration
INSERT OR IGNORE INTO `planning_runs` (id, tenant_id, idea, refined_idea, status, current_phase, quality_score, revenue_potential, mode, created_at) VALUES
('run_01', 'default', 'AI-powered code review tool', 'AI Code Review Platform for Enterprise Teams', 'active', 'opportunity', 85, '$10M ARR potential', 'cloud', cast((julianday('now') - 2440587.5)*86400000 as integer) - 86400000),
('run_02', 'default', 'Real-time collaboration for remote teams', 'Async-First Team Collaboration Suite', 'active', 'customer-intel', 78, '$5M ARR potential', 'cloud', cast((julianday('now') - 2440587.5)*86400000 as integer) - 172800000),
('run_03', 'default', 'Developer productivity analytics', 'Engineering Velocity Dashboard', 'active', 'market-research', 82, '$8M ARR potential', 'cloud', cast((julianday('now') - 2440587.5)*86400000 as integer) - 259200000),
('run_04', 'default', 'API monetization platform', 'API Usage & Billing Infrastructure', 'active', 'strategy', 90, '$15M ARR potential', 'cloud', cast((julianday('now') - 2440587.5)*86400000 as integer) - 345600000),
('run_05', 'default', 'No-code workflow automation', 'Visual Workflow Builder for Non-Technical Teams', 'active', 'product-design', 75, '$12M ARR potential', 'cloud', cast((julianday('now') - 2440587.5)*86400000 as integer) - 432000000);
