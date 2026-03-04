#!/bin/bash
# .claude/hooks/result-capture.sh
# Stop hook: Captures execution results and posts to Cloudflare control plane
# Exit 0 always (best effort)

set -e

INPUT=$(cat)
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_ROOT"

# Load run context
RUN_SPEC=".agent/run/current/run-spec.json"
RUN_REPORT=".agent/run/current/run-report.json"
RESULT_FILE=".agent/run/current/result.json"

# If no run-spec, this isn't a Ralph execution - skip
if [ ! -f "$RUN_SPEC" ]; then
  exit 0
fi

# Extract run metadata
RUN_ID=$(jq -r '.run_id // "unknown"' "$RUN_SPEC" 2>/dev/null)
BRANCH=$(jq -r '.branch // "unknown"' "$RUN_SPEC" 2>/dev/null)
CONTROL_PLANE="${CONTROL_PLANE_URL:-}"

echo "=== Result Capture: $RUN_ID ===" >&2

# 1. Check if run-report.json exists
if [ -f "$RUN_REPORT" ]; then
  echo "Found run-report.json" >&2

  # 2. Post to Cloudflare control plane (if configured)
  if [ -n "$CONTROL_PLANE" ] && [ -n "$AGENT_TOKEN" ]; then
    echo "Posting run report to control plane..." >&2
    curl -sf -X POST \
      "$CONTROL_PLANE/v1/runs/$RUN_ID/report" \
      -H "Authorization: Bearer $AGENT_TOKEN" \
      -H "Content-Type: application/json" \
      -d @"$RUN_REPORT" 2>&1 || echo "Warning: Failed to post to control plane" >&2
  else
    echo "Skipping control plane post (CONTROL_PLANE_URL or AGENT_TOKEN not set)" >&2
  fi
else
  echo "No run-report.json found - run may have ended early" >&2
fi

# 3. Push branch to GitHub (if changes exist)
if [ -n "$BRANCH" ] && [ "$BRANCH" != "unknown" ]; then
  # Check if there are commits to push
  if git log origin/$BRANCH..$BRANCH 2>/dev/null | grep -q commit; then
    echo "Pushing branch $BRANCH to origin..." >&2
    git push origin "$BRANCH" 2>&1 || echo "Warning: Failed to push branch" >&2
  else
    echo "No new commits to push" >&2
  fi
fi

# 4. Record session completion timestamp
TIMESTAMP=$(date -Iseconds)
echo "Session completed at $TIMESTAMP" >&2

# 5. Archive run artifacts (optional)
ARCHIVE_DIR=".agent/run/archive/$RUN_ID"
if [ ! -d "$ARCHIVE_DIR" ]; then
  mkdir -p "$ARCHIVE_DIR"
  cp -r .agent/run/current/* "$ARCHIVE_DIR/" 2>/dev/null || true
  echo "Archived run to $ARCHIVE_DIR" >&2
fi

echo "=== Result Capture Complete ===" >&2
exit 0
