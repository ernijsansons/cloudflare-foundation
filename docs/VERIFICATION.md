# 3-Level Verification System

Every task executed by Naomi passes through 3 verification levels before being marked `completed`. If any blocking check fails, the task is re-queued with failure context injected into its `naomiPrompt`.

## Verification Levels

### Level 1 — Syntactic (Automated)

**What:** Did the task produce any output at all, and does it compile?

**Checks:**
- At least one file was created or modified
- `pnpm typecheck` exits 0 (TypeScript compilation succeeds)
- `pnpm lint` exits 0 (ESLint passes)

**Implemented by:** `checkSyntactic()` in `services/planning-machine/src/lib/contract-checker.ts`

**API call:** `POST /api/naomi/tasks/:id/verification` with `level: "syntactic"`

### Level 2 — Contract (Automated)

**What:** Did the task produce what it promised in `integrationContract`?

**Checks:**
1. **Exports check** — for each item in `integrationContract.exports`, a file matching the export name exists in `filesProduced`
2. **Environment variables** — all `integrationContract.environmentVarsRequired` are set in the execution context
3. **API endpoints** — if `endpointsAvailable` is provided, all `integrationContract.apiEndpoints` are reachable

**Implemented by:** `checkContract()` in `services/planning-machine/src/lib/contract-checker.ts`

**API call:** `POST /api/naomi/tasks/:id/verification` with `level: "contract"`

### Level 3 — Behavioral (Automated)

**What:** Do the acceptance criteria pass?

**For each criterion with `severity: "blocking"`:**
- Run `acceptanceCriteria[n].verificationCommand`
- Command must exit 0

**Implemented by:** Naomi running the verification commands and reporting results

**API call:** `POST /api/naomi/tasks/:id/verification` with `level: "behavioral"`

## Verification API

### Report Verification Results

```
POST /api/naomi/tasks/:id/verification
Authorization: Bearer <FOUNDATION_API_KEY>
Content-Type: application/json

{
  "level": "syntactic" | "contract" | "behavioral",
  "passed": true | false,
  "failedChecks": [
    { "name": "typecheck", "detail": "3 TS errors in auth-service.ts" }
  ],
  "summary": "Syntactic check failed: typecheck, lint",
  "attemptNumber": 1
}
```

**Response when passed:**
```json
{ "id": "naomi_abc", "action": "completed", "passed": true }
```

**Response when failed, attempts < 3:**
```json
{
  "id": "naomi_abc",
  "action": "requeued",
  "passed": false,
  "attemptNumber": 2,
  "reason": "..."
}
```

**Response when failed, attempts >= 3:**
```json
{
  "id": "naomi_abc",
  "action": "escalated",
  "passed": false,
  "reason": "max_retries_exceeded"
}
```

## Re-Queue Protocol

When verification fails with `attemptNumber < 3`, the gateway:

1. Appends failure context to the task's `executor_prompt`:

```
=== PREVIOUS ATTEMPT FAILED (Attempt 2) ===
Verification level: contract
The previous execution of this task failed verification. Fix the following issues:

- env-JWT_SECRET: JWT_SECRET is NOT set — task may fail at runtime
- endpoint-POST--api-auth-register: Endpoint not found

=== END FAILURE CONTEXT ===

Retry the task addressing these specific failures.
Do not change working parts of the implementation.
```

2. Resets task `status` to `pending`
3. Clears `vm_id`, `claimed_at`, `started_at`
4. Increments `attempt_number`

## Max Retry Behavior

After 3 failed attempts:
- Task status → `failed`
- Error message saved to `naomi_tasks.error`
- Webhook event `task_escalated` fired
- Task appears in Naomi Kanban under "Needs Human Review"

Human resolution: fix the underlying issue (missing env var, wrong file path, etc.), then reset status to `pending`.

## Using contract-checker.ts Directly

For local testing of verification logic:

```typescript
import { checkSyntactic, checkContract, buildRequeuePrompt } from
  "services/planning-machine/src/lib/contract-checker";

// Level 1
const result = checkSyntactic({
  taskId: "task-001",
  taskTitle: "Create auth service",
  filesProduced: ["services/gateway/src/routes/auth.ts"],
  typecheckPassed: true,
  lintPassed: false,
  errors: ["Missing semicolon at line 42"],
});

// Level 2
const contractResult = checkContract({
  taskId: "task-001",
  taskTitle: "Create auth service",
  integrationContract: {
    exports: ["UserService"],
    apiEndpoints: ["POST /api/auth/register"],
    databaseMutations: [],
    environmentVarsRequired: ["JWT_SECRET"],
    downstreamTasks: [],
  },
  filesProduced: ["services/gateway/src/routes/auth.ts"],
  environmentVarsPresent: ["JWT_SECRET", "DATABASE_URL"],
  endpointsAvailable: ["POST /api/auth/register", "GET /api/health"],
});

// Build re-queue prompt on failure
const prompt = buildRequeuePrompt(
  originalNaomiPrompt,
  [result, contractResult],
  2
);
```

## Security Verification

Tasks with `securityReviewRequired: true` have an additional companion security review task in TASKS.json. That security task runs Level 2 + Level 3 verification against security-specific acceptance criteria:

- No secrets in logs
- SQL injection prevented (parameterized queries)
- IDOR prevented (tenant_id on all queries)
- Auth checked before data access
- File uploads validate type and size
