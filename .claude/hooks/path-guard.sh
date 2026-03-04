#!/bin/bash
# .claude/hooks/path-guard.sh
# PreToolUse hook: Validates file paths are within allowed directories
# Exit 0 = allow, Exit 2 = block (stderr fed back to Claude)

set -e

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# If no file path in input, allow the operation
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get absolute path
ABS_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")
PROJECT_ROOT=$(realpath "${CLAUDE_PROJECT_DIR:-$(pwd)}")

# Get relative path (strip PROJECT_ROOT and any leading slash)
REL_PATH=$(echo "$ABS_PATH" | sed "s|^$PROJECT_ROOT||" | sed 's|^/||')

# Check if run-spec.json exists (Ralph mode)
RUN_SPEC=".agent/run/current/run-spec.json"
if [ -f "$RUN_SPEC" ]; then
  # Load allowed and forbidden paths from run-spec
  ALLOWED_PATHS=$(jq -r '.allowed_paths[]? // empty' "$RUN_SPEC" 2>/dev/null)
  FORBIDDEN_PATHS=$(jq -r '.forbidden_paths[]? // empty' "$RUN_SPEC" 2>/dev/null)

  # Get relative path
  REL_PATH="${ABS_PATH#$PROJECT_ROOT/}"

  # Check forbidden paths first
  if [ -n "$FORBIDDEN_PATHS" ]; then
    while IFS= read -r pattern; do
      if [[ -n "$pattern" ]] && [[ "$REL_PATH" == $pattern ]]; then
        echo "BLOCKED: Path '$REL_PATH' matches forbidden pattern '$pattern'" >&2
        # Report to run-api
        RUN_ID=$(jq -r '.run_id' "$RUN_SPEC" 2>/dev/null || echo "")
        if [ -n "$RUN_ID" ] && [ -n "$RUN_API_URL" ]; then
          curl -s -X POST "$RUN_API_URL/runs/$RUN_ID/hook-violation" \
            -H "Content-Type: application/json" \
            -d "{\"hookName\":\"path-guard\",\"violationType\":\"forbidden-path\",\"details\":\"Matches forbidden pattern: $pattern\",\"filePath\":\"$REL_PATH\"}" || true
        fi
        exit 2
      fi
    done <<< "$FORBIDDEN_PATHS"
  fi

  # Check allowed paths
  if [ -n "$ALLOWED_PATHS" ]; then
    ALLOWED=false
    while IFS= read -r pattern; do
      if [[ -n "$pattern" ]] && [[ "$REL_PATH" == $pattern ]]; then
        ALLOWED=true
        break
      fi
    done <<< "$ALLOWED_PATHS"

    if [ "$ALLOWED" = false ]; then
      echo "BLOCKED: Path '$REL_PATH' not in allowed_paths. Allowed: $ALLOWED_PATHS" >&2
      # Report to run-api
      RUN_ID=$(jq -r '.run_id' "$RUN_SPEC" 2>/dev/null || echo "")
      if [ -n "$RUN_ID" ] && [ -n "$RUN_API_URL" ]; then
        curl -s -X POST "$RUN_API_URL/runs/$RUN_ID/hook-violation" \
          -H "Content-Type: application/json" \
          -d "{\"hookName\":\"path-guard\",\"violationType\":\"outside-allowed-paths\",\"details\":\"Path not in allowed_paths\",\"filePath\":\"$REL_PATH\"}" || true
      fi
      exit 2
    fi
  fi
fi

# === PROTECTED FILES (foundation monorepo) ===
PROTECTED_FILES=(
  "services/planning-machine/src/workflows/planning-workflow.ts"
  "services/planning-machine/src/lib/orchestrator.ts"
  "services/planning-machine/src/lib/model-router.ts"
  "services/planning-machine/src/lib/reasoning-engine.ts"
  "services/planning-machine/src/lib/schema-validator.ts"
)

REL_PATH="${ABS_PATH#$PROJECT_ROOT/}"
for protected in "${PROTECTED_FILES[@]}"; do
  if [ "$REL_PATH" = "$protected" ]; then
    echo "BLOCKED: '$REL_PATH' is a protected file. Only append imports/exports allowed." >&2
    exit 2
  fi
done

# === PROTECTED MIGRATION PATTERNS ===
# Existing gateway migrations (0000-0011)
if [[ "$REL_PATH" =~ ^services/gateway/migrations/00(0[0-9]|1[0-1])_ ]]; then
  echo "BLOCKED: Existing gateway migration '$REL_PATH' cannot be modified." >&2
  exit 2
fi

# Existing planning-machine migrations (0000-0006)
if [[ "$REL_PATH" =~ ^services/planning-machine/migrations/000[0-6]_ ]]; then
  echo "BLOCKED: Existing planning-machine migration '$REL_PATH' cannot be modified." >&2
  exit 2
fi

# === STALE DIRECTORIES ===
STALE_DIRS=(
  "cli-scaffold-test"
  "cli-scaffold-test3"
  "erlvinc-dashboard-temp"
  "future-idea-scaffold"
  "test-init"
)

for stale in "${STALE_DIRS[@]}"; do
  if [[ "$REL_PATH" =~ ^$stale/ ]]; then
    echo "BLOCKED: '$stale' is a stale directory marked DO NOT TOUCH." >&2
    exit 2
  fi
done

# === PATH TRAVERSAL CHECK ===
if [[ "$ABS_PATH" != "$PROJECT_ROOT"* ]]; then
  echo "BLOCKED: Path traversal detected. Operation must stay within project directory." >&2
  # Report to run-api if RUN_ID is set
  if [ -n "$RUN_ID" ] && [ -n "$RUN_API_URL" ]; then
    curl -s -X POST "$RUN_API_URL/runs/$RUN_ID/hook-violation" \
      -H "Content-Type: application/json" \
      -d "{\"hookName\":\"path-guard\",\"violationType\":\"path-traversal\",\"details\":\"Path traversal detected\",\"filePath\":\"$ABS_PATH\"}" || true
  fi
  exit 2
fi

# All checks passed
exit 0
