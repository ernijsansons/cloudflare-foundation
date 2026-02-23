-- Cost Tracking Migration
-- Adds table for monitoring platform costs across all Cloudflare services

-- ============================================================================
-- COST TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_tracking (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'ai_tokens',
    'd1_operations',
    'r2_storage',
    'r2_bandwidth',
    'vectorize_queries',
    'vectorize_storage',
    'workers_compute',
    'kv_operations'
  )),
  timestamp INTEGER NOT NULL,
  units REAL NOT NULL, -- Tokens, operations, bytes, milliseconds, etc.
  estimated_cost REAL NOT NULL, -- USD
  metadata TEXT NOT NULL -- JSON: { modelName, operationType, artifactId, runId, phase, etc. }
);

CREATE INDEX idx_cost_tracking_category ON cost_tracking(category);
CREATE INDEX idx_cost_tracking_timestamp ON cost_tracking(timestamp DESC);
CREATE INDEX idx_cost_tracking_category_timestamp ON cost_tracking(category, timestamp DESC);

-- Index for artifact/run cost lookups
CREATE INDEX idx_cost_tracking_metadata_artifact ON cost_tracking(metadata) WHERE metadata LIKE '%artifactId%';
CREATE INDEX idx_cost_tracking_metadata_run ON cost_tracking(metadata) WHERE metadata LIKE '%runId%';

-- ============================================================================
-- COST BUDGETS TABLE (for alerts and limits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- NULL for overall budget, or specific category
  limit_usd REAL NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  alert_threshold REAL NOT NULL DEFAULT 0.8, -- Alert at 80% of limit
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_cost_budgets_enabled ON cost_budgets(enabled);
CREATE INDEX idx_cost_budgets_category ON cost_budgets(category);

-- ============================================================================
-- SAMPLE BUDGETS
-- ============================================================================

-- Overall monthly budget
INSERT INTO cost_budgets (id, name, category, limit_usd, period, alert_threshold, enabled, created_at, updated_at)
VALUES (
  'budget-overall-monthly',
  'Overall Monthly Budget',
  NULL,
  100.00, -- $100/month total
  'monthly',
  0.8,
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- AI tokens daily budget
INSERT INTO cost_budgets (id, name, category, limit_usd, period, alert_threshold, enabled, created_at, updated_at)
VALUES (
  'budget-ai-daily',
  'AI Tokens Daily Budget',
  'ai_tokens',
  5.00, -- $5/day for AI
  'daily',
  0.9,
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- D1 operations monthly budget
INSERT INTO cost_budgets (id, name, category, limit_usd, period, alert_threshold, enabled, created_at, updated_at)
VALUES (
  'budget-d1-monthly',
  'D1 Operations Monthly Budget',
  'd1_operations',
  10.00, -- $10/month for database
  'monthly',
  0.8,
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
