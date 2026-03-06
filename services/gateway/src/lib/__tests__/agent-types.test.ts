import { describe, it, expect } from "vitest";
import {
  mapNaomiRole,
  mapAthenaRole,
  mapNaomiAutonomy,
  parseAthenaCapabilities,
  transformNaomiAgent,
  transformAthenaAgent,
  type NaomiAgent,
  type AthenaAgent,
} from "../agent-types";

describe("agent-types transformers", () => {
  describe("mapNaomiRole", () => {
    it("should map 'boss' to 'root'", () => {
      expect(mapNaomiRole("boss")).toBe("root");
    });

    it("should map 'sovereign' to 'root'", () => {
      expect(mapNaomiRole("sovereign")).toBe("root");
    });

    it("should map 'root' to 'root'", () => {
      expect(mapNaomiRole("root")).toBe("root");
    });

    it("should map 'manager' to 'manager'", () => {
      expect(mapNaomiRole("manager")).toBe("manager");
    });

    it("should map 'lead' to 'manager'", () => {
      expect(mapNaomiRole("lead")).toBe("manager");
    });

    it("should map 'writer' to 'worker' (default)", () => {
      expect(mapNaomiRole("writer")).toBe("worker");
    });

    it("should map 'tester' to 'worker' (default)", () => {
      expect(mapNaomiRole("tester")).toBe("worker");
    });

    it("should map 'reviewer' to 'worker' (default)", () => {
      expect(mapNaomiRole("reviewer")).toBe("worker");
    });

    it("should handle case-insensitive input", () => {
      expect(mapNaomiRole("BOSS")).toBe("root");
      expect(mapNaomiRole("Boss")).toBe("root");
      expect(mapNaomiRole("MANAGER")).toBe("manager");
    });

    it("should map unknown roles to 'worker'", () => {
      expect(mapNaomiRole("unknown")).toBe("worker");
      expect(mapNaomiRole("")).toBe("worker");
      expect(mapNaomiRole("analyst")).toBe("worker");
    });
  });

  describe("mapAthenaRole", () => {
    it("should map 'master' to 'root'", () => {
      expect(mapAthenaRole("master")).toBe("root");
    });

    it("should map 'department' to 'manager'", () => {
      expect(mapAthenaRole("department")).toBe("manager");
    });

    it("should map 'worker' to 'worker'", () => {
      expect(mapAthenaRole("worker")).toBe("worker");
    });

    it("should handle case-insensitive input", () => {
      expect(mapAthenaRole("MASTER")).toBe("root");
      expect(mapAthenaRole("Master")).toBe("root");
      expect(mapAthenaRole("DEPARTMENT")).toBe("manager");
    });

    it("should map unknown types to 'worker'", () => {
      expect(mapAthenaRole("unknown")).toBe("worker");
      expect(mapAthenaRole("")).toBe("worker");
      expect(mapAthenaRole("specialist")).toBe("worker");
    });
  });

  describe("mapNaomiAutonomy", () => {
    it("should map 'auto' to 'auto'", () => {
      expect(mapNaomiAutonomy("auto")).toBe("auto");
    });

    it("should map 'semi_auto' to 'semi_auto'", () => {
      expect(mapNaomiAutonomy("semi_auto")).toBe("semi_auto");
    });

    it("should map 'supervised' to 'supervised'", () => {
      expect(mapNaomiAutonomy("supervised")).toBe("supervised");
    });

    it("should map 'manual_review' to 'manual_review'", () => {
      expect(mapNaomiAutonomy("manual_review")).toBe("manual_review");
    });

    it("should handle case-insensitive input", () => {
      expect(mapNaomiAutonomy("AUTO")).toBe("auto");
      expect(mapNaomiAutonomy("Auto")).toBe("auto");
      expect(mapNaomiAutonomy("SEMI_AUTO")).toBe("semi_auto");
    });

    it("should default to 'manual_review' for unknown levels", () => {
      expect(mapNaomiAutonomy("unknown")).toBe("manual_review");
      expect(mapNaomiAutonomy("")).toBe("manual_review");
      expect(mapNaomiAutonomy(undefined)).toBe("manual_review");
    });
  });

  describe("parseAthenaCapabilities", () => {
    it("should parse valid JSON capabilities", () => {
      const result = parseAthenaCapabilities('["code", "test", "review"]', "worker");
      expect(result.capabilities).toEqual(["code", "test", "review"]);
    });

    it("should return empty array for undefined input", () => {
      const result = parseAthenaCapabilities(undefined, "worker");
      expect(result.capabilities).toEqual([]);
    });

    it("should return empty array for malformed JSON", () => {
      const result = parseAthenaCapabilities("{invalid-json", "worker");
      expect(result.capabilities).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      const result = parseAthenaCapabilities("", "worker");
      expect(result.capabilities).toEqual([]);
    });

    it("should set canDelegate true for root role", () => {
      const result = parseAthenaCapabilities(undefined, "root");
      expect(result.canDelegate).toBe(true);
    });

    it("should set canDelegate true for manager role", () => {
      const result = parseAthenaCapabilities(undefined, "manager");
      expect(result.canDelegate).toBe(true);
    });

    it("should set canDelegate false for worker role", () => {
      const result = parseAthenaCapabilities(undefined, "worker");
      expect(result.canDelegate).toBe(false);
    });

    it("should set canExecute true for worker role", () => {
      const result = parseAthenaCapabilities(undefined, "worker");
      expect(result.canExecute).toBe(true);
    });

    it("should set canExecute true if capabilities include 'execute'", () => {
      const result = parseAthenaCapabilities('["execute", "other"]', "root");
      expect(result.canExecute).toBe(true);
    });

    it("should set canExecute false for root/manager without execute capability", () => {
      const result = parseAthenaCapabilities('["code"]', "root");
      expect(result.canExecute).toBe(false);
    });
  });

  describe("transformNaomiAgent", () => {
    const minimalNaomiAgent: NaomiAgent = {
      agent_id: "naomi-123",
      role: "writer",
      can_delegate: false,
      can_execute: true,
    };

    it("should transform minimal Naomi agent", () => {
      const result = transformNaomiAgent(minimalNaomiAgent);

      expect(result.id).toBe("naomi-123");
      expect(result.name).toBe("Writer");
      expect(result.source).toBe("naomi");
      expect(result.role).toBe("worker");
      expect(result.status).toBe("active");
      expect(result.can_delegate).toBe(false);
      expect(result.can_execute).toBe(true);
      expect(result.capabilities).toEqual([]);
      expect(result.detail_url).toBe("/agents/naomi/naomi-123");
      expect(result.api_endpoint).toBe("/v1/dashboard/agents/naomi-123");
    });

    it("should transform full Naomi agent", () => {
      const fullAgent: NaomiAgent = {
        agent_id: "naomi-456",
        role: "boss",
        can_delegate: true,
        can_execute: false,
        parent_agent_id: "naomi-parent",
        department: "engineering",
        reliability_score: 0.95,
        hallucination_risk: 0.02,
        autonomy_level: "auto",
        unresolved_incidents: 1,
        created_at: 1704067200000,
      };

      const result = transformNaomiAgent(fullAgent);

      expect(result.id).toBe("naomi-456");
      expect(result.name).toBe("Boss");
      expect(result.source).toBe("naomi");
      expect(result.role).toBe("root");
      expect(result.can_delegate).toBe(true);
      expect(result.can_execute).toBe(false);
      expect(result.parent_id).toBe("naomi-parent");
      expect(result.department).toBe("engineering");
      expect(result.reliability_score).toBe(0.95);
      expect(result.hallucination_risk).toBe(0.02);
      expect(result.autonomy_level).toBe("auto");
    });

    it("should capitalize role name correctly", () => {
      const agent: NaomiAgent = {
        agent_id: "test",
        role: "tester",
        can_delegate: false,
        can_execute: true,
      };

      const result = transformNaomiAgent(agent);
      expect(result.name).toBe("Tester");
    });

    it("should handle empty role gracefully", () => {
      const agent: NaomiAgent = {
        agent_id: "test",
        role: "",
        can_delegate: false,
        can_execute: true,
      };

      const result = transformNaomiAgent(agent);
      expect(result.role).toBe("worker");
      expect(result.name).toBe("");
    });
  });

  describe("transformAthenaAgent", () => {
    const minimalAthenaAgent: AthenaAgent = {
      id: "athena-123",
      name: "Engineering Worker",
      agent_type: "worker",
      status: "active",
    };

    it("should transform minimal Athena agent", () => {
      const result = transformAthenaAgent(minimalAthenaAgent);

      expect(result.id).toBe("athena-123");
      expect(result.name).toBe("Engineering Worker");
      expect(result.source).toBe("athena");
      expect(result.role).toBe("worker");
      expect(result.status).toBe("active");
      expect(result.can_delegate).toBe(false);
      expect(result.can_execute).toBe(true);
      expect(result.capabilities).toEqual([]);
      expect(result.autonomy_level).toBe("auto");
      expect(result.detail_url).toBe("/agents/athena/athena-123");
      expect(result.api_endpoint).toBe("/api/v2/agents/athena-123");
    });

    it("should transform full Athena agent", () => {
      const fullAgent: AthenaAgent = {
        id: "athena-456",
        name: "Master Controller",
        agent_type: "master",
        status: "busy",
        parent_agent_id: "athena-parent",
        department: "engineering",
        capabilities: '["code", "test", "deploy"]',
        config: '{"timeout": 30000}',
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        last_heartbeat: "2024-01-02T12:00:00Z",
      };

      const result = transformAthenaAgent(fullAgent);

      expect(result.id).toBe("athena-456");
      expect(result.name).toBe("Master Controller");
      expect(result.source).toBe("athena");
      expect(result.role).toBe("root");
      expect(result.status).toBe("busy");
      expect(result.can_delegate).toBe(true);
      expect(result.can_execute).toBe(false);
      expect(result.capabilities).toEqual(["code", "test", "deploy"]);
      expect(result.parent_id).toBe("athena-parent");
      expect(result.department).toBe("engineering");
    });

    it("should map 'terminated' status to 'offline'", () => {
      const agent: AthenaAgent = {
        id: "test",
        name: "Test Agent",
        agent_type: "worker",
        status: "terminated",
      };

      const result = transformAthenaAgent(agent);
      expect(result.status).toBe("offline");
    });

    it("should handle department agent type", () => {
      const agent: AthenaAgent = {
        id: "test",
        name: "Engineering Department",
        agent_type: "department",
        status: "active",
      };

      const result = transformAthenaAgent(agent);
      expect(result.role).toBe("manager");
      expect(result.can_delegate).toBe(true);
      expect(result.can_execute).toBe(false);
    });

    it("should handle malformed capabilities JSON gracefully", () => {
      const agent: AthenaAgent = {
        id: "test",
        name: "Test Agent",
        agent_type: "worker",
        status: "active",
        capabilities: "not-valid-json{",
      };

      const result = transformAthenaAgent(agent);
      expect(result.capabilities).toEqual([]);
    });

    it("should preserve all status values except terminated", () => {
      const statuses: Array<"active" | "idle" | "busy" | "offline"> = [
        "active",
        "idle",
        "busy",
        "offline",
      ];

      for (const status of statuses) {
        const agent: AthenaAgent = {
          id: "test",
          name: "Test",
          agent_type: "worker",
          status,
        };
        const result = transformAthenaAgent(agent);
        expect(result.status).toBe(status);
      }
    });
  });
});
