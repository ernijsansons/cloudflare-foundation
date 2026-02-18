#!/usr/bin/env bash
# smoke-staging.sh — Critical smoke tests for staging deployment
# Run: bash scripts/smoke-staging.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-https://foundation-gateway.ernijs-ansons.workers.dev}"
PASSED=0
FAILED=0

print_result() {
  local name="$1"
  local status="$2"
  local detail="$3"
  if [[ "$status" == "PASS" ]]; then
    echo "✅ $name"
    PASSED=$((PASSED + 1))
  else
    echo "❌ $name — $detail"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== Staging Smoke Tests ==="
echo "Base URL: $BASE_URL"
echo ""

# -----------------------------------------------------------------------------
# Test 1: Gateway health
# -----------------------------------------------------------------------------
echo "--- Test 1: Gateway Health ---"
RESP=$(curl -s "$BASE_URL/health" 2>&1)
if echo "$RESP" | grep -q '"status":"ok"'; then
  print_result "Gateway /health" "PASS" ""
else
  print_result "Gateway /health" "FAIL" "$RESP"
fi

# -----------------------------------------------------------------------------
# Test 2: Planning service health (proxied)
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 2: Planning Health ---"
RESP=$(curl -s "$BASE_URL/api/planning/health" 2>&1)
if echo "$RESP" | grep -q '"status":"ok"'; then
  print_result "Planning /api/planning/health" "PASS" ""
else
  print_result "Planning /api/planning/health" "FAIL" "$RESP"
fi

# -----------------------------------------------------------------------------
# Test 3: Planning runs list (GET) — returns valid JSON array structure
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 3: Planning Runs List ---"
RESP=$(curl -s "$BASE_URL/api/planning/runs" 2>&1)
if echo "$RESP" | grep -q '"items":\['; then
  print_result "Planning GET /api/planning/runs" "PASS" ""
else
  print_result "Planning GET /api/planning/runs" "FAIL" "$RESP"
fi

# -----------------------------------------------------------------------------
# Test 4: Planning create run (POST) — write flow with local mode
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 4: Planning Create Run (local mode) ---"
RESP=$(curl -s -X POST "$BASE_URL/api/planning/runs" \
  -H "Content-Type: application/json" \
  -d '{"idea":"smoke-test-run","mode":"local"}' 2>&1)

if echo "$RESP" | grep -q '"id":"'; then
  RUN_ID=$(echo "$RESP" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  print_result "Planning POST /api/planning/runs" "PASS" ""
  echo "   Created run: $RUN_ID"
else
  print_result "Planning POST /api/planning/runs" "FAIL" "$RESP"
  RUN_ID=""
fi

# -----------------------------------------------------------------------------
# Test 5: Planning get run by ID (if created)
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 5: Planning Get Run by ID ---"
if [[ -n "${RUN_ID:-}" ]]; then
  RESP=$(curl -s "$BASE_URL/api/planning/runs/$RUN_ID" 2>&1)
  if echo "$RESP" | grep -q '"status"'; then
    print_result "Planning GET /api/planning/runs/:id" "PASS" ""
  else
    print_result "Planning GET /api/planning/runs/:id" "FAIL" "$RESP"
  fi
else
  print_result "Planning GET /api/planning/runs/:id" "SKIP" "No run ID from previous test"
fi

# -----------------------------------------------------------------------------
# Test 6: Webhooks list (GET) — requires auth, expect 401 or valid response
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 6: Webhooks List (auth check) ---"
RESP=$(curl -s "$BASE_URL/api/webhooks" 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/webhooks")

if [[ "$HTTP_CODE" == "401" ]]; then
  print_result "Webhooks GET /api/webhooks" "PASS" "(401 - auth required as expected)"
elif echo "$RESP" | grep -q '\['; then
  print_result "Webhooks GET /api/webhooks" "PASS" "(returned array)"
else
  print_result "Webhooks GET /api/webhooks" "FAIL" "HTTP $HTTP_CODE: $RESP"
fi

# -----------------------------------------------------------------------------
# Test 7: Webhooks create (POST) — requires auth, expect 401 or valid response
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 7: Webhooks Create (auth check) ---"
RESP=$(curl -s -X POST "$BASE_URL/api/webhooks" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/smoke-test","name":"smoke-test","events":"run_started"}' 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/webhooks" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/smoke-test","name":"smoke-test","events":"run_started"}')

if [[ "$HTTP_CODE" == "401" ]]; then
  print_result "Webhooks POST /api/webhooks" "PASS" "(401 - auth required as expected)"
elif echo "$RESP" | grep -q '"id"'; then
  print_result "Webhooks POST /api/webhooks" "PASS" "(created destination)"
else
  print_result "Webhooks POST /api/webhooks" "FAIL" "HTTP $HTTP_CODE: $RESP"
fi

# -----------------------------------------------------------------------------
# Test 8: UI reachable (302 redirect to dashboard)
# -----------------------------------------------------------------------------
echo ""
echo "--- Test 8: UI Reachable ---"
UI_URL="${BASE_URL/gateway/ui}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$UI_URL/" 2>&1)

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "302" ]]; then
  print_result "UI accessible ($UI_URL)" "PASS" ""
else
  print_result "UI accessible ($UI_URL)" "FAIL" "HTTP $HTTP_CODE"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "=== Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
exit 0
