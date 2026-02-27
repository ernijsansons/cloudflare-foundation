CREATE TABLE `escalations` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`from_operator_id` text NOT NULL,
	`to_supervisor_id` text,
	`reason` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolution` text,
	FOREIGN KEY (`from_operator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_supervisor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `handoffs` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`from_phase` text NOT NULL,
	`to_phase` text NOT NULL,
	`status` text NOT NULL,
	`artifact_id` text,
	`data` text NOT NULL,
	`instructions` text,
	`dependencies` text,
	`created_at` integer NOT NULL,
	`accepted_at` integer,
	`completed_at` integer,
	`rejected_at` integer,
	`rejection_reason` text
);
--> statement-breakpoint
CREATE TABLE `operator_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`timestamp` integer NOT NULL,
	`success` integer NOT NULL,
	`error_message` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `operator_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`decision_id` text NOT NULL,
	`operator_id` text NOT NULL,
	`operator_role` text NOT NULL,
	`action` text NOT NULL,
	`confidence` integer NOT NULL,
	`feedback` text,
	`revision_instructions` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `resolution_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`phase` text NOT NULL,
	`action` text NOT NULL,
	`result` text,
	`confidence` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`workflow_id`) REFERENCES `unknown_resolutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unknown_resolutions` (
	`id` text PRIMARY KEY NOT NULL,
	`unknown_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`unknown_id`) REFERENCES `unknowns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unknowns` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`phase_discovered` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`question` text NOT NULL,
	`context` text,
	`assumptions` text,
	`answer` text,
	`answered_in_phase` text,
	`answered_at` integer,
	`answered_by` text,
	`confidence` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'operator' NOT NULL;