#!/bin/bash
set -euo pipefail

# Factory Feature Production Deployment Script
# Version: 2.5.0
# Purpose: Deploy factory endpoints to production environment with verification
#
# Usage:
#   ./scripts/deploy-factory-production.sh
#
# Prerequisites:
#   - Must be run from project root (cloudflare-foundation-dev/)
#   - Wrangler must be installed and authenticated
#   - All tests must pass before deployment
#   - Staging must be verified and working
#
# This script will:
#   1. Run pre-flight checks (build, tests, wrangler auth)
#   2. Deploy planning-machine service to production
#   3. Deploy gateway service to production
#   4. Deploy UI (Pages) to production
#   5. Run automated smoke tests
#   6. Generate deployment summary
#
# Exit codes:
#   0 - Deployment successful
#   1 - Deployment failed (see deployment-*.log for details)

echo "========================================="
echo "Factory Feature Production Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_GATEWAY_URL="https://gateway.erlvinc.com"
PRODUCTION_DASHBOARD_URL="https://dashboard.erlvinc.com"
DEPLOYMENT_LOG="deployment-production-$(date +%Y%m%d-%H%M%S).log"
SMOKE_FAILURES=0

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Error handler
error_exit() {
    log_error "$1"
    log_error "Deployment failed. Check $DEPLOYMENT_LOG for details."
    exit 1
}

# Production deployment confirmation
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "This will deploy to the PRODUCTION environment."
echo "Please confirm you have:"
echo "  ✓ Tested thoroughly in staging"
echo "  ✓ Reviewed all changes"
echo "  ✓ All 45 smoke tests passed in staging"
echo "  ✓ No uncommitted changes"
echo ""
read -p "Are you sure you want to deploy to PRODUCTION? (type 'yes' to continue): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error_exit "Not in project root directory. Please run from cloudflare-foundation-dev/"
fi

# Check if wrangler is installed (via npx or globally)
if ! command -v wrangler &> /dev/null && ! npx wrangler --version &> /dev/null; then
    error_exit "wrangler CLI not found. Install with: npm install -g wrangler"
fi

# Check if logged in to Cloudflare
if ! npx wrangler whoami &> /dev/null; then
    error_exit "Not logged in to Cloudflare. Run: npx wrangler login"
fi

# Git status check
log_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    log_warn "Warning: You have uncommitted changes"
    git status --short
    echo ""
    read -p "Continue anyway? (type 'yes'): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi

# Run build
log_info "Building all packages..."
pnpm run build || error_exit "Build failed"

# Run tests
log_info "Running gateway tests..."
cd services/gateway
pnpm test || error_exit "Gateway tests failed"
cd ../..

log_info "All pre-flight checks passed ✓"
echo ""

# Final confirmation before deployment
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}FINAL CONFIRMATION${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Deploy to PRODUCTION now? (type 'yes'): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Deployment cancelled at final confirmation.${NC}"
    exit 0
fi
echo ""

# Deploy planning-machine service
log_info "Deploying planning-machine service to production..."
cd services/planning-machine
npx wrangler deploy --env production || error_exit "Planning-machine deployment failed"
cd ../..
log_success "Planning-machine deployed successfully"
echo ""

# Wait for deployment to propagate
log_info "Waiting 10s for deployment to propagate..."
sleep 10

# Deploy gateway service
log_info "Deploying gateway service to production..."
cd services/gateway
npx wrangler deploy --env production || error_exit "Gateway deployment failed"
cd ../..
log_success "Gateway deployed successfully"
echo ""

# Wait for deployment to propagate
log_info "Waiting 10s for deployment to propagate..."
sleep 10

# Deploy UI service
log_info "Deploying UI service to production..."
cd services/ui
npx wrangler pages deploy --branch main --project-name erlvinc-dashboard || error_exit "UI deployment failed"
cd ../..
log_success "UI deployed successfully"
echo ""

# Wait for Pages deployment
log_info "Waiting 15s for Pages deployment to propagate..."
sleep 15

# Smoke tests
log_info "========================================="
log_info "Running smoke tests..."
log_info "========================================="
echo ""

# Test 1: Gateway health check
log_info "Test 1/6: Gateway health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_GATEWAY_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Gateway health check passed"
else
    log_error "  ✗ Gateway health check failed (HTTP $HTTP_CODE)"
    SMOKE_FAILURES=$((SMOKE_FAILURES + 1))
fi

# Test 2: Factory templates list
log_info "Test 2/6: Factory templates endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_GATEWAY_URL/api/public/factory/templates")
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Templates endpoint responding"
else
    log_error "  ✗ Templates endpoint failed (HTTP $HTTP_CODE)"
    SMOKE_FAILURES=$((SMOKE_FAILURES + 1))
fi

# Test 3: Factory capabilities list
log_info "Test 3/6: Factory capabilities endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_GATEWAY_URL/api/public/factory/capabilities")
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Capabilities endpoint responding"
else
    log_error "  ✗ Capabilities endpoint failed (HTTP $HTTP_CODE)"
    SMOKE_FAILURES=$((SMOKE_FAILURES + 1))
fi

# Test 4: Factory build-specs list
log_info "Test 4/6: Factory build-specs endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_GATEWAY_URL/api/public/factory/build-specs")
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Build-specs endpoint responding"
else
    log_error "  ✗ Build-specs endpoint failed (HTTP $HTTP_CODE)"
    SMOKE_FAILURES=$((SMOKE_FAILURES + 1))
fi

# Test 5: 404 handling
log_info "Test 5/6: 404 error handling..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_GATEWAY_URL/api/public/factory/templates/nonexistent-template")
if [ "$HTTP_CODE" -eq 404 ]; then
    log_success "404 handling working correctly"
else
    log_error "  ✗ Expected 404, got HTTP $HTTP_CODE"
    SMOKE_FAILURES=$((SMOKE_FAILURES + 1))
fi

# Test 6: UI factory page
log_info "Test 6/6: Factory UI page accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_DASHBOARD_URL/factory" -L)
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Factory UI page accessible"
else
    log_warn "  ✗ Factory UI page failed (HTTP $HTTP_CODE)"
fi

if [ "$SMOKE_FAILURES" -gt 0 ]; then
    error_exit "$SMOKE_FAILURES smoke checks failed during deployment verification"
fi

# Tag release in git
GIT_SHA=$(git rev-parse --short HEAD)
DEPLOY_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo ""
log_info "Creating deployment tag..."
git tag -a "production-factory-$(date +%Y%m%d-%H%M%S)" -m "Factory production deployment at $DEPLOY_TIME (commit: $GIT_SHA)" || log_warn "Failed to create git tag"

echo ""
log_info "========================================="
log_info "Deployment Summary"
log_info "========================================="
echo ""
log_info "Services deployed to production:"
log_info "  - Planning Machine: foundation-planning-machine-production"
log_info "  - Gateway: foundation-gateway-production"
log_info "  - UI: erlvinc-dashboard (Pages, main branch)"
echo ""
log_info "Endpoints available:"
log_info "  - Gateway: $PRODUCTION_GATEWAY_URL"
log_info "  - Dashboard: $PRODUCTION_DASHBOARD_URL"
echo ""
log_info "Deployed commit: $GIT_SHA"
log_info "Deploy time: $DEPLOY_TIME"
echo ""
log_info "Next steps:"
log_info "  1. Monitor error rates in Cloudflare dashboard"
log_info "  2. Monitor logs: wrangler tail foundation-gateway-production"
log_info "  3. Check Analytics Engine for factory events"
log_info "  4. Run comprehensive smoke tests: ./scripts/smoke-test-factory.sh production"
log_info "  5. Verify critical functionality works in production"
echo ""
log_info "Deployment log saved to: $DEPLOYMENT_LOG"
log_info "Deployment complete! ✓"
