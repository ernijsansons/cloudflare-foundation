#!/bin/bash

################################################################################
# Bootstrap Script - ERLV / OpenClaw Research OS Development Environment
#
# Sets up complete development environment with:
# - Dependency installation
# - Database migrations
# - Environment configuration
# - Validation checks
# - Test data (optional)
#
# Usage:
#   ./scripts/bootstrap.sh [--with-test-data]
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
WITH_TEST_DATA=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-test-data)
      WITH_TEST_DATA=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

################################################################################
# Helper Functions
################################################################################

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is not installed"
    return 1
  fi
  log_success "$1 is installed"
  return 0
}

################################################################################
# PHASE 1: Prerequisites Check
################################################################################

log_section "Phase 1: Checking Prerequisites"

# Check Node.js
log_info "Checking Node.js..."
if check_command node; then
  NODE_VERSION=$(node --version)
  log_info "Node.js version: $NODE_VERSION"

  # Check version >= 20
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
  if [ "$MAJOR_VERSION" -lt 20 ]; then
    log_error "Node.js version 20 or higher required (found: $NODE_VERSION)"
    exit 1
  fi
else
  log_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org"
  exit 1
fi

# Check pnpm
log_info "Checking pnpm..."
if ! check_command pnpm; then
  log_warning "pnpm not found. Installing pnpm..."
  npm install -g pnpm
  log_success "pnpm installed"
fi
PNPM_VERSION=$(pnpm --version)
log_info "pnpm version: $PNPM_VERSION"

# Check Wrangler
log_info "Checking Wrangler (Cloudflare CLI)..."
if ! check_command wrangler; then
  log_warning "Wrangler not found. Installing wrangler..."
  pnpm install -g wrangler
  log_success "Wrangler installed"
fi
WRANGLER_VERSION=$(wrangler --version)
log_info "Wrangler version: $WRANGLER_VERSION"

# Check Git
log_info "Checking Git..."
if check_command git; then
  GIT_VERSION=$(git --version)
  log_info "Git version: $GIT_VERSION"
fi

################################################################################
# PHASE 2: Environment Configuration
################################################################################

log_section "Phase 2: Environment Configuration"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  log_info "Creating .env file..."
  cat > .env << EOF
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Orchestration
ORCHESTRATION_ENABLED=true

# Environment
NODE_ENV=development

# Optional: Slack notifications
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
EOF
  log_success ".env file created"
  log_warning "⚠️  Please update .env with your Cloudflare credentials"
  log_warning "    1. Visit https://dash.cloudflare.com/profile/api-tokens"
  log_warning "    2. Create an API token with Workers permissions"
  log_warning "    3. Update CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env"
else
  log_success ".env file already exists"
fi

################################################################################
# PHASE 3: Dependencies Installation
################################################################################

log_section "Phase 3: Installing Dependencies"

log_info "Installing project dependencies with pnpm..."
pnpm install --frozen-lockfile

log_success "Dependencies installed"

################################################################################
# PHASE 4: Database Setup
################################################################################

log_section "Phase 4: Database Setup & Migrations"

log_info "Creating D1 database (if not exists)..."

# Check if wrangler is authenticated
if ! wrangler whoami &> /dev/null; then
  log_warning "Wrangler not authenticated. Please run: wrangler login"
  log_info "Skipping D1 setup. Run './scripts/setup-d1.sh' manually after authentication."
else
  # Create D1 database
  DB_NAME="foundation-primary"

  log_info "Checking for existing D1 database: $DB_NAME"

  # Try to create database (will fail if exists, which is fine)
  wrangler d1 create $DB_NAME 2>/dev/null || log_info "Database already exists"

  log_info "Running database migrations..."

  # Apply migrations
  cd services/gateway
  wrangler d1 migrations apply $DB_NAME --local
  log_success "Local database migrations applied"

  # Ask if user wants to apply to remote
  read -p "Apply migrations to remote database? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler d1 migrations apply $DB_NAME --remote
    log_success "Remote database migrations applied"
  else
    log_info "Skipping remote migration. Run 'pnpm run db:migrate' to apply later."
  fi

  cd ../..
fi

################################################################################
# PHASE 5: Build Shared Packages
################################################################################

log_section "Phase 5: Building Shared Packages"

log_info "Building @foundation/shared..."
pnpm --filter @foundation/shared build
log_success "@foundation/shared built"

log_info "Building @foundation/db..."
pnpm --filter @foundation/db build || log_warning "@foundation/db build failed or no build script"

log_success "Shared packages built"

################################################################################
# PHASE 6: Validation & Tests
################################################################################

log_section "Phase 6: Running Validation Tests"

log_info "Running type checking..."
pnpm run typecheck:workers || log_warning "Type checking had errors (non-blocking)"

log_info "Running schema validator tests (CRITICAL)..."
pnpm --filter foundation-planning-machine run test src/lib/__tests__/schema-validator.test.ts

log_success "Schema validation tests passed!"

################################################################################
# PHASE 7: Test Data (Optional)
################################################################################

if [ "$WITH_TEST_DATA" = true ]; then
  log_section "Phase 7: Generating Test Data"

  log_info "Creating test planning run..."

  # Create test data SQL
  cat > /tmp/test-data.sql << 'EOF'
INSERT INTO planning_runs (id, tenant_id, idea, refined_idea, status, created_by, created_at, updated_at)
VALUES (
  'run-test-001',
  'tenant-default',
  'SaaS platform for laundromat management',
  'B2B SaaS for multi-location laundromat management with AI-powered scheduling and maintenance tracking',
  'running',
  'bootstrap-script',
  unixepoch(),
  unixepoch()
);

INSERT INTO planning_artifacts (id, run_id, phase, version, content, review_verdict, created_at)
VALUES (
  'artifact-test-001',
  'run-test-001',
  'intake',
  1,
  '{"refinedIdea":"B2B SaaS for laundromat management","A0_intake":{"codename":"PROJECT_LAUNDRY","thesis":"Laundromats lack modern management tools","targetICP":"Multi-location laundromat owners","coreDirective":"Build AI scheduling platform"},"A1_unknowns":[{"category":"Market","question":"What is total addressable market?"}]}',
  'ACCEPTED',
  unixepoch()
);
EOF

  log_info "Inserting test data into local database..."
  cd services/gateway
  wrangler d1 execute foundation-primary --local --file=/tmp/test-data.sql
  cd ../..

  log_success "Test data created!"
  log_info "Test run ID: run-test-001"

  rm /tmp/test-data.sql
else
  log_info "Skipping test data generation (use --with-test-data to enable)"
fi

################################################################################
# PHASE 8: Summary & Next Steps
################################################################################

log_section "Bootstrap Complete!"

echo ""
log_success "Development environment is ready!"
echo ""

log_info "📋 Next Steps:"
echo ""
echo "  1. Update .env with your Cloudflare credentials:"
echo "     - CLOUDFLARE_ACCOUNT_ID"
echo "     - CLOUDFLARE_API_TOKEN"
echo ""
echo "  2. Start the development server:"
echo "     ${GREEN}pnpm run dev${NC}"
echo ""
echo "  3. View the application:"
echo "     🌐 UI: http://localhost:8788"
echo "     🔌 API: http://localhost:8788/api"
echo ""
echo "  4. Run tests:"
echo "     ${GREEN}pnpm --filter foundation-planning-machine run test${NC}"
echo ""
echo "  5. View metrics dashboard:"
echo "     http://localhost:8788/metrics/run-test-001 (if test data created)"
echo ""

log_info "📚 Documentation:"
echo "  - Ontology: docs/ONTOLOGY.md"
echo "  - API: docs/API.md"
echo "  - CI/CD: docs/CI_CD.md"
echo "  - Palantir AIP Gap Analysis: docs/PALANTIR_AIP_INSPIRED_GAP_ANALYSIS.md"
echo "  - Implementation Roadmap: docs/IMPLEMENTATION_ROADMAP.md"
echo ""

log_info "🔧 Useful Commands:"
echo "  - ${GREEN}pnpm run build${NC}           - Build all services"
echo "  - ${GREEN}pnpm run lint${NC}            - Run ESLint"
echo "  - ${GREEN}pnpm run format${NC}          - Format code with Prettier"
echo "  - ${GREEN}pnpm run typecheck:workers${NC} - Type check services"
echo "  - ${GREEN}pnpm run db:migrate${NC}      - Apply database migrations"
echo ""

log_success "Happy coding! 🚀"
echo ""

################################################################################
# Exit
################################################################################

exit 0
