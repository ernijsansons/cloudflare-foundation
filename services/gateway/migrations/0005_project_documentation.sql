-- Project documentation sections for comprehensive one-shot agentic development
CREATE TABLE IF NOT EXISTS `project_documentation` (
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
  UNIQUE (`project_id`, `section_id`, `subsection_key`)
);

CREATE INDEX IF NOT EXISTS `idx_project_docs_project` ON `project_documentation` (`project_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_section` ON `project_documentation` (`project_id`, `section_id`);
CREATE INDEX IF NOT EXISTS `idx_project_docs_status` ON `project_documentation` (`project_id`, `status`);

-- Section metadata tracking completeness and validation
CREATE TABLE IF NOT EXISTS `project_documentation_metadata` (
  `project_id` text PRIMARY KEY NOT NULL,
  `completeness_percentage` integer NOT NULL DEFAULT 0,
  `total_sections` integer NOT NULL DEFAULT 13,
  `populated_sections` integer NOT NULL DEFAULT 0,
  `required_unknowns_resolved` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL DEFAULT 'incomplete',
  `last_updated` integer NOT NULL,
  CHECK (`status` IN ('incomplete', 'complete', 'approved', 'archived'))
);

CREATE INDEX IF NOT EXISTS `idx_project_meta_status` ON `project_documentation_metadata` (`status`);
CREATE INDEX IF NOT EXISTS `idx_project_meta_completeness` ON `project_documentation_metadata` (`completeness_percentage`);
