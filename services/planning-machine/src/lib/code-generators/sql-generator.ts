/**
 * SQL DDL Generator (Phase 1.6 + Phase 4: Foundation Invariants)
 * Generates executable SQL DDL from tech-arch database schema
 *
 * PHASE 4 ENHANCEMENT: Hard-wires foundation invariants (tenants, users, audit_chain, audit_log)
 * These tables are ALWAYS injected, even if the agent forgets them.
 */

import type { TechArchOutput } from "../../schemas/tech-arch";

/**
 * Foundation invariant tables that MUST exist in every Cloudflare Foundation project
 * These are hard-coded to prevent "invariant leaks" where agents forget core tables
 */
function generateFoundationTables(): string {
  const ddl: string[] = [];

  ddl.push("-- ============================================================================");
  ddl.push("-- FOUNDATION INVARIANTS (Phase 4: Hard-wired Core Tables)");
  ddl.push("-- These tables are MANDATORY for cloudflare-foundation-dev and cannot be omitted");
  ddl.push("-- ============================================================================");
  ddl.push("");

  // Table 1: tenants (Multi-tenancy core)
  ddl.push("-- Table: tenants (Multi-tenancy core)");
  ddl.push("CREATE TABLE IF NOT EXISTS tenants (");
  ddl.push("  id TEXT PRIMARY KEY,");
  ddl.push("  name TEXT NOT NULL,");
  ddl.push("  slug TEXT NOT NULL UNIQUE,");
  ddl.push("  plan TEXT DEFAULT 'free',  -- free, pro, enterprise");
  ddl.push("  status TEXT DEFAULT 'active',  -- active, suspended, deleted");
  ddl.push("  created_at INTEGER NOT NULL,");
  ddl.push("  updated_at INTEGER NOT NULL");
  ddl.push(");");
  ddl.push("");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);");
  ddl.push("");

  // Table 2: users (Authentication & Authorization)
  ddl.push("-- Table: users (Authentication & Authorization)");
  ddl.push("CREATE TABLE IF NOT EXISTS users (");
  ddl.push("  id TEXT PRIMARY KEY,");
  ddl.push("  tenant_id TEXT NOT NULL,");
  ddl.push("  email TEXT NOT NULL,");
  ddl.push("  name TEXT,");
  ddl.push("  role TEXT DEFAULT 'member',  -- admin, member, viewer");
  ddl.push("  status TEXT DEFAULT 'active',  -- active, suspended, deleted");
  ddl.push("  created_at INTEGER NOT NULL,");
  ddl.push("  updated_at INTEGER NOT NULL,");
  ddl.push("  last_login_at INTEGER,");
  ddl.push("  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE");
  ddl.push(");");
  ddl.push("");
  ddl.push("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_tenant ON users(email, tenant_id);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);");
  ddl.push("");

  // Table 3: audit_chain (Plane 10 Security - Immutable Audit Log)
  ddl.push("-- Table: audit_chain (Plane 10 Security - SOC2/HIPAA Immutable Audit Log)");
  ddl.push("CREATE TABLE IF NOT EXISTS audit_chain (");
  ddl.push("  id INTEGER PRIMARY KEY AUTOINCREMENT,");
  ddl.push("  tenant_id TEXT NOT NULL,");
  ddl.push("  event_type TEXT NOT NULL,");
  ddl.push("  event_data TEXT NOT NULL,  -- JSON blob");
  ddl.push("  previous_hash TEXT,  -- NULL for first event");
  ddl.push("  current_hash TEXT NOT NULL,  -- SHA-256(previous_hash + event_data + timestamp + actor_id)");
  ddl.push("  timestamp INTEGER NOT NULL,");
  ddl.push("  actor_id TEXT NOT NULL,  -- user_id or system");
  ddl.push("  CONSTRAINT fk_audit_chain_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE");
  ddl.push(");");
  ddl.push("");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_chain_tenant ON audit_chain(tenant_id, timestamp);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_chain_hash ON audit_chain(current_hash);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_chain_event_type ON audit_chain(event_type);");
  ddl.push("");

  // Table 4: audit_log (Regular Audit Log - Queryable, Mutable)
  ddl.push("-- Table: audit_log (Regular Audit Log - Queryable, Mutable)");
  ddl.push("CREATE TABLE IF NOT EXISTS audit_log (");
  ddl.push("  id TEXT PRIMARY KEY,");
  ddl.push("  tenant_id TEXT NOT NULL,");
  ddl.push("  user_id TEXT,");
  ddl.push("  action TEXT NOT NULL,  -- create, update, delete, login, etc.");
  ddl.push("  resource_type TEXT,  -- table name or resource type");
  ddl.push("  resource_id TEXT,");
  ddl.push("  metadata TEXT,  -- JSON blob with action details");
  ddl.push("  ip_address TEXT,");
  ddl.push("  user_agent TEXT,");
  ddl.push("  created_at INTEGER NOT NULL,");
  ddl.push("  CONSTRAINT fk_audit_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE");
  ddl.push(");");
  ddl.push("");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id, created_at);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);");
  ddl.push("CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);");
  ddl.push("");

  ddl.push("-- ============================================================================");
  ddl.push("-- END FOUNDATION INVARIANTS");
  ddl.push("-- ============================================================================");
  ddl.push("");

  return ddl.join("\n");
}

export function generateSQLDDL(techArchOutput: TechArchOutput): string {
  const ddl: string[] = [];

  ddl.push("-- Auto-generated SQL DDL from Planning Machine (Phase 4: Foundation Invariants)");
  ddl.push("-- Generated: " + new Date().toISOString());
  ddl.push("");

  // PHASE 4: Inject foundation invariants FIRST (always present)
  ddl.push(generateFoundationTables());

  // Check if product has custom tables
  if (!techArchOutput.databaseSchema?.tables || techArchOutput.databaseSchema.tables.length === 0) {
    ddl.push("-- No product-specific tables defined (foundation tables only)");
    ddl.push("");
    return ddl.join("\n");
  }

  ddl.push("-- ============================================================================");
  ddl.push("-- PRODUCT-SPECIFIC TABLES");
  ddl.push("-- ============================================================================");
  ddl.push("");

  const tables = techArchOutput.databaseSchema.tables;

  // Filter out foundation tables if agent included them (prevent duplicates)
  const foundationTableNames = new Set(['tenants', 'users', 'audit_chain', 'audit_log']);
  const productTables = tables.filter(t =>
    typeof t === 'object' && t.name && !foundationTableNames.has(t.name)
  );

  // Generate CREATE TABLE statements for product-specific tables
  for (const table of productTables) {
    if (!Array.isArray(table.columns)) {
      continue; // Skip invalid tables
    }

    ddl.push(`-- Table: ${table.name}`);
    ddl.push(`CREATE TABLE IF NOT EXISTS ${table.name} (`);

    const columnDefs: string[] = [];

    // Column definitions
    for (const col of table.columns) {
      if (typeof col !== 'object') continue;

      let colDef = `  ${col.name} ${col.type}`;

      if (col.primaryKey) colDef += " PRIMARY KEY";
      if (!col.nullable && !col.primaryKey) colDef += " NOT NULL";
      if (col.unique && !col.primaryKey) colDef += " UNIQUE";
      if (col.defaultValue) colDef += ` DEFAULT ${col.defaultValue}`;

      columnDefs.push(colDef);

      // Foreign key constraints
      if (col.references) {
        const fkName = `fk_${table.name}_${col.name}`;
        const fkDef = `  CONSTRAINT ${fkName} FOREIGN KEY (${col.name}) REFERENCES ${col.references.table}(${col.references.column}) ON DELETE ${col.references.onDelete || 'CASCADE'}`;
        columnDefs.push(fkDef);
      }
    }

    ddl.push(columnDefs.join(",\n"));
    ddl.push(");");
    ddl.push("");

    // Index creation
    if (table.indexes && Array.isArray(table.indexes)) {
      for (const idx of table.indexes) {
        if (typeof idx !== 'object') continue;
        const uniqueClause = idx.unique ? "UNIQUE " : "";
        const idxColumns = Array.isArray(idx.columns) ? idx.columns.join(", ") : idx.columns;
        ddl.push(`CREATE ${uniqueClause}INDEX IF NOT EXISTS ${idx.name} ON ${table.name}(${idxColumns});`);
      }
      if (table.indexes.length > 0) ddl.push("");
    }
  }

  // NOTE: audit_chain is now a foundation invariant (always injected above)
  // Old conditional logic removed in Phase 4

  return ddl.join("\n");
}
