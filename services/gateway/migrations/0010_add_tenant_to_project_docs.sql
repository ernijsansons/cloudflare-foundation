-- Migration: Add tenant_id to project documentation tables for multi-tenant isolation
-- This addresses the critical security vulnerability where any authenticated user
-- can access any project's documentation by knowing the projectId.

-- Add tenant_id column to project_documentation
ALTER TABLE project_documentation ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- Add tenant_id column to project_documentation_metadata
ALTER TABLE project_documentation_metadata ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';

-- Create composite indexes for efficient tenant-scoped queries
CREATE INDEX idx_project_docs_tenant_project ON project_documentation(tenant_id, project_id);
CREATE INDEX idx_project_docs_tenant_section ON project_documentation(tenant_id, project_id, section_id);
CREATE INDEX idx_project_meta_tenant ON project_documentation_metadata(tenant_id, project_id);

-- Note: Foreign key constraints for tenant_id can be added later if needed
-- ALTER TABLE project_documentation ADD CONSTRAINT fk_project_docs_tenant
--   FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
-- ALTER TABLE project_documentation_metadata ADD CONSTRAINT fk_project_meta_tenant
--   FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
