import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, createRequestLogger } from "../logger";

describe("Logger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLogger", () => {
    it("should create a logger with service name", () => {
      const logger = createLogger("test-service");
      logger.info("Test message");

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const loggedValue = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(loggedValue.service).toBe("test-service");
      expect(loggedValue.message).toBe("Test message");
      expect(loggedValue.level).toBe("info");
    });

    it("should include metadata in logs", () => {
      const logger = createLogger("test-service");
      logger.info("Test message", { userId: "123", action: "login" });

      const loggedValue = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(loggedValue.userId).toBe("123");
      expect(loggedValue.action).toBe("login");
    });

    it("should log errors with stack trace", () => {
      const logger = createLogger("test-service");
      const testError = new Error("Test error");
      logger.error("Operation failed", testError);

      const loggedValue = JSON.parse(consoleSpy.error.mock.calls[0][0] as string);
      expect(loggedValue.level).toBe("error");
      expect(loggedValue.error.name).toBe("Error");
      expect(loggedValue.error.message).toBe("Test error");
      expect(loggedValue.error.stack).toBeDefined();
    });

    it("should handle non-Error objects in error logging", () => {
      const logger = createLogger("test-service");
      logger.error("Operation failed", "string error");

      const loggedValue = JSON.parse(consoleSpy.error.mock.calls[0][0] as string);
      expect(loggedValue.error.name).toBe("UnknownError");
      expect(loggedValue.error.message).toBe("string error");
    });
  });

  describe("child logger", () => {
    it("should inherit parent context", () => {
      const logger = createLogger("test-service", { tenantId: "tenant-1" });
      const childLogger = logger.child({ requestId: "req-123" });
      childLogger.info("Child message");

      const loggedValue = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(loggedValue.tenantId).toBe("tenant-1");
      expect(loggedValue.requestId).toBe("req-123");
    });
  });

  describe("createRequestLogger", () => {
    it("should create a logger with request context", () => {
      const logger = createLogger("test-service");
      const requestLogger = createRequestLogger(
        logger,
        "req-123",
        "tenant-1",
        "user-1"
      );
      requestLogger.info("Request processed");

      const loggedValue = JSON.parse(consoleSpy.log.mock.calls[0][0] as string);
      expect(loggedValue.requestId).toBe("req-123");
      expect(loggedValue.tenantId).toBe("tenant-1");
      expect(loggedValue.userId).toBe("user-1");
    });
  });
});
