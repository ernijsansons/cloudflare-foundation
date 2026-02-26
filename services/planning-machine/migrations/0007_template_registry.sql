-- Migration: 0007_template_registry
-- Project Factory v3.0 - Template Registry and CF Capabilities

-- Template registry: 22+ official CF templates + 5 BIBLE patterns
CREATE TABLE IF NOT EXISTS template_registry (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('cloudflare', 'bible', 'community')),
  category TEXT NOT NULL,
  framework TEXT NOT NULL,
  bindings TEXT NOT NULL DEFAULT '[]',  -- JSON array of binding types
  complexity INTEGER NOT NULL CHECK (complexity >= 1 AND complexity <= 5),
  estimated_cost_low REAL NOT NULL DEFAULT 0,
  estimated_cost_mid REAL NOT NULL DEFAULT 0,
  estimated_cost_high REAL NOT NULL DEFAULT 0,
  repo_url TEXT,
  docs_url TEXT,
  last_scanned TEXT,
  deprecated INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON array of tags
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CF Capabilities: all Cloudflare products with pricing
CREATE TABLE IF NOT EXISTS cf_capabilities (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  binding_type TEXT NOT NULL,
  has_free_quota INTEGER NOT NULL DEFAULT 0,
  free_quota TEXT,
  paid_pricing TEXT,
  best_for TEXT NOT NULL DEFAULT '[]',  -- JSON array
  limitations TEXT DEFAULT '[]',  -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_template_source ON template_registry(source);
CREATE INDEX IF NOT EXISTS idx_template_category ON template_registry(category);
CREATE INDEX IF NOT EXISTS idx_template_framework ON template_registry(framework);
CREATE INDEX IF NOT EXISTS idx_template_complexity ON template_registry(complexity);
CREATE INDEX IF NOT EXISTS idx_template_cost_mid ON template_registry(estimated_cost_mid);
CREATE INDEX IF NOT EXISTS idx_capability_binding ON cf_capabilities(binding_type);
CREATE INDEX IF NOT EXISTS idx_capability_free ON cf_capabilities(has_free_quota);
