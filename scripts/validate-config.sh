#!/bin/bash
set -euo pipefail

# =============================================================================
# Cloudflare Foundation - Configuration Validation
# =============================================================================
# Checks all wrangler.jsonc files for placeholder values and validates
# that required resources are configured before deployment.
# =============================================================================

echo "=== Cloudflare Foundation — Configuration Validation ==="
echo ""

ERRORS=0
WARNINGS=0

# Function to check for placeholders in a file
check_placeholders() {
    local file=$1
    local service=$2

    if [ ! -f "$file" ]; then
        echo "  [SKIP] $service: File not found ($file)"
        return
    fi

    # Check for common placeholder patterns
    if grep -q "KV_ID_HERE\|D1_ID_HERE\|R2_ID_HERE\|QUEUE_ID_HERE\|YOUR_.*_HERE\|PLACEHOLDER" "$file" 2>/dev/null; then
        echo "  [ERROR] $service: Contains placeholder values"
        grep -n "KV_ID_HERE\|D1_ID_HERE\|R2_ID_HERE\|QUEUE_ID_HERE\|YOUR_.*_HERE\|PLACEHOLDER" "$file" || true
        ((ERRORS++))
    else
        echo "  [OK] $service: No placeholders found"
    fi
}

echo "Checking wrangler.jsonc files for placeholders..."
echo ""

check_placeholders "services/gateway/wrangler.jsonc" "Gateway"
check_placeholders "services/agents/wrangler.jsonc" "Agents"
check_placeholders "services/workflows/wrangler.jsonc" "Workflows"
check_placeholders "services/queues/wrangler.jsonc" "Queues"
check_placeholders "services/cron/wrangler.jsonc" "Cron"
check_placeholders "services/ui/wrangler.jsonc" "UI"
check_placeholders "services/planning-machine/wrangler.jsonc" "Planning Machine"

echo ""
echo "Checking for required files..."

# Check for required files
for file in \
    "services/gateway/src/index.ts" \
    "services/agents/src/index.ts" \
    "services/queues/src/index.ts" \
    "services/workflows/src/index.ts" \
    "services/ui/src/app.html"
do
    if [ -f "$file" ]; then
        echo "  [OK] $file exists"
    else
        echo "  [WARN] $file not found"
        ((WARNINGS++))
    fi
done

echo ""
echo "Checking for database migrations..."

if [ -d "services/gateway/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 services/gateway/migrations/*.sql 2>/dev/null | wc -l)
    echo "  [OK] Gateway migrations: $MIGRATION_COUNT files"
else
    echo "  [WARN] No gateway migrations directory"
    ((WARNINGS++))
fi

if [ -d "services/planning-machine/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 services/planning-machine/migrations/*.sql 2>/dev/null | wc -l)
    echo "  [OK] Planning migrations: $MIGRATION_COUNT files"
else
    echo "  [WARN] No planning-machine migrations directory"
    ((WARNINGS++))
fi

echo ""
echo "=== Validation Summary ==="
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo "FAILED: Fix the errors above before deploying."
    echo ""
    echo "To fix placeholder values:"
    echo "1. Run ./scripts/setup-all.sh to create resources"
    echo "2. Copy the IDs from .env.local to your wrangler.jsonc files"
    exit 1
else
    echo "PASSED: Configuration looks good!"
    if [ $WARNINGS -gt 0 ]; then
        echo "(Some warnings may need attention)"
    fi
    exit 0
fi
