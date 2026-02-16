-- Webhook destinations for outbound notifications
CREATE TABLE IF NOT EXISTS `webhook_destinations` (
  `id` text PRIMARY KEY NOT NULL,
  `tenant_id` text NOT NULL,
  `name` text NOT NULL DEFAULT '',
  `hostname` text NOT NULL,
  `url` text NOT NULL,
  `secret` text,
  `active` integer NOT NULL DEFAULT 1,
  `events` text NOT NULL DEFAULT '*',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_webhook_dest_tenant` ON `webhook_destinations` (`tenant_id`, `active`);
CREATE INDEX IF NOT EXISTS `idx_webhook_dest_hostname` ON `webhook_destinations` (`hostname`);
