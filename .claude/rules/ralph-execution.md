---
paths:
  - ".agent/**"
  - "scripts/agent-*"
  - "scripts/generate-*"
---

# Ralph Loop Execution Rules

## Ralph State Machine
```
PRELOAD → READ_SPEC → READ_DOCS → PLAN_PATCH → EXECUTE_PATCH →
RUN_CHECKS → UPDATE_DOCS → WRITE_REPORT → REQUEST_APPROVAL → COMPLETE
Any state → BLOCKED (terminal failure)
```

## Execution Contract
1. ALWAYS read run-spec.json first
2. ONLY modify files in allowed_paths
3. NEVER touch files in forbidden_paths
4. Maximum 3 repair attempts on check failures
5. Mandatory documentation updates

## Run Spec Fields
- schema_version: "1.0.0"
- run_id: "run_YYYY_MM_DD_NNN"
- allowed_paths: glob patterns for allowed edits
- forbidden_paths: glob patterns to never touch
- acceptance_criteria: conditions for success
- stop_conditions: when to halt execution

## Hooks
- path-guard.sh: Enforces allowed_paths
- forbidden-cmd.sh: Blocks dangerous commands
- pre-commit-audit.sh: Lint/typecheck/test before commit
- post-edit-lint.sh: Advisory lint after edits
- post-edit-typecheck.sh: Advisory typecheck after edits
- result-capture.sh: Post results on session end

## Compaction Recovery
When context compacts, critical invariants are re-injected via compaction-context.md.
