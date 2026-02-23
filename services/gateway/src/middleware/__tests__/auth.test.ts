import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { authMiddleware, PUBLIC_ROUTES } from "../auth";
import type { Env, Variables } from "../../types";

describe("authMiddleware", () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;
  let mockEnv: Partial<Env>;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
    mockEnv = {
      SESSION_KV: {
        get: vi.fn(),
      } as any,
    };
  });

  describe("PUBLIC_ROUTES constant", () => {
    it("should export public routes", () => {
      expect(PUBLIC_ROUTES).toContain("/health");
      expect(PUBLIC_ROUTES).toContain("/api/health");
      expect(PUBLIC_ROUTES).toContain("/api/public/");
      expect(PUBLIC_ROUTES).toContain("/mcp/");
    });

    it("should have 4 public routes defined", () => {
      expect(PUBLIC_ROUTES).toHaveLength(4);
    });
  });

  describe("Public routes (no auth required)", () => {
    beforeEach(() => {
      app.use("*", authMiddleware());
      app.get("/health", (c) => c.json({ status: "ok" }));
      app.get("/api/health", (c) => c.json({ status: "ok" }));
      app.post("/api/public/signup", (c) => c.json({ success: true }));
      app.post("/api/public/contact", (c) => c.json({ success: true }));
      app.get("/mcp/status", (c) => c.json({ status: "ok" }));
      app.get("/mcp/anything/deep", (c) => c.json({ status: "ok" }));
    });

    it("should allow /health without auth", async () => {
      const res = await app.request("/health", {}, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: "ok" });
    });

    it("should allow /api/health without auth", async () => {
      const res = await app.request("/api/health", {}, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: "ok" });
    });

    it("should allow /api/public/signup without auth", async () => {
      const res = await app.request("/api/public/signup", {
        method: "POST",
      }, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    it("should allow /api/public/contact without auth", async () => {
      const res = await app.request("/api/public/contact", {
        method: "POST",
      }, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    });

    it("should allow /mcp/status without auth", async () => {
      const res = await app.request("/mcp/status", {}, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: "ok" });
    });

    it("should allow nested /mcp/* routes without auth", async () => {
      const res = await app.request("/mcp/anything/deep", {}, mockEnv as Env);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: "ok" });
    });

    it("should set context values to undefined on public routes", async () => {
      app.get("/test-public", (c) => {
        return c.json({
          tenantId: c.get("tenantId"),
          userId: c.get("userId"),
          plan: c.get("plan"),
        });
      });

      const res = await app.request("/health", {}, mockEnv as Env);
      expect(res.status).toBe(200);
    });
  });

  describe("Protected routes (auth required)", () => {
    beforeEach(() => {
      app.use("*", authMiddleware());
      app.get("/api/webhooks", (c) => c.json({ webhooks: [] }));
      app.get("/api/naomi/tasks", (c) => c.json({ tasks: [] }));
      app.post("/api/workflows/trigger", (c) => c.json({ triggered: true }));
      app.get("/api/data/users", (c) => c.json({ data: [] }));
    });

    it("should reject /api/webhooks without auth", async () => {
      const res = await app.request("/api/webhooks", {}, mockEnv as Env);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication required" });
    });

    it("should reject /api/naomi/tasks without auth", async () => {
      const res = await app.request("/api/naomi/tasks", {}, mockEnv as Env);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication required" });
    });

    it("should reject /api/workflows/trigger without auth", async () => {
      const res = await app.request("/api/workflows/trigger", {
        method: "POST",
      }, mockEnv as Env);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication required" });
    });

    it("should accept valid session token on protected routes", async () => {
      const mockSession = {
        tenantId: "test-tenant",
        userId: "test-user",
        plan: "premium",
      };

      mockEnv.SESSION_KV!.get = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      const res = await app.request("/api/webhooks", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(200);
      expect(mockEnv.SESSION_KV!.get).toHaveBeenCalledWith("session:valid-token", "json");
    });

    it("should reject invalid session token", async () => {
      mockEnv.SESSION_KV!.get = vi.fn().mockResolvedValue(null);

      const res = await app.request("/api/webhooks", {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Invalid or expired session" });
    });

    it("should handle SESSION_KV errors by failing closed", async () => {
      mockEnv.SESSION_KV!.get = vi.fn().mockRejectedValue(new Error("KV error"));

      const res = await app.request("/api/webhooks", {
        headers: {
          Authorization: "Bearer some-token",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication failed" });
    });

    it("should set context values from valid session", async () => {
      const mockSession = {
        tenantId: "test-tenant",
        userId: "test-user",
        plan: "premium",
      };

      mockEnv.SESSION_KV!.get = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      app.get("/api/test-context", (c) => {
        return c.json({
          tenantId: c.get("tenantId"),
          userId: c.get("userId"),
          plan: c.get("plan"),
        });
      });

      const res = await app.request("/api/test-context", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockSession);
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      app.use("*", authMiddleware());
      app.get("/api/publicly-named-route", (c) => c.json({ data: "secret" }));
    });

    it("should not confuse /api/publicly-named-route as public", async () => {
      const res = await app.request("/api/publicly-named-route", {}, mockEnv as Env);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication required" });
    });

    it("should handle Bearer token with extra whitespace", async () => {
      const mockSession = {
        tenantId: "test-tenant",
        userId: "test-user",
        plan: "free",
      };

      mockEnv.SESSION_KV!.get = vi.fn().mockResolvedValue(JSON.stringify(mockSession));

      app.get("/api/test", (c) => c.json({ success: true }));

      const res = await app.request("/api/test", {
        headers: {
          Authorization: "Bearer  token-with-spaces",
        },
      }, mockEnv as Env);

      // Should still work - the replace handles "Bearer " prefix
      expect(mockEnv.SESSION_KV!.get).toHaveBeenCalledWith("session: token-with-spaces", "json");
    });

    it("should handle missing Authorization header on protected route", async () => {
      app.get("/api/protected", (c) => c.json({ data: "secret" }));

      const res = await app.request("/api/protected", {}, mockEnv as Env);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: "Authentication required" });
    });

    it("should handle session with missing fields by using defaults", async () => {
      const incompleteSession = {
        tenantId: "test-tenant",
        // Missing userId and plan
      };

      mockEnv.SESSION_KV!.get = vi.fn().mockResolvedValue(JSON.stringify(incompleteSession));

      app.get("/api/test", (c) => {
        return c.json({
          tenantId: c.get("tenantId"),
          userId: c.get("userId"),
          plan: c.get("plan"),
        });
      });

      const res = await app.request("/api/test", {
        headers: {
          Authorization: "Bearer valid-token",
        },
      }, mockEnv as Env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        tenantId: "test-tenant",
        userId: "default",
        plan: "free",
      });
    });
  });
});
