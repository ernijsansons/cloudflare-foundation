#!/bin/bash
# .claude/hooks/pre-commit-audit.sh
# PreToolUse hook: Audits git commits before they happen
# Runs lint, typecheck, test before allowing commit
# Exit 0 = allow, Exit 2 = block (stderr fed back to Claude)

set -e

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE '^git\s+commit'; then
  exit 0
fi

# Check for skipped hooks (prohibited)
if echo "$COMMAND" | grep -qE '(\-\-no-verify|\-\-no-gpg-sign)'; then
  echo "BLOCKED: --no-verify and --no-gpg-sign flags are prohibited." >&2
  exit 2
fi

# Check for amend on already-pushed commits
if echo "$COMMAND" | grep -qE '\-\-amend'; then
  # Verify we are ahead of remote (commit not pushed)
  if git status 2>/dev/null | grep -q "Your branch is behind\|up to date"; then
    echo "BLOCKED: --amend on already-pushed commits is prohibited. Create a new commit." >&2
    exit 2
  fi
fi

# === PRE-COMMIT QUALITY GATES ===
# These run before the commit is allowed

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_ROOT"

# 1. Run lint
echo "Pre-commit: Running lint..." >&2
if ! pnpm lint 2>&1; then
  echo "BLOCKED: Lint check failed. Fix linting errors before committing." >&2
  exit 2
fi

# 2. Run typecheck (Workers only - faster)
echo "Pre-commit: Running typecheck..." >&2
if ! pnpm run typecheck:workers 2>&1; then
  echo "BLOCKED: TypeScript check failed. Fix type errors before committing." >&2
  exit 2
fi

# 3. Run tests (optional - check if tests exist for changed files)
# Only run if run-spec specifies tests are required
RUN_SPEC=".agent/run/current/run-spec.json"
if [ -f "$RUN_SPEC" ]; then
  TEST_CMD=$(jq -r '.commands.test // empty' "$RUN_SPEC" 2>/dev/null)
  if [ -n "$TEST_CMD" ]; then
    echo "Pre-commit: Running tests..." >&2
    if ! eval "$TEST_CMD" 2>&1; then
      echo "BLOCKED: Tests failed. Fix failing tests before committing." >&2
      exit 2
    fi
  fi
fi

echo "Pre-commit: All checks passed." >&2
exit 0
