import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isNaomiEnabled,
  fetchNaomiAgents,
  fetchNaomiAgentById,
  checkNaomiHealth,
  type NaomiClientEnv,
} from "../naomi-client";

describe("naomi-client", () => {
  let mockEnv: NaomiClientEnv;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    mockEnv = {
      NAOMI_SERVICE: { fetch: mockFetch } as unknown as Fetcher,
      AGENTS_NAOMI_ENABLED: "true",
      NAOMI_TENANT_ID: "test-tenant",
      NAOMI_BUSINESS_ID: "test-business",
    };
  });

  describe("isNaomiEnabled", () => {
    it("should return true when AGENTS_NAOMI_ENABLED is 'true'", () => {
      expect(isNaomiEnabled(mockEnv)).toBe(true);
    });

    it("should return false when AGENTS_NAOMI_ENABLED is 'false'", () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "false";
      expect(isNaomiEnabled(mockEnv)).toBe(false);
    });

    it("should return false when AGENTS_NAOMI_ENABLED is empty", () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "";
      expect(isNaomiEnabled(mockEnv)).toBe(false);
    });

    it("should return false for any value other than 'true'", () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "TRUE";
      expect(isNaomiEnabled(mockEnv)).toBe(false);

      mockEnv.AGENTS_NAOMI_ENABLED = "yes";
      expect(isNaomiEnabled(mockEnv)).toBe(false);
    });
  });

  describe("fetchNaomiAgents", () => {
    it("should return empty agents when disabled", async () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "false";

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(true);
      expect(result.agents).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should construct correct request URL with env params", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      await fetchNaomiAgents(mockEnv);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain("tenant_id=test-tenant");
      expect(request.url).toContain("business_id=test-business");
      expect(request.url).toContain("/v1/dashboard/agents");
    });

    it("should use context params over env params when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      await fetchNaomiAgents(mockEnv, {
        tenant_id: "context-tenant",
        business_id: "context-business",
      });

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain("tenant_id=context-tenant");
      expect(request.url).toContain("business_id=context-business");
    });

    it("should use defaults when env params not set", async () => {
      mockEnv.NAOMI_TENANT_ID = undefined;
      mockEnv.NAOMI_BUSINESS_ID = undefined;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      await fetchNaomiAgents(mockEnv);

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain("tenant_id=global");
      expect(request.url).toContain("business_id=naomi");
    });

    it("should transform agents from response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agents: [
            {
              agent_id: "agent-1",
              role: "boss",
              can_delegate: true,
              can_execute: false,
            },
          ],
        }),
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(true);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].id).toBe("agent-1");
      expect(result.agents[0].source).toBe("naomi");
      expect(result.agents[0].role).toBe("root");
    });

    it("should return error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.agents).toEqual([]);
      expect(result.error).toContain("Naomi API error: 500");
    });

    it("should return error for invalid response format", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: "wrong format" }),
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid response format");
    });

    it("should return error for null agents array", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: null }),
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid response format");
      expect(result.errorCode).toBe("INVALID_RESPONSE");
    });

    it("should detect HTTP 200 with error body (ok: false)", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: "oracle_error: table not found" }),
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("oracle_error");
      expect(result.errorCode).toBe("API_ERROR");
    });

    it("should detect HTTP 200 with error field", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: "database_connection_failed" }),
      });

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toBe("database_connection_failed");
      expect(result.errorCode).toBe("API_ERROR");
    });

    it("should handle fetch exceptions", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await fetchNaomiAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to fetch Naomi agents");
      expect(result.error).toContain("Network error");
    });
  });

  describe("fetchNaomiAgentById", () => {
    it("should return error when disabled", async () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "false";

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Naomi integration is disabled");
    });

    it("should construct correct URL with agent ID", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agent: { agent_id: "agent-1", role: "worker", can_delegate: false, can_execute: true },
        }),
      });

      await fetchNaomiAgentById(mockEnv, "agent-1");

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain("/v1/dashboard/agents/agent-1");
    });

    it("should return transformed agent on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agent: { agent_id: "agent-1", role: "worker", can_delegate: false, can_execute: true },
          tasks: [{ task_id: "task-1", status: "completed" }],
        }),
      });

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(true);
      expect(result.agent?.id).toBe("agent-1");
      expect(result.raw?.tasks).toHaveLength(1);
    });

    it("should handle 404 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await fetchNaomiAgentById(mockEnv, "non-existent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Agent not found");
    });

    it("should handle invalid response format", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: "no agent field" }),
      });

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid response format");
    });

    it("should detect HTTP 200 with agent_not_found error", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: "agent_not_found" }),
      });

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("agent_not_found");
      expect(result.errorCode).toBe("NOT_FOUND");
    });

    it("should detect HTTP 200 with ok: false and generic error", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false, error: "database_timeout" }),
      });

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("database_timeout");
      expect(result.errorCode).toBe("API_ERROR");
    });

    it("should detect not found in error message variations", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: "Agent not found in database" }),
      });

      const result = await fetchNaomiAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Agent not found in database");
      expect(result.errorCode).toBe("NOT_FOUND");
    });
  });

  describe("checkNaomiHealth", () => {
    it("should return disabled when feature flag is off", async () => {
      mockEnv.AGENTS_NAOMI_ENABLED = "false";

      const result = await checkNaomiHealth(mockEnv);

      expect(result.enabled).toBe(false);
      expect(result.healthy).toBe(false);
    });

    it("should return healthy when health endpoint returns ok", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await checkNaomiHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(true);
    });

    it("should return unhealthy with error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await checkNaomiHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(false);
      expect(result.error).toContain("Health check failed");
    });

    it("should handle fetch exceptions", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const result = await checkNaomiHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });
});
