#!/bin/bash

# Deploy to Staging Environment
# This script deploys the Planning Machine service to the staging environment

set -e  # Exit on error

echo "🚀 Deploying Planning Machine to STAGING..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}[1/8] Checking prerequisites...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Navigate to service directory
cd "$(dirname "$0")/../services/planning-machine" || exit

# Install dependencies
echo -e "${BLUE}[2/8] Installing dependencies...${NC}"
npm ci --silent
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run tests
echo -e "${BLUE}[3/8] Running tests...${NC}"
if npm test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed! Aborting deployment.${NC}"
    exit 1
fi
echo ""

# Build application
echo -e "${BLUE}[4/8] Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Run database migrations
echo -e "${BLUE}[5/8] Running database migrations...${NC}"
cd ../../packages/db || exit
wrangler d1 execute foundation-db-staging --file=migrations/0001_initial_schema.sql --remote || echo "Migration already applied or failed"
wrangler d1 execute foundation-db-staging --file=migrations/0002_consensus_tracking.sql --remote || echo "Migration already applied or failed"
wrangler d1 execute foundation-db-staging --file=migrations/0003_quality_scores.sql --remote || echo "Migration already applied or failed"
wrangler d1 execute foundation-db-staging --file=migrations/0004_rbac_operator_actions.sql --remote || echo "Migration already applied or failed"
wrangler d1 execute foundation-db-staging --file=migrations/0005_unknowns_handoffs.sql --remote || echo "Migration already applied or failed"
wrangler d1 execute foundation-db-staging --file=migrations/0006_external_integrations.sql --remote || echo "Migration already applied or failed"
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Return to service directory
cd ../../services/planning-machine || exit

# Create Vectorize index if it doesn't exist
echo -e "${BLUE}[6/8] Setting up Vectorize index...${NC}"
wrangler vectorize create foundation-vectors-staging --dimensions=384 --metric=cosine || echo "Vectorize index already exists"
echo -e "${GREEN}✅ Vectorize index ready${NC}"
echo ""

# Create R2 bucket if it doesn't exist
echo -e "${BLUE}[7/8] Setting up R2 storage...${NC}"
wrangler r2 bucket create foundation-artifacts-staging || echo "R2 bucket already exists"
echo -e "${GREEN}✅ R2 storage ready${NC}"
echo ""

# Deploy to Cloudflare Workers
echo -e "${BLUE}[8/8] Deploying to Cloudflare Workers...${NC}"
wrangler deploy --config wrangler.staging.toml

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment to STAGING completed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Service URL:${NC} https://planning-staging.foundation.dev"
echo -e "${BLUE}Logs:${NC} wrangler tail --env staging"
echo -e "${BLUE}Monitor:${NC} https://dash.cloudflare.com"
echo ""
echo -e "${YELLOW}⚠️  Remember to set required secrets:${NC}"
echo "  wrangler secret put DATABASE_ENCRYPTION_KEY --env staging"
echo "  wrangler secret put JWT_SECRET --env staging"
echo "  wrangler secret put WEBHOOK_SIGNING_SECRET --env staging"
echo ""
