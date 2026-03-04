CREATE TABLE `run_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`action` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`context` text,
	`requested_at` text DEFAULT (datetime('now')),
	`resolved_at` text,
	`resolved_by` text,
	`resolution` text
);
--> statement-breakpoint
CREATE TABLE `run_transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`from_state` text NOT NULL,
	`to_state` text NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`run_id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`task_type` text NOT NULL,
	`risk_level` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`objective` text NOT NULL,
	`branch` text NOT NULL,
	`bundle_r2_key` text,
	`report_r2_key` text,
	`session_id` text,
	`cost_usd` real DEFAULT 0,
	`num_turns` integer DEFAULT 0,
	`duration_ms` integer DEFAULT 0,
	`repair_attempts` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`started_at` text,
	`completed_at` text,
	`created_by` text DEFAULT 'openclaw',
	`tenant_id` text
);
