#!/bin/bash
# .claude/hooks/forbidden-cmd.sh
# PreToolUse hook: Blocks dangerous shell commands
# Exit 0 = allow, Exit 2 = block (stderr fed back to Claude)

set -e

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# If no command, allow
if [ -z "$COMMAND" ]; then
  exit 0
fi

# === BLOCKED COMMANDS ===

# Helper function to report violations to run-api
report_violation() {
  local violation_type="$1"
  local details="$2"
  RUN_SPEC=".agent/run/current/run-spec.json"
  if [ -f "$RUN_SPEC" ]; then
    local run_id=$(jq -r '.run_id' "$RUN_SPEC" 2>/dev/null || echo "")
    if [ -n "$run_id" ] && [ -n "$RUN_API_URL" ]; then
      curl -s -X POST "$RUN_API_URL/runs/$run_id/hook-violation" \
        -H "Content-Type: application/json" \
        -d "{\"hookName\":\"forbidden-cmd\",\"violationType\":\"$violation_type\",\"details\":\"$details\",\"command\":\"$COMMAND\"}" || true
    fi
  fi
}

# Destructive rm patterns (rm -rf /, rm -rf ~, etc.)
if echo "$COMMAND" | grep -qE 'rm\s+(-rf?|--recursive)\s+(/|~|\.\.|\$HOME|\$CLAUDE_PROJECT_DIR\s*$)'; then
  echo "BLOCKED: Recursive delete of root, home, or project root is prohibited." >&2
  report_violation "destructive-rm" "Recursive delete of root/home/project"
  exit 2
fi

# Git force push to main/master
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*(-f|--force).*\s+(main|master|origin/main|origin/master)'; then
  echo "BLOCKED: Force push to main/master is prohibited." >&2
  report_violation "force-push-main" "Force push to main/master"
  exit 2
fi

# Git hard reset
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "BLOCKED: git reset --hard is destructive. Use git stash or git checkout instead." >&2
  report_violation "hard-reset" "git reset --hard is destructive"
  exit 2
fi

# Drop table/database commands
if echo "$COMMAND" | grep -qiE '(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)'; then
  echo "BLOCKED: DROP TABLE/DATABASE and TRUNCATE commands are prohibited." >&2
  report_violation "drop-command" "DROP/TRUNCATE command"
  exit 2
fi

# Curl to external URLs (potential data exfiltration)
if echo "$COMMAND" | grep -qE 'curl\s+.*https?://(?!localhost|127\.0\.0\.1|run-api\.)'; then
  # Allow internal/control plane URLs, block external
  if ! echo "$COMMAND" | grep -qE 'curl\s+.*https?://(localhost|127\.0\.0\.1|.*\.workers\.dev)'; then
    echo "BLOCKED: External curl requests require explicit approval." >&2
    exit 2
  fi
fi

# Check for commands touching forbidden paths from run-spec
RUN_SPEC=".agent/run/current/run-spec.json"
if [ -f "$RUN_SPEC" ]; then
  FORBIDDEN_PATHS=$(jq -r '.forbidden_paths[]? // empty' "$RUN_SPEC" 2>/dev/null)
  if [ -n "$FORBIDDEN_PATHS" ]; then
    while IFS= read -r pattern; do
      if [[ -n "$pattern" ]] && echo "$COMMAND" | grep -qF "$pattern"; then
        echo "BLOCKED: Command references forbidden path '$pattern'." >&2
        exit 2
      fi
    done <<< "$FORBIDDEN_PATHS"
  fi
fi

# === SENSITIVE COMMANDS (warn but allow) ===

# wrangler secret commands
if echo "$COMMAND" | grep -qE 'wrangler\s+secret\s+(put|delete)'; then
  echo "WARNING: Secrets management command detected. Ensure correct environment." >&2
  # Allow but warn
  exit 0
fi

# Deploy commands
if echo "$COMMAND" | grep -qE '(wrangler\s+deploy|pnpm\s+run\s+deploy|npx\s+wrangler\s+deploy)'; then
  # Check if --dry-run flag is present
  if ! echo "$COMMAND" | grep -q '\-\-dry-run'; then
    echo "WARNING: Production deployment detected. Consider using --dry-run first." >&2
  fi
  exit 0
fi

# Allow the command
exit 0
