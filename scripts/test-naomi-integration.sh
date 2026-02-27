#!/usr/bin/env bash
# test-naomi-integration.sh - Smoke tests for Naomi dashboard integration
# Run: bash scripts/test-naomi-integration.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-https://dashboard.erlvinc.com}"
PASSED=0
FAILED=0

print_result() {
  local name="$1"
  local status="$2"
  local detail="$3"
  if [[ "$status" == "PASS" ]]; then
    echo "PASS $name"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL $name - $detail"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== Naomi Dashboard Integration Smoke Tests ==="
echo "Base URL: $BASE_URL"
echo ""

# 1. Health
echo "--- 1. Gateway Health ---"
RESP=$(curl -s "$BASE_URL/api/health" 2>&1)
if echo "$RESP" | grep -q '"status":"ok"'; then
  print_result "GET /api/health" "PASS" ""
else
  print_result "GET /api/health" "FAIL" "$RESP"
fi

# 2. List Naomi tasks
echo ""
echo "--- 2. List Naomi Tasks ---"
RESP=$(curl -s "$BASE_URL/api/naomi/tasks?limit=5" 2>&1)
if echo "$RESP" | grep -q '"items"'; then
  print_result "GET /api/naomi/tasks" "PASS" ""
else
  print_result "GET /api/naomi/tasks" "FAIL" "$RESP"
fi

# 3. Production page
echo ""
echo "--- 3. Production Page ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ai-labs/production" 2>&1)
if [[ "$HTTP_CODE" == "200" ]]; then
  print_result "GET /ai-labs/production" "PASS" ""
else
  print_result "GET /ai-labs/production" "FAIL" "HTTP $HTTP_CODE"
fi

# 4. Naomi subdomain
echo ""
echo "--- 4. Naomi Subdomain ---"
NAOMI_URL="${BASE_URL/dashboard./naomi.}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NAOMI_URL/ai-labs/production" 2>&1)
if [[ "$HTTP_CODE" == "200" ]]; then
  print_result "GET naomi.erlvinc.com/ai-labs/production" "PASS" ""
else
  print_result "GET naomi.erlvinc.com/ai-labs/production" "FAIL" "HTTP $HTTP_CODE"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi
exit 0
