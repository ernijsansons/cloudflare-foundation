# Database Architecture

## Overview

The research pipeline uses a **dual-database architecture** for service isolation and performance.

## Databases

### Gateway Database (`foundation-primary`)
- **Binding**: `DB` in gateway service
- **Purpose**: Serves UI queries (read-heavy)
- **Key Tables**:
  - `planning_runs` - Mirror of planning-machine runs for UI display
  - `webhook_destinations`
  - `notifications`
  - `naomi_tasks`, `naomi_execution_logs`
  - `project_documentation`

### Planning Machine Database (`planning-primary`)
- **Binding**: `DB` in planning-machine service
- **Purpose**: Workflow execution and artifact storage (write-heavy)
- **Key Tables**:
  - `planning_runs` - Source of truth
  - `planning_artifacts` - Phase outputs
  - `planning_sources` - Research citations
  - `planning_memory` - RAG embeddings
  - `planning_quality` - Quality scores
  - `planning_parked_ideas` - Killed ideas
  - `ideas` - Idea cards

## Sync Strategy

The `planning_runs` table is duplicated:
1. Planning-machine creates/updates runs during workflow
2. UI queries planning-machine directly via PLANNING_SERVICE binding
3. No explicit sync needed (service-to-service calls provide real-time data)

## Migration Status

### Gateway Migrations
Location: `services/gateway/migrations/`
- 0000-0009: Applied ✅

### Planning Machine Migrations
Location: `services/planning-machine/migrations/`
- 0000-0006: Applied ✅

## Verification Commands

```bash
# Gateway DB migrations
cd services/gateway
wrangler d1 migrations list foundation-primary --remote

# Planning Machine DB migrations
cd services/planning-machine
wrangler d1 migrations list planning-primary --remote
```

## Apply Missing Migrations (if needed)

```bash
# Gateway
cd services/gateway
wrangler d1 migrations apply foundation-primary --remote

# Planning Machine
cd services/planning-machine
wrangler d1 migrations apply planning-primary --remote
```
