#!/bin/bash
# .claude/hooks/post-edit-typecheck.sh
# PostToolUse hook: Runs TypeScript check after file edits
# Output goes to stdout and is fed to Claude for self-correction
# Exit 0 always (advisory hook)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# If no file path, skip
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only typecheck TypeScript files
if [[ ! "$FILE_PATH" =~ \.tsx?$ ]]; then
  exit 0
fi

# Skip node_modules and build artifacts
if [[ "$FILE_PATH" =~ (node_modules|\.wrangler|dist|build|\.svelte-kit)/ ]]; then
  exit 0
fi

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_ROOT"

# Determine which service was edited and run targeted typecheck
REL_PATH="${FILE_PATH#$PROJECT_ROOT/}"

TSC_OUTPUT=""
TSC_EXIT=0

if [[ "$REL_PATH" =~ ^services/gateway/ ]]; then
  TSC_OUTPUT=$(cd services/gateway && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^services/planning-machine/ ]]; then
  TSC_OUTPUT=$(cd services/planning-machine && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^services/agents/ ]]; then
  TSC_OUTPUT=$(cd services/agents && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^services/workflows/ ]]; then
  TSC_OUTPUT=$(cd services/workflows && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^services/ui/ ]]; then
  # SvelteKit uses svelte-check
  TSC_OUTPUT=$(cd services/ui && npx svelte-check --tsconfig ./tsconfig.json 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^packages/shared/ ]]; then
  TSC_OUTPUT=$(cd packages/shared && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
elif [[ "$REL_PATH" =~ ^packages/db/ ]]; then
  TSC_OUTPUT=$(cd packages/db && npx tsc --noEmit 2>&1) || TSC_EXIT=$?
else
  # Skip files outside known service directories
  exit 0
fi

if [ $TSC_EXIT -ne 0 ] && [ -n "$TSC_OUTPUT" ]; then
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")

  echo "TypeScript found $ERROR_COUNT error(s) after editing $REL_PATH:"
  echo "$TSC_OUTPUT"
  echo ""
  echo "Build will fail until these type errors are fixed."
fi

# Always exit 0 (advisory)
exit 0
