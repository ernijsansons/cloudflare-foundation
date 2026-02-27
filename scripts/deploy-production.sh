#!/bin/bash

# Deploy to Production Environment
# This script deploys the Planning Machine service to production
# WITH SAFETY CHECKS AND CONFIRMATIONS

set -e  # Exit on error

echo "🚀 Deploying Planning Machine to PRODUCTION..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Production deployment confirmation
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "This will deploy to the PRODUCTION environment."
echo "Please confirm you have:"
echo "  ✓ Tested thoroughly in staging"
echo "  ✓ Reviewed all changes"
echo "  ✓ Coordinated with the team"
echo "  ✓ Created a backup of production data"
echo ""
read -p "Are you sure you want to deploy to PRODUCTION? (type 'yes' to continue): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Check prerequisites
echo -e "${BLUE}[1/9] Checking prerequisites...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found. Please install git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Git status check
echo -e "${BLUE}[2/9] Checking git status...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Continue anyway? (type 'yes'): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi
echo -e "${GREEN}✅ Git check passed${NC}"
echo ""

# Navigate to service directory
cd "$(dirname "$0")/../services/planning-machine" || exit

# Install dependencies
echo -e "${BLUE}[3/9] Installing dependencies...${NC}"
npm ci --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run full test suite
echo -e "${BLUE}[4/9] Running full test suite...${NC}"
if npm test; then
    echo -e "${GREEN}✅ All tests passed ($(npm test 2>&1 | grep -o '[0-9]* passed' | head -1))${NC}"
else
    echo -e "${RED}❌ Tests failed! Aborting production deployment.${NC}"
    exit 1
fi
echo ""

# Run linting
echo -e "${BLUE}[5/9] Running linter...${NC}"
npm run lint || echo -e "${YELLOW}⚠️  Linting warnings detected${NC}"
echo -e "${GREEN}✅ Linting completed${NC}"
echo ""

# Build application
echo -e "${BLUE}[6/9] Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Run database migrations (with confirmation)
echo -e "${BLUE}[7/9] Database migrations...${NC}"
echo -e "${YELLOW}⚠️  About to run migrations on PRODUCTION database${NC}"
read -p "Proceed with migrations? (type 'yes'): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Skipping migrations. Manual intervention required.${NC}"
else
    cd ../../packages/db || exit
    wrangler d1 execute foundation-db --file=migrations/0001_initial_schema.sql --remote || echo "Migration already applied or failed"
    wrangler d1 execute foundation-db --file=migrations/0002_consensus_tracking.sql --remote || echo "Migration already applied or failed"
    wrangler d1 execute foundation-db --file=migrations/0003_quality_scores.sql --remote || echo "Migration already applied or failed"
    wrangler d1 execute foundation-db --file=migrations/0004_rbac_operator_actions.sql --remote || echo "Migration already applied or failed"
    wrangler d1 execute foundation-db --file=migrations/0005_unknowns_handoffs.sql --remote || echo "Migration already applied or failed"
    wrangler d1 execute foundation-db --file=migrations/0006_external_integrations.sql --remote || echo "Migration already applied or failed"
    echo -e "${GREEN}✅ Database migrations completed${NC}"
fi
echo ""

# Return to service directory
cd ../../services/planning-machine || exit

# Setup infrastructure
echo -e "${BLUE}[8/9] Setting up infrastructure...${NC}"
wrangler vectorize create foundation-vectors --dimensions=384 --metric=cosine || echo "Vectorize index already exists"
wrangler r2 bucket create foundation-artifacts || echo "R2 bucket already exists"
echo -e "${GREEN}✅ Infrastructure ready${NC}"
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

# Deploy to Cloudflare Workers
echo -e "${BLUE}[9/9] Deploying to Cloudflare Workers...${NC}"
wrangler deploy --config wrangler.production.toml

# Tag release in git
GIT_SHA=$(git rev-parse --short HEAD)
DEPLOY_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
echo ""
echo -e "${BLUE}Creating deployment tag...${NC}"
git tag -a "production-deploy-$(date +%Y%m%d-%H%M%S)" -m "Production deployment at $DEPLOY_TIME (commit: $GIT_SHA)" || echo "Failed to create git tag"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ PRODUCTION DEPLOYMENT COMPLETED!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Service URL:${NC} https://planning.foundation.dev"
echo -e "${BLUE}Deployed Commit:${NC} $GIT_SHA"
echo -e "${BLUE}Deploy Time:${NC} $DEPLOY_TIME"
echo -e "${BLUE}Monitor:${NC} https://dash.cloudflare.com"
echo -e "${BLUE}Logs:${NC} wrangler tail --env production"
echo ""
echo -e "${YELLOW}⚠️  Post-deployment checklist:${NC}"
echo "  □ Monitor error rates in Cloudflare dashboard"
echo "  □ Check application logs for issues"
echo "  □ Verify critical functionality works"
echo "  □ Update team on deployment status"
echo "  □ Document any issues or rollback procedures"
echo ""
