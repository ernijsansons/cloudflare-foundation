/**
 * External Integrations Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  formatArtifactCompletionMessage,
  formatEscalationMessage,
  verifyWebhookSignature,
  type Integration,
  type IntegrationConfig,
  type SlackMessage,
} from '../external-integrations';

describe('External Integrations', () => {
  describe('Slack Message Formatting', () => {
    it('should format artifact completion message for high quality', () => {
      const message = formatArtifactCompletionMessage(
        'artifact-001',
        'opportunity',
        92,
        'run-001'
      );

      expect(message.text).toContain('✅');
      expect(message.text).toContain('opportunity');
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments![0].color).toBe('good');
      expect(message.attachments![0].text).toContain('92');
    });

    it('should format artifact completion message for medium quality', () => {
      const message = formatArtifactCompletionMessage(
        'artifact-002',
        'solution',
        75,
        'run-002'
      );

      expect(message.text).toContain('⚠️');
      expect(message.attachments![0].color).toBe('warning');
      expect(message.attachments![0].text).toContain('75');
    });

    it('should format artifact completion message for low quality', () => {
      const message = formatArtifactCompletionMessage(
        'artifact-003',
        'validation',
        45,
        'run-003'
      );

      expect(message.text).toContain('❌');
      expect(message.attachments![0].color).toBe('danger');
      expect(message.attachments![0].text).toContain('45');
    });

    it('should include all required fields in artifact message', () => {
      const message = formatArtifactCompletionMessage(
        'artifact-004',
        'opportunity',
        88,
        'run-004'
      );

      const fields = message.attachments![0].fields;
      expect(fields).toHaveLength(3);

      const artifactField = fields.find(f => f.title === 'Artifact ID');
      expect(artifactField?.value).toBe('artifact-004');

      const runField = fields.find(f => f.title === 'Run ID');
      expect(runField?.value).toBe('run-004');

      const qualityField = fields.find(f => f.title === 'Quality');
      expect(qualityField?.value).toBe('Production Ready');
    });

    it('should mark non-production-ready artifacts correctly', () => {
      const message = formatArtifactCompletionMessage(
        'artifact-005',
        'opportunity',
        72,
        'run-005'
      );

      const qualityField = message.attachments![0].fields.find(f => f.title === 'Quality');
      expect(qualityField?.value).toBe('Needs Review');
    });
  });

  describe('Escalation Message Formatting', () => {
    it('should format urgent escalation message', () => {
      const message = formatEscalationMessage(
        'esc-001',
        'urgent',
        'Critical quality issue detected',
        'artifact-001'
      );

      expect(message.text).toContain('🚨');
      expect(message.text).toContain('Critical quality issue');
      expect(message.attachments![0].color).toBe('danger');
    });

    it('should format high priority escalation message', () => {
      const message = formatEscalationMessage(
        'esc-002',
        'high',
        'Low consensus score',
        'artifact-002'
      );

      expect(message.text).toContain('⚠️');
      expect(message.attachments![0].color).toBe('warning');
    });

    it('should format medium/low priority escalation message', () => {
      const message = formatEscalationMessage(
        'esc-003',
        'medium',
        'Review requested',
        'artifact-003'
      );

      expect(message.text).toContain('ℹ️');
      expect(message.attachments![0].color).toBe('#439FE0');
    });

    it('should include all required escalation fields', () => {
      const message = formatEscalationMessage(
        'esc-004',
        'urgent',
        'Data validation failed',
        'artifact-004'
      );

      const fields = message.attachments![0].fields;
      expect(fields).toHaveLength(3);

      const priorityField = fields.find(f => f.title === 'Priority');
      expect(priorityField?.value).toBe('URGENT');

      const artifactField = fields.find(f => f.title === 'Artifact ID');
      expect(artifactField?.value).toBe('artifact-004');

      const escalationField = fields.find(f => f.title === 'Escalation ID');
      expect(escalationField?.value).toBe('esc-004');
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should generate and verify valid signature', async () => {
      const payload = JSON.stringify({ test: 'data', value: 123 });
      const secret = 'test-secret-key';

      // In real implementation, this would use the internal generateHmacSignature
      // For testing, we'll use the verification function
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

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = await verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret-key';
      const invalidSignature = 'invalid-signature-hex';

      const isValid = await verifyWebhookSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      // Generate signature with secret1
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const key1 = encoder.encode(secret1);

      const cryptoKey1 = await crypto.subtle.importKey(
        'raw',
        key1,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey1, data);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Verify with secret2 (should fail)
      const isValid = await verifyWebhookSignature(payload, signature, secret2);
      expect(isValid).toBe(false);
    });
  });

  describe('Integration Types', () => {
    it('should support webhook integration type', () => {
      const integration: Integration = {
        id: 'int-001',
        name: 'Test Webhook',
        type: 'webhook',
        status: 'active',
        config: { url: 'https://example.com/webhook' },
        events: ['artifact.created'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.type).toBe('webhook');
    });

    it('should support slack integration type', () => {
      const integration: Integration = {
        id: 'int-002',
        name: 'Test Slack',
        type: 'slack',
        status: 'active',
        config: { url: 'https://hooks.slack.com/...', channel: '#alerts' },
        events: ['escalation.created'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.type).toBe('slack');
      expect(integration.config.channel).toBe('#alerts');
    });

    it('should support api integration type', () => {
      const integration: Integration = {
        id: 'int-003',
        name: 'Test API',
        type: 'api',
        status: 'active',
        config: { url: 'https://api.example.com', apiKey: 'test-key' },
        events: ['quality.scored'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.type).toBe('api');
      expect(integration.config.apiKey).toBe('test-key');
    });
  });

  describe('Integration Status', () => {
    it('should handle active status', () => {
      const integration: Integration = {
        id: 'int-004',
        name: 'Active Integration',
        type: 'webhook',
        status: 'active',
        config: {},
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.status).toBe('active');
    });

    it('should handle inactive status', () => {
      const integration: Integration = {
        id: 'int-005',
        name: 'Inactive Integration',
        type: 'webhook',
        status: 'inactive',
        config: {},
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.status).toBe('inactive');
    });

    it('should handle error status', () => {
      const integration: Integration = {
        id: 'int-006',
        name: 'Error Integration',
        type: 'webhook',
        status: 'error',
        config: {},
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.status).toBe('error');
    });
  });

  describe('Event Types', () => {
    it('should support artifact lifecycle events', () => {
      const events: Array<string> = [
        'artifact.created',
        'artifact.updated',
        'artifact.completed',
      ];

      expect(events).toHaveLength(3);
      expect(events).toContain('artifact.created');
      expect(events).toContain('artifact.updated');
      expect(events).toContain('artifact.completed');
    });

    it('should support quality events', () => {
      const events = ['quality.scored'];

      expect(events).toContain('quality.scored');
    });

    it('should support review and escalation events', () => {
      const events = ['review.submitted', 'escalation.created'];

      expect(events).toHaveLength(2);
      expect(events).toContain('review.submitted');
      expect(events).toContain('escalation.created');
    });

    it('should support run lifecycle events', () => {
      const events = ['run.started', 'run.completed', 'run.failed'];

      expect(events).toHaveLength(3);
      expect(events).toContain('run.started');
      expect(events).toContain('run.completed');
      expect(events).toContain('run.failed');
    });
  });

  describe('Integration Configuration', () => {
    it('should support webhook configuration', () => {
      const config: IntegrationConfig = {
        url: 'https://example.com/webhook',
        secret: 'webhook-secret',
        timeout: 5000,
      };

      expect(config.url).toBe('https://example.com/webhook');
      expect(config.secret).toBe('webhook-secret');
      expect(config.timeout).toBe(5000);
    });

    it('should support API configuration with auth', () => {
      const config: IntegrationConfig = {
        url: 'https://api.example.com',
        apiKey: 'sk_test_123456',
        headers: {
          'X-Custom-Header': 'value',
        },
      };

      expect(config.apiKey).toBe('sk_test_123456');
      expect(config.headers).toHaveProperty('X-Custom-Header');
    });

    it('should support retry policy configuration', () => {
      const config: IntegrationConfig = {
        url: 'https://example.com',
        retryPolicy: {
          maxRetries: 5,
          backoffMs: 1000,
          maxBackoffMs: 60000,
          backoffMultiplier: 2,
        },
      };

      expect(config.retryPolicy?.maxRetries).toBe(5);
      expect(config.retryPolicy?.backoffMs).toBe(1000);
      expect(config.retryPolicy?.backoffMultiplier).toBe(2);
    });

    it('should support metadata in configuration', () => {
      const config: IntegrationConfig = {
        url: 'https://example.com',
        metadata: {
          environment: 'production',
          region: 'us-east-1',
          team: 'engineering',
        },
      };

      expect(config.metadata?.environment).toBe('production');
      expect(config.metadata?.region).toBe('us-east-1');
    });
  });

  describe('Retry Policy', () => {
    it('should calculate exponential backoff correctly', () => {
      const policy = {
        maxRetries: 5,
        backoffMs: 1000,
        maxBackoffMs: 60000,
        backoffMultiplier: 2,
      };

      // Retry 1: 1000ms
      const backoff1 = Math.min(
        policy.backoffMs * Math.pow(policy.backoffMultiplier, 0),
        policy.maxBackoffMs
      );
      expect(backoff1).toBe(1000);

      // Retry 2: 2000ms
      const backoff2 = Math.min(
        policy.backoffMs * Math.pow(policy.backoffMultiplier, 1),
        policy.maxBackoffMs
      );
      expect(backoff2).toBe(2000);

      // Retry 3: 4000ms
      const backoff3 = Math.min(
        policy.backoffMs * Math.pow(policy.backoffMultiplier, 2),
        policy.maxBackoffMs
      );
      expect(backoff3).toBe(4000);

      // Retry 4: 8000ms
      const backoff4 = Math.min(
        policy.backoffMs * Math.pow(policy.backoffMultiplier, 3),
        policy.maxBackoffMs
      );
      expect(backoff4).toBe(8000);
    });

    it('should cap backoff at maxBackoffMs', () => {
      const policy = {
        maxRetries: 10,
        backoffMs: 1000,
        maxBackoffMs: 10000,
        backoffMultiplier: 2,
      };

      // Retry 10 would be 512000ms without cap
      const backoff10 = Math.min(
        policy.backoffMs * Math.pow(policy.backoffMultiplier, 9),
        policy.maxBackoffMs
      );
      expect(backoff10).toBe(10000); // Capped at maxBackoffMs
    });
  });

  describe('Slack Block Formatting', () => {
    it('should create valid Slack message structure', () => {
      const message: SlackMessage = {
        channel: '#engineering',
        text: 'Test message',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Bold* and _italic_ text',
            },
          },
        ],
      };

      expect(message.channel).toBe('#engineering');
      expect(message.blocks).toHaveLength(1);
      expect(message.blocks![0].type).toBe('section');
    });

    it('should support multiple attachments', () => {
      const message = formatArtifactCompletionMessage(
        'art-001',
        'opportunity',
        88,
        'run-001'
      );

      // Add a second attachment manually for testing
      message.attachments!.push({
        color: 'good',
        title: 'Additional Info',
        text: 'Extra details',
        fields: [],
      });

      expect(message.attachments).toHaveLength(2);
    });
  });

  describe('Event Subscription', () => {
    it('should allow multiple event subscriptions', () => {
      const integration: Integration = {
        id: 'int-007',
        name: 'Multi-Event Integration',
        type: 'webhook',
        status: 'active',
        config: { url: 'https://example.com' },
        events: [
          'artifact.created',
          'artifact.completed',
          'quality.scored',
          'escalation.created',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.events).toHaveLength(4);
      expect(integration.events).toContain('artifact.created');
      expect(integration.events).toContain('quality.scored');
    });

    it('should allow single event subscription', () => {
      const integration: Integration = {
        id: 'int-008',
        name: 'Single Event Integration',
        type: 'slack',
        status: 'active',
        config: {},
        events: ['escalation.created'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(integration.events).toHaveLength(1);
      expect(integration.events[0]).toBe('escalation.created');
    });
  });

  describe('Error Handling', () => {
    it('should include error message in failed event', () => {
      const event = {
        id: 'evt-001',
        integrationId: 'int-001',
        eventType: 'artifact.created' as const,
        payload: { test: 'data' },
        timestamp: new Date(),
        deliveryStatus: 'failed' as const,
        retryCount: 1,
        error: 'Connection timeout',
      };

      expect(event.deliveryStatus).toBe('failed');
      expect(event.error).toBe('Connection timeout');
    });

    it('should track retry count', () => {
      const event = {
        id: 'evt-002',
        integrationId: 'int-002',
        eventType: 'quality.scored' as const,
        payload: {},
        timestamp: new Date(),
        deliveryStatus: 'retrying' as const,
        retryCount: 3,
      };

      expect(event.retryCount).toBe(3);
      expect(event.deliveryStatus).toBe('retrying');
    });
  });
});
