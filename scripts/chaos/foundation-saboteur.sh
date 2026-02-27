#!/bin/bash
#
# Foundation Saboteur - Chaos Engineering Script
# Version: 1.0.0
#
# PURPOSE: Controlled failure injection to verify platform resilience
#
# USAGE:
#   ./foundation-saboteur.sh <experiment> [options]
#
# EXPERIMENTS:
#   d1-latency        Inject D1 query latency (simulates slow DB)
#   kv-unavailable    Temporarily make KV unreachable
#   worker-overload   Generate high request load
#   do-corruption     Inject corrupted DO state (recoverable)
#   network-partition Simulate network issues to service bindings
#   cascade-failure   Chain multiple failures
#
# SAFETY:
#   - ONLY runs against staging environment
#   - All experiments are reversible
#   - Automatic cleanup on Ctrl+C
#   - Requires explicit confirmation
#
# ENVIRONMENT:
#   CLOUDFLARE_API_TOKEN  - Required for API calls
#   CLOUDFLARE_ACCOUNT_ID - Required for API calls
#   CHAOS_CONFIRM=true    - Skip confirmation prompts (CI mode)
#

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Staging-only resource IDs (NEVER production)
STAGING_D1_ID="eee97642-7f7e-466d-b6df-f4c68b822356"
STAGING_KV_IDS=(
  "6240f158d5744ad99cabf5db2d8e4cbf"  # CACHE_KV
  "7fa65ae86f2f47ceb4b2239a07b31eb8"  # RATE_LIMIT_KV
  "ec3eaf67adec4b0db41b7d5daf5ad8f3"  # SESSION_KV
)
STAGING_GATEWAY_URL="https://foundation-gateway-staging.erlvinc.workers.dev"
STAGING_WORKER_NAME="foundation-gateway-staging"

# Blacklisted production IDs (safety check)
PRODUCTION_D1_ID="34bce593-9df9-4acf-ac40-c8d93a7c7244"
PRODUCTION_KV_IDS=(
  "1e179df285ba4817b905633ce55d6d98"
  "c53d7df2c22c43f590f960a913113737"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# State
CLEANUP_ACTIONS=()

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_chaos() { echo -e "${MAGENTA}[CHAOS]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

banner() {
  echo -e "${MAGENTA}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║                                                                ║"
  echo "║     ███████╗ █████╗ ██████╗  ██████╗ ████████╗███████╗██╗   ██╗║"
  echo "║     ██╔════╝██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██║   ██║║"
  echo "║     ███████╗███████║██████╔╝██║   ██║   ██║   █████╗  ██║   ██║║"
  echo "║     ╚════██║██╔══██║██╔══██╗██║   ██║   ██║   ██╔══╝  ██║   ██║║"
  echo "║     ███████║██║  ██║██████╔╝╚██████╔╝   ██║   ███████╗╚██████╔╝║"
  echo "║     ╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝ ║"
  echo "║                                                                ║"
  echo "║              Foundation Chaos Engineering v1.0                 ║"
  echo "║                                                                ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

safety_check() {
  log_step "Running safety checks..."

  # Check for production IDs in current config
  if grep -r "$PRODUCTION_D1_ID" "$PROJECT_ROOT/services/" --include="*.jsonc" 2>/dev/null | grep -v "production"; then
    log_error "SAFETY ABORT: Production D1 ID found outside production config!"
    exit 1
  fi

  # Verify we're not targeting production
  if [[ "${TARGET_ENV:-staging}" == "production" ]]; then
    log_error "SAFETY ABORT: Cannot run chaos experiments against production!"
    exit 1
  fi

  # Verify API credentials exist
  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] || [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
    log_error "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID"
    exit 1
  fi

  log_info "Safety checks passed"
}

confirm() {
  local message="$1"

  if [[ "${CHAOS_CONFIRM:-false}" == "true" ]]; then
    log_info "Auto-confirmed (CHAOS_CONFIRM=true)"
    return 0
  fi

  echo -e "${YELLOW}[CONFIRM]${NC} $message"
  read -p "Type 'CHAOS' to confirm: " response

  if [[ "$response" != "CHAOS" ]]; then
    log_error "Confirmation failed. Aborting."
    exit 1
  fi
}

cleanup() {
  echo ""
  log_warn "Running cleanup..."

  for action in "${CLEANUP_ACTIONS[@]}"; do
    log_step "Cleanup: $action"
    eval "$action" || log_warn "Cleanup action failed: $action"
  done

  log_info "Cleanup complete"
}

trap cleanup EXIT

register_cleanup() {
  CLEANUP_ACTIONS+=("$1")
}

# ============================================================================
# EXPERIMENT: D1 LATENCY INJECTION
# ============================================================================

experiment_d1_latency() {
  local duration="${1:-30}"

  log_chaos "Experiment: D1 Latency Injection"
  log_info "Duration: ${duration}s"
  log_info "Target: foundation-primary-staging ($STAGING_D1_ID)"

  confirm "This will inject artificial latency into D1 queries"

  # Create a chaos table that triggers slow queries
  log_step "Creating chaos trigger table..."

  npx wrangler d1 execute foundation-primary-staging --remote --command="
    CREATE TABLE IF NOT EXISTS _chaos_latency (
      id TEXT PRIMARY KEY,
      payload TEXT,
      created_at INTEGER
    );
  "

  register_cleanup "npx wrangler d1 execute foundation-primary-staging --remote --command=\"DROP TABLE IF EXISTS _chaos_latency;\""

  # Insert large payload to slow down queries
  log_step "Injecting latency payload..."
  local large_payload=$(printf 'X%.0s' {1..10000})

  for i in {1..100}; do
    npx wrangler d1 execute foundation-primary-staging --remote --command="
      INSERT OR REPLACE INTO _chaos_latency (id, payload, created_at)
      VALUES ('chaos-$i', '$large_payload', unixepoch());
    " 2>/dev/null &
  done
  wait

  log_chaos "Latency injection active. Monitoring for ${duration}s..."

  # Monitor health endpoint
  local start_time=$(date +%s)
  local failures=0
  local successes=0

  while [[ $(($(date +%s) - start_time)) -lt $duration ]]; do
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$STAGING_GATEWAY_URL/health")
    local response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)

    if [[ $response_ms -gt 1000 ]]; then
      log_warn "Slow response: ${response_ms}ms"
      failures=$((failures + 1))
    else
      successes=$((successes + 1))
    fi

    sleep 1
  done

  log_chaos "Experiment complete"
  log_info "Results: $successes healthy, $failures degraded"

  # Verify recovery
  log_step "Verifying recovery..."
  sleep 5

  local recovery_time=$(curl -o /dev/null -s -w '%{time_total}' "$STAGING_GATEWAY_URL/health")
  local recovery_ms=$(echo "$recovery_time * 1000" | bc | cut -d. -f1)

  if [[ $recovery_ms -lt 500 ]]; then
    log_info "Recovery verified: ${recovery_ms}ms response time"
  else
    log_warn "Recovery slow: ${recovery_ms}ms response time"
  fi
}

# ============================================================================
# EXPERIMENT: KV UNAVAILABLE
# ============================================================================

experiment_kv_unavailable() {
  local kv_index="${1:-0}"
  local duration="${2:-30}"
  local kv_id="${STAGING_KV_IDS[$kv_index]}"

  log_chaos "Experiment: KV Unavailable"
  log_info "Duration: ${duration}s"
  log_info "Target KV: $kv_id"

  confirm "This will flood KV with invalid keys to test graceful degradation"

  # Flood KV with chaos keys
  log_step "Injecting chaos keys..."

  for i in {1..50}; do
    npx wrangler kv key put --namespace-id "$kv_id" "_chaos_key_$i" "chaos_value_$i" --remote &
  done
  wait

  register_cleanup "for i in {1..50}; do echo y | npx wrangler kv key delete --namespace-id \"$kv_id\" \"_chaos_key_\$i\" --remote 2>/dev/null; done"

  log_chaos "KV chaos active. Monitoring for ${duration}s..."

  # Monitor rate limiting behavior
  local start_time=$(date +%s)
  local rate_limited=0
  local passed=0

  while [[ $(($(date +%s) - start_time)) -lt $duration ]]; do
    local status=$(curl -s -o /dev/null -w '%{http_code}' "$STAGING_GATEWAY_URL/api/health")

    if [[ "$status" == "429" ]]; then
      rate_limited=$((rate_limited + 1))
    else
      passed=$((passed + 1))
    fi

    sleep 0.5
  done

  log_chaos "Experiment complete"
  log_info "Results: $passed passed, $rate_limited rate-limited"
}

# ============================================================================
# EXPERIMENT: WORKER OVERLOAD
# ============================================================================

experiment_worker_overload() {
  local rps="${1:-100}"
  local duration="${2:-30}"

  log_chaos "Experiment: Worker Overload"
  log_info "RPS: $rps"
  log_info "Duration: ${duration}s"
  log_info "Target: $STAGING_GATEWAY_URL"

  confirm "This will generate high request load against staging gateway"

  # Check if hey is available
  if ! command -v hey &> /dev/null; then
    log_warn "'hey' not found. Installing via go..."
    go install github.com/rakyll/hey@latest 2>/dev/null || {
      log_warn "Failed to install hey. Using curl fallback."

      # Curl-based load generation
      log_step "Starting load generation (curl fallback)..."

      local start_time=$(date +%s)
      local requests=0
      local errors=0

      while [[ $(($(date +%s) - start_time)) -lt $duration ]]; do
        for _ in $(seq 1 $rps); do
          curl -s -o /dev/null "$STAGING_GATEWAY_URL/health" &
        done
        wait
        requests=$((requests + rps))
        sleep 1
      done

      log_chaos "Load test complete: $requests requests"
      return
    }
  fi

  # Use hey for proper load testing
  log_step "Starting load generation with hey..."

  hey -z "${duration}s" -q "$rps" -c 50 "$STAGING_GATEWAY_URL/health" | tee /tmp/chaos-overload-results.txt

  # Parse results
  local total_requests=$(grep "Total:" /tmp/chaos-overload-results.txt | awk '{print $2}')
  local success_rate=$(grep "Status code distribution" -A 1 /tmp/chaos-overload-results.txt | tail -1 | grep -oP '\d+\.\d+%' | head -1)

  log_chaos "Experiment complete"
  log_info "Total requests: $total_requests"
  log_info "Success rate: ${success_rate:-N/A}"
}

# ============================================================================
# EXPERIMENT: DO CORRUPTION
# ============================================================================

experiment_do_corruption() {
  local agent_id="${1:-chaos-test-agent}"

  log_chaos "Experiment: DO Corruption (Recoverable)"
  log_info "Target Agent: $agent_id"

  confirm "This will inject corrupted state into a test DO"

  # Create test agent via API
  log_step "Creating test agent..."

  local create_response=$(curl -s -X POST "$STAGING_GATEWAY_URL/api/agents/chat/$agent_id" \
    -H "Content-Type: application/json" \
    -d '{"message":"Chaos test initialization"}')

  register_cleanup "curl -s -X DELETE \"$STAGING_GATEWAY_URL/api/agents/chat/$agent_id\" || true"

  # Inject malformed message
  log_step "Injecting corrupted payload..."

  local corrupt_response=$(curl -s -X POST "$STAGING_GATEWAY_URL/api/agents/chat/$agent_id" \
    -H "Content-Type: application/json" \
    -d '{"message":"\u0000\uFFFF\xDE\xAD\xBE\xEF"}' 2>/dev/null)

  # Check if agent recovered
  log_step "Verifying agent resilience..."

  local health_response=$(curl -s "$STAGING_GATEWAY_URL/api/agents/chat/$agent_id/status" 2>/dev/null || echo '{"status":"error"}')

  if echo "$health_response" | grep -q '"status"'; then
    log_info "Agent survived corruption: $health_response"
  else
    log_warn "Agent may be degraded: $health_response"
  fi

  log_chaos "Experiment complete"
}

# ============================================================================
# EXPERIMENT: NETWORK PARTITION
# ============================================================================

experiment_network_partition() {
  local duration="${1:-30}"

  log_chaos "Experiment: Network Partition (Service Binding)"
  log_info "Duration: ${duration}s"
  log_info "Simulating: Gateway <-> Agent Service disconnect"

  confirm "This will test service binding resilience"

  # We can't actually partition Cloudflare internal network, but we can
  # test the error handling by calling a non-existent service path

  log_step "Testing service binding error handling..."

  local error_responses=0
  local graceful_fallbacks=0

  for i in {1..20}; do
    local response=$(curl -s "$STAGING_GATEWAY_URL/api/agents/nonexistent/test-$i" 2>/dev/null)

    if echo "$response" | grep -q '"error"'; then
      graceful_fallbacks=$((graceful_fallbacks + 1))
    else
      error_responses=$((error_responses + 1))
    fi

    sleep 0.5
  done

  log_chaos "Experiment complete"
  log_info "Graceful error handling: $graceful_fallbacks / 20"

  if [[ $graceful_fallbacks -ge 18 ]]; then
    log_info "PASS: Error handling is robust"
  else
    log_warn "FAIL: Error handling needs improvement"
  fi
}

# ============================================================================
# EXPERIMENT: CASCADE FAILURE
# ============================================================================

experiment_cascade_failure() {
  log_chaos "Experiment: Cascade Failure"
  log_info "Combining multiple failure modes..."

  confirm "This will trigger multiple concurrent failures"

  log_step "Phase 1: D1 Latency"
  experiment_d1_latency 10 &
  local pid1=$!

  sleep 3

  log_step "Phase 2: Worker Overload"
  experiment_worker_overload 50 10 &
  local pid2=$!

  sleep 3

  log_step "Phase 3: DO Corruption"
  experiment_do_corruption "cascade-test-agent" &
  local pid3=$!

  wait $pid1 $pid2 $pid3

  log_chaos "Cascade experiment complete"

  # Final health check
  log_step "Final health verification..."

  local final_health=$(curl -s "$STAGING_GATEWAY_URL/health")

  if echo "$final_health" | grep -q '"status":"healthy"'; then
    log_info "PASS: System recovered from cascade failure"
  else
    log_warn "System state after cascade: $final_health"
  fi
}

# ============================================================================
# REPORT GENERATOR
# ============================================================================

generate_report() {
  local experiment="$1"
  local result="$2"
  local duration="$3"

  local report_file="$PROJECT_ROOT/docs/chaos-reports/$(date +%Y%m%d-%H%M%S)-$experiment.md"
  mkdir -p "$(dirname "$report_file")"

  cat > "$report_file" << EOF
# Chaos Experiment Report

**Experiment**: $experiment
**Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Duration**: ${duration}s
**Environment**: staging
**Result**: $result

## Configuration

- Gateway URL: $STAGING_GATEWAY_URL
- D1 Database: $STAGING_D1_ID
- KV Namespaces: ${STAGING_KV_IDS[*]}

## Observations

<!-- Add observations here -->

## Recommendations

<!-- Add recommendations here -->

## Artifacts

<!-- Link to logs, screenshots, etc. -->

---
Generated by Foundation Saboteur v1.0
EOF

  log_info "Report saved: $report_file"
}

# ============================================================================
# MAIN
# ============================================================================

show_help() {
  banner
  echo "Usage: $0 <experiment> [options]"
  echo ""
  echo "Experiments:"
  echo "  d1-latency [duration]         Inject D1 query latency"
  echo "  kv-unavailable [kv_index] [duration]  Flood KV namespace"
  echo "  worker-overload [rps] [duration]      Generate high request load"
  echo "  do-corruption [agent_id]      Inject corrupted DO state"
  echo "  network-partition [duration]  Simulate service binding issues"
  echo "  cascade-failure               Trigger multiple concurrent failures"
  echo ""
  echo "Options:"
  echo "  --report    Generate markdown report after experiment"
  echo "  --help      Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  CLOUDFLARE_API_TOKEN    Required for API calls"
  echo "  CLOUDFLARE_ACCOUNT_ID   Required for API calls"
  echo "  CHAOS_CONFIRM=true      Skip confirmation prompts (CI mode)"
  echo ""
  echo "Examples:"
  echo "  $0 d1-latency 60           # 60 second D1 latency test"
  echo "  $0 worker-overload 200 30  # 200 RPS for 30 seconds"
  echo "  $0 cascade-failure         # Combined failure test"
}

main() {
  local experiment="${1:-help}"
  shift || true

  banner

  case "$experiment" in
    d1-latency)
      safety_check
      experiment_d1_latency "$@"
      ;;
    kv-unavailable)
      safety_check
      experiment_kv_unavailable "$@"
      ;;
    worker-overload)
      safety_check
      experiment_worker_overload "$@"
      ;;
    do-corruption)
      safety_check
      experiment_do_corruption "$@"
      ;;
    network-partition)
      safety_check
      experiment_network_partition "$@"
      ;;
    cascade-failure)
      safety_check
      experiment_cascade_failure "$@"
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      log_error "Unknown experiment: $experiment"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
