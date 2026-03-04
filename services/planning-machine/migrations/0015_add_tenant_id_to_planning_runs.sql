-- Migration: Add tenant_id column to planning_runs table
-- This enables proper multi-tenant isolation for planning runs and their documentation

-- Add tenant_id column with default value
ALTER TABLE planning_runs ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- Create index for efficient tenant-based queries
CREATE INDEX IF NOT EXISTS idx_planning_runs_tenant_id ON planning_runs(tenant_id);

-- Update existing rows to have 'default' tenant_id (they already have it from default value)
-- This is explicit for clarity
UPDATE planning_runs SET tenant_id = 'default' WHERE tenant_id IS NULL;
