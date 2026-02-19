/**
 * TASKS.json Output Schema — the final one-shot build artifact.
 *
 * Produced by Phase 16 (task-reconciliation-agent) after all planning phases complete.
 * Contains every atomic task needed to build and launch the product, organized by
 * build phase with dependency graph, integration contracts, and self-contained
 * naomiPrompts for zero-context execution.
 *
 * Two task types: CodeTask (for engineering work) and MarketingTask (for content/marketing).
 * These require different fields and verification strategies.
 */

import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────────────────────

export const TaskAcceptanceCriterionSchema = z.object({
  description: z.string(),
  /** Shell command to run for automated verification (e.g., "pnpm test --filter auth") */
  verificationCommand: z.string().nullish(),
  severity: z.enum(["blocking", "warning"]).default("blocking"),
});

export const IntegrationContractSchema = z.object({
  /** TypeScript exports this task produces, as human-readable interface descriptions */
  exports: z.array(z.string()).default([]),
  /** API endpoints this task creates (e.g., "POST /api/auth/register") */
  apiEndpoints: z.array(z.string()).default([]),
  /** Database mutations this task performs (e.g., "creates users table row") */
  databaseMutations: z.array(z.string()).default([]),
  /** Environment variables this task requires to be set */
  environmentVarsRequired: z.array(z.string()).default([]),
  /** Other tasks that will break if this task's contract changes */
  downstreamTasks: z.array(z.string()).default([]),
});

export const ContextBundleSchema = z.object({
  /** Architecture decisions that constrain how this task should be implemented */
  architectureDecisions: z.array(z.string()).default([]),
  /** File/function/DB naming conventions for this project */
  namingConventions: z.record(z.string(), z.string()).default({}),
  /** Environment variable topology (which vars exist in which environments) */
  environmentTopology: z.record(z.string(), z.array(z.string())).default({}),
  /** References to existing patterns in the codebase to follow */
  relevantPatterns: z.array(z.string()).default([]),
  /** Current state assumptions about files this task will modify */
  codeSnapshotNotes: z.array(z.string()).default([]),
});

export const GitConfigSchema = z.object({
  branchName: z.string(),
  baseBranch: z.string().default("main"),
  mergeStrategy: z.enum(["auto-merge-when-verified", "human-review-required"]).default("human-review-required"),
  /** Files where concurrent modification by other tasks is likely */
  conflictSensitiveFiles: z.array(z.string()).default([]),
});

// ─── CodeTask ─────────────────────────────────────────────────────────────────

export const CodeTaskSchema = z.object({
  id: z.string(),
  type: z.literal("code").default("code"),
  title: z.string(),
  description: z.string(),
  category: z.enum([
    "devops",
    "backend",
    "frontend",
    "middleware",
    "database",
    "testing",
    "security",
    "integration",
    "documentation",
    "pr-review",
    "launch",
  ]),
  subcategory: z.string().nullish(),
  priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
  /**
   * Build phase number (1–8):
   * 1=Infrastructure, 2=Database, 3=Backend, 4=Frontend,
   * 5=Integrations, 6=Testing, 7=Marketing, 8=Launch
   */
  buildPhase: z.number().int().min(1).max(8),
  /** IDs of tasks that must complete before this task can start */
  dependencies: z.array(z.string()).default([]),
  /** IDs of tasks that are blocked by this task */
  blockedBy: z.array(z.string()).default([]),
  integrationContract: IntegrationContractSchema,
  contextBundle: ContextBundleSchema,
  acceptanceCriteria: z.array(TaskAcceptanceCriterionSchema),
  filesToCreate: z.array(z.string()).default([]),
  filesToModify: z.array(z.string()).default([]),
  estimatedEffort: z.enum(["xs", "s", "m", "l", "xl"]).default("m"),
  ownerType: z.enum(["engineer", "devops", "designer"]).default("engineer"),
  canBeParallelized: z.boolean().default(false),
  isOneShottable: z.boolean().default(true),
  /**
   * If true, a separate security-review task must be scheduled after this task.
   * Required for all tasks touching user data, auth, payments.
   */
  securityReviewRequired: z.boolean().default(false),
  /**
   * The self-contained Claude Code execution prompt.
   * MUST include: architecture context, naming conventions, file structure,
   * acceptance criteria, and specific implementation instructions.
   * A fresh Claude Code session must be able to execute this without any
   * additional context.
   */
  naomiPrompt: z.string(),
  git: GitConfigSchema.nullish(),
  /** Which planning phase first drafted this task */
  sourcePhase: z.string().nullish(),
  draftedAt: z.string().nullish(),
  reconciledAt: z.string().nullish(),
});

// ─── MarketingTask ────────────────────────────────────────────────────────────

export const MarketingTaskSchema = z.object({
  id: z.string(),
  type: z.literal("marketing").default("marketing"),
  title: z.string(),
  description: z.string(),
  category: z.enum(["copy", "seo", "content", "campaign", "social", "email", "pr-review"]),
  priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
  buildPhase: z.number().int().min(1).max(8).default(7),
  dependencies: z.array(z.string()).default([]),
  targetAudience: z.string(),
  brandVoice: z.string().nullish(),
  conversionObjective: z.string(),
  contentTemplate: z.object({
    sections: z.array(z.string()).default([]),
    maxWords: z.number().nullish(),
    format: z.string().nullish(),
  }).nullish(),
  competitorExamples: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.object({
    description: z.string(),
    severity: z.enum(["blocking", "warning"]).default("blocking"),
  })).default([]),
  /** Marketing tasks always require human review — no auto-verification */
  humanReviewRequired: z.literal(true).default(true),
  isOneShottable: z.boolean().default(true),
  naomiPrompt: z.string(),
  sourcePhase: z.string().nullish(),
});

// ─── Build Phase ──────────────────────────────────────────────────────────────

export const BuildPhaseSchema = z.object({
  id: z.number().int().min(1).max(8),
  name: z.string(),
  description: z.string().nullish(),
  taskIds: z.array(z.string()).default([]),
  marketingTaskIds: z.array(z.string()).default([]),
  /** IDs of build phases that must complete before this phase can start */
  dependsOnPhases: z.array(z.number()).default([]),
});

// ─── Full TASKS.json ──────────────────────────────────────────────────────────

export const TasksOutputSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  generatedAt: z.string(),
  version: z.string().default("1.0"),

  summary: z.object({
    totalTasks: z.number().int(),
    totalMarketingTasks: z.number().int(),
    byCategory: z.record(z.string(), z.number()).default({}),
    byPriority: z.record(z.string(), z.number()).default({}),
    /** Ordered list of task IDs on the critical path */
    criticalPath: z.array(z.string()).default([]),
    estimatedTotalEffort: z.string().nullish(),
    buildPhaseCount: z.number().int().default(8),
  }),

  intakeConstraints: z.object({
    techStack: z.string(),
    teamSize: z.string(),
    budgetRange: z.string(),
    deploymentTarget: z.string().nullish(),
    mustAvoid: z.array(z.string()).default([]),
  }),

  buildPhases: z.array(BuildPhaseSchema),

  /** Engineering / code tasks */
  tasks: z.array(CodeTaskSchema),

  /** Marketing / content tasks — separate schema, always humanReviewRequired */
  marketingTasks: z.array(MarketingTaskSchema),

  /** Pipeline memory lesson IDs used to generate this task list */
  pipelineMemoryUsed: z.array(z.string()).default([]),

  /** Citation count from research phases (quality indicator) */
  researchCitationCount: z.number().int().default(0),
});

export type TasksOutput = z.infer<typeof TasksOutputSchema>;
export type CodeTask = z.infer<typeof CodeTaskSchema>;
export type MarketingTask = z.infer<typeof MarketingTaskSchema>;
export type BuildPhase = z.infer<typeof BuildPhaseSchema>;
export type TaskAcceptanceCriterion = z.infer<typeof TaskAcceptanceCriterionSchema>;
export type IntegrationContract = z.infer<typeof IntegrationContractSchema>;
export type ContextBundle = z.infer<typeof ContextBundleSchema>;
