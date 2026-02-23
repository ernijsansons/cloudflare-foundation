#!/bin/bash
set -euo pipefail

# =============================================================================
# Cloudflare Foundation v2.5 — Full Deployment
# =============================================================================
# Deploys all services with proper error handling and validation
#
# Usage:
#   ./scripts/deploy-all.sh [environment]
#
# Arguments:
#   environment  - Target environment: "staging" | "production" (default: production)
#
# Examples:
#   ./scripts/deploy-all.sh staging      # Deploy to staging
#   ./scripts/deploy-all.sh production   # Deploy to production
#   ./scripts/deploy-all.sh              # Deploy to production (default)
# =============================================================================

# Parse environment argument
ENV=${1:-production}

# Validate environment
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo "ERROR: Invalid environment '$ENV'. Must be 'staging' or 'production'."
    exit 1
fi

echo "=== Cloudflare Foundation v2.5 — Full Deployment ==="
echo "Environment: $ENV"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track deployment status
FAILED_SERVICES=""
DEPLOYED_SERVICES=""

# Function to deploy a service
deploy_service() {
    local service=$1
    local dir=$2
    echo -e "${YELLOW}Deploying $service to $ENV...${NC}"

    if [ ! -d "$dir" ]; then
        echo -e "${RED}ERROR: Directory $dir not found${NC}"
        FAILED_SERVICES="$FAILED_SERVICES $service"
        return 1
    fi

    cd "$dir"

    # Deploy with environment flag
    if ! npx wrangler deploy --env "$ENV"; then
        echo -e "${RED}ERROR: Failed to deploy $service${NC}"
        FAILED_SERVICES="$FAILED_SERVICES $service"
        cd - > /dev/null
        return 1
    fi

    echo -e "${GREEN}$service deployed successfully to $ENV${NC}"
    DEPLOYED_SERVICES="$DEPLOYED_SERVICES $service"
    cd - > /dev/null
    return 0
}

# Function to deploy UI (requires build step)
deploy_ui() {
    echo -e "${YELLOW}Deploying UI to $ENV...${NC}"

    if [ ! -d "services/ui" ]; then
        echo -e "${RED}ERROR: UI directory not found${NC}"
        FAILED_SERVICES="$FAILED_SERVICES ui"
        return 1
    fi

    cd services/ui

    echo "  Building UI..."
    if ! pnpm run build; then
        echo -e "${RED}ERROR: UI build failed${NC}"
        FAILED_SERVICES="$FAILED_SERVICES ui"
        cd - > /dev/null
        return 1
    fi

    echo "  Deploying UI to $ENV..."
    if ! npx wrangler deploy --env "$ENV"; then
        echo -e "${RED}ERROR: Failed to deploy UI${NC}"
        FAILED_SERVICES="$FAILED_SERVICES ui"
        cd - > /dev/null
        return 1
    fi

    echo -e "${GREEN}UI deployed successfully to $ENV${NC}"
    DEPLOYED_SERVICES="$DEPLOYED_SERVICES ui"
    cd - > /dev/null
    return 0
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

echo "Running pre-flight checks..."

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}ERROR: wrangler CLI not found. Install with: npm install -g wrangler${NC}"
    exit 1
fi

# Check if validation script exists and run it
if [ -f "scripts/validate-config.sh" ]; then
    echo "Validating configuration..."
    if ! bash scripts/validate-config.sh; then
        echo -e "${RED}ERROR: Configuration validation failed${NC}"
        echo "Fix the issues above before deploying."
        exit 1
    fi
else
    echo -e "${YELLOW}WARNING: No validation script found, skipping validation${NC}"
fi

echo ""

# =============================================================================
# Install Dependencies
# =============================================================================

echo "Installing dependencies..."
if ! pnpm install; then
    echo -e "${RED}ERROR: Failed to install dependencies${NC}"
    exit 1
fi

# =============================================================================
# Build Shared Packages
# =============================================================================

echo ""
echo "Building shared packages..."
pnpm --filter @foundation/shared build 2>/dev/null || echo "  (No @foundation/shared package)"
pnpm --filter @foundation/db build 2>/dev/null || echo "  (No @foundation/db package)"

# =============================================================================
# Run Extension Codegen
# =============================================================================

if [ -f "scripts/codegen-extensions.ts" ]; then
    echo ""
    echo "Running extension codegen..."
    npx tsx scripts/codegen-extensions.ts 2>/dev/null || echo "  (Extension codegen skipped)"
fi

# =============================================================================
# Apply Database Migrations
# =============================================================================

echo ""
echo "Applying database migrations..."

if [ -d "services/gateway/migrations" ]; then
    echo "  -> Gateway migrations..."
    cd services/gateway
    npx wrangler d1 migrations apply foundation-primary --remote 2>/dev/null || echo "    (No pending migrations or database not configured)"
    cd - > /dev/null
fi

if [ -d "services/planning-machine/migrations" ]; then
    echo "  -> Planning machine migrations..."
    cd services/planning-machine
    npx wrangler d1 migrations apply planning-primary --remote 2>/dev/null || echo "    (No pending migrations or database not configured)"
    cd - > /dev/null
fi

# =============================================================================
# Deploy Services (in dependency order)
# =============================================================================

echo ""
echo "Deploying services..."
echo ""

# 1. Queue consumers first (other services send to queues)
deploy_service "queues" "services/queues"

# 2. Workflows (gateway dispatches to workflows)
deploy_service "workflows" "services/workflows"

# 3. Agents (gateway routes to agents)
deploy_service "agents" "services/agents"

# 4. Planning machine (gateway routes to planning)
if [ -d "services/planning-machine" ]; then
    deploy_service "planning-machine" "services/planning-machine"
fi

# 5. Gateway (main API)
deploy_service "gateway" "services/gateway"

# 6. Cron (scheduled tasks)
if [ -d "services/cron" ]; then
    deploy_service "cron" "services/cron"
fi

# 7. UI (depends on gateway)
deploy_ui

# =============================================================================
# Summary
# =============================================================================

echo ""
echo "=== Deployment Summary ==="
echo ""

if [ -n "$DEPLOYED_SERVICES" ]; then
    echo -e "${GREEN}Successfully deployed:${NC}$DEPLOYED_SERVICES"
fi

if [ -n "$FAILED_SERVICES" ]; then
    echo -e "${RED}Failed to deploy:${NC}$FAILED_SERVICES"
    echo ""
    echo "Check the errors above and retry deployment for failed services."
    exit 1
fi

echo ""
echo -e "${GREEN}All services deployed successfully!${NC}"
echo ""
echo "Service URLs:"
echo "  UI:       https://foundation-ui.<account>.workers.dev"
echo "  Gateway:  https://foundation-gateway.<account>.workers.dev"
echo "  Agents:   https://foundation-agents.<account>.workers.dev"
echo ""
echo "To verify deployment, run health checks:"
echo "  curl https://foundation-gateway.<account>.workers.dev/health"
echo ""
