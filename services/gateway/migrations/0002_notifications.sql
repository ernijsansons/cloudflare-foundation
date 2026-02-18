-- Notifications table for foundation-notifications queue consumer
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` text PRIMARY KEY NOT NULL,
  `tenant_id` text NOT NULL,
  `type` text NOT NULL,
  `title` text,
  `message` text,
  `metadata` text,
  `read` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_notifications_tenant` ON `notifications` (`tenant_id`);
CREATE INDEX IF NOT EXISTS `idx_notifications_created` ON `notifications` (`created_at` DESC);
