-- Migration: Add foreign key constraint to project_documentation
-- Created: 2026-02-19
-- Purpose: Ensure referential integrity - deleting a planning run automatically deletes its documentation

-- Note: D1 SQLite may not support ALTER TABLE ADD CONSTRAINT for foreign keys
-- Instead, we'll recreate the table with the constraint

-- Create new table with foreign key
CREATE TABLE IF NOT EXISTS `project_documentation_new` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `section_id` text NOT NULL,
  `subsection_key` text,
  `content` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `populated_by` text,
  `last_updated` integer NOT NULL,
  `created_at` integer NOT NULL,
  CHECK (`status` IN ('draft', 'reviewed', 'approved')),
  UNIQUE (`project_id`, `section_id`, `subsection_key`),
  FOREIGN KEY (`project_id`) REFERENCES planning_runs(`id`) ON DELETE CASCADE
);

-- Copy data from old table
INSERT INTO `project_documentation_new`
SELECT * FROM `project_documentation`;

-- Drop old table
DROP TABLE `project_documentation`;

-- Rename new table
ALTER TABLE `project_documentation_new` RENAME TO `project_documentation`;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS `idx_project_docs_project` ON `project_documentation` (`project_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_section` ON `project_documentation` (`project_id`, `section_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_status` ON `project_documentation` (`project_id`, `status`);
