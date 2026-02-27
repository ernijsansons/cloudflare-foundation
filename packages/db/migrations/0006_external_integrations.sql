-- External Integrations Migration
-- Adds tables for external tool integrations, webhooks, and event publishing

-- ============================================================================
-- INTEGRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'slack', 'api', 'database', 'storage', 'analytics', 'notification')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error', 'pending')) DEFAULT 'active',
  config TEXT NOT NULL, -- JSON: { url, apiKey, secret, channel, headers, retryPolicy, timeout, metadata }
  events TEXT NOT NULL, -- JSON array: ['artifact.created', 'quality.scored', etc.]
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_created_at ON integrations(created_at DESC);

-- ============================================================================
-- INTEGRATION EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_events (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'artifact.created',
    'artifact.updated',
    'artifact.completed',
    'quality.scored',
    'review.submitted',
    'escalation.created',
    'run.started',
    'run.completed',
    'run.failed'
  )),
  payload TEXT NOT NULL, -- JSON event payload
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')) DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  timestamp INTEGER NOT NULL,
  last_attempt INTEGER,
  error TEXT,
  FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);

CREATE INDEX idx_integration_events_integration_id ON integration_events(integration_id);
CREATE INDEX idx_integration_events_event_type ON integration_events(event_type);
CREATE INDEX idx_integration_events_delivery_status ON integration_events(delivery_status);
CREATE INDEX idx_integration_events_timestamp ON integration_events(timestamp DESC);
CREATE INDEX idx_integration_events_retry ON integration_events(delivery_status, retry_count) WHERE delivery_status IN ('failed', 'retrying');

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Example Slack integration
INSERT INTO integrations (id, name, type, status, config, events, created_at, updated_at)
VALUES (
  'example-slack-001',
  'Engineering Slack Channel',
  'slack',
  'inactive', -- Inactive by default, user must configure and activate
  '{"url":"https://hooks.slack.com/services/YOUR/WEBHOOK/URL","channel":"#engineering","timeout":5000}',
  '["artifact.completed","escalation.created","run.failed"]',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Example generic webhook
INSERT INTO integrations (id, name, type, status, config, events, created_at, updated_at)
VALUES (
  'example-webhook-001',
  'External Dashboard Webhook',
  'webhook',
  'inactive',
  '{"url":"https://api.example.com/webhooks/planning","secret":"your-webhook-secret","timeout":10000,"retryPolicy":{"maxRetries":5,"backoffMs":1000,"maxBackoffMs":60000,"backoffMultiplier":2}}',
  '["artifact.created","artifact.completed","quality.scored"]',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
