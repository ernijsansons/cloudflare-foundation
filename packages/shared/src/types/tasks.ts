/**
 * Shared TypeScript types for TASKS.json — the one-shot build artifact.
 *
 * These are plain TypeScript interfaces (no Zod dependency) so they can be
 * imported anywhere in the monorepo: gateway, planning-machine, UI, scripts.
 *
 * The canonical Zod schemas live in:
 *   services/planning-machine/src/schemas/tasks-output.ts
 */

// ── Integration Contract ───────────────────────────────────────────────────

export interface IntegrationContract {
  /** TypeScript exports this task will produce, e.g. "UserService with interface { register, login }" */
  exports: string[];
  /** HTTP endpoints this task registers, e.g. "POST /api/auth/register" */
  apiEndpoints: string[];
  /** D1 mutations this task makes, e.g. "creates users table row" */
  databaseMutations: string[];
  /** Env vars that must be set for this task to run */
  environmentVarsRequired: string[];
  /** Task IDs that consume outputs from this task */
  downstreamTasks: string[];
}

// ── Context Bundle ─────────────────────────────────────────────────────────

export interface ContextBundle {
  /** Key architectural decisions that apply to this task */
  architectureDecisions: string[];
  /** Naming conventions for the project */
  namingConventions: {
    files: string;
    functions: string;
    dbColumns: string;
    components?: string;
  };
  /** Environment variable sources per environment */
  environmentTopology: Record<string, string[]>;
  /** File paths or descriptions of patterns to follow */
  relevantPatterns: string[];
}

// ── Acceptance Criteria ────────────────────────────────────────────────────

export interface AcceptanceCriterion {
  description: string;
  /** Shell command that must exit 0 to pass this criterion */
  verificationCommand?: string;
  severity: "blocking" | "warning";
}

// ── Git Config ─────────────────────────────────────────────────────────────

export type MergeStrategy = "auto-merge-when-verified" | "human-review-required";

export interface GitConfig {
  branchName: string;
  baseBranch: string;
  mergeStrategy: MergeStrategy;
  /** Files likely to cause merge conflicts when tasks run in parallel */
  conflictSensitiveFiles: string[];
}

// ── Task Categories ────────────────────────────────────────────────────────

export type CodeCategory =
  | "devops"
  | "backend"
  | "frontend"
  | "middleware"
  | "database"
  | "testing"
  | "security"
  | "integration"
  | "documentation"
  | "pr-review"
  | "launch";

export type MarketingCategory = "copy" | "seo" | "content" | "campaign" | "social" | "email";

export type TaskPriority = "p0" | "p1" | "p2" | "p3";

export type EffortSize = "xs" | "s" | "m" | "l" | "xl";

// ── Code Task ──────────────────────────────────────────────────────────────

export interface CodeTask {
  id: string;
  type: "code";
  title: string;
  description: string;
  category: CodeCategory;
  subcategory?: string;
  priority: TaskPriority;
  /** Execution order group (1 = infra first, 8 = launch last) */
  buildPhase: number;
  dependencies: string[];
  blockedBy: string[];
  integrationContract: IntegrationContract;
  contextBundle: ContextBundle;
  acceptanceCriteria: AcceptanceCriterion[];
  filesToCreate: string[];
  filesToModify: string[];
  estimatedEffort: EffortSize;
  ownerType: "engineer" | "ai-agent";
  canBeParallelized: boolean;
  isOneShottable: boolean;
  securityReviewRequired: boolean;
  /**
   * Self-contained prompt for Naomi/Claude Code.
   * Must include all context, architecture decisions, naming conventions,
   * file structure, acceptance criteria — written so a fresh Claude Code
   * session needs nothing else.
   */
  naomiPrompt: string;
  git: GitConfig;
  sourcePhase: string;
  draftedAt: string;
  reconciledAt: string;
}

// ── Marketing Task ─────────────────────────────────────────────────────────

export interface ContentTemplate {
  sections: string[];
  maxWords?: number;
  format?: string;
}

export interface MarketingTask {
  id: string;
  type: "marketing";
  title: string;
  description: string;
  category: MarketingCategory;
  buildPhase: number;
  dependencies: string[];
  targetAudience: string;
  brandVoice: string;
  conversionObjective: string;
  contentTemplate?: ContentTemplate;
  competitorExamples?: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  /** Marketing tasks always require human review before publishing */
  humanReviewRequired: true;
  isOneShottable: boolean;
  naomiPrompt: string;
  sourcePhase: string;
  draftedAt: string;
  reconciledAt: string;
}

export type Task = CodeTask | MarketingTask;

// ── Build Phases ───────────────────────────────────────────────────────────

export interface BuildPhase {
  id: number;
  name: string;
  taskIds: string[];
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface TasksSummary {
  totalTasks: number;
  totalMarketingTasks: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  criticalPath: string[];
  buildPhases: number;
  estimatedTotalEffort: string;
}

// ── Top-level TASKS.json ───────────────────────────────────────────────────

export interface IntakeConstraints {
  techStack: string;
  teamSize: string;
  budgetRange: string;
  mustAvoid: string[];
  complianceRequirements?: string[];
  deploymentTarget?: string;
}

export interface TasksOutput {
  projectId: string;
  projectName: string;
  generatedAt: string;
  version: string;
  summary: TasksSummary;
  intakeConstraints: IntakeConstraints;
  buildPhases: BuildPhase[];
  tasks: CodeTask[];
  marketingTasks: MarketingTask[];
  pipelineMemoryUsed: string[];
  researchCitationCount: number;
}

// ── Verification ───────────────────────────────────────────────────────────

export type VerificationLevel = "syntactic" | "contract" | "behavioral";

export interface VerificationCheckResult {
  name: string;
  description: string;
  passed: boolean;
  detail?: string;
}

export interface VerificationReport {
  taskId: string;
  level: VerificationLevel;
  passed: boolean;
  checks: VerificationCheckResult[];
  failedChecks: VerificationCheckResult[];
  summary: string;
  attemptNumber: number;
}
