import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAthenaEnabled,
  fetchAthenaAgents,
  fetchAthenaAgentById,
  checkAthenaHealth,
  type AthenaClientEnv,
} from "../athena-client";

describe("athena-client", () => {
  let mockEnv: AthenaClientEnv;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    mockEnv = {
      ATHENA_SERVICE: { fetch: mockFetch } as unknown as Fetcher,
      AGENTS_ATHENA_ENABLED: "true",
      ATHENA_ADMIN_SECRET: "test-secret-token",
    };
  });

  describe("isAthenaEnabled", () => {
    it("should return true when AGENTS_ATHENA_ENABLED is 'true'", () => {
      expect(isAthenaEnabled(mockEnv)).toBe(true);
    });

    it("should return false when AGENTS_ATHENA_ENABLED is 'false'", () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "false";
      expect(isAthenaEnabled(mockEnv)).toBe(false);
    });

    it("should return false when AGENTS_ATHENA_ENABLED is empty", () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "";
      expect(isAthenaEnabled(mockEnv)).toBe(false);
    });

    it("should return false for any value other than 'true'", () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "TRUE";
      expect(isAthenaEnabled(mockEnv)).toBe(false);

      mockEnv.AGENTS_ATHENA_ENABLED = "1";
      expect(isAthenaEnabled(mockEnv)).toBe(false);
    });
  });

  describe("fetchAthenaAgents", () => {
    it("should return empty agents when disabled", async () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "false";

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.success).toBe(true);
      expect(result.agents).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should include Authorization header when secret is set", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      await fetchAthenaAgents(mockEnv);

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.headers.get("Authorization")).toBe("Bearer test-secret-token");
      expect(request.headers.get("Content-Type")).toBe("application/json");
    });

    it("should not include Authorization header when secret is not set", async () => {
      mockEnv.ATHENA_ADMIN_SECRET = undefined;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ agents: [] }),
      });

      await fetchAthenaAgents(mockEnv);

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.headers.get("Authorization")).toBeNull();
    });

    it("should transform agents from response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agents: [
            {
              id: "athena-1",
              name: "Test Agent",
              agent_type: "master",
              status: "active",
            },
          ],
        }),
      });

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.success).toBe(true);
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].id).toBe("athena-1");
      expect(result.agents[0].source).toBe("athena");
      expect(result.agents[0].role).toBe("root");
    });

    it("should return error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.agents).toEqual([]);
      expect(result.error).toContain("Unauthorized");
      expect(result.errorCode).toBe("UNAUTHORIZED");
    });

    it("should return error for invalid response format", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: "wrong format" }),
      });

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid response format");
    });

    it("should handle fetch exceptions", async () => {
      mockFetch.mockRejectedValue(new Error("Service unavailable"));

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to fetch Athena agents");
      expect(result.error).toContain("Service unavailable");
    });

    it("should transform multiple agents", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agents: [
            { id: "a1", name: "Agent 1", agent_type: "master", status: "active" },
            { id: "a2", name: "Agent 2", agent_type: "department", status: "idle" },
            { id: "a3", name: "Agent 3", agent_type: "worker", status: "busy" },
          ],
        }),
      });

      const result = await fetchAthenaAgents(mockEnv);

      expect(result.agents).toHaveLength(3);
      expect(result.agents[0].role).toBe("root");
      expect(result.agents[1].role).toBe("manager");
      expect(result.agents[2].role).toBe("worker");
    });
  });

  describe("fetchAthenaAgentById", () => {
    it("should return error when disabled", async () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "false";

      const result = await fetchAthenaAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Athena integration is disabled");
    });

    it("should construct correct URL with agent ID", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agent: { id: "agent-1", name: "Test", agent_type: "worker", status: "active" },
        }),
      });

      await fetchAthenaAgentById(mockEnv, "agent-1");

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.url).toContain("/api/v2/agents/agent-1");
    });

    it("should include Authorization header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agent: { id: "agent-1", name: "Test", agent_type: "worker", status: "active" },
        }),
      });

      await fetchAthenaAgentById(mockEnv, "agent-1");

      const request = mockFetch.mock.calls[0][0] as Request;
      expect(request.headers.get("Authorization")).toBe("Bearer test-secret-token");
    });

    it("should return transformed agent on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          agent: { id: "agent-1", name: "Test Worker", agent_type: "worker", status: "active" },
          metrics: { tasks_completed: 10, tasks_failed: 2, avg_latency_ms: 150 },
        }),
      });

      const result = await fetchAthenaAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(true);
      expect(result.agent?.id).toBe("agent-1");
      expect(result.agent?.name).toBe("Test Worker");
      expect(result.raw?.metrics?.tasks_completed).toBe(10);
    });

    it("should handle 404 response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await fetchAthenaAgentById(mockEnv, "non-existent");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Agent not found");
    });

    it("should handle other error responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await fetchAthenaAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Athena API error: 500");
    });

    it("should handle invalid response format", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: "no agent field" }),
      });

      const result = await fetchAthenaAgentById(mockEnv, "agent-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid response format");
    });
  });

  describe("checkAthenaHealth", () => {
    it("should return disabled when feature flag is off", async () => {
      mockEnv.AGENTS_ATHENA_ENABLED = "false";

      const result = await checkAthenaHealth(mockEnv);

      expect(result.enabled).toBe(false);
      expect(result.healthy).toBe(false);
    });

    it("should return healthy when health endpoint returns ok", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await checkAthenaHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(true);
    });

    it("should return unhealthy with error on non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await checkAthenaHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(false);
      expect(result.error).toContain("Health check failed");
    });

    it("should handle fetch exceptions", async () => {
      mockFetch.mockRejectedValue(new Error("Connection timeout"));

      const result = await checkAthenaHealth(mockEnv);

      expect(result.enabled).toBe(true);
      expect(result.healthy).toBe(false);
      expect(result.error).toBe("Connection timeout");
    });
  });
});
