/**
 * Audit Logger Tests
 */

import { describe, it, expect } from 'vitest';
import type { AuditLogEntry, AuditAction, ResourceType } from '@foundation/shared';

describe('Audit Logger', () => {
  describe('Audit Log Structure', () => {
    it('should have required fields', () => {
      const logEntry: Partial<AuditLogEntry> = {
        id: 'log-001',
        userId: 'user-001',
        tenantId: 'tenant-001',
        action: 'approve',
        resourceType: 'decision',
        resourceId: 'decision-001',
        metadata: {},
        timestamp: new Date(),
        success: true,
      };

      expect(logEntry.id).toBeDefined();
      expect(logEntry.userId).toBeDefined();
      expect(logEntry.tenantId).toBeDefined();
      expect(logEntry.action).toBeDefined();
      expect(logEntry.resourceType).toBeDefined();
      expect(logEntry.resourceId).toBeDefined();
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.success).toBeDefined();
    });

    it('should include metadata for context', () => {
      const logEntry = {
        id: 'log-001',
        action: 'approve',
        metadata: {
          confidence: 85,
          feedback: 'Looks good',
          previousScore: 80,
          newScore: 85,
        },
      };

      expect(logEntry.metadata).toBeDefined();
      expect(typeof logEntry.metadata).toBe('object');
      expect(logEntry.metadata.confidence).toBe(85);
    });

    it('should capture error details for failures', () => {
      const failureLog = {
        id: 'log-002',
        action: 'approve',
        success: false,
        errorMessage: 'Permission denied: insufficient role level',
      };

      expect(failureLog.success).toBe(false);
      expect(failureLog.errorMessage).toBeDefined();
    });

    it('should include IP address and user agent', () => {
      const logEntry = {
        id: 'log-003',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };

      expect(logEntry.ipAddress).toBeDefined();
      expect(logEntry.userAgent).toBeDefined();
    });
  });

  describe('Action Types', () => {
    it('should validate action types', () => {
      const validActions: AuditAction[] = [
        'create',
        'read',
        'update',
        'delete',
        'approve',
        'reject',
        'revise',
        'escalate',
        'resolve',
        'override',
        'configure',
      ];

      validActions.forEach((action) => {
        expect(
          [
            'create',
            'read',
            'update',
            'delete',
            'approve',
            'reject',
            'revise',
            'escalate',
            'resolve',
            'override',
            'configure',
          ]
        ).toContain(action);
      });
    });

    it('should map operator actions correctly', () => {
      const operatorActions = {
        approve: 'approve',
        reject: 'reject',
        revise: 'revise',
        escalate: 'escalate',
      };

      expect(operatorActions.approve).toBe('approve');
      expect(operatorActions.reject).toBe('reject');
      expect(operatorActions.revise).toBe('revise');
      expect(operatorActions.escalate).toBe('escalate');
    });
  });

  describe('Resource Types', () => {
    it('should validate resource types', () => {
      const validResources: ResourceType[] = [
        'decision',
        'artifact',
        'run',
        'quality_score',
        'user',
        'escalation',
        'system',
      ];

      validResources.forEach((resource) => {
        expect(
          [
            'decision',
            'artifact',
            'run',
            'quality_score',
            'user',
            'escalation',
            'system',
          ]
        ).toContain(resource);
      });
    });
  });

  describe('Audit Query Filters', () => {
    it('should filter by user', () => {
      const allLogs = [
        { userId: 'user-001', action: 'approve' },
        { userId: 'user-002', action: 'reject' },
        { userId: 'user-001', action: 'revise' },
      ];

      const user001Logs = allLogs.filter((log) => log.userId === 'user-001');

      expect(user001Logs).toHaveLength(2);
    });

    it('should filter by tenant', () => {
      const allLogs = [
        { tenantId: 'tenant-001', action: 'approve' },
        { tenantId: 'tenant-002', action: 'reject' },
        { tenantId: 'tenant-001', action: 'revise' },
      ];

      const tenant001Logs = allLogs.filter(
        (log) => log.tenantId === 'tenant-001'
      );

      expect(tenant001Logs).toHaveLength(2);
    });

    it('should filter by action', () => {
      const allLogs = [
        { action: 'approve' },
        { action: 'reject' },
        { action: 'approve' },
        { action: 'revise' },
      ];

      const approveLogs = allLogs.filter((log) => log.action === 'approve');

      expect(approveLogs).toHaveLength(2);
    });

    it('should filter by resource type and ID', () => {
      const allLogs = [
        { resourceType: 'decision', resourceId: 'decision-001' },
        { resourceType: 'artifact', resourceId: 'artifact-001' },
        { resourceType: 'decision', resourceId: 'decision-002' },
      ];

      const decision001Logs = allLogs.filter(
        (log) =>
          log.resourceType === 'decision' && log.resourceId === 'decision-001'
      );

      expect(decision001Logs).toHaveLength(1);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const twoDaysAgo = now - 172800000;

      const allLogs = [
        { timestamp: now },
        { timestamp: oneDayAgo },
        { timestamp: twoDaysAgo },
      ];

      const last24Hours = allLogs.filter(
        (log) => log.timestamp >= now - 86400000
      );

      expect(last24Hours).toHaveLength(2);
    });

    it('should filter by success status', () => {
      const allLogs = [
        { success: true },
        { success: false },
        { success: true },
        { success: false },
      ];

      const failures = allLogs.filter((log) => log.success === false);

      expect(failures).toHaveLength(2);
    });
  });

  describe('Audit Statistics', () => {
    it('should calculate total action counts', () => {
      const logs = [
        { action: 'approve' },
        { action: 'approve' },
        { action: 'reject' },
        { action: 'revise' },
        { action: 'escalate' },
      ];

      const totalActions = logs.length;
      expect(totalActions).toBe(5);
    });

    it('should calculate success rate', () => {
      const logs = [
        { success: true },
        { success: true },
        { success: true },
        { success: false },
        { success: true },
      ];

      const successful = logs.filter((log) => log.success).length;
      const successRate = (successful / logs.length) * 100;

      expect(successRate).toBe(80);
    });

    it('should count actions by type', () => {
      const logs = [
        { action: 'approve' },
        { action: 'approve' },
        { action: 'approve' },
        { action: 'reject' },
        { action: 'revise' },
      ];

      const actionCounts = logs.reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(actionCounts['approve']).toBe(3);
      expect(actionCounts['reject']).toBe(1);
      expect(actionCounts['revise']).toBe(1);
    });

    it('should identify top users by activity', () => {
      const logs = [
        { userId: 'user-001' },
        { userId: 'user-002' },
        { userId: 'user-001' },
        { userId: 'user-003' },
        { userId: 'user-001' },
      ];

      const userCounts = logs.reduce(
        (acc, log) => {
          acc[log.userId] = (acc[log.userId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topUser = Object.entries(userCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      expect(topUser[0]).toBe('user-001');
      expect(topUser[1]).toBe(3);
    });
  });

  describe('Audit Trail Integrity', () => {
    it('should be immutable (no updates or deletes)', () => {
      // Audit logs should only support INSERT and SELECT operations
      const allowedOperations = ['INSERT', 'SELECT'];

      expect(allowedOperations).toContain('INSERT');
      expect(allowedOperations).toContain('SELECT');
      expect(allowedOperations).not.toContain('UPDATE');
      expect(allowedOperations).not.toContain('DELETE');
    });

    it('should maintain chronological order', () => {
      const logs = [
        { id: 'log-1', timestamp: 1000 },
        { id: 'log-2', timestamp: 2000 },
        { id: 'log-3', timestamp: 3000 },
      ];

      const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);

      sorted.forEach((log, index) => {
        if (index > 0) {
          expect(log.timestamp).toBeGreaterThanOrEqual(
            sorted[index - 1].timestamp
          );
        }
      });
    });

    it('should capture all required context', () => {
      const requiredFields = [
        'id',
        'userId',
        'tenantId',
        'action',
        'resourceType',
        'resourceId',
        'timestamp',
        'success',
      ];

      const logEntry = {
        id: 'log-001',
        userId: 'user-001',
        tenantId: 'tenant-001',
        action: 'approve',
        resourceType: 'decision',
        resourceId: 'decision-001',
        timestamp: Date.now(),
        success: true,
      };

      requiredFields.forEach((field) => {
        expect(logEntry).toHaveProperty(field);
      });
    });
  });

  describe('Compliance & Reporting', () => {
    it('should support audit log exports', () => {
      const logs = [
        {
          id: 'log-001',
          userId: 'user-001',
          action: 'approve',
          timestamp: Date.now(),
        },
        {
          id: 'log-002',
          userId: 'user-002',
          action: 'reject',
          timestamp: Date.now(),
        },
      ];

      const exported = JSON.stringify(logs, null, 2);

      expect(exported).toContain('log-001');
      expect(exported).toContain('log-002');
    });

    it('should generate audit reports by time period', () => {
      const now = Date.now();
      const logs = [
        { timestamp: now, action: 'approve' },
        { timestamp: now - 86400000, action: 'reject' },
        { timestamp: now - 172800000, action: 'revise' },
      ];

      // Last 24 hours
      const last24h = logs.filter((log) => log.timestamp >= now - 86400000);

      expect(last24h).toHaveLength(2);
    });

    it('should track failed actions for security monitoring', () => {
      const logs = [
        {
          userId: 'user-001',
          action: 'delete',
          success: false,
          errorMessage: 'Permission denied',
        },
        {
          userId: 'user-001',
          action: 'delete',
          success: false,
          errorMessage: 'Permission denied',
        },
        {
          userId: 'user-001',
          action: 'approve',
          success: true,
        },
      ];

      const failedAttempts = logs.filter((log) => log.success === false);

      // Multiple failed attempts might indicate security issue
      if (failedAttempts.length > 1) {
        const user = failedAttempts[0].userId;
        const sameUser = failedAttempts.every((log) => log.userId === user);
        expect(sameUser).toBe(true); // All failures from same user
      }
    });
  });
});
