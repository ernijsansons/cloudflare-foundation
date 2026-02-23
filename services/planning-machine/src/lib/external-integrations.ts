/**
 * External Tools Integration - Connect with external services and APIs
 *
 * Supports webhooks, third-party APIs, data connectors, and event publishing
 */

import type { PhaseName } from '@foundation/shared';

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationType =
  | 'webhook'
  | 'slack'
  | 'api'
  | 'database'
  | 'storage'
  | 'analytics'
  | 'notification';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export type EventType =
  | 'artifact.created'
  | 'artifact.updated'
  | 'artifact.completed'
  | 'quality.scored'
  | 'review.submitted'
  | 'escalation.created'
  | 'run.started'
  | 'run.completed'
  | 'run.failed';

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: IntegrationConfig;
  events: EventType[]; // Events this integration subscribes to
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  url?: string; // For webhooks, APIs
  apiKey?: string; // For API authentication
  secret?: string; // For webhook signature verification
  channel?: string; // For Slack, Discord, etc.
  headers?: Record<string, string>; // Custom headers
  retryPolicy?: RetryPolicy;
  timeout?: number; // Request timeout in ms
  metadata?: Record<string, unknown>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number; // Initial backoff
  maxBackoffMs: number; // Maximum backoff
  backoffMultiplier: number; // Exponential backoff multiplier
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  eventType: EventType;
  payload: unknown;
  timestamp: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'retrying';
  retryCount: number;
  lastAttempt?: Date;
  error?: string;
}

export interface WebhookPayload {
  event: EventType;
  timestamp: string;
  runId?: string;
  artifactId?: string;
  phase?: PhaseName;
  data: unknown;
  signature?: string; // HMAC signature for verification
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
}

// ============================================================================
// WEBHOOK INTEGRATION
// ============================================================================

/**
 * Send webhook event to external service
 */
export async function sendWebhook(
  integration: Integration,
  event: EventType,
  payload: unknown
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  if (!integration.config.url) {
    return { success: false, error: 'Webhook URL not configured' };
  }

  const webhookPayload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  // Add HMAC signature if secret is configured
  if (integration.config.secret) {
    webhookPayload.signature = await generateHmacSignature(
      JSON.stringify(webhookPayload.data),
      integration.config.secret
    );
  }

  try {
    const response = await fetch(integration.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PlanningMachine/1.0',
        ...integration.config.headers,
      },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(integration.config.timeout || 10000),
    });

    if (response.ok) {
      return { success: true, statusCode: response.status };
    } else {
      return {
        success: false,
        statusCode: response.status,
        error: await response.text(),
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HMAC signature for webhook verification
 */
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateHmacSignature(payload, secret);
  return signature === expectedSignature;
}

// ============================================================================
// SLACK INTEGRATION
// ============================================================================

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  integration: Integration,
  message: SlackMessage
): Promise<{ success: boolean; error?: string }> {
  if (!integration.config.url) {
    return { success: false, error: 'Slack webhook URL not configured' };
  }

  try {
    const response = await fetch(integration.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: await response.text() };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format artifact completion for Slack
 */
export function formatArtifactCompletionMessage(
  artifactId: string,
  phase: PhaseName,
  qualityScore: number,
  runId: string
): SlackMessage {
  const color = qualityScore >= 85 ? 'good' : qualityScore >= 70 ? 'warning' : 'danger';
  const emoji = qualityScore >= 85 ? '✅' : qualityScore >= 70 ? '⚠️' : '❌';

  return {
    channel: '', // Will be filled from integration config
    text: `${emoji} Artifact completed for ${phase} phase`,
    attachments: [
      {
        color,
        title: `${phase} Phase Artifact`,
        text: `Quality Score: ${qualityScore}/100`,
        fields: [
          {
            title: 'Artifact ID',
            value: artifactId,
            short: true,
          },
          {
            title: 'Run ID',
            value: runId,
            short: true,
          },
          {
            title: 'Quality',
            value: qualityScore >= 85 ? 'Production Ready' : 'Needs Review',
            short: true,
          },
        ],
      },
    ],
  };
}

/**
 * Format escalation for Slack
 */
export function formatEscalationMessage(
  escalationId: string,
  priority: string,
  reason: string,
  artifactId: string
): SlackMessage {
  const color = priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : '#439FE0';
  const emoji = priority === 'urgent' ? '🚨' : priority === 'high' ? '⚠️' : 'ℹ️';

  return {
    channel: '',
    text: `${emoji} New escalation: ${reason}`,
    attachments: [
      {
        color,
        title: 'Escalation Created',
        text: reason,
        fields: [
          {
            title: 'Priority',
            value: priority.toUpperCase(),
            short: true,
          },
          {
            title: 'Artifact ID',
            value: artifactId,
            short: true,
          },
          {
            title: 'Escalation ID',
            value: escalationId,
            short: false,
          },
        ],
      },
    ],
  };
}

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Make authenticated API request to external service
 */
export async function callExternalApi<T = unknown>(
  integration: Integration,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!integration.config.url) {
    return { success: false, error: 'API URL not configured' };
  }

  const url = `${integration.config.url}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...integration.config.headers,
  };

  if (integration.config.apiKey) {
    headers['Authorization'] = `Bearer ${integration.config.apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(integration.config.timeout || 10000),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data as T };
    } else {
      return {
        success: false,
        error: `API error: ${response.status} ${await response.text()}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EVENT PUBLISHING
// ============================================================================

/**
 * Publish event to all subscribed integrations
 */
export async function publishEvent(
  db: D1Database,
  eventType: EventType,
  payload: unknown
): Promise<{ published: number; failed: number }> {
  // Get all active integrations subscribed to this event
  const result = await db.prepare(`
    SELECT * FROM integrations
    WHERE status = 'active'
    AND events LIKE ?
  `).bind(`%${eventType}%`).all();

  if (!result.results || result.results.length === 0) {
    return { published: 0, failed: 0 };
  }

  let published = 0;
  let failed = 0;

  for (const row of result.results as any[]) {
    const integration: Integration = {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      config: JSON.parse(row.config),
      events: JSON.parse(row.events),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    // Create event record
    const eventId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO integration_events (id, integration_id, event_type, payload, delivery_status, retry_count, timestamp)
      VALUES (?, ?, ?, ?, 'pending', 0, ?)
    `).bind(eventId, integration.id, eventType, JSON.stringify(payload), Date.now()).run();

    // Attempt delivery
    const result = await deliverEvent(integration, eventType, payload);

    if (result.success) {
      published++;
      await db.prepare(`
        UPDATE integration_events
        SET delivery_status = 'delivered', last_attempt = ?
        WHERE id = ?
      `).bind(Date.now(), eventId).run();
    } else {
      failed++;
      await db.prepare(`
        UPDATE integration_events
        SET delivery_status = 'failed', error = ?, last_attempt = ?
        WHERE id = ?
      `).bind(result.error || 'Unknown error', Date.now(), eventId).run();
    }
  }

  return { published, failed };
}

/**
 * Deliver event to integration based on type
 */
async function deliverEvent(
  integration: Integration,
  eventType: EventType,
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  switch (integration.type) {
    case 'webhook':
      return sendWebhook(integration, eventType, payload);

    case 'slack':
      // Format payload as Slack message if needed
      if (typeof payload === 'object' && payload !== null && 'channel' in payload) {
        return sendSlackMessage(integration, payload as SlackMessage);
      }
      return { success: false, error: 'Invalid Slack message format' };

    case 'api':
      return callExternalApi(integration, '/events', 'POST', { event: eventType, data: payload });

    default:
      return { success: false, error: `Unsupported integration type: ${integration.type}` };
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Retry failed event deliveries
 */
export async function retryFailedEvents(db: D1Database): Promise<{ retried: number; succeeded: number }> {
  // Get failed events that haven't exceeded retry limit
  const result = await db.prepare(`
    SELECT ie.*, i.*
    FROM integration_events ie
    JOIN integrations i ON ie.integration_id = i.id
    WHERE ie.delivery_status IN ('failed', 'retrying')
    AND ie.retry_count < 5
    AND i.status = 'active'
    ORDER BY ie.timestamp ASC
    LIMIT 100
  `).all();

  if (!result.results || result.results.length === 0) {
    return { retried: 0, succeeded: 0 };
  }

  let retried = 0;
  let succeeded = 0;

  for (const row of result.results as any[]) {
    const integration: Integration = {
      id: row.integration_id,
      name: row.name,
      type: row.type,
      status: row.status,
      config: JSON.parse(row.config),
      events: JSON.parse(row.events),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    const payload = JSON.parse(row.payload);
    const retryCount = row.retry_count + 1;

    // Calculate backoff
    const retryPolicy = integration.config.retryPolicy || {
      maxRetries: 5,
      backoffMs: 1000,
      maxBackoffMs: 60000,
      backoffMultiplier: 2,
    };

    const backoff = Math.min(
      retryPolicy.backoffMs * Math.pow(retryPolicy.backoffMultiplier, retryCount - 1),
      retryPolicy.maxBackoffMs
    );

    // Wait for backoff
    await new Promise(resolve => setTimeout(resolve, backoff));

    // Attempt delivery
    retried++;
    const deliveryResult = await deliverEvent(integration, row.event_type, payload);

    if (deliveryResult.success) {
      succeeded++;
      await db.prepare(`
        UPDATE integration_events
        SET delivery_status = 'delivered', retry_count = ?, last_attempt = ?
        WHERE id = ?
      `).bind(retryCount, Date.now(), row.id).run();
    } else {
      await db.prepare(`
        UPDATE integration_events
        SET delivery_status = 'retrying', retry_count = ?, error = ?, last_attempt = ?
        WHERE id = ?
      `).bind(retryCount, deliveryResult.error || 'Unknown error', Date.now(), row.id).run();
    }
  }

  return { retried, succeeded };
}

// ============================================================================
// INTEGRATION MANAGEMENT
// ============================================================================

/**
 * Create new integration
 */
export async function createIntegration(
  db: D1Database,
  integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.prepare(`
    INSERT INTO integrations (id, name, type, status, config, events, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    integration.name,
    integration.type,
    integration.status,
    JSON.stringify(integration.config),
    JSON.stringify(integration.events),
    now,
    now
  ).run();

  return id;
}

/**
 * Update integration
 */
export async function updateIntegration(
  db: D1Database,
  integrationId: string,
  updates: Partial<Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const setClauses: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.status !== undefined) {
    setClauses.push('status = ?');
    values.push(updates.status);
  }
  if (updates.config !== undefined) {
    setClauses.push('config = ?');
    values.push(JSON.stringify(updates.config));
  }
  if (updates.events !== undefined) {
    setClauses.push('events = ?');
    values.push(JSON.stringify(updates.events));
  }

  setClauses.push('updated_at = ?');
  values.push(Date.now());

  values.push(integrationId);

  await db.prepare(`
    UPDATE integrations
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `).bind(...values).run();
}

/**
 * Delete integration
 */
export async function deleteIntegration(db: D1Database, integrationId: string): Promise<void> {
  await db.prepare('DELETE FROM integrations WHERE id = ?').bind(integrationId).run();
  await db.prepare('DELETE FROM integration_events WHERE integration_id = ?').bind(integrationId).run();
}

/**
 * Get integration by ID
 */
export async function getIntegration(db: D1Database, integrationId: string): Promise<Integration | null> {
  const result = await db.prepare('SELECT * FROM integrations WHERE id = ?').bind(integrationId).first();

  if (!result) return null;

  const row = result as any;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    config: JSON.parse(row.config),
    events: JSON.parse(row.events),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * List all integrations
 */
export async function listIntegrations(
  db: D1Database,
  filters?: { type?: IntegrationType; status?: IntegrationStatus }
): Promise<Integration[]> {
  let query = 'SELECT * FROM integrations';
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters?.type) {
    conditions.push('type = ?');
    values.push(filters.type);
  }
  if (filters?.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await db.prepare(query).bind(...values).all();

  if (!result.results) return [];

  return result.results.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    config: JSON.parse(row.config),
    events: JSON.parse(row.events),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}
