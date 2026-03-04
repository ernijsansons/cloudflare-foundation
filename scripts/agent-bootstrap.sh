#!/bin/bash
# scripts/agent-bootstrap.sh
# Main execution entrypoint for Ralph Loop bounded tasks
#
# Usage: ./scripts/agent-bootstrap.sh <run_id>
#
# This script:
# 1. Fetches or validates the run bundle
# 2. Validates the run-spec schema
# 3. Checks out the correct branch
# 4. Generates the prompt and compaction context
# 5. Executes Claude Code in headless mode
# 6. Posts results to Cloudflare control plane

set -euo pipefail

# === Configuration ===
RUN_ID="${1:?Usage: agent-bootstrap.sh <run_id>}"
# Actor 2: Isolated control plane (run-api service)
RUN_API_URL="${RUN_API_URL:-http://localhost:8790}"
AGENT_TOKEN="${AGENT_TOKEN:-}"
RUN_DIR=".agent/run/current"
PROJECT_ROOT="$(pwd)"

# Export RUN_API_URL for hooks to use
export RUN_API_URL
export RUN_ID

echo "=== Agent Bootstrap: $RUN_ID ==="
echo "Project root: $PROJECT_ROOT"
echo "Run directory: $RUN_DIR"

# === Step 1: Fetch or validate run bundle ===
if [[ -f "$RUN_DIR/run-spec.json" ]]; then
  echo "Step 1: Using local run pack"
else
  if [[ -z "$RUN_API_URL" ]] || [[ -z "$AGENT_TOKEN" ]]; then
    echo "ERROR: No local run-spec.json and RUN_API_URL/AGENT_TOKEN not set"
    exit 1
  fi

  echo "Step 1: Fetching run bundle from run-api..."
  mkdir -p "$RUN_DIR"
  # Fetch bundle from run-api service
  BUNDLE_RESPONSE=$(curl -sf "$RUN_API_URL/runs/$RUN_ID/bundle" \
    -H "Authorization: Bearer $AGENT_TOKEN")

  # Extract files from JSON response
  echo "$BUNDLE_RESPONSE" | jq -r '.runSpec' > "$RUN_DIR/run-spec.json"
  echo "$BUNDLE_RESPONSE" | jq -r '.brief // empty' > "$RUN_DIR/brief.md"
  echo "$BUNDLE_RESPONSE" | jq -r '.docManifest // empty' > "$RUN_DIR/doc-manifest.json"
fi

# === Step 2: Validate schema ===
echo "Step 2: Validating run-spec schema..."
if command -v npx &> /dev/null; then
  npx ajv validate -s .agent/schema/run-spec.schema.json -d "$RUN_DIR/run-spec.json" 2>/dev/null || {
    echo "WARNING: Schema validation skipped (ajv not available or validation failed)"
  }
else
  echo "WARNING: npx not available, skipping schema validation"
fi

# === Step 3: Verify/checkout branch ===
echo "Step 3: Checking branch..."
EXPECTED_BRANCH=$(jq -r '.branch' "$RUN_DIR/run-spec.json")
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  echo "Switching from $CURRENT_BRANCH to $EXPECTED_BRANCH"
  git checkout -B "$EXPECTED_BRANCH" 2>/dev/null || git checkout "$EXPECTED_BRANCH"
fi
echo "On branch: $(git branch --show-current)"

# === Step 4: Generate prompt and compaction context ===
echo "Step 4: Generating prompt and compaction context..."
node scripts/generate-prompt.js "$RUN_DIR/run-spec.json" > "$RUN_DIR/prompt.md"
node scripts/generate-compaction-context.js "$RUN_DIR/run-spec.json" > "$RUN_DIR/compaction-context.md"

echo "Generated:"
echo "  - $RUN_DIR/prompt.md ($(wc -l < "$RUN_DIR/prompt.md") lines)"
echo "  - $RUN_DIR/compaction-context.md ($(wc -l < "$RUN_DIR/compaction-context.md") lines)"

# === Step 5: Extract execution parameters ===
MAX_TURNS=$(jq -r '.max_turns // 25' "$RUN_DIR/run-spec.json")
MODEL=$(jq -r '.model // "claude-sonnet-4-5-20250929"' "$RUN_DIR/run-spec.json")

echo "Step 5: Execution parameters:"
echo "  - Model: $MODEL"
echo "  - Max turns: $MAX_TURNS"

# === Step 6: Execute Claude Code ===
echo "Step 6: Executing Claude Code in headless mode..."
echo "=========================================="

RESULT_FILE="$RUN_DIR/result.json"

# Execute Claude Code with bounded permissions
set +e
RESULT=$(claude -p "$(cat "$RUN_DIR/prompt.md")" \
  --output-format json \
  --model "$MODEL" \
  --allowedTools "Read,Write,Edit,MultiEdit,Bash(pnpm *),Bash(git *),Bash(wrangler *),Bash(npx *)" \
  --max-turns "$MAX_TURNS" \
  --permission-mode acceptEdits 2>&1)
CLAUDE_EXIT=$?
set -e

echo "$RESULT" > "$RESULT_FILE"

echo "=========================================="
echo "Claude Code exit code: $CLAUDE_EXIT"

# === Step 7: Post results to run-api ===
if [[ -n "$RUN_API_URL" ]]; then
  echo "Step 7: Posting results to run-api..."

  if [[ -f "$RUN_DIR/run-report.json" ]]; then
    curl -sf -X POST \
      "$RUN_API_URL/runs/$RUN_ID/report" \
      -H "Content-Type: application/json" \
      -d @"$RUN_DIR/run-report.json" || echo "Warning: Failed to post run report"
  else
    echo "Warning: No run-report.json found"
  fi
else
  echo "Step 7: Skipping run-api post (not configured)"
fi

# === Step 8: Push branch ===
echo "Step 8: Pushing branch to origin..."
git push origin "$EXPECTED_BRANCH" 2>/dev/null || echo "Warning: Failed to push branch (may not have remote)"

# === Summary ===
STATUS=$(echo "$RESULT" | jq -r '.subtype // "unknown"' 2>/dev/null || echo "unknown")
COST=$(echo "$RESULT" | jq -r '.cost_usd // "N/A"' 2>/dev/null || echo "N/A")
TURNS=$(echo "$RESULT" | jq -r '.num_turns // "N/A"' 2>/dev/null || echo "N/A")

echo ""
echo "=== Bootstrap Complete ==="
echo "Run ID: $RUN_ID"
echo "Status: $STATUS"
echo "Turns: $TURNS"
echo "Cost: \$$COST"
echo "Result: $RESULT_FILE"
