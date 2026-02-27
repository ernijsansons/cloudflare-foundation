-- Migration: Add temporal indexes for time-based queries
-- Created: 2026-02-19
-- Purpose: Optimize queries like 'recently updated projects' and 'documentation changelog'

-- Add index on project_documentation for temporal queries
CREATE INDEX IF NOT EXISTS `idx_project_docs_updated`
ON `project_documentation` (`project_id`, `last_updated` DESC);

-- Add index on metadata for recently updated projects
CREATE INDEX IF NOT EXISTS `idx_project_meta_updated`
ON `project_documentation_metadata` (`last_updated` DESC);

-- Add index on created_at for historical queries
CREATE INDEX IF NOT EXISTS `idx_project_docs_created`
ON `project_documentation` (`created_at` DESC);

-- Add composite index for status + updated queries
CREATE INDEX IF NOT EXISTS `idx_project_docs_status_updated`
ON `project_documentation` (`status`, `last_updated` DESC);
