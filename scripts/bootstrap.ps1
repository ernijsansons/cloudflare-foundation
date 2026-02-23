<#
.SYNOPSIS
    Bootstrap Script - ERLV / OpenClaw Research OS Development Environment (Windows)

.DESCRIPTION
    Sets up complete development environment with:
    - Dependency installation
    - Database migrations
    - Environment configuration
    - Validation checks
    - Test data (optional)

.PARAMETER WithTestData
    Include test data generation

.EXAMPLE
    .\scripts\bootstrap.ps1
    .\scripts\bootstrap.ps1 -WithTestData
#>

param(
    [switch]$WithTestData
)

################################################################################
# Helper Functions
################################################################################

function Write-InfoLog {
    param([string]$Message)
    Write-Host "ℹ " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-SuccessLog {
    param([string]$Message)
    Write-Host "✓ " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-WarningLog {
    param([string]$Message)
    Write-Host "⚠ " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "✗ " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Write-SectionLog {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

################################################################################
# PHASE 1: Prerequisites Check
################################################################################

Write-SectionLog "Phase 1: Checking Prerequisites"

# Check Node.js
Write-InfoLog "Checking Node.js..."
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-SuccessLog "Node.js is installed"
    Write-InfoLog "Node.js version: $nodeVersion"

    # Extract major version
    $majorVersion = [int]($nodeVersion -replace 'v','').Split('.')[0]
    if ($majorVersion -lt 20) {
        Write-ErrorLog "Node.js version 20 or higher required (found: $nodeVersion)"
        exit 1
    }
} else {
    Write-ErrorLog "Node.js not found. Please install Node.js 20+ from https://nodejs.org"
    exit 1
}

# Check pnpm
Write-InfoLog "Checking pnpm..."
if (-not (Test-CommandExists "pnpm")) {
    Write-WarningLog "pnpm not found. Installing pnpm..."
    npm install -g pnpm
    Write-SuccessLog "pnpm installed"
}
$pnpmVersion = pnpm --version
Write-InfoLog "pnpm version: $pnpmVersion"

# Check Wrangler
Write-InfoLog "Checking Wrangler (Cloudflare CLI)..."
if (-not (Test-CommandExists "wrangler")) {
    Write-WarningLog "Wrangler not found. Installing wrangler..."
    pnpm install -g wrangler
    Write-SuccessLog "Wrangler installed"
}
$wranglerVersion = wrangler --version
Write-InfoLog "Wrangler version: $wranglerVersion"

# Check Git
Write-InfoLog "Checking Git..."
if (Test-CommandExists "git") {
    $gitVersion = git --version
    Write-InfoLog "Git version: $gitVersion"
}

################################################################################
# PHASE 2: Environment Configuration
################################################################################

Write-SectionLog "Phase 2: Environment Configuration"

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-InfoLog "Creating .env file..."
    @"
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here

# Orchestration
ORCHESTRATION_ENABLED=true

# Environment
NODE_ENV=development

# Optional: Slack notifications
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-SuccessLog ".env file created"
    Write-WarningLog "⚠️  Please update .env with your Cloudflare credentials"
    Write-WarningLog "    1. Visit https://dash.cloudflare.com/profile/api-tokens"
    Write-WarningLog "    2. Create an API token with Workers permissions"
    Write-WarningLog "    3. Update CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env"
} else {
    Write-SuccessLog ".env file already exists"
}

################################################################################
# PHASE 3: Dependencies Installation
################################################################################

Write-SectionLog "Phase 3: Installing Dependencies"

Write-InfoLog "Installing project dependencies with pnpm..."
pnpm install --frozen-lockfile

if ($LASTEXITCODE -ne 0) {
    Write-ErrorLog "Failed to install dependencies"
    exit 1
}

Write-SuccessLog "Dependencies installed"

################################################################################
# PHASE 4: Database Setup
################################################################################

Write-SectionLog "Phase 4: Database Setup & Migrations"

Write-InfoLog "Creating D1 database (if not exists)..."

# Check if wrangler is authenticated
$whoamiResult = wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-WarningLog "Wrangler not authenticated. Please run: wrangler login"
    Write-InfoLog "Skipping D1 setup. Run '.\scripts\setup-d1.ps1' manually after authentication."
} else {
    $dbName = "foundation-primary"

    Write-InfoLog "Checking for existing D1 database: $dbName"

    # Try to create database (will fail if exists, which is fine)
    wrangler d1 create $dbName 2>&1 | Out-Null

    Write-InfoLog "Running database migrations..."

    # Apply migrations (local)
    Push-Location services\gateway
    wrangler d1 migrations apply $dbName --local
    Write-SuccessLog "Local database migrations applied"

    # Ask if user wants to apply to remote
    $response = Read-Host "Apply migrations to remote database? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        wrangler d1 migrations apply $dbName --remote
        Write-SuccessLog "Remote database migrations applied"
    } else {
        Write-InfoLog "Skipping remote migration. Run 'pnpm run db:migrate' to apply later."
    }

    Pop-Location
}

################################################################################
# PHASE 5: Build Shared Packages
################################################################################

Write-SectionLog "Phase 5: Building Shared Packages"

Write-InfoLog "Building @foundation/shared..."
pnpm --filter @foundation/shared build
Write-SuccessLog "@foundation/shared built"

Write-InfoLog "Building @foundation/db..."
pnpm --filter @foundation/db build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-SuccessLog "@foundation/db built"
} else {
    Write-WarningLog "@foundation/db build failed or no build script"
}

Write-SuccessLog "Shared packages built"

################################################################################
# PHASE 6: Validation & Tests
################################################################################

Write-SectionLog "Phase 6: Running Validation Tests"

Write-InfoLog "Running type checking..."
pnpm run typecheck:workers 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-WarningLog "Type checking had errors (non-blocking)"
}

Write-InfoLog "Running schema validator tests (CRITICAL)..."
pnpm --filter foundation-planning-machine run test src/lib/__tests__/schema-validator.test.ts

if ($LASTEXITCODE -ne 0) {
    Write-ErrorLog "Schema validation tests failed!"
    exit 1
}

Write-SuccessLog "Schema validation tests passed!"

################################################################################
# PHASE 7: Test Data (Optional)
################################################################################

if ($WithTestData) {
    Write-SectionLog "Phase 7: Generating Test Data"

    Write-InfoLog "Creating test planning run..."

    # Create test data SQL
    $testDataSql = @"
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
"@

    $testDataSql | Out-File -FilePath "$env:TEMP\test-data.sql" -Encoding utf8

    Write-InfoLog "Inserting test data into local database..."
    Push-Location services\gateway
    wrangler d1 execute foundation-primary --local --file="$env:TEMP\test-data.sql"
    Pop-Location

    Write-SuccessLog "Test data created!"
    Write-InfoLog "Test run ID: run-test-001"

    Remove-Item "$env:TEMP\test-data.sql"
} else {
    Write-InfoLog "Skipping test data generation (use -WithTestData to enable)"
}

################################################################################
# PHASE 8: Summary & Next Steps
################################################################################

Write-SectionLog "Bootstrap Complete!"

Write-Host ""
Write-SuccessLog "Development environment is ready!"
Write-Host ""

Write-InfoLog "📋 Next Steps:"
Write-Host ""
Write-Host "  1. Update .env with your Cloudflare credentials:" -ForegroundColor Cyan
Write-Host "     - CLOUDFLARE_ACCOUNT_ID"
Write-Host "     - CLOUDFLARE_API_TOKEN"
Write-Host ""
Write-Host "  2. Start the development server:" -ForegroundColor Cyan
Write-Host "     pnpm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "  3. View the application:" -ForegroundColor Cyan
Write-Host "     🌐 UI: http://localhost:8788"
Write-Host "     🔌 API: http://localhost:8788/api"
Write-Host ""
Write-Host "  4. Run tests:" -ForegroundColor Cyan
Write-Host "     pnpm --filter foundation-planning-machine run test" -ForegroundColor Green
Write-Host ""
Write-Host "  5. View metrics dashboard:" -ForegroundColor Cyan
Write-Host "     http://localhost:8788/metrics/run-test-001 (if test data created)"
Write-Host ""

Write-InfoLog "📚 Documentation:"
Write-Host "  - Ontology: docs\ONTOLOGY.md"
Write-Host "  - API: docs\API.md"
Write-Host "  - CI/CD: docs\CI_CD.md"
Write-Host "  - Palantir AIP Gap Analysis: docs\PALANTIR_AIP_INSPIRED_GAP_ANALYSIS.md"
Write-Host "  - Implementation Roadmap: docs\IMPLEMENTATION_ROADMAP.md"
Write-Host ""

Write-InfoLog "🔧 Useful Commands:"
Write-Host "  - pnpm run build           - Build all services" -ForegroundColor Green
Write-Host "  - pnpm run lint            - Run ESLint" -ForegroundColor Green
Write-Host "  - pnpm run format          - Format code with Prettier" -ForegroundColor Green
Write-Host "  - pnpm run typecheck:workers - Type check services" -ForegroundColor Green
Write-Host "  - pnpm run db:migrate      - Apply database migrations" -ForegroundColor Green
Write-Host ""

Write-SuccessLog "Happy coding! 🚀"
Write-Host ""

exit 0
