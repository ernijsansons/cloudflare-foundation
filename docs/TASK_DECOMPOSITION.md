# Task Decomposition — How TASKS.json Is Generated

## Overview

TASKS.json is generated through a **hybrid incremental + batch** architecture:
- Phases 9–14 each produce `draftTasks` arrays as part of their normal output
- Phase 16 reconciles all draft tasks into a single ordered, deduplicated, dependency-resolved list

This hybrid approach avoids context window saturation that would occur if Phase 16 had to read all 15 phase outputs in full.

## Which Phases Produce Draft Tasks

| Phase | Name | Draft Task Types |
|-------|------|-----------------|
| 9 | Product Design | Frontend pages, UI components, API endpoints, DB tables |
| 10 | GTM & Marketing | Marketing campaigns, SEO tasks, ad setup, launch channels |
| 11 | Content Engine | Landing page copy, email sequences, UX copy (type: marketing) |
| 12 | Tech Architecture | DevOps setup, DB migrations, Workers config, Durable Objects |
| 13 | Analytics | Analytics Engine setup, event tracking, monitoring dashboards |
| 14 | Launch Execution | Deploy scripts, runbooks, PR descriptions, launch checklists |

Phases 1–8 (Discovery, Kill Test, Strategy) do NOT produce draft tasks — they produce strategic context that informs Phase 9–14 tasks.

## Phase 16: Reconciliation

Phase 16 is the `task-reconciliation-agent`. It receives:

```json
{
  "draftTasksByPhase": {
    "product-design": [...],
    "tech-arch": [...],
    "gtm-marketing": [...],
    "content-engine": [...],
    "analytics": [...],
    "launch-execution": [...]
  },
  "projectContext": { ... },
  "pipelineMemory": [...]
}
```

### What Phase 16 Does

**Step 1: Merge and deduplicate**
- Combine all draft tasks from all phases
- Detect semantic duplicates (e.g., "Create users table" from both product-design and tech-arch)
- Keep the more detailed version, discard duplicates

**Step 2: Add mandatory tasks**
Phase 16 always adds tasks that AI agents systematically forget:

- **Infrastructure first** — wrangler.jsonc setup, D1/KV/R2/Queue provisioning, CI pipeline. These become Build Phase 1 tasks.
- **Security reviews** — for every task touching user data, auth, or payment, a companion `security-review` task is added as a blocker.
- **Integration glue** — when Task A produces an export and Task B consumes it, a glue task is added if no existing task owns the integration.
- **Test pyramid balance** — for every 5 unit test tasks, at least 1 integration test and 1 E2E test task is required.

**Step 3: Dependency graph**
- Build the dependency graph from all `dependencies` arrays
- Run DFS cycle detection — if a cycle is found, break it by removing the weakest dependency and log a warning
- Run Kahn's algorithm (topological sort) to establish execution order

**Step 4: Build phase assignment**
Tasks are assigned to build phases 1–8 based on:
1. Their `category` (devops → phase 1, database → phase 2, backend → phase 3, etc.)
2. Their position in the topological sort (a task cannot be in an earlier phase than its dependencies)
3. Security review tasks are always assigned to the same phase as the task they review

**Step 5: Write naomiPrompt**
For each task, Phase 16 writes a self-contained `naomiPrompt` that embeds:
- Architecture decisions from tech-arch phase
- Naming conventions from intake
- File paths relative to monorepo root
- Integration points (what the task connects to)
- Acceptance criteria verbatim
- Security requirements if `securityReviewRequired: true`

**Step 6: Populate integrationContract**
Each task's `integrationContract` is filled from the task description and phase context:
- `exports` — TypeScript types/classes/functions this task creates
- `apiEndpoints` — HTTP routes registered by this task
- `databaseMutations` — D1 table operations
- `environmentVarsRequired` — vars needed at runtime

## Pipeline Memory Integration

Phase 16 reads `planning-machine/memory/pipeline-memory.json` before generating tasks. Lessons are applied by:

1. Filtering lessons where `appliesTo` overlaps with the task category
2. Injecting relevant lessons into the Phase 16 system prompt as constraints
3. Recording which lesson IDs were applied in `pipelineMemoryUsed`

Example: Lesson "Auth tasks should be split into 4 separate tasks: schema, service, middleware, UI" causes Phase 16 to split any combined auth task it encounters.

## Standalone Execution

To run Phase 16 against a completed planning run without re-running the full pipeline:

```bash
/plan:tasks <RUN_ID>
```

Or directly:

```bash
npx tsx planning-machine/scripts/generate-scaffold.ts <RUN_ID>
```

This fetches draft task outputs from the planning API and re-runs reconciliation.

## Output Location

```
planning-machine/output/<RUN_ID>/
  TASKS.json              — the primary artifact
  BOOTSTRAP.md            — wrangler config, deploy order
  DATA_MODEL.md           — entity-storage map
  EXECUTION_RULES.md      — product-specific Claude Code rules
  PRODUCT_ARCHITECTURE.md — service names, routes, Durable Objects
```
