import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRequestLogger } from "../../lib/logger";
import type { Env, Variables } from "../../types";
import { getRequestLogger, requestLoggerMiddleware } from "../request-logger";

// Mock the logger module
vi.mock("../../lib/logger", () => {
	const mockLogger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	};

	return {
		createLogger: vi.fn(() => mockLogger),
		createRequestLogger: vi.fn(() => mockLogger),
	};
});

describe("requestLoggerMiddleware", () => {
	let app: Hono<{ Bindings: Env; Variables: Variables }>;
	let mockEnv: Partial<Env>;
	let mockLogger: ReturnType<typeof createRequestLogger>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env; Variables: Variables }>();
		mockEnv = {};
		mockLogger = createRequestLogger({} as any, "test-id");
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic logging", () => {
		beforeEach(() => {
			app.use("*", requestLoggerMiddleware());
			app.get("/test", (c) => c.json({ status: "ok" }));
			app.post("/submit", (c) => c.json({ submitted: true }));
		});

		it("should log incoming request", async () => {
			const res = await app.request("/test", {
				headers: {
					"User-Agent": "test-agent",
				},
			}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request received",
				expect.objectContaining({
					method: "GET",
					path: "/test",
					userAgent: "test-agent",
				})
			);
		});

		it("should log request completion with duration", async () => {
			const res = await app.request("/test", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request completed",
				expect.objectContaining({
					method: "GET",
					path: "/test",
					status: 200,
					duration: expect.any(Number),
				})
			);
		});

		it("should log POST requests", async () => {
			const res = await app.request("/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ data: "test" }),
			}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request received",
				expect.objectContaining({
					method: "POST",
					path: "/submit",
					contentType: "application/json",
				})
			);
		});

		it("should log request metadata (query params, content-length)", async () => {
			const res = await app.request("/test?foo=bar&baz=qux", {
				headers: {
					"Content-Length": "123",
				},
			}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request received",
				expect.objectContaining({
					query: { foo: "bar", baz: "qux" },
					contentLength: "123",
				})
			);
		});
	});

	describe("Excluded paths", () => {
		beforeEach(() => {
			app.use("*", requestLoggerMiddleware({
				excludePaths: ["/health", "/api/health", "/metrics"],
			}));
			app.get("/health", (c) => c.json({ status: "ok" }));
			app.get("/api/health", (c) => c.json({ status: "ok" }));
			app.get("/metrics", (c) => c.json({ metrics: [] }));
			app.get("/api/data", (c) => c.json({ data: [] }));
		});

		it("should skip logging for /health", async () => {
			vi.clearAllMocks();

			const res = await app.request("/health", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Request received",
				expect.anything()
			);
		});

		it("should skip logging for /api/health", async () => {
			vi.clearAllMocks();

			const res = await app.request("/api/health", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Request received",
				expect.anything()
			);
		});

		it("should skip logging for /metrics", async () => {
			vi.clearAllMocks();

			const res = await app.request("/metrics", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Request received",
				expect.anything()
			);
		});

		it("should log non-excluded paths", async () => {
			const res = await app.request("/api/data", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request received",
				expect.objectContaining({ path: "/api/data" })
			);
		});

		it("should skip nested excluded paths", async () => {
			vi.clearAllMocks();
			app.get("/health/deep/check", (c) => c.json({ status: "ok" }));

			const res = await app.request("/health/deep/check", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Request received",
				expect.anything()
			);
		});
	});

	describe("Response status logging", () => {
		beforeEach(() => {
			app.use("*", requestLoggerMiddleware());
			app.get("/success", (c) => c.json({ status: "ok" }, 200));
			app.get("/created", (c) => c.json({ id: 1 }, 201));
			app.get("/bad-request", (c) => c.json({ error: "Bad request" }, 400));
			app.get("/not-found", (c) => c.json({ error: "Not found" }, 404));
			app.get("/server-error", (c) => c.json({ error: "Internal error" }, 500));
		});

		it("should log 200 as info", async () => {
			await app.request("/success", {}, mockEnv as Env);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request completed",
				expect.objectContaining({ status: 200 })
			);
		});

		it("should log 201 as info", async () => {
			await app.request("/created", {}, mockEnv as Env);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request completed",
				expect.objectContaining({ status: 201 })
			);
		});

		it("should log 400 as warn", async () => {
			await app.request("/bad-request", {}, mockEnv as Env);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Request client error",
				expect.objectContaining({ status: 400 })
			);
		});

		it("should log 404 as warn", async () => {
			await app.request("/not-found", {}, mockEnv as Env);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Request client error",
				expect.objectContaining({ status: 404 })
			);
		});

		it("should log 500 as error", async () => {
			await app.request("/server-error", {}, mockEnv as Env);

			expect(mockLogger.error).toHaveBeenCalledWith(
				"Request failed",
				undefined,
				expect.objectContaining({ status: 500 })
			);
		});
	});

	describe("Error handling", () => {
		beforeEach(() => {
			app.use("*", requestLoggerMiddleware());
			app.get("/throw-error", () => {
				throw new Error("Test error");
			});
		});

		it("should log 500 when route handler throws", async () => {
			// Hono catches errors and returns 500 before our catch block runs
			// The middleware sees this as a completed request with 500 status
			const res = await app.request("/throw-error", {}, mockEnv as Env);

			expect(res.status).toBe(500);
			// Hono's error handler transforms the throw into a 500 response
			// Our middleware sees status >= 500 and logs as error
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Request failed",
				undefined,
				expect.objectContaining({
					method: "GET",
					path: "/throw-error",
					status: 500,
					duration: expect.any(Number),
				})
			);
		});
	});

	describe("Correlation ID", () => {
		it("should use correlation ID from request header", async () => {
			app.use("*", requestLoggerMiddleware());
			app.get("/test", (c) => c.json({ status: "ok" }));

			await app.request("/test", {
				headers: {
					"x-correlation-id": "test-correlation-123",
				},
			}, mockEnv as Env);

			expect(createRequestLogger).toHaveBeenCalledWith(
				expect.anything(),
				"test-correlation-123",
				undefined,
				undefined
			);
		});

		it("should use context correlation ID if available", async () => {
			app.use("*", async (c, next) => {
				c.set("correlationId" as keyof Variables, "context-correlation-456" as Variables[keyof Variables]);
				await next();
			});
			app.use("*", requestLoggerMiddleware());
			app.get("/test", (c) => c.json({ status: "ok" }));

			await app.request("/test", {}, mockEnv as Env);

			expect(createRequestLogger).toHaveBeenCalledWith(
				expect.anything(),
				"context-correlation-456",
				undefined,
				undefined
			);
		});
	});

	describe("Options", () => {
		it("should use default excludePaths when not provided", async () => {
			app.use("*", requestLoggerMiddleware());
			app.get("/health", (c) => c.json({ status: "ok" }));
			app.get("/api/health", (c) => c.json({ status: "ok" }));

			vi.clearAllMocks();

			await app.request("/health", {}, mockEnv as Env);
			expect(mockLogger.info).not.toHaveBeenCalled();

			await app.request("/api/health", {}, mockEnv as Env);
			expect(mockLogger.info).not.toHaveBeenCalled();
		});

		it("should respect custom excludePaths", async () => {
			app.use("*", requestLoggerMiddleware({ excludePaths: ["/custom-exclude"] }));
			app.get("/custom-exclude", (c) => c.json({ status: "ok" }));
			app.get("/health", (c) => c.json({ status: "ok" }));

			vi.clearAllMocks();

			await app.request("/custom-exclude", {}, mockEnv as Env);
			expect(mockLogger.info).not.toHaveBeenCalled();

			// /health is no longer excluded with custom excludePaths
			await app.request("/health", {}, mockEnv as Env);
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should handle empty excludePaths", async () => {
			app.use("*", requestLoggerMiddleware({ excludePaths: [] }));
			app.get("/health", (c) => c.json({ status: "ok" }));

			await app.request("/health", {}, mockEnv as Env);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Request received",
				expect.objectContaining({ path: "/health" })
			);
		});
	});

	describe("Logger context attachment", () => {
		it("should attach logger to context for route handlers", async () => {
			let capturedLogger: any = null;

			app.use("*", requestLoggerMiddleware());
			app.get("/test", (c) => {
				capturedLogger = c.get("logger" as keyof Variables);
				return c.json({ status: "ok" });
			});

			await app.request("/test", {}, mockEnv as Env);

			// The logger should be set on context
			expect(capturedLogger).toBeDefined();
		});
	});
});

describe("getRequestLogger", () => {
	it("should return logger from context if available", async () => {
		const mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		};

		const app = new Hono<{ Bindings: Env; Variables: Variables }>();
		app.use("*", async (c, next) => {
			c.set("logger" as keyof Variables, mockLogger as any);
			await next();
		});
		app.get("/test", (c) => {
			const logger = getRequestLogger(c);
			logger.info("Test log");
			return c.json({ status: "ok" });
		});

		await app.request("/test", {});

		expect(mockLogger.info).toHaveBeenCalledWith("Test log");
	});

	it("should return base logger if context logger not available", async () => {
		const app = new Hono<{ Bindings: Env; Variables: Variables }>();
		app.get("/test", (c) => {
			const logger = getRequestLogger(c);
			// Should not throw even without logger in context
			expect(logger).toBeDefined();
			expect(typeof logger.info).toBe("function");
			return c.json({ status: "ok" });
		});

		const res = await app.request("/test", {});
		expect(res.status).toBe(200);
	});
});
