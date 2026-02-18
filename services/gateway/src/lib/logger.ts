/**
 * Structured logging utility for consistent log formatting across services.
 * Outputs JSON logs for easy parsing and analysis.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  service: string;
  message: string;
  timestamp: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
  child(context: Partial<LogEntry>): Logger;
}

/**
 * Create a structured logger for a service.
 * @param service - Service name to include in all logs
 * @param context - Optional default context to include in all logs
 */
export function createLogger(
  service: string,
  context: Partial<LogEntry> = {}
): Logger {
  const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level,
      service,
      message,
      timestamp: new Date().toISOString(),
      ...context,
      ...meta,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.log(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
    }
  };

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      log("debug", message, meta);
    },

    info(message: string, meta?: Record<string, unknown>) {
      log("info", message, meta);
    },

    warn(message: string, meta?: Record<string, unknown>) {
      log("warn", message, meta);
    },

    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
      const errorMeta: Record<string, unknown> = { ...meta };

      if (error instanceof Error) {
        errorMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error !== undefined) {
        errorMeta.error = {
          name: "UnknownError",
          message: String(error),
        };
      }

      log("error", message, errorMeta);
    },

    child(childContext: Partial<LogEntry>): Logger {
      return createLogger(service, { ...context, ...childContext });
    },
  };
}

/**
 * Log middleware for request/response logging.
 * Creates a child logger with request context.
 */
export function createRequestLogger(
  logger: Logger,
  requestId: string,
  tenantId?: string,
  userId?: string
): Logger {
  return logger.child({
    requestId,
    tenantId,
    userId,
  });
}
