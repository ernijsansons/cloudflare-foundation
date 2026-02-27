/**
 * Schema validator tests aligned to canonical phase contracts.
 */

import { describe, it, expect } from "vitest";

import {
  extractField,
  getDefinedPhases,
  getSchemaForPhase,
  validatePhaseOutput,
  validateStructure,
} from "../schema-validator";

function buildSectionA() {
  return {
    A0_intake: {
      concept: {
        codename: "PROJECT_ATLAS",
        thesis: "A practical AI operating system for micro-SaaS founders.",
        target_icp: "Bootstrapped solo founders",
        core_directive: "Build agentic workflows that reduce launch time to days.",
        why_now: "Tooling maturity and distribution channels are aligned.",
      },
      outcome_unit: {
        definition: "A shipped feature with test evidence and deploy receipts.",
        proof_artifact: "PR + preview URL + test report",
        time_to_first_outcome: "7 days",
        frequency: "weekly",
        current_cost: "$0-$99",
      },
      agentic_execution: {
        allowed_actions: ["edit code", "run tests", "open PR"],
        forbidden_actions: ["delete production data"],
        hitl_threshold: ["security-sensitive changes"],
        required_integrations: ["github", "cloudflare"],
        external_side_effects: ["deploy preview environments"],
      },
      data_trust: {
        input_sources: [{ source: "public docs", licensing: "permissive" }],
        output_data_types: ["code", "tests", "docs"],
        data_sensitivity: "internal",
        retention_requirements: "Keep audit logs for 30 days.",
        ground_truth: "Passing CI and reproducible test results.",
      },
      constraints: {
        budget_cap: "$200/month",
        timeline: "6 weeks",
        geography: "US",
        compliance_bar: "bootstrap",
        performance_bar: "95th percentile API latency under 300ms.",
      },
      monetization: {
        who_pays: "indie founders",
        pricing_anchor: "$29/month starter plan",
        sales_motion: "self-serve",
        value_metric: "features shipped per month",
      },
      success_kill_switches: {
        north_star: "Weekly shipped features",
        supporting_metrics: ["Time-to-first-merge", "Defect escape rate"],
        kill_conditions: ["No user pull", "No retention", "No distribution edge"],
        "30_day_done": "One production pilot with retained usage.",
        "90_day_done": "Repeatable onboarding and net-positive unit economics.",
      },
    },
    A1_unknowns: {
      core_directive: "RESOLVED",
      hitl_threshold: "RESOLVED",
      tooling_data_gravity: "RESOLVED",
      memory_horizon: "RESOLVED",
      verification_standard: "RESOLVED",
    },
    A2_invariants: {
      no_raw_destructive_ops: true,
      idempotent_side_effects: true,
      auditable_receipts: true,
      llm_gateway: "Cloudflare AI Gateway",
      fail_closed: true,
    },
  };
}

function buildValidTaskReconciliation() {
  return {
    projectId: "run-001",
    projectName: "Atlas",
    generatedAt: "2026-02-24T00:00:00.000Z",
    summary: {
      totalTasks: 1,
      totalMarketingTasks: 1,
      byCategory: { backend: 1, content: 1 },
      byPriority: { p1: 1, p2: 1 },
      criticalPath: ["task-001"],
    },
    intakeConstraints: {
      techStack: "Cloudflare + SvelteKit",
      teamSize: "1 engineer",
      budgetRange: "bootstrap",
      deploymentTarget: "Cloudflare Workers",
      mustAvoid: [],
    },
    buildPhases: [],
    tasks: [
      {
        id: "task-001",
        type: "code",
        title: "Implement auth API",
        description: "Add registration and login endpoints with secure sessions.",
        category: "backend",
        priority: "p1",
        buildPhase: 3,
        dependencies: [],
        blockedBy: [],
        integrationContract: {
          exports: [],
          apiEndpoints: ["POST /api/auth/register", "POST /api/auth/login"],
          databaseMutations: [],
          environmentVarsRequired: [],
          downstreamTasks: [],
        },
        contextBundle: {
          architectureDecisions: [],
          namingConventions: {},
          environmentTopology: {},
          relevantPatterns: [],
          codeSnapshotNotes: [],
        },
        acceptanceCriteria: [{ description: "Endpoints pass integration tests." }],
        naomiPrompt:
          "Implement auth endpoints, tests, and documentation. Enforce secure password handling and session management.",
      },
    ],
    marketingTasks: [
      {
        id: "mkt-001",
        type: "marketing",
        title: "Draft launch page copy",
        description: "Write homepage copy for first launch wave.",
        category: "content",
        targetAudience: "Solo founders",
        conversionObjective: "Email signups",
        naomiPrompt: "Create hero, proof, and CTA copy for launch page.",
      },
    ],
    pipelineMemoryUsed: [],
    researchCitationCount: 1,
    reconciliation: {
      draftTasksReceived: 2,
      tasksMerged: 1,
      securityTasksAdded: 0,
      glueTasksAdded: 0,
      testTasksAdded: 0,
      infraTasksAdded: 0,
      dependencyCyclesFound: 0,
      cyclesResolved: [],
      contributingPhases: ["product-design", "content-engine"],
      lessonsApplied: [],
    },
  };
}

describe("Schema Validator", () => {
  describe("validatePhaseOutput", () => {
    it("validates canonical intake output", () => {
      const result = validatePhaseOutput("phase-0-intake", {
        sectionA: buildSectionA(),
        blockers: [],
        ready_to_proceed: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("validates legacy intake output via alias normalization", () => {
      const result = validatePhaseOutput("intake", {
        refinedIdea: "AI copilots for customer support teams with compliance guardrails.",
        A0_intake: {
          codename: "PROJECT_GUARDIAN",
          thesis: "Support teams need faster resolution with auditability.",
          targetICP: "Regulated SaaS support leaders",
          coreDirective: "Automate first-line triage safely.",
        },
        A1_unknowns: [{ category: "market", question: "Willingness to pay?" }],
      });

      expect(result.valid).toBe(true);
    });

    it("rejects malformed canonical intake output", () => {
      const result = validatePhaseOutput("phase-0-intake", {
        sectionA: buildSectionA(),
        blockers: [],
      });

      expect(result.valid).toBe(false);
      expect((result.errors ?? []).length).toBeGreaterThan(0);
    });

    it("validates opportunity output with canonical fields", () => {
      const result = validatePhaseOutput("opportunity", {
        originalIdea: "AI-first support triage",
        refinedOpportunities: [
          {
            idea: "Verticalized compliance-first helpdesk agent",
            reasoning: "High urgency and clear budget owner",
          },
        ],
      });

      expect(result.valid).toBe(true);
    });

    it("rejects market-research output when citations are missing", () => {
      const result = validatePhaseOutput("market-research", {
        marketSize: { tam: "$1B" },
        citations: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("requires at least one citation");
    });

    it("rejects market-research output when citation URLs are invalid", () => {
      const result = validatePhaseOutput("market-research", {
        marketSize: { tam: "$1B" },
        citations: [{ claim: "Large TAM", url: "not-a-url", confidence: "medium" }],
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("invalid URLs");
    });

    it("validates task-reconciliation output", () => {
      const result = validatePhaseOutput("task-reconciliation", buildValidTaskReconciliation());
      expect(result.valid).toBe(true);
    });

    it("rejects invalid task buildPhase values", () => {
      const invalid = buildValidTaskReconciliation();
      invalid.tasks[0].buildPhase = 0;

      const result = validatePhaseOutput("task-reconciliation", invalid);
      expect(result.valid).toBe(false);
      expect(result.errors?.some((error) => error.includes("buildPhase"))).toBe(true);
    });

    it("returns unknown-phase error when phase is not recognized", () => {
      const result = validatePhaseOutput("unknown-phase", {});
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain("Unknown phase");
    });
  });

  describe("validateStructure", () => {
    it("validates required canonical intake fields", () => {
      const result = validateStructure("phase-0-intake", {
        sectionA: buildSectionA(),
        ready_to_proceed: true,
      });

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it("detects missing canonical intake fields", () => {
      const result = validateStructure("phase-0-intake", {});
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain("sectionA");
      expect(result.missingFields).toContain("ready_to_proceed");
    });

    it("detects missing opportunity required fields", () => {
      const result = validateStructure("opportunity", {});
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain("refinedOpportunities");
    });

    it("returns phase sentinel for unknown phases", () => {
      const result = validateStructure("not-a-phase", {});
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain("<phase>");
    });
  });

  describe("schema lookups", () => {
    it("returns schemas for alias and canonical intake names", () => {
      expect(getSchemaForPhase("intake")).not.toBeNull();
      expect(getSchemaForPhase("phase-0-intake")).not.toBeNull();
    });

    it("returns null for unknown phase schema", () => {
      expect(getSchemaForPhase("unknown-phase")).toBeNull();
    });

    it("returns canonical workflow phase list", () => {
      const phases = getDefinedPhases();
      expect(phases).toContain("phase-0-intake");
      expect(phases).toContain("task-reconciliation");
      expect(phases.length).toBeGreaterThanOrEqual(17);
    });
  });

  describe("extractField", () => {
    it("extracts nested fields", () => {
      const data = { artifact: { content: { summary: { score: 91 } } } };
      expect(extractField(data, "artifact.content.summary.score")).toBe(91);
    });

    it("returns null when field is missing", () => {
      const data = { artifact: { content: {} } };
      expect(extractField(data, "artifact.content.summary.score")).toBeNull();
    });

    it("returns null for non-object root", () => {
      expect(extractField("text", "a.b")).toBeNull();
    });
  });
});
