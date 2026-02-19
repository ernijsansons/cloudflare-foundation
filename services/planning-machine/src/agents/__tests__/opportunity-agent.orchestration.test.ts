/**
 * Tests for OpportunityAgent orchestration path.
 * When ORCHESTRATION_ENABLED=true, the agent uses multi-model orchestration.
 * Run with: pnpm test services/planning-machine
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpportunityAgent } from "../opportunity-agent";
import type { Env } from "../../types";

const { mockOpportunityOutput, mockOrchestrationResult } = vi.hoisted(() => {
  const output = {
    originalIdea: "test idea",
    refinedOpportunities: [
      {
        idea: "refined idea",
        description: "A data-driven agentic application",
        revenuePotential: "HIGH" as const,
        customerUrgency: "HIGH" as const,
        competitionDensity: "MEDIUM" as const,
        feasibility: "HIGH" as const,
        agenticScore: "HIGH" as const,
        reasoning: "Strong market fit",
      },
    ],
    recommendedIndex: 0,
    keyInsight: "Key insight",
    unknowns: [] as string[],
  };
  return {
    mockOpportunityOutput: output,
    mockOrchestrationResult: {
      finalText: JSON.stringify(output),
      modelOutputs: [
        { model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", text: "{}", durationMs: 100 },
      ],
      wildIdeas: [],
      synthesizerModel: "claude-3-5-sonnet-20241022",
      totalDurationMs: 500,
    },
  };
});

vi.mock("../../tools/web-search", () => ({
  webSearch: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../lib/orchestrator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/orchestrator")>();
  return {
    ...actual,
    orchestrateModels: vi.fn().mockResolvedValue(mockOrchestrationResult),
    extractJSON: (text: string) => JSON.parse(text),
  };
});

vi.mock("../../lib/model-router", () => ({
  runModel: vi.fn().mockResolvedValue(JSON.stringify(mockOpportunityOutput)),
}));

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    AI: {} as Ai,
    DB: {} as D1Database,
    ORCHESTRATION_ENABLED: "false",
    ...overrides,
  } as Env;
}

describe("OpportunityAgent orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses orchestration path when ORCHESTRATION_ENABLED=true and returns orchestration data", async () => {
    const { orchestrateModels } = await import("../../lib/orchestrator");
    const env = createMockEnv({ ORCHESTRATION_ENABLED: "true" });
    const agent = new OpportunityAgent(env);

    const result = await agent.run(
      {
        runId: "test-run",
        idea: "AI-powered CRM",
        priorOutputs: {},
      },
      { idea: "AI-powered CRM" }
    );

    expect(result.success).toBe(true);
    expect(result.output).toEqual(mockOpportunityOutput);
    expect(result.orchestration).toBeDefined();
    expect(result.orchestration?.modelOutputs).toHaveLength(1);
    expect(result.orchestration?.synthesizerModel).toBe("claude-3-5-sonnet-20241022");
    expect(orchestrateModels).toHaveBeenCalled();
  });

  it("uses single-model path when ORCHESTRATION_ENABLED=false", async () => {
    const { orchestrateModels } = await import("../../lib/orchestrator");
    const { runModel } = await import("../../lib/model-router");
    const env = createMockEnv({ ORCHESTRATION_ENABLED: "false" });
    const agent = new OpportunityAgent(env);

    const result = await agent.run(
      {
        runId: "test-run",
        idea: "AI-powered CRM",
        priorOutputs: {},
      },
      { idea: "AI-powered CRM" }
    );

    expect(result.success).toBe(true);
    expect(result.output).toEqual(mockOpportunityOutput);
    expect(result.orchestration).toBeUndefined();
    expect(orchestrateModels).not.toHaveBeenCalled();
    expect(runModel).toHaveBeenCalled();
  });

  it("falls back to single-model when orchestration fails", async () => {
    const { orchestrateModels } = await import("../../lib/orchestrator");
    const { runModel } = await import("../../lib/model-router");
    vi.mocked(orchestrateModels).mockRejectedValueOnce(new Error("Orchestration failed"));

    const env = createMockEnv({ ORCHESTRATION_ENABLED: "true" });
    const agent = new OpportunityAgent(env);

    const result = await agent.run(
      {
        runId: "test-run",
        idea: "AI-powered CRM",
        priorOutputs: {},
      },
      { idea: "AI-powered CRM" }
    );

    expect(result.success).toBe(true);
    expect(result.output).toEqual(mockOpportunityOutput);
    expect(result.orchestration).toBeUndefined();
    expect(runModel).toHaveBeenCalled();
  });
});
