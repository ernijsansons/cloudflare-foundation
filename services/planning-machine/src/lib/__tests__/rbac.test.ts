/**
 * RBAC Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canPerformAction,
  hasRoleLevel,
  getPermissionsForRole,
  getRolesWithPermission,
  PermissionError,
  requirePermission,
  requireRoleLevel,
} from '../rbac';
import type { UserWithRole, ActionContext } from '@foundation/shared';

describe('RBAC Permission System', () => {
  // Test users
  const operatorUser: UserWithRole = {
    id: 'user-op-001',
    tenantId: 'tenant-001',
    email: 'operator@example.com',
    name: 'Test Operator',
    role: 'operator',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const supervisorUser: UserWithRole = {
    id: 'user-sup-001',
    tenantId: 'tenant-001',
    email: 'supervisor@example.com',
    name: 'Test Supervisor',
    role: 'supervisor',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser: UserWithRole = {
    id: 'user-admin-001',
    tenantId: 'tenant-001',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hasPermission', () => {
    it('should allow operator to view decisions', () => {
      const result = hasPermission(operatorUser, 'decision:view');
      expect(result.allowed).toBe(true);
    });

    it('should allow operator to approve decisions', () => {
      const result = hasPermission(operatorUser, 'decision:approve');
      expect(result.allowed).toBe(true);
    });

    it('should deny operator from editing artifacts', () => {
      const result = hasPermission(operatorUser, 'artifact:edit');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not have permission');
    });

    it('should deny operator from managing users', () => {
      const result = hasPermission(operatorUser, 'user:create');
      expect(result.allowed).toBe(false);
    });

    it('should allow supervisor to edit artifacts', () => {
      const result = hasPermission(supervisorUser, 'artifact:edit');
      expect(result.allowed).toBe(true);
    });

    it('should allow supervisor to override quality scores', () => {
      const result = hasPermission(supervisorUser, 'quality:override');
      expect(result.allowed).toBe(true);
    });

    it('should deny supervisor from creating users', () => {
      const result = hasPermission(supervisorUser, 'user:create');
      expect(result.allowed).toBe(false);
    });

    it('should allow admin to create users', () => {
      const result = hasPermission(adminUser, 'user:create');
      expect(result.allowed).toBe(true);
    });

    it('should allow admin to configure system', () => {
      const result = hasPermission(adminUser, 'system:configure');
      expect(result.allowed).toBe(true);
    });

    it('should allow admin to delete artifacts', () => {
      const result = hasPermission(adminUser, 'artifact:delete');
      expect(result.allowed).toBe(true);
    });
  });

  describe('canPerformAction', () => {
    it('should allow action within same tenant', () => {
      const context: ActionContext = {
        userId: operatorUser.id,
        tenantId: operatorUser.tenantId,
        action: 'decision:approve',
      };

      const result = canPerformAction(context, operatorUser);
      expect(result.allowed).toBe(true);
    });

    it('should deny cross-tenant access', () => {
      const context: ActionContext = {
        userId: operatorUser.id,
        tenantId: 'tenant-999', // Different tenant
        action: 'decision:approve',
      };

      const result = canPerformAction(context, operatorUser);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cross-tenant access denied');
    });

    it('should deny action without permission', () => {
      const context: ActionContext = {
        userId: operatorUser.id,
        tenantId: operatorUser.tenantId,
        action: 'user:create',
      };

      const result = canPerformAction(context, operatorUser);
      expect(result.allowed).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw for allowed permission', () => {
      expect(() => {
        requirePermission(operatorUser, 'decision:approve');
      }).not.toThrow();
    });

    it('should throw PermissionError for denied permission', () => {
      expect(() => {
        requirePermission(operatorUser, 'user:create');
      }).toThrow(PermissionError);
    });
  });

  describe('hasRoleLevel', () => {
    it('should allow admin to access operator-level features', () => {
      expect(hasRoleLevel('admin', 'operator')).toBe(true);
    });

    it('should allow admin to access supervisor-level features', () => {
      expect(hasRoleLevel('admin', 'supervisor')).toBe(true);
    });

    it('should allow admin to access admin-level features', () => {
      expect(hasRoleLevel('admin', 'admin')).toBe(true);
    });

    it('should allow supervisor to access operator-level features', () => {
      expect(hasRoleLevel('supervisor', 'operator')).toBe(true);
    });

    it('should deny supervisor from accessing admin-level features', () => {
      expect(hasRoleLevel('supervisor', 'admin')).toBe(false);
    });

    it('should allow operator to access operator-level features', () => {
      expect(hasRoleLevel('operator', 'operator')).toBe(true);
    });

    it('should deny operator from accessing supervisor-level features', () => {
      expect(hasRoleLevel('operator', 'supervisor')).toBe(false);
    });

    it('should deny operator from accessing admin-level features', () => {
      expect(hasRoleLevel('operator', 'admin')).toBe(false);
    });
  });

  describe('requireRoleLevel', () => {
    it('should not throw for sufficient role level', () => {
      expect(() => {
        requireRoleLevel('admin', 'operator');
      }).not.toThrow();
    });

    it('should throw PermissionError for insufficient role level', () => {
      expect(() => {
        requireRoleLevel('operator', 'admin');
      }).toThrow(PermissionError);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all operator permissions', () => {
      const permissions = getPermissionsForRole('operator');
      expect(permissions).toContain('decision:view');
      expect(permissions).toContain('decision:approve');
      expect(permissions).toContain('artifact:view');
      expect(permissions).not.toContain('user:create');
    });

    it('should return all supervisor permissions', () => {
      const permissions = getPermissionsForRole('supervisor');
      expect(permissions).toContain('decision:view');
      expect(permissions).toContain('artifact:edit');
      expect(permissions).toContain('quality:override');
      expect(permissions).toContain('user:view');
      expect(permissions).not.toContain('user:create');
    });

    it('should return all admin permissions', () => {
      const permissions = getPermissionsForRole('admin');
      expect(permissions).toContain('decision:view');
      expect(permissions).toContain('user:create');
      expect(permissions).toContain('system:configure');
    });
  });

  describe('getRolesWithPermission', () => {
    it('should return roles with decision:view permission', () => {
      const roles = getRolesWithPermission('decision:view');
      expect(roles).toContain('operator');
      expect(roles).toContain('supervisor');
      expect(roles).toContain('admin');
    });

    it('should return roles with artifact:edit permission', () => {
      const roles = getRolesWithPermission('artifact:edit');
      expect(roles).not.toContain('operator');
      expect(roles).toContain('supervisor');
      expect(roles).toContain('admin');
    });

    it('should return roles with user:create permission', () => {
      const roles = getRolesWithPermission('user:create');
      expect(roles).not.toContain('operator');
      expect(roles).not.toContain('supervisor');
      expect(roles).toContain('admin');
    });
  });

  describe('Permission Hierarchy', () => {
    it('should show admin has most permissions', () => {
      const adminPerms = getPermissionsForRole('admin');
      const supervisorPerms = getPermissionsForRole('supervisor');
      const operatorPerms = getPermissionsForRole('operator');

      expect(adminPerms.length).toBeGreaterThan(supervisorPerms.length);
      expect(supervisorPerms.length).toBeGreaterThan(operatorPerms.length);
    });

    it('should show operator has subset of supervisor permissions', () => {
      const supervisorPerms = getPermissionsForRole('supervisor');
      const operatorPerms = getPermissionsForRole('operator');

      const operatorInSupervisor = operatorPerms.every((perm) =>
        supervisorPerms.includes(perm)
      );
      expect(operatorInSupervisor).toBe(true);
    });

    it('should show supervisor has subset of admin permissions', () => {
      const adminPerms = getPermissionsForRole('admin');
      const supervisorPerms = getPermissionsForRole('supervisor');

      const supervisorInAdmin = supervisorPerms.every((perm) =>
        adminPerms.includes(perm)
      );
      expect(supervisorInAdmin).toBe(true);
    });
  });
});
