# TASKS.json Schema Reference

The `TASKS.json` file is the one-shot build artifact produced after Phase 16 (task reconciliation). It contains every atomic task required to build the product, ordered by `buildPhase` with a resolved dependency graph.

## Top-Level Structure

```json
{
  "projectId": "run-abc123",
  "projectName": "My Product",
  "generatedAt": "2024-01-15T10:00:00Z",
  "version": "1.0",
  "summary": { ... },
  "intakeConstraints": { ... },
  "buildPhases": [ ... ],
  "tasks": [ ... ],
  "marketingTasks": [ ... ],
  "pipelineMemoryUsed": ["lesson-003", "lesson-007"],
  "researchCitationCount": 23
}
```

## Build Phases

Tasks are grouped into 8 build phases executed in order:

| Phase | Name | Description |
|-------|------|-------------|
| 1 | Infrastructure & Provisioning | D1/KV/R2/Queue setup, wrangler.jsonc, CI/CD |
| 2 | Database Schema & Migrations | Drizzle schema, migrations, seed data |
| 3 | Backend Core | Auth, business logic, Hono API routes |
| 4 | Frontend | SvelteKit pages, components, routing |
| 5 | Integrations & Middleware | Third-party APIs, Queues, Durable Objects |
| 6 | Testing | Unit, integration, E2E test suites |
| 7 | Marketing & Content | Landing pages, copy, email sequences |
| 8 | Launch | Deploy scripts, monitoring, runbooks, PR reviews |

## CodeTask Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Unique ID, e.g. `task-001` |
| `type` | `"code"` | ✓ | Discriminates from MarketingTask |
| `title` | string | ✓ | Short imperative title |
| `description` | string | ✓ | 1-3 sentence description |
| `category` | CodeCategory | ✓ | See category list below |
| `subcategory` | string | — | Optional domain label |
| `priority` | `p0`-`p3` | ✓ | p0=critical blocker, p3=nice-to-have |
| `buildPhase` | 1-8 | ✓ | Execution group |
| `dependencies` | string[] | ✓ | Task IDs that must complete first |
| `blockedBy` | string[] | ✓ | Currently blocking task IDs |
| `integrationContract` | object | ✓ | What this task exports/creates |
| `contextBundle` | object | ✓ | Architecture context for fresh session |
| `acceptanceCriteria` | array | ✓ | Blocking + warning criteria |
| `filesToCreate` | string[] | ✓ | New files this task creates |
| `filesToModify` | string[] | ✓ | Existing files this task changes |
| `estimatedEffort` | xs/s/m/l/xl | ✓ | Relative sizing |
| `ownerType` | string | ✓ | `engineer` or `ai-agent` |
| `canBeParallelized` | boolean | ✓ | Safe to run alongside other tasks |
| `isOneShottable` | boolean | ✓ | Single Claude Code session sufficient |
| `securityReviewRequired` | boolean | ✓ | Touches user data / auth |
| `naomiPrompt` | string | ✓ | Self-contained execution prompt |
| `git` | object | ✓ | Branch name, merge strategy |
| `sourcePhase` | string | ✓ | Which planning phase generated this |
| `draftedAt` | string | ✓ | Phase that drafted the task |
| `reconciledAt` | string | ✓ | Always `"phase-16"` |

### Code Categories

`devops` · `backend` · `frontend` · `middleware` · `database` · `testing` · `security` · `integration` · `documentation` · `pr-review` · `launch`

### integrationContract

```json
{
  "exports": ["UserService with interface { register, login, logout }"],
  "apiEndpoints": ["POST /api/auth/register", "POST /api/auth/login"],
  "databaseMutations": ["creates row in users table"],
  "environmentVarsRequired": ["JWT_SECRET"],
  "downstreamTasks": ["task-005", "task-007"]
}
```

Used by the Level 2 contract checker to verify the task produced what it promised.

### contextBundle

```json
{
  "architectureDecisions": [
    "All services use factory pattern with DI",
    "Auth uses JWT with 15-min access + 7-day refresh tokens"
  ],
  "namingConventions": {
    "files": "kebab-case",
    "functions": "camelCase",
    "dbColumns": "snake_case"
  },
  "environmentTopology": {
    "dev": ["DATABASE_URL from .dev.vars"],
    "test": ["DATABASE_URL from .env.test"]
  },
  "relevantPatterns": [
    "See services/gateway/src/middleware/auth.ts for JWT pattern"
  ]
}
```

### naomiPrompt

The most critical field. Must be **completely self-contained** — a fresh Claude Code session with no prior context must be able to execute the task correctly from this prompt alone.

Required elements:
1. What to build (specific, not vague)
2. Exact files to create/modify with their paths
3. Architecture decisions that apply to this task
4. Naming conventions (files: kebab-case, functions: camelCase, DB: snake_case)
5. Integration points (what already exists, what this task must connect to)
6. Acceptance criteria verbatim
7. Security requirements if applicable
8. Test requirements

### acceptanceCriteria

```json
[
  {
    "description": "POST /api/auth/register returns 201 with user object",
    "verificationCommand": "pnpm test --filter=auth-register",
    "severity": "blocking"
  },
  {
    "description": "Password is hashed with bcrypt, never stored plaintext",
    "severity": "blocking"
  }
]
```

`blocking` criteria must pass before the task is marked done. `warning` criteria are flagged but do not block completion.

### git

```json
{
  "branchName": "feature/task-001-auth-service",
  "baseBranch": "main",
  "mergeStrategy": "auto-merge-when-verified",
  "conflictSensitiveFiles": ["services/gateway/src/index.ts"]
}
```

`mergeStrategy`:
- `auto-merge-when-verified` — merge automatically when all 3 verification levels pass
- `human-review-required` — always requires PR review regardless of verification

## MarketingTask Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID, e.g. `mkt-001` |
| `type` | `"marketing"` | Discriminates from CodeTask |
| `category` | MarketingCategory | `copy`, `seo`, `content`, `campaign`, `social`, `email` |
| `targetAudience` | string | From customer-intel phase |
| `brandVoice` | string | From content-engine phase |
| `conversionObjective` | string | What action this content drives |
| `contentTemplate` | object | Sections, word count, format |
| `competitorExamples` | string[] | From competitive-intel phase |
| `humanReviewRequired` | `true` | Always true — never auto-publish |
| `naomiPrompt` | string | Content generation prompt with all context |

## Summary Object

```json
{
  "totalTasks": 47,
  "totalMarketingTasks": 12,
  "byCategory": { "backend": 12, "frontend": 8, "testing": 9, ... },
  "byPriority": { "p0": 5, "p1": 18, "p2": 19, "p3": 5 },
  "criticalPath": ["task-001", "task-005", "task-012", "task-023"],
  "buildPhases": 8,
  "estimatedTotalEffort": "~240 engineer-hours (AI-assisted)"
}
```

## Validation

Run validation against the Zod schema:

```bash
npx tsx planning-machine/scripts/validate-tasks.ts planning-machine/output/<RUN_ID>/TASKS.json
```

Common validation failures:
- `naomiPrompt` under 200 characters (too short to be self-contained)
- `dependencies` references non-existent task IDs
- Circular dependency detected (use `detectCycles()` from `dependency-graph.ts`)
- Marketing task missing `humanReviewRequired: true`
