# Bootstrap Scripts

Quick setup scripts for ERLV/OpenClaw Research OS development environment.

## Overview

The bootstrap script automates the complete development environment setup including:

- ✅ Prerequisites verification (Node.js, pnpm, wrangler)
- ✅ Environment configuration (.env file)
- ✅ Dependency installation
- ✅ Database migrations (D1)
- ✅ Shared package builds
- ✅ Validation tests (schema validator)
- ✅ Optional test data generation

## Quick Start

### Linux / macOS

```bash
# Make executable
chmod +x scripts/bootstrap.sh

# Run bootstrap
./scripts/bootstrap.sh

# Or with test data
./scripts/bootstrap.sh --with-test-data
```

### Windows

```powershell
# Run bootstrap
.\scripts\bootstrap.ps1

# Or with test data
.\scripts\bootstrap.ps1 -WithTestData
```

## What Gets Installed

### 1. Global Tools

- **pnpm** (if not already installed) - Package manager
- **wrangler** (if not already installed) - Cloudflare CLI

### 2. Project Dependencies

All dependencies from `package.json` and workspace packages:

```
node_modules/
├── @foundation/shared
├── @foundation/db
├── services/*/node_modules
└── packages/*/node_modules
```

### 3. Database

- Creates D1 database: `foundation-primary`
- Applies migrations from `packages/db/migrations/`
- Creates tables:
  - `planning_runs`
  - `planning_artifacts`
  - `decisions`
  - `evidence`
  - `orchestration_metadata` (NEW)
  - `wild_ideas` (NEW)
  - `orchestration_consensus` (NEW)
  - `rag_citations`
  - etc.

### 4. Environment File

Creates `.env` with template:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_token_here
ORCHESTRATION_ENABLED=true
NODE_ENV=development
```

**⚠️ Important:** You MUST update `.env` with your actual Cloudflare credentials.

## Options

### `--with-test-data` / `-WithTestData`

Generates test data for development:

- Creates test planning run: `run-test-001`
- Creates test artifact: `artifact-test-001`
- Inserts into local D1 database

Useful for:
- Testing the metrics dashboard
- Validating traceability APIs
- Demo purposes

## Prerequisites

Before running bootstrap, ensure you have:

1. **Node.js 20+**
   - Download from https://nodejs.org
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **Git**
   - Download from https://git-scm.com
   - Verify: `git --version`

4. **Cloudflare Account** (for remote deployment)
   - Sign up at https://dash.cloudflare.com
   - Get Account ID from dashboard
   - Create API token with Workers permissions

## Post-Bootstrap Steps

After running bootstrap:

### 1. Configure Cloudflare Credentials

```bash
# Edit .env
nano .env  # or use your preferred editor

# Update:
CLOUDFLARE_ACCOUNT_ID=abcd1234...
CLOUDFLARE_API_TOKEN=your_token_here...
```

### 2. Authenticate Wrangler

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### 3. Start Development Server

```bash
# Start all services
pnpm run dev

# Or start individual services
pnpm --filter foundation-gateway run dev
pnpm --filter foundation-ui run dev
```

### 4. Verify Setup

```bash
# Check that UI is running
curl http://localhost:8788

# Check API health
curl http://localhost:8788/api/health

# Run tests
pnpm --filter foundation-planning-machine run test
```

## Troubleshooting

### Bootstrap Script Fails

**Problem:** Script exits with errors

**Solution:**
1. Check prerequisites are installed: `node --version`, `pnpm --version`
2. Ensure you're in project root directory
3. Check internet connection (for package downloads)
4. Review error message for specific issue

### Database Migrations Fail

**Problem:** `wrangler d1 migrations apply` fails

**Solution:**
1. Ensure Wrangler is authenticated: `wrangler login`
2. Check database name matches `wrangler.jsonc` configuration
3. Verify migration files exist in `packages/db/migrations/`
4. Try applying to local first: `wrangler d1 migrations apply foundation-primary --local`

### Build Errors

**Problem:** Shared packages fail to build

**Solution:**
1. Clear node_modules: `rm -rf node_modules && rm pnpm-lock.yaml`
2. Reinstall: `pnpm install --frozen-lockfile`
3. Build individually: `pnpm --filter @foundation/shared build`
4. Check TypeScript errors: `pnpm run typecheck:workers`

### Test Data Already Exists

**Problem:** Bootstrap fails because test data IDs already exist

**Solution:**
1. Clear local database:
   ```bash
   cd services/gateway
   wrangler d1 execute foundation-primary --local --command="DELETE FROM planning_runs WHERE id='run-test-001'"
   wrangler d1 execute foundation-primary --local --command="DELETE FROM planning_artifacts WHERE id='artifact-test-001'"
   ```
2. Or use different test IDs in bootstrap script

## Manual Setup (Alternative)

If bootstrap script doesn't work, follow these manual steps:

```bash
# 1. Install pnpm
npm install -g pnpm

# 2. Install wrangler
pnpm install -g wrangler

# 3. Install dependencies
pnpm install --frozen-lockfile

# 4. Build shared packages
pnpm --filter @foundation/shared build
pnpm --filter @foundation/db build

# 5. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 6. Login to Cloudflare
wrangler login

# 7. Create D1 database
wrangler d1 create foundation-primary

# 8. Apply migrations
cd services/gateway
wrangler d1 migrations apply foundation-primary --local
wrangler d1 migrations apply foundation-primary --remote

# 9. Run tests
cd ../..
pnpm --filter foundation-planning-machine run test

# 10. Start dev server
pnpm run dev
```

## CI/CD Integration

Bootstrap is integrated into CI/CD pipeline:

- **GitHub Actions** - Automated on every push
- **Local Dev** - Manual via bootstrap script
- **Docker** - Can be integrated into Dockerfile

See `.github/workflows/ci.yml` for automated setup.

## Related Scripts

- `setup-d1.sh` - D1 database setup only
- `setup-kv.sh` - KV namespace setup
- `setup-r2.sh` - R2 bucket setup
- `setup-queues.sh` - Queue setup
- `deploy-all.sh` - Deploy all services

## Support

If you encounter issues:

1. Check this README
2. Review error logs
3. Search existing GitHub issues
4. Create new issue with:
   - Operating system
   - Node.js version
   - Error message
   - Steps to reproduce

---

**Last updated:** 2026-02-20
**Maintained by:** DevOps Team
