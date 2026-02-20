# Developer Tooling Guide

This document explains how to use linting and formatting tools in this large monorepo.

## Quick Start

### Recommended Commands (Fast & Reliable)

```bash
# Lint all services incrementally
npm run lint:services

# Format check (services and packages only, with cache)
npm run format:check:services

# Format all files
npm run format
```

### Pre-commit Hooks

Pre-commit hooks are automatically enabled via Husky and will:
- Lint and format only your **changed files**
- Run quickly without memory issues
- Ensure code quality before commits

## Available Commands

### Linting

| Command | Description | Speed | Memory Usage |
|---------|-------------|-------|--------------|
| `npm run lint` | Lint entire codebase | Slow | High (8GB heap) |
| `npm run lint:services` | Lint all services incrementally | Fast | Low |
| `npm run lint:gateway` | Lint gateway service only | Very Fast | Very Low |
| `npm run lint:ui` | Lint UI service only | Very Fast | Very Low |
| `npm run lint:agents` | Lint agents service only | Very Fast | Very Low |
| `npm run lint:fix` | Auto-fix lint issues (full codebase) | Slow | High (8GB heap) |

### Formatting

| Command | Description | Speed | Memory Usage |
|---------|-------------|-------|--------------|
| `npm run format:check` | Check all files (with cache) | Moderate | Moderate (8GB heap) |
| `npm run format:check:services` | Check services/packages (with cache) | Fast | Low |
| `npm run format` | Format all files (with cache) | Moderate | Moderate (8GB heap) |

## Best Practices

### For Daily Development

Use incremental commands for faster feedback:

```bash
# Check your service
npm run lint:gateway    # If working on gateway
npm run lint:ui         # If working on UI
npm run lint:agents     # If working on agents

# Or check all services
npm run lint:services
```

### For CI/CD

Recommended commands for automated pipelines:

```bash
# Use incremental commands in CI
npm run lint:services
npm run format:check:services
```

### For Full Codebase Validation

If you need to check the entire codebase:

```bash
# Full lint (uses 8GB heap with cache)
npm run lint

# Full format check (uses 8GB heap with cache)
npm run format:check
```

**Note:** Full codebase commands may be memory-intensive. If they fail:
- Use incremental commands instead
- Ensure you have at least 8GB of available RAM
- Close other memory-intensive applications

## Optimizations Applied

This monorepo uses several optimizations to handle its large size:

1. **Increased Memory Allocation**
   - 8GB Node.js heap size for full checks
   - Cross-platform environment variables via `cross-env`

2. **Caching**
   - ESLint cache enabled (`.eslintcache`)
   - Prettier cache enabled (`.prettiercache`)
   - Significantly faster on subsequent runs

3. **Comprehensive Exclusions**
   - Build outputs, generated files excluded
   - Large documentation files excluded
   - Config and migration files excluded
   - See `.eslintignore` and `.prettierignore` for details

4. **Incremental Commands**
   - Service-by-service linting
   - Faster feedback and easier debugging
   - Lower memory footprint

## Troubleshooting

### "Out of Memory" Errors

If you encounter out-of-memory errors:

1. **Use incremental commands** (recommended):
   ```bash
   npm run lint:services
   npm run format:check:services
   ```

2. **Increase Node memory** (if needed):
   ```bash
   # Temporary increase for one command
   cross-env NODE_OPTIONS="--max-old-space-size=16384" npm run lint
   ```

3. **Close other applications** to free up RAM

### Cache Issues

If linting/formatting behaves unexpectedly:

```bash
# Clear ESLint cache
rm -f .eslintcache

# Clear Prettier cache
rm -f .prettiercache

# Then run commands again
npm run lint:services
```

### Pre-commit Hook Issues

If pre-commit hooks fail:

```bash
# Check what's being linted
git diff --cached --name-only

# Manually fix files
npm run lint:fix
npm run format

# Then commit again
git commit
```

## Configuration Files

- **`.eslintrc.json`** - ESLint configuration
- **`.eslintignore`** - Files to exclude from linting
- **`.prettierrc.json`** - Prettier configuration
- **`.prettierignore`** - Files to exclude from formatting
- **`.husky/pre-commit`** - Pre-commit hook script
- **`package.json`** - `lint-staged` configuration

## Performance Tips

1. **Use cache:** Both ESLint and Prettier cache results for faster runs
2. **Lint only what changed:** Pre-commit hooks automatically do this
3. **Use incremental commands:** Check one service at a time when debugging
4. **Keep exclusions updated:** Add new build outputs/generated files to ignore files

## Support

If you encounter issues with developer tooling:

1. Check this documentation
2. Try incremental commands instead of full codebase commands
3. Ensure you have the latest dependencies: `npm install`
4. Clear caches and try again
5. Report persistent issues to the team
