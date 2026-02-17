-- Naomi execution tasks linked to planning runs
CREATE TABLE IF NOT EXISTS `naomi_tasks` (
  `id` text PRIMARY KEY NOT NULL,
  `run_id` text NOT NULL,
  `repo_url` text NOT NULL,
  `agent` text NOT NULL DEFAULT 'claude',
  `status` text NOT NULL DEFAULT 'pending',
  `phase` text,
  `vm_id` text,
  `claimed_at` integer,
  `started_at` integer,
  `completed_at` integer,
  `retry_count` integer NOT NULL DEFAULT 0,
  `error` text,
  `created_at` integer NOT NULL,
  `updated_at` integer
);

CREATE INDEX IF NOT EXISTS `idx_naomi_tasks_run_id` ON `naomi_tasks` (`run_id`);
CREATE INDEX IF NOT EXISTS `idx_naomi_tasks_status` ON `naomi_tasks` (`status`);

-- Real-time execution logs for dashboard + Naomi
CREATE TABLE IF NOT EXISTS `naomi_execution_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `task_id` text NOT NULL,
  `phase` text,
  `level` text NOT NULL DEFAULT 'info',
  `message` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_naomi_logs_task_id` ON `naomi_execution_logs` (`task_id`);

-- Repo-level locks for execution isolation
CREATE TABLE IF NOT EXISTS `naomi_locks` (
  `repo_url` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `acquired_at` integer NOT NULL,
  `expires_at` integer NOT NULL
);
