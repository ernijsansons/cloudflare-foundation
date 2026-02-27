#!/bin/bash
set -euo pipefail

# Factory Endpoints Smoke Test Suite
# Version: 2.5.0
# Purpose: Comprehensive smoke tests for factory public endpoints

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT=${1:-staging}
BASE_URL=""
CORS_TEST_ORIGIN=""

case $ENVIRONMENT in
  "staging")
    BASE_URL="https://foundation-gateway-staging.ernijs-ansons.workers.dev"
    CORS_TEST_ORIGIN="https://dashboard-staging.erlvinc.com"
    ;;
  "production")
    BASE_URL="https://gateway.erlvinc.com"
    CORS_TEST_ORIGIN="https://dashboard.erlvinc.com"
    ;;
  "local")
    BASE_URL="http://localhost:8788"
    CORS_TEST_ORIGIN="http://localhost:5173"
    ;;
  *)
    echo "Usage: $0 [staging|production|local]"
    exit 1
    ;;
esac

# Dependency checks
require_cmd() {
    local cmd="$1"
    local install_hint="$2"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Missing required command: $cmd"
        echo "Install hint: $install_hint"
        exit 1
    fi
}

require_cmd "curl" "Install curl and ensure it is available on PATH."
require_cmd "jq" "Install jq and ensure it is available on PATH."
require_cmd "awk" "Install awk and ensure it is available on PATH."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TEMPLATE_SLUG=""

# Test functions
test_start() {
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -en "${BLUE}[TEST $TESTS_RUN]${NC} $1... "
}

test_pass() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

test_fail() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "${RED}✗ FAIL${NC} - $1"
}

test_warn() {
    echo -e "${YELLOW}⚠ WARN${NC} - $1"
}

# HTTP test helper
http_test() {
    local method=$1
    local path=$2
    local expected_code=$3
    local description=$4

    test_start "$description"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path")

    if [ "$HTTP_CODE" -eq "$expected_code" ]; then
        test_pass
        return 0
    else
        test_fail "Expected HTTP $expected_code, got $HTTP_CODE"
        return 1
    fi
}

# JSON response test
json_test() {
    local path=$1
    local jq_filter=$2
    local expected=$3
    local description=$4

    test_start "$description"

    if ! RESPONSE=$(curl -sS "$BASE_URL$path"); then
        test_fail "Request failed"
        return 1
    fi

    if ! RESULT=$(echo "$RESPONSE" | jq -r "$jq_filter" 2>/dev/null); then
        test_fail "Invalid JSON response or jq filter error"
        return 1
    fi

    if [ "$RESULT" == "$expected" ]; then
        test_pass
        return 0
    else
        test_fail "Expected '$expected', got '$RESULT'"
        return 1
    fi
}

# Performance test
perf_test() {
    local path=$1
    local max_time_ms=$2
    local description=$3

    test_start "$description"

    local samples=()
    local i
    for i in 1 2 3; do
        TIME_SECONDS=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$path")
        TIME_MS=$(awk -v t="$TIME_SECONDS" 'BEGIN { printf "%.0f", t * 1000 }')
        samples+=("$TIME_MS")
    done

    mapfile -t sorted_samples < <(printf "%s\n" "${samples[@]}" | sort -n)
    local median_ms="${sorted_samples[1]}"
    local samples_str
    samples_str=$(IFS=,; echo "${samples[*]}")

    if [ "$median_ms" -lt "$max_time_ms" ]; then
        test_pass
        echo -e "      Response times (ms): ${samples_str} | median: ${median_ms}ms"
        return 0
    else
        test_fail "Median response time ${median_ms}ms exceeds ${max_time_ms}ms (samples: ${samples_str})"
        return 1
    fi
}

echo "========================================="
echo "Factory Endpoints Smoke Test Suite"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Test Suite 1: Templates Endpoint
echo -e "${BLUE}[SUITE 1] Templates Endpoint${NC}"
echo "-------------------"

http_test "GET" "/api/public/factory/templates" 200 "GET templates list returns 200"

json_test "/api/public/factory/templates" \
    'has("items") and has("total")' \
    "true" \
    "Response has 'items' and 'total' fields"

json_test "/api/public/factory/templates" \
    '.items | type' \
    "array" \
    "Items field is an array"

json_test "/api/public/factory/templates" \
    '.total | type' \
    "number" \
    "Total field is a number"

perf_test "/api/public/factory/templates" 500 "Templates list responds in <500ms"

http_test "GET" "/api/public/factory/templates?category=api" 200 "Filter by category works"

http_test "GET" "/api/public/factory/templates?framework=hono" 200 "Filter by framework works"

http_test "GET" "/api/public/factory/templates?maxComplexity=3" 200 "Filter by maxComplexity works"

http_test "GET" "/api/public/factory/templates?includeDeprecated=true" 200 "includeDeprecated parameter works"

http_test "GET" "/api/public/factory/templates?tenant_id=test-tenant" 200 "tenant_id parameter works"

http_test "GET" "/api/public/factory/templates?limit=5" 200 "Pagination limit parameter works"

http_test "GET" "/api/public/factory/templates?offset=2" 200 "Pagination offset parameter works"

http_test "GET" "/api/public/factory/templates?limit=5&offset=2" 200 "Pagination limit+offset together works"

# Resolve a valid template slug dynamically from current staging data.
TEMPLATE_SLUG=$(curl -sS "$BASE_URL/api/public/factory/templates?limit=1" | jq -r '.items[0].slug // empty')

echo ""

# Test Suite 2: Templates Detail Endpoint
echo -e "${BLUE}[SUITE 2] Templates Detail Endpoint${NC}"
echo "-------------------"

if [ -z "$TEMPLATE_SLUG" ]; then
    echo "Unable to resolve a template slug from /factory/templates. Cannot run detail endpoint checks."
    exit 1
fi

http_test "GET" "/api/public/factory/templates/$TEMPLATE_SLUG" 200 "GET dynamic template slug returns 200"

json_test "/api/public/factory/templates/$TEMPLATE_SLUG" \
    '. | type' \
    "object" \
    "Template detail returns object"

http_test "GET" "/api/public/factory/templates/nonexistent-template" 404 "GET nonexistent template returns 404"

perf_test "/api/public/factory/templates/$TEMPLATE_SLUG" 500 "Template detail responds in <500ms"

echo ""

# Test Suite 3: Capabilities Endpoint
echo -e "${BLUE}[SUITE 3] Capabilities Endpoint${NC}"
echo "-------------------"

http_test "GET" "/api/public/factory/capabilities" 200 "GET capabilities list returns 200"

json_test "/api/public/factory/capabilities" \
    'has("items") and has("total")' \
    "true" \
    "Response has 'items' and 'total' fields"

json_test "/api/public/factory/capabilities" \
    '.items | type' \
    "array" \
    "Items field is an array"

http_test "GET" "/api/public/factory/capabilities/free" 200 "GET free-tier capabilities returns 200"

json_test "/api/public/factory/capabilities/free" \
    '.items | map(select(.hasFreeQuota != true)) | length' \
    "0" \
    "Free endpoint returns only capabilities with free quota"

http_test "GET" "/api/public/factory/capabilities?bindingType=d1_databases" 200 "Filter by binding type works"

perf_test "/api/public/factory/capabilities" 500 "Capabilities list responds in <500ms"

echo ""

# Test Suite 4: Build Specs Endpoint
echo -e "${BLUE}[SUITE 4] Build Specs Endpoint${NC}"
echo "-------------------"

http_test "GET" "/api/public/factory/build-specs" 200 "GET build specs list returns 200"

json_test "/api/public/factory/build-specs" \
    'has("buildSpecs") and has("pagination")' \
    "true" \
    "Response has 'buildSpecs' and 'pagination' fields"

json_test "/api/public/factory/build-specs" \
    '.buildSpecs | type' \
    "array" \
    "buildSpecs field is an array"

json_test "/api/public/factory/build-specs" \
    '.pagination | has("limit") and has("offset") and has("count")' \
    "true" \
    "Pagination has required fields"

http_test "GET" "/api/public/factory/build-specs?limit=5" 200 "Limit parameter works"

http_test "GET" "/api/public/factory/build-specs?offset=0" 200 "Offset parameter works"

http_test "GET" "/api/public/factory/build-specs?status=draft" 200 "Status filter: draft works"

http_test "GET" "/api/public/factory/build-specs?status=approved" 200 "Status filter: approved works"

http_test "GET" "/api/public/factory/build-specs?status=fallback" 200 "Status filter: fallback works"

http_test "GET" "/api/public/factory/build-specs?tenant_id=test-tenant" 200 "tenant_id parameter works"

perf_test "/api/public/factory/build-specs" 500 "Build specs list responds in <500ms"

echo ""

# Test Suite 5: Build Specs Detail Endpoint
echo -e "${BLUE}[SUITE 5] Build Specs Detail Endpoint${NC}"
echo "-------------------"

http_test "GET" "/api/public/factory/build-specs/nonexistent-run" 404 "GET nonexistent build spec returns 404"

# Test with real runId (data-driven, with optional staging seed)
test_start "Build spec detail with valid runId"
FIRST_RUN_ID=""

if ! BUILD_SPECS_JSON=$(curl -sS "$BASE_URL/api/public/factory/build-specs?limit=20"); then
    test_fail "Failed to fetch build specs list for detail test"
else
    RUN_ID_CANDIDATES=$(echo "$BUILD_SPECS_JSON" | jq -r '.buildSpecs[]?.runId // empty' 2>/dev/null || true)

    for RUN_ID in $RUN_ID_CANDIDATES; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/public/factory/build-specs/$RUN_ID")
        if [ "$HTTP_CODE" -eq 200 ]; then
            FIRST_RUN_ID="$RUN_ID"
            break
        fi
    done

    # Staging-only deterministic seed path for empty build spec environments.
    if [ -z "$FIRST_RUN_ID" ] && [ "$ENVIRONMENT" = "staging" ]; then
        if [ -f "$SCRIPT_DIR/seed-factory-staging-data.sh" ]; then
            if ! bash "$SCRIPT_DIR/seed-factory-staging-data.sh" >/dev/null; then
                test_fail "Seed script failed: $SCRIPT_DIR/seed-factory-staging-data.sh"
            else
                BUILD_SPECS_JSON=$(curl -sS "$BASE_URL/api/public/factory/build-specs?limit=20")
                RUN_ID_CANDIDATES=$(echo "$BUILD_SPECS_JSON" | jq -r '.buildSpecs[]?.runId // empty' 2>/dev/null || true)

                for RUN_ID in $RUN_ID_CANDIDATES; do
                    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/public/factory/build-specs/$RUN_ID")
                    if [ "$HTTP_CODE" -eq 200 ]; then
                        FIRST_RUN_ID="$RUN_ID"
                        break
                    fi
                done
            fi
        else
            test_fail "No build specs found and seed script is missing: $SCRIPT_DIR/seed-factory-staging-data.sh"
        fi
    fi

    if [ -n "$FIRST_RUN_ID" ]; then
        test_pass
        echo -e "      Using runId: ${FIRST_RUN_ID}"
    else
        test_fail "No build specs available to validate detail endpoint (including post-seed)"
    fi
fi

echo ""

# Test Suite 6: Security & CORS
echo -e "${BLUE}[SUITE 6] Security & CORS${NC}"
echo "-------------------"

test_start "CORS headers present on templates endpoint"
CORS_HEADER=$(
    curl -s -D - -o /dev/null \
      -H "Origin: $CORS_TEST_ORIGIN" \
      "$BASE_URL/api/public/factory/templates" \
      | tr -d '\r' \
      | grep -i "^access-control-allow-origin:" || true
)
if [ -n "$CORS_HEADER" ] && echo "$CORS_HEADER" | grep -qi "$CORS_TEST_ORIGIN\|\*"; then
    test_pass
else
    test_fail "CORS allow-origin header missing or invalid for origin $CORS_TEST_ORIGIN"
fi

test_start "No authentication required for public endpoints"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/public/factory/templates")
if [ "$HTTP_CODE" -eq 200 ]; then
    test_pass
else
    test_fail "Public endpoint requires authentication (HTTP $HTTP_CODE)"
fi

test_start "Rate limit headers present"
RATE_LIMIT_HEADERS=$(
    curl -s -D - -o /dev/null "$BASE_URL/api/public/factory/templates" \
      | tr -d '\r' \
      | grep -Ei "^x-ratelimit-(limit|remaining|reset):" || true
)
if echo "$RATE_LIMIT_HEADERS" | grep -qi "^x-ratelimit-limit:" && \
   echo "$RATE_LIMIT_HEADERS" | grep -qi "^x-ratelimit-remaining:"; then
    test_pass
else
    test_fail "Missing X-RateLimit-Limit/X-RateLimit-Remaining headers"
fi

test_start "POST not allowed on templates endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/public/factory/templates")
if [ "$HTTP_CODE" -eq 405 ] || [ "$HTTP_CODE" -eq 404 ]; then
    test_pass
else
    test_fail "Unexpected status for POST: HTTP $HTTP_CODE"
fi

test_start "PUT not allowed on templates endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE_URL/api/public/factory/templates/test")
if [ "$HTTP_CODE" -eq 405 ] || [ "$HTTP_CODE" -eq 404 ]; then
    test_pass
else
    test_fail "Unexpected status for PUT: HTTP $HTTP_CODE"
fi

test_start "DELETE not allowed on templates endpoint"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/public/factory/templates/test")
if [ "$HTTP_CODE" -eq 405 ] || [ "$HTTP_CODE" -eq 404 ]; then
    test_pass
else
    test_fail "Unexpected status for DELETE: HTTP $HTTP_CODE"
fi

echo ""

# Test Suite 7: Error Handling
echo -e "${BLUE}[SUITE 7] Error Handling${NC}"
echo "-------------------"

http_test "GET" "/api/public/factory/invalid-endpoint" 404 "Invalid endpoint returns 404"

test_start "Malformed query parameters handled gracefully"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/public/factory/templates?maxComplexity=invalid")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 400 ]; then
    test_pass
else
    test_fail "Unexpected status: HTTP $HTTP_CODE"
fi

echo ""

# Summary
echo "========================================="
echo -e "${BLUE}Test Summary${NC}"
echo "========================================="
echo "Total tests run: $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "Review failures above and fix before deployment."
    exit 1
fi
