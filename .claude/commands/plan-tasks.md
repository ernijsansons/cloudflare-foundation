# /plan-tasks

Run Phase 16 (task reconciliation) standalone against a completed planning run.
Use this when you need to regenerate TASKS.json without re-running the full research pipeline.

## Usage

```
/plan-tasks <RUN_ID>
```

## When to Use

- Planning run completed but Phase 16 didn't finish
- You want to regenerate TASKS.json with updated pipeline memory lessons
- You want to change task ordering or add missing tasks
- A previous TASKS.json had dependency cycles you need to fix

## Workflow

### Step 1: Fetch Draft Tasks

Get all draft task contributions from phases 9–14:

```bash
cd C:\dev\.cloudflare\cloudflare-foundation-dev
npx tsx packages/foundation-cli/src/index.ts context <RUN_ID> --phase task-reconciliation --json
```

This returns a context object containing:
- `draftTasksByPhase`: draft tasks from each contributing phase
- `projectContext`: tech stack, product name, architecture decisions
- `intakeConstraints`: Phase 0 intake (tech stack, budget, team size)
- `priorPhasesSummary`: summaries from all 15 completed phases

### Step 2: Load Pipeline Memory

Read lessons from prior builds:

```bash
cat planning-machine/memory/pipeline-memory.json
```

Apply relevant lessons to the reconciliation. Lessons with `evidenceCount >= 2` should be treated as strong constraints.

### Step 3: Run Reconciliation

Using the context from Step 1 and lessons from Step 2, generate TASKS.json following the task-reconciliation schema below.

**Reconciliation checklist:**

- [ ] Merge all draft tasks — deduplicate by semantic similarity (e.g., "Create users table" + "Add users migration" → one task)
- [ ] Add mandatory infrastructure tasks for Build Phase 1 (wrangler.jsonc, D1/KV/R2 provisioning, CI pipeline)
- [ ] For every task touching auth, payments, or user data: add a blocking `security-review` companion task
- [ ] Test pyramid: for every 5 unit test tasks, add 1 integration test and 1 E2E test task
- [ ] Add integration glue tasks for any feature pairs that produce + consume each other's exports
- [ ] Run cycle detection mentally — if Task A depends on B and B depends on A, break the cycle at the weakest link
- [ ] Assign `buildPhase` 1–8 using the category map below
- [ ] Write `naomiPrompt` for every task (min 300 chars, completely self-contained)
- [ ] Populate `integrationContract` (exports, apiEndpoints, environmentVarsRequired)
- [ ] Set `git.branchName`, `git.mergeStrategy`, `git.conflictSensitiveFiles`

**Category → Build Phase map:**
| Category | Build Phase |
|----------|-------------|
| devops | 1 |
| database | 2 |
| backend | 3 |
| security | 3 (same phase as the task they secure) |
| frontend | 4 |
| middleware | 5 |
| integration | 5 |
| testing | 6 |
| copy, seo, content, campaign, social, email | 7 |
| launch, pr-review, documentation | 8 |

### Step 4: Sync and Generate Scaffold

Sync the reconciliation output:

```bash
echo '<TASKS_JSON_OUTPUT>' | npx tsx packages/foundation-cli/src/index.ts sync task-reconciliation <RUN_ID> --stdin
```

Generate scaffold files from the updated run:

```bash
npx tsx planning-machine/scripts/generate-scaffold.ts <RUN_ID>
```

Output location: `planning-machine/output/<RUN_ID>/`

### Step 5: Display Summary

Show a summary table to the user:

```
TASKS.json generated for <RUN_ID>

Build Phase Summary:
  Phase 1 (Infrastructure):  X tasks
  Phase 2 (Database):        X tasks
  Phase 3 (Backend):         X tasks
  Phase 4 (Frontend):        X tasks
  Phase 5 (Integrations):    X tasks
  Phase 6 (Testing):         X tasks
  Phase 7 (Marketing):       X tasks
  Phase 8 (Launch):          X tasks

  Total: X code tasks + X marketing tasks
  Critical path: task-001 → task-005 → task-012 → task-023
  Security tasks added: X
  Pipeline lessons applied: X

Next steps:
  1. Review: planning-machine/output/<RUN_ID>/TASKS.json
  2. Send to Naomi: POST /api/naomi/tasks/bulk-create
  3. Or re-run with lessons: /plan-tasks <RUN_ID>
```

---

## Task Output Schema Reference

Each code task in the `tasks` array:

```json
{
  "id": "task-001",
  "type": "code",
  "title": "Provision D1 database and KV namespaces",
  "description": "Set up D1 database, KV namespaces for session/rate-limit, and R2 bucket using wrangler CLI",
  "category": "devops",
  "priority": "p0",
  "buildPhase": 1,
  "dependencies": [],
  "blockedBy": [],
  "integrationContract": {
    "exports": [],
    "apiEndpoints": [],
    "databaseMutations": ["creates D1 database"],
    "environmentVarsRequired": [],
    "downstreamTasks": ["task-002", "task-003"]
  },
  "contextBundle": {
    "architectureDecisions": [
      "All data goes to D1 via Drizzle ORM",
      "Sessions stored in KV with 24h TTL"
    ],
    "namingConventions": {
      "files": "kebab-case",
      "functions": "camelCase",
      "dbColumns": "snake_case"
    },
    "environmentTopology": {
      "dev": ["Use .dev.vars for local D1 simulation"],
      "prod": ["DATABASE_ID from wrangler.jsonc binding"]
    },
    "relevantPatterns": [
      "See BOOTSTRAP.md for wrangler binding template"
    ]
  },
  "acceptanceCriteria": [
    {
      "description": "wrangler d1 list shows database with correct name",
      "verificationCommand": "npx wrangler d1 list | grep <DB_NAME>",
      "severity": "blocking"
    }
  ],
  "filesToCreate": ["wrangler.jsonc"],
  "filesToModify": [],
  "estimatedEffort": "xs",
  "ownerType": "ai-agent",
  "canBeParallelized": false,
  "isOneShottable": true,
  "securityReviewRequired": false,
  "naomiPrompt": "COMPLETE SELF-CONTAINED PROMPT HERE — include exact wrangler commands, binding names from BOOTSTRAP.md, D1 database name, KV namespace names, R2 bucket name. Must not require prior context.",
  "git": {
    "branchName": "feature/task-001-provision-infra",
    "baseBranch": "main",
    "mergeStrategy": "auto-merge-when-verified",
    "conflictSensitiveFiles": ["wrangler.jsonc"]
  },
  "sourcePhase": "tech-arch",
  "draftedAt": "phase-12",
  "reconciledAt": "phase-16"
}
```

Each marketing task in the `marketingTasks` array:

```json
{
  "id": "mkt-001",
  "type": "marketing",
  "title": "Write hero section copy for landing page",
  "description": "Write headline, subheadline, value props, and CTA for the landing page hero",
  "category": "copy",
  "buildPhase": 7,
  "dependencies": [],
  "targetAudience": "From customer-intel phase",
  "brandVoice": "Professional, direct, no jargon",
  "conversionObjective": "Drive trial signup",
  "contentTemplate": {
    "sections": ["headline", "subheadline", "value-props-x3", "social-proof", "cta"],
    "maxWords": 200
  },
  "competitorExamples": ["Competitor A does X here"],
  "acceptanceCriteria": [
    {
      "description": "Headline addresses primary pain point from customer-intel",
      "severity": "blocking"
    }
  ],
  "humanReviewRequired": true,
  "isOneShottable": true,
  "naomiPrompt": "COMPLETE CONTENT GENERATION PROMPT — include target audience, pain points, brand voice, competitor examples, content template sections, and word count limits.",
  "sourcePhase": "content-engine",
  "draftedAt": "phase-11",
  "reconciledAt": "phase-16"
}
```
