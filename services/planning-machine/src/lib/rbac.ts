/**
 * RBAC (Role-Based Access Control) Permission System
 *
 * Provides permission checking for operator actions
 */

import type {
  UserRole,
  Permission,
  ActionContext,
  PermissionCheckResult,
  UserWithRole,
} from '@foundation/shared';
import { ROLE_PERMISSIONS } from '@foundation/shared';

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if a user has a specific permission
 *
 * @param user User with role information
 * @param permission Permission to check
 * @returns Permission check result
 */
export function hasPermission(
  user: UserWithRole,
  permission: Permission
): PermissionCheckResult {
  const rolePermissions = ROLE_PERMISSIONS[user.role];

  if (!rolePermissions) {
    return {
      allowed: false,
      reason: `Invalid role: ${user.role}`,
    };
  }

  const allowed = rolePermissions.includes(permission);

  return {
    allowed,
    reason: allowed
      ? undefined
      : `User role '${user.role}' does not have permission '${permission}'`,
  };
}

/**
 * Check if a user can perform an action
 *
 * @param context Action context with user, tenant, and action details
 * @param user User with role information
 * @returns Permission check result
 */
export function canPerformAction(
  context: ActionContext,
  user: UserWithRole
): PermissionCheckResult {
  // Check tenant isolation
  if (context.tenantId !== user.tenantId) {
    return {
      allowed: false,
      reason: 'Cross-tenant access denied',
    };
  }

  // Check if user has required permission
  return hasPermission(user, context.action);
}

/**
 * Require permission (throws if not allowed)
 *
 * @param user User with role information
 * @param permission Permission to require
 * @throws Error if permission check fails
 */
export function requirePermission(
  user: UserWithRole,
  permission: Permission
): void {
  const result = hasPermission(user, permission);
  if (!result.allowed) {
    throw new PermissionError(result.reason || 'Permission denied');
  }
}

/**
 * Require action permission (throws if not allowed)
 *
 * @param context Action context
 * @param user User with role information
 * @throws Error if permission check fails
 */
export function requireAction(
  context: ActionContext,
  user: UserWithRole
): void {
  const result = canPerformAction(context, user);
  if (!result.allowed) {
    throw new PermissionError(result.reason || 'Action not permitted');
  }
}

// ============================================================================
// ROLE HIERARCHY CHECKING
// ============================================================================

/**
 * Check if a role has at least the specified role level
 *
 * Hierarchy: admin > supervisor > operator
 *
 * @param userRole User's role
 * @param requiredRole Minimum required role
 * @returns True if user has sufficient role level
 */
export function hasRoleLevel(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    supervisor: 2,
    operator: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require minimum role level (throws if not sufficient)
 *
 * @param userRole User's role
 * @param requiredRole Minimum required role
 * @throws Error if role level is insufficient
 */
export function requireRoleLevel(
  userRole: UserRole,
  requiredRole: UserRole
): void {
  if (!hasRoleLevel(userRole, requiredRole)) {
    throw new PermissionError(
      `Required role '${requiredRole}' or higher, user has '${userRole}'`
    );
  }
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

/**
 * Get all permissions for a role
 *
 * @param role User role
 * @returns Array of permissions
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a permission exists
 *
 * @param permission Permission to check
 * @returns True if permission is valid
 */
export function isValidPermission(permission: string): permission is Permission {
  const allPermissions = new Set<string>();
  for (const perms of Object.values(ROLE_PERMISSIONS)) {
    perms.forEach((p) => allPermissions.add(p));
  }
  return allPermissions.has(permission);
}

/**
 * Get roles that have a specific permission
 *
 * @param permission Permission to check
 * @returns Array of roles that have the permission
 */
export function getRolesWithPermission(permission: Permission): UserRole[] {
  const roles: UserRole[] = [];
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (permissions.includes(permission)) {
      roles.push(role as UserRole);
    }
  }
  return roles;
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Permission error
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

/**
 * Create permission middleware for API routes
 *
 * @param permission Required permission
 * @returns Middleware function
 */
export function requirePermissionMiddleware(permission: Permission) {
  return (user: UserWithRole) => {
    requirePermission(user, permission);
  };
}

/**
 * Create role middleware for API routes
 *
 * @param requiredRole Minimum required role
 * @returns Middleware function
 */
export function requireRoleMiddleware(requiredRole: UserRole) {
  return (user: UserWithRole) => {
    requireRoleLevel(user.role, requiredRole);
  };
}
