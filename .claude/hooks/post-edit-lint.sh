#!/bin/bash
# .claude/hooks/post-edit-lint.sh
# PostToolUse hook: Runs ESLint after file edits
# Output goes to stdout and is fed to Claude for self-correction
# Exit 0 always (advisory hook)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# If no file path, skip
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only lint TypeScript/JavaScript/Svelte files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|svelte)$ ]]; then
  exit 0
fi

# Skip node_modules and build artifacts
if [[ "$FILE_PATH" =~ (node_modules|\.wrangler|dist|build|\.svelte-kit)/ ]]; then
  exit 0
fi

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_ROOT"

# Run ESLint on the specific file
LINT_OUTPUT=$(npx eslint "$FILE_PATH" --format compact 2>&1) || true
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ] && [ -n "$LINT_OUTPUT" ]; then
  # Extract error count
  ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")
  WARNING_COUNT=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo "0")

  echo "ESLint found $ERROR_COUNT error(s) and $WARNING_COUNT warning(s) in $FILE_PATH:"
  echo "$LINT_OUTPUT"
  echo ""
  echo "Run 'pnpm lint:fix' to auto-fix or address manually."
fi

# Always exit 0 (advisory)
exit 0
