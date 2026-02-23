# CI/CD Pipeline Documentation

## Overview

The ERLV/OpenClaw Research OS uses GitHub Actions for continuous integration and deployment. This document describes the CI/CD architecture, workflows, and setup instructions.

## Architecture

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────┐
    │  PHASE 1: Setup & Install Dependencies              │
    │  - Checkout code                                     │
    │  - Setup Node.js 20                                  │
    │  - Install pnpm                                      │
    │  - Install dependencies with frozen lockfile         │
    │  - Cache node_modules for subsequent jobs            │
    └─────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌──────────────────────────────────────────────────────────┐
    │  PHASE 2: Code Quality Checks (Parallel)                 │
    ├─────────────────────┬──────────────────┬─────────────────┤
    │  Type Checking      │  Linting         │  Format Check   │
    │  - Shared packages  │  - ESLint        │  - Prettier     │
    │  - DB package       │  - All services  │  - All files    │
    │  - Workers          │                  │                 │
    └─────────────────────┴──────────────────┴─────────────────┘
                              │
                              ▼
    ┌──────────────────────────────────────────────────────────┐
    │  PHASE 3: Testing (Parallel)                             │
    ├────────────────────────┬─────────────────────────────────┤
    │  Unit & Integration    │  Schema Validation (CRITICAL)   │
    │  - Planning Machine    │  - All phase schemas            │
    │  - Gateway             │  - Validation logic             │
    │  - UI                  │  - Ontology compliance          │
    └────────────────────────┴─────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────┐
    │  PHASE 4: Build                                      │
    │  - Build shared packages (@foundation/shared, db)    │
    │  - Build all services                                │
    │  - Upload artifacts                                  │
    └─────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌──────────────────────────────────────────────────────────┐
    │  PHASE 5: Deployment (Branch-dependent)                  │
    ├──────────────────────────┬───────────────────────────────┤
    │  Staging (develop)       │  Production (main)            │
    │  - Deploy to staging     │  - Deploy to production       │
    │  - No approval required  │  - Health checks              │
    │                          │  - Rollback on failure        │
    └──────────────────────────┴───────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────┐
    │  PHASE 6: Post-Deployment                            │
    │  - Health check API endpoints                        │
    │  - Verify UI availability                            │
    │  - Send notifications (Slack, etc.)                  │
    └─────────────────────────────────────────────────────┘
```

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Jobs:**
1. **setup** - Install dependencies and cache
2. **typecheck** - TypeScript type checking across all packages
3. **lint** - ESLint and Prettier validation
4. **test** - Run all unit and integration tests
5. **schema-validation** - Critical validation for Palantir AIP implementation
6. **build** - Build all packages and services
7. **deploy-staging** - Deploy to staging (develop branch only)
8. **deploy-production** - Deploy to production (main branch only)
9. **health-check** - Verify deployment health
10. **notify** - Send team notifications

### 2. PR Validation Pipeline (`.github/workflows/pr-validation.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened

**Features:**
- **Fast feedback** - Runs only affected checks
- **PR title validation** - Enforces conventional commit format
- **Changed files detection** - Optimizes what gets tested
- **Automatic PR comments** - Posts validation summary

**PR Title Format:**
```
feat: add new feature
fix: bug fix
docs: documentation update
style: code formatting
refactor: code restructuring
perf: performance improvement
test: add/update tests
chore: maintenance tasks
build: build system changes
ci: CI/CD changes
revert: revert previous commit
```

## Setup Instructions

### Prerequisites

1. **GitHub Repository Secrets**

   Navigate to `Settings > Secrets and variables > Actions` and add:

   ```
   CLOUDFLARE_API_TOKEN - Your Cloudflare API token
   CLOUDFLARE_ACCOUNT_ID - Your Cloudflare account ID
   SLACK_WEBHOOK_URL - (Optional) For Slack notifications
   ```

2. **GitHub Environments**

   Create two environments:
   - `staging` - For develop branch deployments
   - `production` - For main branch deployments

   For production, enable:
   - Required reviewers (optional)
   - Wait timer (optional)
   - Environment secrets (if different from global)

### Cloudflare Configuration

1. **Generate API Token**

   ```bash
   # Visit: https://dash.cloudflare.com/profile/api-tokens
   # Create token with permissions:
   # - Account.Cloudflare Workers Scripts (Edit)
   # - Account.Account Settings (Read)
   ```

2. **Find Account ID**

   ```bash
   # Visit: https://dash.cloudflare.com/
   # Select your account
   # Copy Account ID from the right sidebar
   ```

### Local Testing

Run the same checks locally before pushing:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Type checking
pnpm run typecheck:workers

# Linting
pnpm run lint
pnpm run format:check

# Tests
pnpm --filter foundation-planning-machine run test

# Schema validation (critical)
pnpm --filter foundation-planning-machine run test src/lib/__tests__/schema-validator.test.ts

# Build
pnpm run build
```

## Critical: Schema Validation

The schema validation job is **CRITICAL** for the Palantir AIP implementation. It ensures:

1. **All phase schemas are defined** - Validates that schemas exist for all 17 phases
2. **Runtime validation works** - Tests the validator with valid/invalid inputs
3. **Ontology compliance** - Ensures artifacts match the formal domain model

**If schema validation fails, the pipeline MUST NOT deploy.**

### Phase Schema Coverage

Required phases:
- `intake` - Initial idea intake
- `opportunity` - Opportunity discovery
- `customer-intel` - Customer intelligence
- `market-research` - Market analysis
- `competitive-intel` - Competitive landscape
- `kill-test` - Go/Kill decision
- `revenue-expansion` - Revenue model
- `strategy` - Strategic planning
- `business-model` - Business model canvas
- `product-design` - Product features & UX
- `gtm` - Go-to-market strategy
- `content-engine` - Content strategy
- `tech-arch` - Technical architecture
- `analytics` - Analytics & KPIs
- `launch-execution` - Launch plan
- `synthesis` - Final synthesis
- `task-reconciliation` - Task breakdown for Naomi

## Deployment Strategy

### Branch Strategy

```
main (production)
  │
  ├─ develop (staging)
  │   │
  │   ├─ feature/new-feature
  │   ├─ fix/bug-fix
  │   └─ refactor/improvement
  │
  └─ hotfix/critical-fix
```

### Deployment Flow

1. **Feature Development**
   - Create feature branch from `develop`
   - Make changes
   - Open PR to `develop`
   - PR validation runs automatically
   - Merge to `develop` → deploys to staging

2. **Production Release**
   - Open PR from `develop` to `main`
   - Full CI pipeline runs
   - Manual approval (optional, configured in GitHub)
   - Merge to `main` → deploys to production
   - Health checks verify deployment

3. **Hotfix**
   - Create hotfix branch from `main`
   - Make critical fix
   - Open PR to `main`
   - Fast-track review and merge
   - Auto-deploy to production
   - Backport to `develop`

## Monitoring & Notifications

### Health Checks

Post-deployment health checks verify:

```bash
# API Health
GET https://api.yourdomain.com/health
Expected: 200 OK

# UI Availability
GET https://yourdomain.com
Expected: 200 OK
```

### Slack Notifications

Configure Slack webhook for team notifications:

1. Create Slack App and Incoming Webhook
2. Add `SLACK_WEBHOOK_URL` to GitHub Secrets
3. Pipeline will send notifications on:
   - Build success/failure
   - Deployment completion
   - Health check failures

## Troubleshooting

### Common Issues

**1. Type checking fails**
```bash
# Run locally to see errors
pnpm run typecheck:workers

# Fix TypeScript errors and push
```

**2. Schema validation fails**
```bash
# Run schema tests locally
cd services/planning-machine
pnpm test src/lib/__tests__/schema-validator.test.ts

# Check that all phases have schemas defined
```

**3. Build fails**
```bash
# Clear and reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build
```

**4. Deployment fails**
```bash
# Check Cloudflare credentials are set
# Verify wrangler.jsonc configurations
# Review Cloudflare dashboard for errors
```

### Pipeline Debugging

Enable debug logging:

```bash
# Add to GitHub Secrets
ACTIONS_RUNNER_DEBUG = true
ACTIONS_STEP_DEBUG = true
```

View detailed logs in GitHub Actions UI.

## Performance Optimization

### Cache Strategy

- **node_modules** - Cached based on pnpm-lock.yaml hash
- **pnpm store** - Shared across workflow runs
- **Build artifacts** - Retained for 7 days

### Parallel Execution

Jobs run in parallel where possible:
- Type checking, linting, testing run concurrently
- Reduces total pipeline time by ~60%

### Fast PR Validation

PR validation workflow optimizes for speed:
- Only runs checks on changed files
- Skips deployment steps
- Provides quick feedback (<2 minutes)

## Metrics & SLAs

Target pipeline performance:

| Metric | Target | Current |
|--------|--------|---------|
| PR validation | <2 min | TBD |
| Full CI pipeline | <10 min | TBD |
| Deploy to staging | <3 min | TBD |
| Deploy to production | <5 min | TBD |
| Health check response | <30 sec | TBD |

## Security

### Secrets Management

- Never commit secrets to git
- Use GitHub encrypted secrets
- Rotate API tokens regularly
- Use environment-specific secrets

### Access Control

- Limit who can merge to `main`
- Require PR reviews
- Enable branch protection rules
- Use CODEOWNERS file

## Future Enhancements

Planned improvements:

1. **E2E Testing** - Add Playwright tests to pipeline
2. **Performance Testing** - Load testing before production deploy
3. **Security Scanning** - SAST/DAST tools integration
4. **Cost Monitoring** - Track Cloudflare Workers costs
5. **Rollback Automation** - Auto-rollback on health check failure
6. **Canary Deployments** - Gradual rollout to production

---

**Maintained by:** DevOps Team
**Last updated:** 2026-02-20
**Version:** 1.0.0
