-- Migration: Add missing foreign key indexes
-- Created: 2026-02-23
-- Purpose: Add indexes for foreign key columns to improve query performance
--
-- Background:
-- Foreign key columns should always have indexes to optimize joins and lookups.
-- This migration adds indexes for FK columns that were missing from initial schema.
--
-- Note: D1 doesn't support explicit FK constraints, so referential integrity
-- is enforced at the application level. However, indexes are still needed for
-- performance.

-- Add index on users.tenant_id (FK to tenants.id)
CREATE INDEX IF NOT EXISTS `idx_users_tenant_id`
ON `users` (`tenant_id`);

-- Add index on audit_log.tenant_id (FK to tenants.id)
CREATE INDEX IF NOT EXISTS `idx_audit_log_tenant_id`
ON `audit_log` (`tenant_id`);

-- Note: The following indexes already exist and don't need to be recreated:
-- - idx_naomi_tasks_tenant (added in 0004_naomi_tenant.sql)
-- - idx_naomi_tasks_status (added in 0003_naomi_tables.sql)
-- - idx_naomi_logs_task_id (added in 0003_naomi_tables.sql)
-- - audit_chain_tenant_seq (composite index added in 0000_init.sql)
