import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { corsMiddleware } from "../cors";
import type { Env } from "../../types";

describe("corsMiddleware", () => {
  let app: Hono<{ Bindings: Env }>;

  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    app.use("*", corsMiddleware());
    app.get("/test", (c) => c.json({ success: true }));
  });

  describe("Production environment", () => {
    const prodEnv: Partial<Env> = {
      ENVIRONMENT: "production",
      ALLOWED_ORIGINS: "https://example.com,https://app.example.com",
    };

    it("should reject localhost origins in production", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "http://localhost:3000",
        },
      }, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeNull();
    });

    it("should reject any localhost port in production", async () => {
      const origins = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:9999",
      ];

      for (const origin of origins) {
        const res = await app.request("/test", {
          headers: { Origin: origin },
        }, prodEnv as Env);

        const corsHeader = res.headers.get("Access-Control-Allow-Origin");
        expect(corsHeader).toBeNull();
      }
    });

    it("should allow configured ALLOWED_ORIGINS in production", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "https://example.com",
        },
      }, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("https://example.com");
    });

    it("should allow multiple configured origins in production", async () => {
      const allowedOrigins = ["https://example.com", "https://app.example.com"];

      for (const origin of allowedOrigins) {
        const res = await app.request("/test", {
          headers: { Origin: origin },
        }, prodEnv as Env);

        const corsHeader = res.headers.get("Access-Control-Allow-Origin");
        expect(corsHeader).toBe(origin);
      }
    });

    it("should reject unauthorized origins in production", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "https://attacker.com",
        },
      }, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeNull();
    });
  });

  describe("Staging environment", () => {
    const stagingEnv: Partial<Env> = {
      ENVIRONMENT: "staging",
      ALLOWED_ORIGINS: "https://staging.example.com",
    };

    it("should reject localhost origins in staging", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "http://localhost:3000",
        },
      }, stagingEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeNull();
    });

    it("should allow configured staging origin", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "https://staging.example.com",
        },
      }, stagingEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("https://staging.example.com");
    });
  });

  describe("Development environment", () => {
    const devEnv: Partial<Env> = {
      ENVIRONMENT: "development",
      ALLOWED_ORIGINS: "",
    };

    it("should allow localhost:3000 in development", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "http://localhost:3000",
        },
      }, devEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("http://localhost:3000");
    });

    it("should allow localhost:5173 in development", async () => {
      const res = await app.request("/test", {
        headers: {
          Origin: "http://localhost:5173",
        },
      }, devEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("http://localhost:5173");
    });

    it("should allow any localhost port in development", async () => {
      const origins = [
        "http://localhost:8080",
        "http://localhost:9999",
        "http://localhost:4200",
      ];

      for (const origin of origins) {
        const res = await app.request("/test", {
          headers: { Origin: origin },
        }, devEnv as Env);

        const corsHeader = res.headers.get("Access-Control-Allow-Origin");
        expect(corsHeader).toBe(origin);
      }
    });

    it("should allow configured origins even in development", async () => {
      const envWithOrigins: Partial<Env> = {
        ENVIRONMENT: "development",
        ALLOWED_ORIGINS: "https://dev.example.com",
      };

      const res = await app.request("/test", {
        headers: {
          Origin: "https://dev.example.com",
        },
      }, envWithOrigins as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("https://dev.example.com");
    });
  });

  describe("Edge cases", () => {
    it("should reject requests with no origin header", async () => {
      const prodEnv: Partial<Env> = {
        ENVIRONMENT: "production",
        ALLOWED_ORIGINS: "https://example.com",
      };

      const res = await app.request("/test", {}, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeNull();
    });

    it("should handle empty ALLOWED_ORIGINS in production", async () => {
      const prodEnv: Partial<Env> = {
        ENVIRONMENT: "production",
        ALLOWED_ORIGINS: "",
      };

      const res = await app.request("/test", {
        headers: {
          Origin: "https://example.com",
        },
      }, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBeNull();
    });

    it("should trim whitespace from ALLOWED_ORIGINS", async () => {
      const prodEnv: Partial<Env> = {
        ENVIRONMENT: "production",
        ALLOWED_ORIGINS: " https://example.com , https://app.example.com ",
      };

      const res = await app.request("/test", {
        headers: {
          Origin: "https://example.com",
        },
      }, prodEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("https://example.com");
    });

    it("should default to development when ENVIRONMENT is not set", async () => {
      const noEnv: Partial<Env> = {
        // ENVIRONMENT not set
        ALLOWED_ORIGINS: "",
      };

      const res = await app.request("/test", {
        headers: {
          Origin: "http://localhost:8080",
        },
      }, noEnv as Env);

      const corsHeader = res.headers.get("Access-Control-Allow-Origin");
      expect(corsHeader).toBe("http://localhost:8080");
    });

    it("should set correct CORS headers for allowed origins", async () => {
      const prodEnv: Partial<Env> = {
        ENVIRONMENT: "production",
        ALLOWED_ORIGINS: "https://example.com",
      };

      const res = await app.request("/test", {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
        },
      }, prodEnv as Env);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
      expect(res.headers.get("Access-Control-Max-Age")).toBe("86400");
    });
  });
});
