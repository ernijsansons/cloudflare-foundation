import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimitDOMiddleware } from "../rate-limit-do";
import type { Env, Variables } from "../../types";

describe("rateLimitDOMiddleware", () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;
  let mockEnv: Partial<Env>;
  let mockAgentService: { fetch: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
    mockAgentService = {
      fetch: vi.fn(),
    };
    mockEnv = {
      AGENT_SERVICE: mockAgentService as any,
    };
  });

  describe("Allowed requests", () => {
    beforeEach(() => {
      app.use("*", rateLimitDOMiddleware());
      app.get("/test", (c) => c.json({ success: true }));
    });

    it("should allow requests within rate limit", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 85, resetAt: Date.now() + 60000 }), {
          status: 200,
          headers: {
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "85",
          },
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Limit")).toBe("200");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("85");
      expect(mockAgentService.fetch).toHaveBeenCalledWith(
        "https://fake-host/rate-limit/check",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should set X-RateLimit-Reset header when resetAt provided", async () => {
      const resetAt = Date.now() + 60000;
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 50, resetAt }), {
          status: 200,
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Reset")).toBe(String(Math.floor(resetAt / 1000)));
    });
  });

  describe("Rate limit exceeded", () => {
    beforeEach(() => {
      app.use("*", rateLimitDOMiddleware());
      app.get("/test", (c) => c.json({ success: true }));
    });

    it("should return 429 when rate limit exceeded", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: false, remaining: 0, retryAfter: 45 }), {
          status: 429,
          headers: {
            "Retry-After": "45",
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
          },
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data).toEqual({ error: "Rate limit exceeded" });
      expect(res.headers.get("Retry-After")).toBe("45");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("should set default Retry-After when not provided", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: false, remaining: 0 }), {
          status: 429,
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("60");
    });
  });

  describe("Fail-open behavior (availability over enforcement)", () => {
    beforeEach(() => {
      app.use("*", rateLimitDOMiddleware());
      app.get("/test", (c) => c.json({ success: true }));
    });

    it("should fail open when DO service errors", async () => {
      mockAgentService.fetch.mockRejectedValue(new Error("DO service error"));

      const res = await app.request("/test", {}, mockEnv as Env);

      // Fail-open: allow request through on service errors
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    it("should fail open on timeout (>500ms)", async () => {
      mockAgentService.fetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 600))
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      // Fail-open: allow request through on timeout
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    it("should fail open when AGENT_SERVICE is unavailable", async () => {
      mockAgentService.fetch.mockRejectedValue(new Error("Service binding error"));

      const res = await app.request("/test", {}, mockEnv as Env);

      // Fail-open: allow request through on service binding errors
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });
  });

  describe("Rate limit strategy", () => {
    beforeEach(() => {
      app.use("*", (c, next) => {
        // Mock context values
        c.set("tenantId", undefined);
        c.set("userId", undefined);
        return next();
      });
      app.use("*", rateLimitDOMiddleware());
      app.get("/test", (c) => c.json({ success: true }));
    });

    it("should use tenant-based rate limiting for authenticated users", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 95 }), {
          status: 200,
        })
      );
      const authenticatedApp = new Hono<{ Bindings: Env; Variables: Variables }>();
      authenticatedApp.use("*", (c, next) => {
        c.set("tenantId", "tenant-123");
        c.set("userId", "user-456");
        return next();
      });
      authenticatedApp.use("*", rateLimitDOMiddleware());
      authenticatedApp.get("/test", (c) => c.json({ success: true }));

      const res = await authenticatedApp.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(200);

      // Verify tenant-based limitId was used
      const callBody = mockAgentService.fetch.mock.calls[0]?.[1]?.body;
      const parsedBody = JSON.parse(callBody as string);
      expect(parsedBody.limitId).toBe("tenant:tenant-123");
    });

    it("should use IP-based rate limiting for unauthenticated users", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 55 }), {
          status: 200,
        })
      );

      const res = await app.request("/test", {
        headers: {
          "CF-Connecting-IP": "192.168.1.1",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(200);

      // Verify IP-based limitId was used
      const callBody = mockAgentService.fetch.mock.calls[0]?.[1]?.body;
      const parsedBody = JSON.parse(callBody as string);
      expect(parsedBody.limitId).toBe("ip:192.168.1.1");
    });

    it("should use IP 'unknown' when CF-Connecting-IP header missing", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 55 }), {
          status: 200,
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(200);

      // Verify IP-based limitId was used with 'unknown'
      const callBody = mockAgentService.fetch.mock.calls[0]?.[1]?.body;
      const parsedBody = JSON.parse(callBody as string);
      expect(parsedBody.limitId).toBe("ip:unknown");
    });

    it("should use IP-based when tenantId is 'default'", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 55 }), {
          status: 200,
        })
      );
      const defaultTenantApp = new Hono<{ Bindings: Env; Variables: Variables }>();
      defaultTenantApp.use("*", (c, next) => {
        c.set("tenantId", "default");
        return next();
      });
      defaultTenantApp.use("*", rateLimitDOMiddleware());
      defaultTenantApp.get("/test", (c) => c.json({ success: true }));

      const res = await defaultTenantApp.request("/test", {
        headers: {
          "CF-Connecting-IP": "10.0.0.1",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(200);

      const callBody = mockAgentService.fetch.mock.calls[0]?.[1]?.body;
      const parsedBody = JSON.parse(callBody as string);
      expect(parsedBody.limitId).toBe("ip:10.0.0.1");
    });
  });

  describe("Rate limit headers", () => {
    beforeEach(() => {
      app.use("*", rateLimitDOMiddleware());
      app.get("/test", (c) => c.json({ success: true }));
    });

    it("should set correct headers for authenticated users (limit=500)", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 75 }), {
          status: 200,
        })
      );
      const authenticatedApp = new Hono<{ Bindings: Env; Variables: Variables }>();
      authenticatedApp.use("*", (c, next) => {
        c.set("tenantId", "tenant-123");
        return next();
      });
      authenticatedApp.use("*", rateLimitDOMiddleware());
      authenticatedApp.get("/test", (c) => c.json({ success: true }));

      const res = await authenticatedApp.request("/test", {}, mockEnv as Env);

      expect(res.headers.get("X-RateLimit-Limit")).toBe("500");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("75");
    });

    it("should set correct headers for unauthenticated users (limit=200)", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: true, remaining: 40 }), {
          status: 200,
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.headers.get("X-RateLimit-Limit")).toBe("200");
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("40");
    });

    it("should set X-RateLimit-Remaining to 0 when rate limit exceeded", async () => {
      mockAgentService.fetch.mockResolvedValue(
        new Response(JSON.stringify({ allowed: false, remaining: 0 }), {
          status: 429,
        })
      );

      const res = await app.request("/test", {}, mockEnv as Env);

      expect(res.status).toBe(429);
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("should pass through request on service errors (fail-open)", async () => {
      mockAgentService.fetch.mockRejectedValue(new Error("Error"));

      const res = await app.request("/test", {}, mockEnv as Env);

      // Fail-open: request passes through, no rate limit headers on error
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });
  });
});
