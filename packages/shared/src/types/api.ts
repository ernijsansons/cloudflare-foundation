/**
 * API request/response types.
 */
export interface HealthResponse {
  ok: boolean;
  version: string;
}

export interface AuditVerifyResponse {
  tenantId: string;
  valid: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}
