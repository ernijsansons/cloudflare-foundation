/**
 * Structured logging utility for Cloudflare Foundation
 *
 * Provides JSON-formatted logs with consistent structure across all services.
 * In production, debug logs are suppressed to reduce noise.
 *
 * Usage:
 *   import { log } from '@foundation/shared/logger';
 *
 *   log.info('User logged in', { userId: '123', tenant: 'acme' });
 *   log.warn('Rate limit approaching', { remaining: 5 });
 *   log.error('Database query failed', { error: err.message, query: 'SELECT...' });
 *   log.debug('Cache hit', { key: 'user:123' });
 */

interface LogEntry {
  level: string;
  ts: number;
  msg: string;
  [key: string]: unknown;
}

function formatLog(level: string, msg: string, meta?: object): string {
  const entry: LogEntry = {
    level,
    ts: Date.now(),
    msg,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const log = {
  /**
   * Log informational messages (normal operations, successful actions)
   */
  info: (msg: string, meta?: object): void => {
    console.log(formatLog("info", msg, meta));
  },

  /**
   * Log warnings (potential issues, degraded performance, recoverable errors)
   */
  warn: (msg: string, meta?: object): void => {
    console.log(formatLog("warn", msg, meta));
  },

  /**
   * Log errors (failures, exceptions, unrecoverable issues)
   */
  error: (msg: string, meta?: object): void => {
    console.error(formatLog("error", msg, meta));
  },

  /**
   * Log debug information (verbose details for development/troubleshooting)
   * Suppressed in production environments
   */
  debug: (msg: string, meta?: object): void => {
    // @ts-expect-error - process.env may not exist in all environments
    const env = typeof process !== "undefined" ? process.env?.ENVIRONMENT : undefined;
    if (env !== "production") {
      console.log(formatLog("debug", msg, meta));
    }
  },
};

/**
 * Legacy console.* methods (deprecated - use log.* instead)
 *
 * These are provided for gradual migration, but should be replaced with log.* methods.
 */
export const logger = log;

export default log;
