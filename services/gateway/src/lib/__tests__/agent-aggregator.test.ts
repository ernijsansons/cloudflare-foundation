import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAllAgents,
  groupAgentsBySource,
  groupAgentsByRole,
  buildAgentHierarchy,
  buildAgentListResponse,
  type AgentAggregatorEnv,
} from "../agent-aggregator";
import type { DashboardAgent } from "../agent-types";

describe("agent-aggregator", () => {
  let mockEnv: AgentAggregatorEnv;
  let mockNaomiFetch: ReturnType<typeof vi.fn>;
  let mockAthenaFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNaomiFetch = vi.fn();
    mockAthenaFetch = vi.fn();

    mockEnv = {
      // Naomi bindings
      NAOMI_SERVICE: { fetch: mockNaomiFetch } as unknown as Fetcher,
      AGENTS_NAOMI_ENABLED: "true",
      NAOMI_TENANT_ID: "test-tenant",
      NAOMI_BUSINESS_ID: "test-business",
      // Athena bindings
      ATHENA_SERVICE: { fetch: mockAthenaFetch } as unknown as Fetcher,
      AGENTS_ATHENA_ENABLED: "true",
      ATHENA_ADMIN_SECRET: "test-secret",
    };
  });

  describe("fetchAllAgents", () => {
    describe("source filtering", () => {
      it("should fetch only from Naomi when source is 'naomi'", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ agent_id: "n1", role: "worker", can_delegate: false, can_execute: true }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "naomi");

        expect(mockNaomiFetch).toHaveBeenCalled();
        expect(mockAthenaFetch).not.toHaveBeenCalled();
        expect(result.agents).toHaveLength(1);
        expect(result.agents[0].source).toBe("naomi");
      });

      it("should fetch only from Athena when source is 'athena'", async () => {
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ id: "a1", name: "A1", agent_type: "worker", status: "active" }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "athena");

        expect(mockAthenaFetch).toHaveBeenCalled();
        expect(mockNaomiFetch).not.toHaveBeenCalled();
        expect(result.agents).toHaveLength(1);
        expect(result.agents[0].source).toBe("athena");
      });

      it("should fetch from both when source is 'all'", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ agent_id: "n1", role: "worker", can_delegate: false, can_execute: true }],
          }),
        });
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ id: "a1", name: "A1", agent_type: "worker", status: "active" }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");

        expect(mockNaomiFetch).toHaveBeenCalled();
        expect(mockAthenaFetch).toHaveBeenCalled();
        expect(result.agents).toHaveLength(2);
      });
    });

    describe("graceful degradation", () => {
      it("should continue when Naomi fails but Athena succeeds", async () => {
        mockNaomiFetch.mockRejectedValue(new Error("Naomi service down"));
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ id: "a1", name: "A1", agent_type: "worker", status: "active" }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");

        expect(result.agents).toHaveLength(1);
        expect(result.agents[0].source).toBe("athena");
        expect(result.sources.naomi.healthy).toBe(false);
        expect(result.sources.naomi.error).toContain("Naomi service down");
        expect(result.sources.athena.healthy).toBe(true);
        expect(result.errors).toHaveLength(1);
      });

      it("should continue when Athena fails but Naomi succeeds", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ agent_id: "n1", role: "worker", can_delegate: false, can_execute: true }],
          }),
        });
        mockAthenaFetch.mockRejectedValue(new Error("Athena service down"));

        const result = await fetchAllAgents(mockEnv, "all");

        expect(result.agents).toHaveLength(1);
        expect(result.agents[0].source).toBe("naomi");
        expect(result.sources.naomi.healthy).toBe(true);
        expect(result.sources.athena.healthy).toBe(false);
        expect(result.sources.athena.error).toContain("Athena service down");
        expect(result.errors).toHaveLength(1);
      });

      it("should return empty with errors when both fail", async () => {
        mockNaomiFetch.mockRejectedValue(new Error("Naomi down"));
        mockAthenaFetch.mockRejectedValue(new Error("Athena down"));

        const result = await fetchAllAgents(mockEnv, "all");

        expect(result.agents).toHaveLength(0);
        expect(result.sources.naomi.healthy).toBe(false);
        expect(result.sources.athena.healthy).toBe(false);
        expect(result.errors).toHaveLength(2);
      });

      it("should handle API error responses gracefully", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ id: "a1", name: "A1", agent_type: "worker", status: "active" }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");

        expect(result.agents).toHaveLength(1);
        expect(result.sources.naomi.healthy).toBe(false);
        expect(result.sources.naomi.error).toContain("500");
      });
    });

    describe("feature flags", () => {
      it("should not fetch from Naomi when disabled", async () => {
        mockEnv.AGENTS_NAOMI_ENABLED = "false";
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ id: "a1", name: "A1", agent_type: "worker", status: "active" }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");

        expect(mockNaomiFetch).not.toHaveBeenCalled();
        expect(result.sources.naomi.enabled).toBe(false);
        expect(result.agents).toHaveLength(1);
      });

      it("should not fetch from Athena when disabled", async () => {
        mockEnv.AGENTS_ATHENA_ENABLED = "false";
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [{ agent_id: "n1", role: "worker", can_delegate: false, can_execute: true }],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");

        expect(mockAthenaFetch).not.toHaveBeenCalled();
        expect(result.sources.athena.enabled).toBe(false);
        expect(result.agents).toHaveLength(1);
      });

      it("should return empty when both disabled", async () => {
        mockEnv.AGENTS_NAOMI_ENABLED = "false";
        mockEnv.AGENTS_ATHENA_ENABLED = "false";

        const result = await fetchAllAgents(mockEnv, "all");

        expect(mockNaomiFetch).not.toHaveBeenCalled();
        expect(mockAthenaFetch).not.toHaveBeenCalled();
        expect(result.agents).toHaveLength(0);
      });
    });

    describe("sorting", () => {
      it("should sort agents by role: root first, then manager, then worker", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [
              { agent_id: "n1", role: "worker", can_delegate: false, can_execute: true },
              { agent_id: "n2", role: "boss", can_delegate: true, can_execute: false },
              { agent_id: "n3", role: "manager", can_delegate: true, can_execute: false },
            ],
          }),
        });
        mockEnv.AGENTS_ATHENA_ENABLED = "false";

        const result = await fetchAllAgents(mockEnv, "all");

        expect(result.agents[0].role).toBe("root");
        expect(result.agents[1].role).toBe("manager");
        expect(result.agents[2].role).toBe("worker");
      });

      it("should sort by source then name within same role", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [
              { agent_id: "n1", role: "writer", can_delegate: false, can_execute: true },
              { agent_id: "n2", role: "tester", can_delegate: false, can_execute: true },
            ],
          }),
        });
        mockAthenaFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            agents: [
              { id: "a1", name: "Alpha", agent_type: "worker", status: "active" },
              { id: "a2", name: "Zeta", agent_type: "worker", status: "active" },
            ],
          }),
        });

        const result = await fetchAllAgents(mockEnv, "all");
        const workers = result.agents.filter((a) => a.role === "worker");

        // All should be workers, sorted by source then name
        expect(workers.every((a) => a.role === "worker")).toBe(true);
      });
    });

    describe("tenant context", () => {
      it("should pass tenant context to Naomi client", async () => {
        mockNaomiFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ agents: [] }),
        });
        mockEnv.AGENTS_ATHENA_ENABLED = "false";

        await fetchAllAgents(mockEnv, "all", {
          tenant_id: "custom-tenant",
          business_id: "custom-business",
        });

        const request = mockNaomiFetch.mock.calls[0][0] as Request;
        expect(request.url).toContain("tenant_id=custom-tenant");
        expect(request.url).toContain("business_id=custom-business");
      });
    });
  });

  describe("groupAgentsBySource", () => {
    it("should group agents by their source", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "n1", source: "naomi" }),
        createMockAgent({ id: "n2", source: "naomi" }),
        createMockAgent({ id: "a1", source: "athena" }),
      ];

      const result = groupAgentsBySource(agents);

      expect(result.naomi).toHaveLength(2);
      expect(result.athena).toHaveLength(1);
    });

    it("should return empty object for empty input", () => {
      const result = groupAgentsBySource([]);
      expect(result).toEqual({});
    });

    it("should handle single source", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "n1", source: "naomi" }),
        createMockAgent({ id: "n2", source: "naomi" }),
      ];

      const result = groupAgentsBySource(agents);

      expect(result.naomi).toHaveLength(2);
      expect(result.athena).toBeUndefined();
    });
  });

  describe("groupAgentsByRole", () => {
    it("should group agents by their role", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "1", role: "root" }),
        createMockAgent({ id: "2", role: "manager" }),
        createMockAgent({ id: "3", role: "manager" }),
        createMockAgent({ id: "4", role: "worker" }),
        createMockAgent({ id: "5", role: "worker" }),
        createMockAgent({ id: "6", role: "worker" }),
      ];

      const result = groupAgentsByRole(agents);

      expect(result.root).toHaveLength(1);
      expect(result.manager).toHaveLength(2);
      expect(result.worker).toHaveLength(3);
    });

    it("should return empty object for empty input", () => {
      const result = groupAgentsByRole([]);
      expect(result).toEqual({});
    });
  });

  describe("buildAgentHierarchy", () => {
    it("should build tree from flat list", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "root", role: "root", parent_id: undefined }),
        createMockAgent({ id: "manager1", role: "manager", parent_id: "root" }),
        createMockAgent({ id: "worker1", role: "worker", parent_id: "manager1" }),
        createMockAgent({ id: "worker2", role: "worker", parent_id: "manager1" }),
      ];

      const result = buildAgentHierarchy(agents);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("root");
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children![0].id).toBe("manager1");
      expect(result[0].children![0].children).toHaveLength(2);
    });

    it("should handle multiple root agents", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "root1", role: "root", parent_id: undefined }),
        createMockAgent({ id: "root2", role: "root", parent_id: undefined }),
        createMockAgent({ id: "child1", role: "worker", parent_id: "root1" }),
      ];

      const result = buildAgentHierarchy(agents);

      expect(result).toHaveLength(2);
      expect(result.find((a) => a.id === "root1")?.children).toHaveLength(1);
      expect(result.find((a) => a.id === "root2")?.children).toHaveLength(0);
    });

    it("should handle orphan agents (parent not in list)", () => {
      const agents: DashboardAgent[] = [
        createMockAgent({ id: "orphan", role: "worker", parent_id: "non-existent" }),
      ];

      const result = buildAgentHierarchy(agents);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("orphan");
    });

    it("should return empty array for empty input", () => {
      const result = buildAgentHierarchy([]);
      expect(result).toEqual([]);
    });
  });

  describe("buildAgentListResponse", () => {
    it("should build response with correct structure", () => {
      const aggregatedResult = {
        agents: [createMockAgent({ id: "1" })],
        sources: {
          naomi: { enabled: true, healthy: true, count: 1, error: undefined },
          athena: { enabled: true, healthy: false, count: 0, error: "Service unavailable" },
        },
        errors: ["Athena: Service unavailable"],
      };

      const response = buildAgentListResponse(aggregatedResult);

      expect(response.agents).toHaveLength(1);
      expect(response.sources.naomi.enabled).toBe(true);
      expect(response.sources.naomi.healthy).toBe(true);
      expect(response.sources.naomi.count).toBe(1);
      expect(response.sources.athena.enabled).toBe(true);
      expect(response.sources.athena.healthy).toBe(false);
      expect(response.sources.athena.count).toBe(0);
    });
  });
});

// Helper function to create mock DashboardAgent
function createMockAgent(
  overrides: Partial<DashboardAgent> & { id: string }
): DashboardAgent {
  const source = overrides.source ?? "naomi";
  const id = overrides.id;
  return {
    id,
    name: overrides.name ?? `Agent ${id}`,
    source,
    role: overrides.role ?? "worker",
    status: overrides.status ?? "active",
    can_delegate: overrides.can_delegate ?? false,
    can_execute: overrides.can_execute ?? true,
    capabilities: overrides.capabilities ?? [],
    parent_id: overrides.parent_id,
    department: overrides.department,
    reliability_score: overrides.reliability_score,
    hallucination_risk: overrides.hallucination_risk,
    autonomy_level: overrides.autonomy_level,
    detail_url: `/agents/${source}/${id}`,
    api_endpoint: `/api/${id}`,
  };
}
