/**
 * RBAC (Role-Based Access Control) Types
 *
 * Defines roles, permissions, and access control for operator actions
 */

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

/**
 * System roles with hierarchical permissions
 *
 * - admin: Full system access, can manage users and roles
 * - supervisor: Can review and override operator decisions, manage operators
 * - operator: Can review and approve/reject AI decisions
 */
export type UserRole = 'admin' | 'supervisor' | 'operator';

/**
 * Permission scopes for granular access control
 */
export type Permission =
  // Decision Review Permissions
  | 'decision:view'
  | 'decision:approve'
  | 'decision:reject'
  | 'decision:revise'
  | 'decision:escalate'

  // Artifact Permissions
  | 'artifact:view'
  | 'artifact:edit'
  | 'artifact:delete'

  // Quality Score Permissions
  | 'quality:view'
  | 'quality:edit'
  | 'quality:override'

  // Run Management Permissions
  | 'run:view'
  | 'run:create'
  | 'run:pause'
  | 'run:resume'
  | 'run:cancel'

  // User Management Permissions (admin only)
  | 'user:view'
  | 'user:create'
  | 'user:edit'
  | 'user:delete'
  | 'user:assign_role'

  // Audit Permissions
  | 'audit:view'
  | 'audit:export'

  // System Permissions
  | 'system:configure'
  | 'system:monitor';

// ============================================================================
// ROLE-PERMISSION MAPPING
// ============================================================================

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  operator: [
    'decision:view',
    'decision:approve',
    'decision:reject',
    'decision:revise',
    'decision:escalate',
    'artifact:view',
    'quality:view',
    'run:view',
    'audit:view',
  ],
  supervisor: [
    // All operator permissions
    'decision:view',
    'decision:approve',
    'decision:reject',
    'decision:revise',
    'decision:escalate',
    'artifact:view',
    'artifact:edit',
    'quality:view',
    'quality:edit',
    'quality:override',
    'run:view',
    'run:pause',
    'run:resume',
    'run:cancel',
    'audit:view',
    'audit:export',
    // Plus supervisor-specific
    'user:view',
  ],
  admin: [
    // All supervisor permissions
    'decision:view',
    'decision:approve',
    'decision:reject',
    'decision:revise',
    'decision:escalate',
    'artifact:view',
    'artifact:edit',
    'artifact:delete',
    'quality:view',
    'quality:edit',
    'quality:override',
    'run:view',
    'run:create',
    'run:pause',
    'run:resume',
    'run:cancel',
    'audit:view',
    'audit:export',
    'user:view',
    // Plus admin-specific
    'user:create',
    'user:edit',
    'user:delete',
    'user:assign_role',
    'system:configure',
    'system:monitor',
  ],
};

// ============================================================================
// RBAC ENTITIES
// ============================================================================

/**
 * User with role information
 */
export interface UserWithRole {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Action context for permission checks
 */
export interface ActionContext {
  userId: string;
  tenantId: string;
  action: Permission;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

/**
 * Operator decision review
 */
export interface OperatorReview {
  id: string;
  decisionId: string;
  operatorId: string;
  operatorRole: UserRole;
  action: 'approve' | 'reject' | 'revise' | 'escalate';
  confidence: number; // 0-100
  feedback?: string;
  revisionInstructions?: string;
  timestamp: Date;
}

/**
 * Escalation record
 */
export interface Escalation {
  id: string;
  decisionId: string;
  fromOperatorId: string;
  toSupervisorId?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Resource types for audit logging
 */
export type ResourceType =
  | 'decision'
  | 'artifact'
  | 'run'
  | 'quality_score'
  | 'user'
  | 'escalation'
  | 'system';

/**
 * Audit action types
 */
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'revise'
  | 'escalate'
  | 'resolve'
  | 'override'
  | 'configure';
