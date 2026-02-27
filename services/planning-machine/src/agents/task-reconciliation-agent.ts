/**
 * Phase 16: Task Reconciliation Agent
 *
 * Reads draft tasks from phases 9-14 (NOT full phase outputs — smaller context).
 * Reconciles, deduplicates, and enhances them into a complete TASKS.json:
 *
 * 1. Merges draft tasks from all contributing phases
 * 2. Adds mandatory tasks always required:
 *    - Infrastructure provisioning (build phase 1)
 *    - Security review tasks for user-data-touching features
 *    - Integration glue tasks between dependent features
 *    - Test pyramid balance tasks
 * 3. Builds dependency graph and detects cycles (DFS)
 * 4. Assigns build phase ordering via topological sort
 * 5. Writes naomiPrompt for each task (self-contained execution context)
 * 6. Populates integrationContract for each task
 * 7. Reads pipeline memory for lessons from prior product builds
 *
 * DESIGN CONSTRAINT: This agent ONLY reads draft task arrays (compact format),
 * NOT full 15-phase outputs. This keeps the context window manageable.
 */

import {
  topologicalSort,
  detectCycles,
  findCriticalPath,
  type GraphNode,
} from "../lib/dependency-graph";
import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import type { TaskReconciliationOutput } from "../schemas/task-reconciliation";
import { TaskReconciliationOutputSchema } from "../schemas/task-reconciliation";
import type { CodeTask } from "../schemas/tasks-output";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface DraftTask {
  title: string;
  description?: string;
  category?: string;
  type?: string;
  priority?: string;
  estimatedEffort?: string;
  [key: string]: unknown;
}

interface TaskReconciliationInput {
  draftTasksByPhase: Record<string, DraftTask[]>;
  intakeConstraints: Record<string, unknown>;
  techArchSummary: string;
  productDesignSummary: string;
  namingConventions: Record<string, string>;
  pipelineMemoryLessons?: Array<{ id: string; lesson: string; category: string }>;
}

export class TaskReconciliationAgent extends BaseAgent<TaskReconciliationInput, TaskReconciliationOutput> {
  config = {
    phase: "task-reconciliation",
    maxSelfIterations: 1,
    qualityThreshold: 8,
    hardQuestions: [
      "Does every user-data-touching task have a security review companion?",
      "Is there an infrastructure task for every Cloudflare binding required?",
      "Are there integration glue tasks between features that depend on each other?",
      "Is the test pyramid balanced (not more unit tests than integration + e2e combined)?",
      "Does every task have a complete, self-contained naomiPrompt?",
      "Do scaffold commands create ALL directories in the file tree? (Phase 4)",
      "Does deployment sequence run D1 migrations BEFORE deploying services that use DB? (Phase 4)",
      "Are ALL executable artifacts mapped to file paths in artifactMap? (Phase 4)",
      "Does bootstrapPrompt include first command to run and task execution order? (Phase 4)",
    ],
    maxTokens: 8192,
    includeFoundationContext: true,
  };

  getSystemPrompt(): string {
    return `You are a senior software architect specializing in task decomposition for AI-assisted development.

Your job is to take draft tasks from multiple planning phases and reconcile them into a complete, ordered, dependency-aware TASKS.json that can be one-shot executed by Claude Code (Naomi).

## Critical Requirements

### 1. naomiPrompt Quality
Every CodeTask MUST have a naomiPrompt that is COMPLETELY SELF-CONTAINED. A fresh Claude Code instance with ZERO prior knowledge must be able to execute it. Include:
- Full architecture context (what framework, what patterns, what naming conventions)
- Specific file paths to create or modify
- The exact acceptance criteria as code-testable conditions
- Any interfaces or contracts this task must fulfill
- Which existing code patterns to follow (with examples)
- Environment variables needed and where to find them

DO NOT write naomiPrompts like "Implement user authentication." That is not self-contained.
DO write naomiPrompts like: "You are building a Cloudflare Workers API using Hono framework. The project is at services/gateway/. Create services/gateway/src/routes/auth.ts implementing POST /api/auth/register and POST /api/auth/login. The register endpoint should: [specific requirements]. Follow the pattern in services/gateway/src/middleware/auth.ts for JWT handling. Add routes to services/gateway/src/index.ts after line X. Tests must pass: pnpm test --filter auth. Naming: files=kebab-case, functions=camelCase, DB columns=snake_case."

### 2. Mandatory Tasks to Always Add

**Infrastructure (buildPhase: 1) — add these if not already in draft tasks:**
- Provision Cloudflare D1 database + run migrations
- Set up KV namespaces (SESSION_KV, RATE_LIMIT_KV, CACHE_KV)
- Set up R2 bucket (FILES)
- Configure environment secrets (JWT_SECRET, CONTEXT_SIGNING_KEY, etc.)
- Initial wrangler.jsonc configuration for product-specific names

**Security tasks (buildPhase: same as feature + 1):**
- For EVERY task that touches user data, auth, or payments: add a security review task
- The security review task's naomiPrompt should specify: "Review [feature] for: SQL injection, IDOR, missing auth checks, unvalidated input, XSS vectors. Run security checklist."

**Integration glue tasks:**
- When Feature A calls Feature B, add a task: "Integration test: verify Feature A → Feature B contract"
- These prevent the "works individually, breaks together" failure mode

**Test pyramid tasks:**
- For every 5 unit test tasks, ensure at least 1 integration test task exists
- Add at least 1 e2e test task that covers the full user journey

### 3. Dependency Rules
- Infrastructure tasks (phase 1) have no dependencies
- Database tasks (phase 2) depend only on infra tasks
- Backend tasks (phase 3) depend on database tasks
- Frontend tasks (phase 4) can depend on backend API tasks
- Integration tasks (phase 5) depend on both backend and frontend tasks
- Testing tasks (phase 6) depend on the features they test
- Security review tasks depend on the tasks they review
- Launch tasks (phase 8) depend on testing tasks

### 4. Task Sizing
A task is ONE-SHOTTABLE when:
- It produces exactly one concrete, testable artifact
- It takes a skilled engineer 15 minutes to 2 hours manually
- It has at most 3-4 files to create/modify
- Its acceptance criteria are binary (pass/fail, not subjective)

SPLIT a task if:
- It touches more than one bounded context
- Its description contains "and also" for multiple unrelated concerns
- It requires inventing an abstraction that other tasks depend on

### 5. Marketing Tasks
Marketing tasks (type: "marketing") always have humanReviewRequired: true.
Their naomiPrompt should include: target audience profile, brand voice, conversion objective, competitor examples, and specific content template to fill.

### 6. File Tree Mapping (Phase 3)
Generate a complete fileTree mapping every artifact to its correct location in the 10-Plane monorepo.
- root: .gitignore, README.md, pnpm-workspace.yaml, package.json
- packages: db (schema, migrations, audit-chain), shared (types, constants)
- services: ui (src/routes, wrangler.jsonc), gateway (src/index, src/middleware), agents (src/agents, src/mcp), workflows, queues, cron
- docs: ARCHITECTURE.md, API.md, DATABASE.md
- scripts: setup-d1.sh, deploy-all.sh

### 7. Scaffold Commands (Phase 4)
Generate scaffoldCommands array with shell commands to build the 10-Plane folder structure from scratch:
- mkdir -p commands for all directories
- touch commands for placeholder files
- Commands should be idempotent (use mkdir -p, touch)
- Group related commands with runInParallel: true where possible
EXAMPLE:
{ command: "mkdir -p packages/db/src packages/shared/src services/gateway/src services/ui/src", description: "Create base directory structure", workingDirectory: ".", runInParallel: false }

### 8. Deployment Sequence (Phase 4)
Generate deploymentSequence array with ordered wrangler/infrastructure commands to prevent dependency failures:
STEP 1: Create D1 database (wrangler d1 create <name>)
STEP 2: Execute SQL migrations (wrangler d1 execute <db> --file=packages/db/schema.sql)
STEP 3: Create KV namespaces (wrangler kv:namespace create SESSION_KV, etc.)
STEP 4: Create R2 buckets (wrangler r2 bucket create <name>)
STEP 5: Deploy services in dependency order (gateway first, then UI, then agents)
STEP 6: Set secrets (wrangler secret put JWT_SECRET, etc.)
Each step must specify dependsOn (step numbers it requires to complete first).

### 9. Artifact Map (Phase 4)
Generate artifactMap array mapping Tech Arch Phase 12 executable artifacts to actual file paths:
- sqlDDL → packages/db/schema.sql
- openAPISpec → docs/openapi.yaml
- wranglerConfigJSONC → services/gateway/wrangler.jsonc (and any other services)
- envExample → .env.example
- auditChainVerificationLogic → packages/db/src/verify-audit-chain.ts

### 10. Bootstrap Prompt (Phase 4)
Generate bootstrapPrompt string: A self-contained prompt for Claude Code (Naomi) with ZERO prior knowledge to execute the entire build.
MUST INCLUDE:
- "Run these commands first: [scaffold commands]"
- "Then run deployment sequence: [deployment steps]"
- "Artifacts are mapped: [artifact map]"
- "Start with Task ID: [first task in critical path]"
- "Task execution order: [ordered task IDs from buildPhases]"
- "Acceptance criteria: Run 'pnpm test' after each task, must pass before moving to next"

Output complete valid JSON matching the TaskReconciliationOutput schema.`;
  }

  getPhaseRubric(): string[] {
    return [
      "naomi_prompts_self_contained — every task could execute in a fresh Claude Code session",
      "security_coverage — every user-data feature has a security review companion task",
      "infrastructure_complete — all required Cloudflare resources have provisioning tasks",
      "dependency_graph_valid — no cycles, topological order is consistent",
      "file_tree_specified — every artifact has a deterministic destination in the monorepo",
      "scaffold_commands_complete — all directories and placeholder files have creation commands (Phase 4)",
      "deployment_sequence_ordered — wrangler commands in correct dependency order (Phase 4)",
      "artifact_map_complete — all executable artifacts mapped to file paths (Phase 4)",
      "bootstrap_prompt_self_contained — Naomi can execute entire build with zero questions (Phase 4)",
    ];
  }

  getOutputSchema(): Record<string, unknown> {
    return { ref: "TaskReconciliationOutputSchema (see tasks-output.ts)" };
  }

  async run(
    ctx: AgentContext,
    input: TaskReconciliationInput
  ): Promise<AgentResult<TaskReconciliationOutput>> {
    const allDraftTasks = Object.entries(input.draftTasksByPhase).flatMap(
      ([phase, tasks]) => tasks.map((t) => ({ ...t, sourcePhase: phase }))
    );

    // Pre-process: detect obvious duplicates by title similarity
    const deduplicatedDrafts = this.deduplicateDraftTasks(allDraftTasks);

    const pipelineMemoryContext =
      input.pipelineMemoryLessons && input.pipelineMemoryLessons.length > 0
        ? `\n## Pipeline Memory — Lessons from Prior Products\n${input.pipelineMemoryLessons
            .map((l) => `- [${l.category}] ${l.lesson}`)
            .join("\n")}\n`
        : "";

    const userPrompt = `
## Intake Constraints
${JSON.stringify(input.intakeConstraints, null, 2)}

## Tech Architecture Summary
${input.techArchSummary}

## Product Design Summary
${input.productDesignSummary}

## Naming Conventions
${JSON.stringify(input.namingConventions, null, 2)}

${pipelineMemoryContext}

## Draft Tasks from Planning Phases (${deduplicatedDrafts.length} tasks after dedup)

${JSON.stringify(deduplicatedDrafts, null, 2)}

## Instructions

Produce a complete TASKS.json by:
1. Expanding and enriching these draft tasks with full fields (naomiPrompt, integrationContract, contextBundle, acceptanceCriteria, git config)
2. Adding mandatory infrastructure, security review, integration glue, and test pyramid tasks
3. Assigning buildPhase (1-8) to each task based on category and dependencies
4. Building the dependency graph (task IDs as dependencies array)
5. Verifying no dependency cycles exist
6. Identifying the critical path
7. Separating code tasks and marketing tasks into their respective arrays

The projectId is: ${ctx.runId}
The projectName should be derived from the idea: "${ctx.idea}"

Output complete valid JSON matching TaskReconciliationOutputSchema.
Include the reconciliation metadata object with counts of added tasks.`;

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: userPrompt },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.3,
        maxTokens: this.config.maxTokens ?? 8192,
      });

      const parsed = extractJSON(response);
      const output = TaskReconciliationOutputSchema.parse(parsed);

      // Post-process: verify dependency graph and fix if needed
      const enhancedOutput = this.postProcessOutput(output);

      return { success: true, output: enhancedOutput };
    } catch (e) {
      console.error("TaskReconciliationAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }

  /**
   * Remove obviously duplicate draft tasks by normalizing titles
   */
  private deduplicateDraftTasks(tasks: Array<DraftTask & { sourcePhase: string }>): typeof tasks {
    const seen = new Map<string, boolean>();
    return tasks.filter((t) => {
      const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  /**
   * Post-process the LLM output:
   * 1. Verify dependency graph (detect cycles algorithmically)
   * 2. Build the actual topological sort
   * 3. Compute critical path
   * 4. Update buildPhase assignments based on topological sort
   */
  private postProcessOutput(output: TaskReconciliationOutput): TaskReconciliationOutput {
    const allTasks = output.tasks;

    const nodes: GraphNode[] = allTasks.map((t: CodeTask) => ({
      id: t.id,
      dependencies: t.dependencies ?? [],
    }));

    const cycleResult = detectCycles(nodes);
    if (cycleResult.hasCycles) {
      console.warn(
        "[task-reconciliation] Dependency cycles detected:",
        JSON.stringify(cycleResult.cycles)
      );
      // Break cycles by removing the last dependency in each cycle
      for (const cycle of cycleResult.cycles) {
        const lastTaskId = cycle[cycle.length - 1];
        const lastTask = allTasks.find((t: CodeTask) => t.id === lastTaskId);
        if (lastTask && lastTask.dependencies.length > 0) {
          const removedDep = lastTask.dependencies.pop()!;
          console.warn(
            `[task-reconciliation] Breaking cycle: removed ${removedDep} from ${lastTaskId}'s dependencies`
          );
        }
      }
    }

    // Sort result computed for dependency validation
    topologicalSort(nodes);
    const criticalPath = findCriticalPath(nodes);

    return {
      ...output,
      summary: {
        ...output.summary,
        criticalPath,
        totalTasks: output.tasks.length,
        totalMarketingTasks: output.marketingTasks.length,
      },
      reconciliation: {
        ...output.reconciliation,
        dependencyCyclesFound: cycleResult.cycles.length,
        cyclesResolved: cycleResult.hasCycles
          ? cycleResult.cycles.map((c) => `Broke cycle: ${c.join(" → ")}`)
          : [],
      },
    };
  }
}
