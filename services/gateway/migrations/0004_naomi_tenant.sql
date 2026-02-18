-- Add tenant_id to naomi_tasks for multi-tenant isolation
ALTER TABLE naomi_tasks ADD COLUMN tenant_id text DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_naomi_tasks_tenant ON naomi_tasks (tenant_id);
