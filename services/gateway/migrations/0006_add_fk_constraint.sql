-- Migration: Add indexes for project_documentation
-- Created: 2026-02-19
-- Updated: 2026-02-20 - Removed cross-database FK constraint (planning_runs is in planning-machine DB)
-- Purpose: Ensure query performance and data integrity

-- Note: Cannot add foreign key to planning_runs as it's in a different D1 database
-- Referential integrity must be maintained at the application level

-- This migration just ensures proper indexes exist
-- The table was already created in migration 0005

-- Ensure indexes exist for optimal query performance
CREATE INDEX IF NOT EXISTS `idx_project_docs_project` ON `project_documentation` (`project_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_section` ON `project_documentation` (`project_id`, `section_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_status` ON `project_documentation` (`project_id`, `status`);
