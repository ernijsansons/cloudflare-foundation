/**
 * Application-wide constants for the Gateway service.
 * Centralized configuration to avoid magic numbers throughout the codebase.
 */

// =============================================================================
// Public Routes - Centralized Definition
// =============================================================================

/**
 * Public route prefixes that do not require authentication or tenant context.
 * Routes are matched using prefix matching (startsWith).
 *
 * - /health, /api/health - Health checks
 * - /api/public/* - Public API endpoints (signup, contact, factory)
 * - /mcp/* - MCP protocol (handles its own session authentication)
 */
export const PUBLIC_ROUTE_PREFIXES = [
  "/health",
  "/api/health",
  "/api/public/",
  "/mcp/",
] as const;

/**
 * Check if the given path matches any public route prefix.
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

// =============================================================================
// Rate Limiting
// =============================================================================

/** Rate limit window duration in seconds (KV-based limiter) */
export const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Maximum requests allowed per window (KV-based limiter, unauthenticated) */
export const RATE_LIMIT_MAX_REQUESTS = 200;

/** Rate limit window duration in milliseconds (Durable Object limiter) */
export const RATE_LIMIT_DO_WINDOW_MS = 60_000;

/** Maximum requests per window for authenticated users (Durable Object limiter) */
export const RATE_LIMIT_DO_MAX_REQUESTS_AUTHENTICATED = 500;

/** Maximum requests per window for unauthenticated users (Durable Object limiter) */
export const RATE_LIMIT_DO_MAX_REQUESTS_UNAUTHENTICATED = 200;

/** @deprecated Use RATE_LIMIT_DO_MAX_REQUESTS_AUTHENTICATED instead */
export const RATE_LIMIT_DO_MAX_REQUESTS = 500;

/** Maximum history entries to keep in rate limiter (prevents unbounded growth) */
export const RATE_LIMIT_MAX_HISTORY = 1000;

// =============================================================================
// File Uploads
// =============================================================================

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum filename length in characters */
export const MAX_FILENAME_LENGTH = 255;

/** Allowed MIME types for file uploads */
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
] as const;

// =============================================================================
// Timeouts
// =============================================================================

/** Timeout for Turnstile verification API calls in milliseconds */
export const TURNSTILE_TIMEOUT_MS = 5000;

/** Default timeout for external fetch requests in milliseconds */
export const FETCH_DEFAULT_TIMEOUT_MS = 10000;

// =============================================================================
// Authentication & Tokens
// =============================================================================

/** JWT token expiration time in seconds (30 minutes) */
export const JWT_EXPIRATION_SECONDS = 1800;

// =============================================================================
// Request Limits
// =============================================================================

/** Maximum request body size in bytes (10MB) */
export const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024;

// =============================================================================
// Database & Storage
// =============================================================================

/** Default query limit for list operations */
export const DEFAULT_QUERY_LIMIT = 100;

/** Maximum query limit for list operations */
export const MAX_QUERY_LIMIT = 1000;

/** Data retention period in seconds (90 days) */
export const DATA_RETENTION_SECONDS = 90 * 24 * 60 * 60;
