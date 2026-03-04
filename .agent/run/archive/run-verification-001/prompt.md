# Execution Contract: run-verification-001

You are executing a bounded development task. Follow the Ralph execution sequence exactly.

## Objective

Add a /v1/health endpoint to services/gateway/src/routes/runs.ts that returns { status: 'ok', version: '1.0.0' }.

## Constraints

- **ONLY** modify files matching: services/gateway/src/routes/runs.ts, docs/api/run-api.md
- **NEVER** touch: 
- Maximum repair attempts: 3
- Changes outside allowed paths: STOP and report
- Risk level: low

## Task Type

IMPLEMENTATION

## Task Brief

See run-spec.json objective.

## Required Documents

See CLAUDE.md.

## Acceptance Criteria

1. /v1/health returns 200 OK
2. Documentation updated

## Check Commands

- typecheck: `pnpm run typecheck`

## Stop Conditions

- Path guard violation
- 3 consecutive check failures

## Human Approval Required For

- None (auto-execute)

## Execution Sequence

### 1. PRELOAD
Read run-spec.json. Verify Git branch matches `agent/run-verification-001`. If mismatch → STOP.

### 2. READ_SPEC
Extract allowed_paths, forbidden_paths, acceptance_criteria, commands, stop_conditions from run-spec.

### 3. READ_DOCS
Read required documents in priority order (priority 1 first).
- Required documents: Read in full
- Optional documents: Skim summary only if relevant

### 4. PLAN_PATCH
Think step-by-step:
1. List ALL files you will modify
2. Verify EVERY file is within allowed_paths
3. If ANY file is outside allowed_paths → BLOCKED or REQUEST_APPROVAL

### 5. EXECUTE_PATCH
Make code changes. Hooks will automatically:
- path-guard.sh: Block edits to forbidden paths
- post-edit-lint.sh: Run lint after each edit (advisory)
- post-edit-typecheck.sh: Run typecheck after each edit (advisory)

### 6. RUN_CHECKS
Run all commands:
```bash
pnpm run typecheck
```
If checks fail → repair (max 3 attempts). If still failing → BLOCKED.

### 7. UPDATE_DOCS
**MANDATORY**: Update any documentation affected by code changes.

### 8. WRITE_REPORT
Write `.agent/run/current/run-report.json` with:
- status: COMPLETE | BLOCKED | REQUEST_APPROVAL
- files_changed: list of modified files
- checks: { lint, typecheck, test, smoke } results
- acceptance_criteria_results: pass/fail for each criterion

### 9. COMMIT
```bash
git add -A
git commit -m "run: run-verification-001 - Add a /v1/health endpoint to services/gateway/src/routes/run"
```

## Maximum Turns

This execution is limited to 25 turns. Plan efficiently.

## Model

claude-opus-4-5-20251101

---

BEGIN EXECUTION NOW.

Start with PRELOAD: Verify you are on branch `agent/run-verification-001`.
