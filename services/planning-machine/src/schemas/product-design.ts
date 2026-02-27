import { z } from "zod";

// ============================================================================
// AGENT GOVERNANCE SCHEMA (Phase 1.5)
// Required for agentic software to specify agent architecture, permissions,
// memory, execution guardrails, and kill switches
// ============================================================================

export const AgentRoleSchema = z.object({
  name: z.string(),
  type: z.enum(["primary", "sub-agent", "supervisor", "worker"]),
  responsibility: z.string(),
  autonomyLevel: z.enum(["fully-autonomous", "supervised", "human-approval-required"]),
});

export const AgentPermissionMatrixSchema = z.object({
  agentRole: z.string(),
  allowedTools: z.array(z.string()),         // MCP tools this agent can use
  forbiddenActions: z.array(z.string()),     // Explicit prohibitions
  escalationRules: z.array(z.string()),      // When to escalate to human
});

export const AgentMemoryArchitectureSchema = z.object({
  agentSpecificMemory: z.record(z.string(), z.object({
    d1Tables: z.array(z.string()).default([]),
    r2Buckets: z.array(z.string()).default([]),
    kvNamespaces: z.array(z.string()).default([]),
    vectorizeIndexes: z.array(z.string()).default([]),
  })),
  sharedMemory: z.object({
    d1Tables: z.array(z.string()).default([]),
    r2Buckets: z.array(z.string()).default([]),
  }),
});

export const ExecutionLimitsSchema = z.object({
  maxRecursionDepth: z.number().int().min(1).max(10),
  maxParallelAgents: z.number().int().min(1),
  timeoutPerAgent: z.string(),  // e.g., "30s", "5m"
  retryStrategy: z.object({
    maxRetries: z.number().int(),
    backoff: z.enum(["linear", "exponential"]),
  }),
});

export const KillSwitchConditionSchema = z.object({
  condition: z.string(),
  action: z.enum(["pause-all", "rollback", "escalate-human"]),
});

// Deterministic ID Strategy (Phase 1.5)
export const DeterministicIDStrategySchema = z.object({
  type: z.enum(["deterministic", "random"]),
  deterministicInputs: z.array(z.string()).optional(),  // e.g., ["tenantId", "userId", "taskType"]
  hashAlgorithm: z.enum(["SHA-256", "SHA-512"]).optional(),
  encoding: z.enum(["base64", "hex"]).optional(),
  benefits: z.array(z.string()).default([
    "idempotent-creation",
    "cross-session-reconnect",
    "no-lookup-table"
  ]),
});

export const AgentGovernanceSchema = z.object({
  // Agent Topology
  agentRoles: z.array(AgentRoleSchema).min(1),

  // Permission System
  permissionMatrix: z.array(AgentPermissionMatrixSchema),

  // Memory Architecture
  memoryArchitecture: AgentMemoryArchitectureSchema,

  // Execution Guardrails
  executionLimits: ExecutionLimitsSchema,

  // Kill Switch
  killSwitchConditions: z.array(KillSwitchConditionSchema).min(1),

  // Governance Pattern
  governancePattern: z.enum([
    "single-agent",
    "commander-scout",
    "supervisor-worker",
    "peer-swarm",
    "hierarchical",
  ]),

  // Deterministic ID Strategy
  idStrategy: DeterministicIDStrategySchema.optional(),
});

// ============================================================================
// MAIN PRODUCT DESIGN OUTPUT SCHEMA
// ============================================================================

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const LandingPageBlueprintSchema = z.any().nullish();
export const DesignSystemSchema = z.any().nullish();
export const AppPageSchema = z.any().nullish();

export const ProductDesignOutputSchema = z.object({
  mvpScope: anyField,
  informationArchitecture: anyField,
  landingPageBlueprint: anyField,
  appPages: anyArray,
  designSystem: anyField,
  copyGuidance: anyField,
  conversionOptimization: anyField,
  accessibilityRequirements: anyArray,
  performanceBudget: anyField,
  recommendedTechStack: anyField,

  // NEW: Agent Governance (Phase 1.5) - Required if isAgenticSoftware === true
  isAgenticSoftware: z.boolean().default(false),
  agentGovernance: AgentGovernanceSchema.optional(),

  /**
   * Draft tasks contributed by product-design toward final TASKS.json.
   * Include: frontend pages, UI components, API endpoints, DB tables needed.
   */
  draftTasks: anyArray,
}).passthrough().refine(
  (data) => {
    // If agentic software, governance is required
    if (data.isAgenticSoftware && !data.agentGovernance) {
      return false;
    }
    return true;
  },
  { message: "Agent governance required for agentic software" }
);

export type ProductDesignOutput = z.infer<typeof ProductDesignOutputSchema>;
