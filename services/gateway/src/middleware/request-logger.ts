import type { Context, Next } from "hono";

import { createLogger, createRequestLogger, type Logger } from "../lib/logger";
import type { Env, Variables } from "../types";

const baseLogger = createLogger("gateway");

/**
 * Request logging middleware.
 *
 * Logs all incoming requests and outgoing responses with timing information.
 * Uses correlation ID for request tracking across services.
 *
 * Log format:
 * - Request: method, path, user-agent, content-length
 * - Response: status, duration, content-length
 *
 * @param options - Configuration options
 * @param options.excludePaths - Paths to exclude from logging (e.g., ["/health"])
 * @param options.logBody - Whether to log request/response bodies (default: false)
 * @param options.logHeaders - Whether to log request headers (default: false)
 */
export function requestLoggerMiddleware(options: {
	excludePaths?: string[];
	logBody?: boolean;
	logHeaders?: boolean;
} = {}) {
	const { excludePaths = ["/health", "/api/health"], logBody: _logBody = false, logHeaders = false } =
		options;

	return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
		const startTime = Date.now();
		const path = new URL(c.req.url).pathname;

		// Skip logging for excluded paths
		if (excludePaths.some((p) => path === p || path.startsWith(p + "/"))) {
			await next();
			return;
		}

		// Get request context
		const correlationId = c.get("correlationId") || c.req.header("x-correlation-id") || "unknown";
		const tenantId = c.get("tenantId");
		const userId = c.get("userId");

		// Create request-scoped logger
		const logger = createRequestLogger(baseLogger, correlationId, tenantId, userId);

		// Store logger on context for use in route handlers
		c.set("logger" as keyof Variables, logger as unknown as Variables[keyof Variables]);

		// Build request metadata
		const requestMeta: Record<string, unknown> = {
			method: c.req.method,
			path,
			query: Object.fromEntries(new URL(c.req.url).searchParams),
			userAgent: c.req.header("user-agent"),
			contentLength: c.req.header("content-length"),
			contentType: c.req.header("content-type"),
			ip: c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for"),
		};

		// Optionally log headers
		if (logHeaders) {
			requestMeta.headers = Object.fromEntries(
				[...c.req.raw.headers.entries()].filter(
					([key]) => !["authorization", "cookie", "x-api-key"].includes(key.toLowerCase())
				)
			);
		}

		// Log incoming request
		logger.info("Request received", requestMeta);

		try {
			await next();

			// Calculate duration
			const duration = Date.now() - startTime;

			// Build response metadata
			const responseMeta: Record<string, unknown> = {
				method: c.req.method,
				path,
				status: c.res.status,
				duration,
				contentLength: c.res.headers.get("content-length"),
				contentType: c.res.headers.get("content-type"),
			};

			// Log based on status
			if (c.res.status >= 500) {
				logger.error("Request failed", undefined, responseMeta);
			} else if (c.res.status >= 400) {
				logger.warn("Request client error", responseMeta);
			} else {
				logger.info("Request completed", responseMeta);
			}
		} catch (error) {
			const duration = Date.now() - startTime;

			logger.error("Request error", error, {
				method: c.req.method,
				path,
				duration,
			});

			throw error;
		}
	};
}

/**
 * Get the request logger from context.
 * Falls back to base logger if not available.
 */
export function getRequestLogger(c: Context<{ Bindings: Env; Variables: Variables }>): Logger {
	const logger = c.get("logger" as keyof Variables) as Logger | undefined;
	return logger || baseLogger;
}
