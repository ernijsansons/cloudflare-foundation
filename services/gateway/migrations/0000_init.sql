-- Foundation v2.5 initial schema
CREATE TABLE `tenants` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `plan` text NOT NULL DEFAULT 'free',
  `created_at` integer NOT NULL
);

CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `tenant_id` text NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `created_at` integer NOT NULL
);

CREATE TABLE `audit_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tenant_id` text NOT NULL,
  `event` text NOT NULL,
  `data` text,
  `timestamp` integer NOT NULL
);

CREATE TABLE `audit_chain` (
  `tenant_id` text NOT NULL,
  `seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `event_type` text NOT NULL,
  `payload` text NOT NULL,
  `previous_hash` text NOT NULL,
  `hash` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `audit_chain_tenant_seq` ON `audit_chain` (`tenant_id`, `seq`);
