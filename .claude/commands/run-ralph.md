# /project:run-ralph

Execute a bounded Ralph Loop development task.

## Prerequisites
- .agent/run/current/run-spec.json must exist
- Git branch must match run-spec.branch

## Execution Sequence

### 1. PRELOAD
Read and validate run-spec.json. Verify Git branch matches. If mismatch → BLOCKED.

### 2. READ_SPEC
Extract from run-spec.json:
- allowed_paths
- forbidden_paths
- acceptance_criteria
- commands
- stop_conditions
- max_turns

### 3. READ_DOCS
Read doc-manifest.json. Load required documents in priority order.
- Priority 1: Read in full
- Priority 2+: Skim summaries only

### 4. PLAN_PATCH
Think step-by-step:
1. List all files to modify
2. Verify EVERY file within allowed_paths
3. If outside → BLOCKED or REQUEST_APPROVAL

### 5. EXECUTE_PATCH
Make code changes. Hooks auto-run:
- path-guard.sh blocks forbidden paths
- post-edit-lint.sh feeds lint errors
- post-edit-typecheck.sh feeds type errors

### 6. RUN_CHECKS
Execute all commands from run-spec:
```bash
pnpm lint
pnpm typecheck
pnpm test
```
If fail → repair (max 3 attempts). If still failing → BLOCKED.

### 7. UPDATE_DOCS
MANDATORY. Update any documentation affected by code changes.

### 8. WRITE_REPORT
Generate .agent/run/current/run-report.json:
```json
{
  "run_id": "...",
  "status": "COMPLETE" | "BLOCKED",
  "files_changed": [...],
  "checks": { "lint": "pass", "typecheck": "pass", "test": "pass" },
  "docs_updated": [...],
  "acceptance_criteria_results": [...]
}
```

### 9. COMMIT
```bash
git add -A
git commit -m "run: <run_id> - <objective>"
```

## Stop Conditions
Execute BLOCKED transition if:
- Schema validation fails
- Required docs missing
- Changes outside allowed_paths
- 3 consecutive check failures
- Context exhausted before completion
