# Claude Code Ultra-Advanced Max-Level++ Audit System

**Version:** 1.0
**Target:** cloudflare-foundation-dev monorepo
**Invocation:** `/audit-max` or use this prompt directly

---

## Overview

This is an ultra-advanced pre-merge audit system that extends beyond traditional code review. It introduces AI-powered semantic analysis, deep integration verification, production safety gates, intelligence gathering, and execution automation.

The system operates in **10 phases** with parallel execution where possible, producing a structured report with actionable findings and confidence scores.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAX-LEVEL++ AUDIT ORCHESTRATOR                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Phase 1    │  │   Phase 2    │  │   Phase 3    │  │   Phase 4    │ │
│  │ Environment  │──│  Semantic    │──│  Contract    │──│  Security    │ │
│  │ Baseline     │  │  Diff        │  │  Validation  │  │  Scan        │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┼─────────────────┼─────────────────┘          │
│                           ▼                 ▼                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Phase 5    │  │   Phase 6    │  │   Phase 7    │  │   Phase 8    │ │
│  │ Performance  │──│  Test Gap    │──│  Production  │──│ Intelligence │ │
│  │ Regression   │  │  Detection   │  │  Safety      │  │  Gathering   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┴─────────────────┴─────────────────┘          │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │   Phase 9: Execution & Verification (typecheck/test/build/lint)  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │   Phase 10: Synthesis & Report Generation                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Environment Baseline Capture

**Purpose:** Establish ground truth before analyzing changes

### Commands

```bash
git status --porcelain=v1            # Working tree status
git log -5 --oneline                 # Recent commits
git diff HEAD~1 --stat               # Change summary
git branch -vv                       # Branch tracking
```

### Build State Validation

```bash
pnpm --filter @foundation/shared build
pnpm --filter @foundation/db build
pnpm run typecheck:workers
```

### Output: BaselineReport

```typescript
interface BaselineReport {
  timestamp: string;
  commitHash: string;
  branchName: string;
  buildPassing: boolean;
  dependencyHash: string;
  serviceStates: Record<string, "healthy" | "degraded" | "unknown">;
}
```

---

## Phase 2: Semantic Diff Analysis

**Purpose:** Understand what changed beyond text diffs

### Intent Detection

| Intent Signal | Detection Method | Example |
|---------------|-----------------|---------|
| Feature Addition | New exports, routes, classes | `export class NewAgent` |
| Bug Fix | Conditional changes, null checks | `if (x !== null)` |
| Refactor | Same exports, different impl | Function body change |
| Performance | Algorithm changes, caching | `Map<>` to `KV` |
| Security | Auth checks, validation | `.bind()`, `validateInput()` |
| Breaking Change | Removed exports, changed sigs | Type narrowing |

### Semantic Change Classification

```typescript
interface SemanticChange {
  file: string;
  changeType: "addition" | "modification" | "deletion" | "rename";
  semanticIntent: "feature" | "fix" | "refactor" | "perf" | "security" | "docs";
  impactRadius: "local" | "module" | "service" | "cross-service" | "public-api";
  confidenceScore: number; // 0-100
  reasoning: string;
}
```

### Breaking Change Detection

```typescript
interface BreakingChangeRisk {
  type: "type-narrowing" | "removed-export" | "signature-change" | "behavior-change";
  affectedConsumers: string[];
  migrationRequired: boolean;
  suggestedMigration?: string;
}
```

---

## Phase 3: Contract Validation

**Purpose:** Verify all service contracts remain consistent

### Type Contract Alignment

For each service boundary, verify request/response types match.

### Schema Migration Safety

```sql
-- SAFE: ADD COLUMN with DEFAULT
-- UNSAFE: DROP COLUMN, ALTER TYPE without migration
-- REVIEW: Any schema change
```

### Service Binding Validation

| Check | Verified |
|-------|----------|
| `PLANNING_SERVICE` binding matches deployed Worker | |
| `AGENT_SERVICE` binding matches deployed Worker | |
| `CONTEXT_SIGNING_KEY` identical in gateway + planning-machine | |
| All phases in `PLANNING_AGENT_PHASE_ORDER` have agents | |
| Post-pipeline uses `getPostPipelineAgent()` | |

### D1 Schema Drift Detection

Compare Drizzle schema files to actual D1 schema via migrations.

---

## Phase 4: Security Vulnerability Scanning

**Purpose:** Detect security issues before merge

### Codebase Security Patterns

| Pattern | Risk | Detection |
|---------|------|-----------|
| SQL Concatenation | Critical | `"SELECT * FROM " + variable` |
| Missing .bind() | Critical | D1 query without parameterization |
| Wildcard CORS | High | `cors()` without origin callback |
| In-memory Rate Limit | High | `new Map()` for rate limiting |
| Secrets in Code | Critical | API keys, tokens in source |
| Missing Auth | High | Route without auth middleware |
| Unsafe Deserialization | Medium | `JSON.parse()` without try/catch |
| Raw Query Forwarding | High | URL params forwarded without validation |

### Secret Detection Patterns

```typescript
const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,                    // AWS Access Key
  /ghp_[A-Za-z0-9_]{36,}/,               // GitHub Personal Token
  /sk-[a-zA-Z0-9]{48}/,                  // OpenAI API Key
  /-----BEGIN.*PRIVATE KEY-----/,         // Private Key
];
```

### Cloudflare Security Checklist

- [ ] KV-backed rate limiting (not in-memory Map)
- [ ] CORS with origin callback (not wildcard)
- [ ] Parameterized D1 queries (.bind() always)
- [ ] WebSocket message size validation (1MB max)
- [ ] Safe deserializeAttachment() (try/catch)
- [ ] Structured workflow retries (exponential backoff)
- [ ] Secrets via wrangler secret (not wrangler.jsonc)
- [ ] MCP OAuth for remote servers
- [ ] MCP elicitation before destructive ops
- [ ] Audit chain SHA-256 hash linking
- [ ] Query param whitelist validation

---

## Phase 5: Performance Regression Indicators

**Purpose:** Detect potential performance degradations

### Algorithmic Complexity Changes

| Pattern | Impact | Detection |
|---------|--------|-----------|
| N+1 Query | High | Loop containing `await db.query()` |
| Missing Index | Medium | Query on non-indexed column |
| Unbounded SELECT | High | `SELECT *` without LIMIT |
| Missing Batch | Medium | Multiple inserts without `db.batch()` |

### Resource Limit Validation

| Resource | Limit | Check |
|----------|-------|-------|
| Workers CPU | 30 seconds | |
| Workers Memory | 128 MB | |
| D1 Row Read | 1M rows/query | |
| KV Value Size | 25 MB | |
| Queue Message | 128 KB | |
| Workflow Step | 15 minutes | |

---

## Phase 6: Automated Test Gap Detection

**Purpose:** Identify untested code paths

### Change-to-Test Mapping

For each changed file, find corresponding test file and verify coverage.

### Critical Path Test Requirements

- [ ] Auth middleware bypass attempts
- [ ] Rate limit enforcement
- [ ] SQL injection prevention
- [ ] WebSocket message validation
- [ ] Workflow step failure handling
- [ ] Queue consumer error recovery
- [ ] Planning phase transitions
- [ ] Kill-test verdict handling

### Test Quality Indicators

| Indicator | Target |
|-----------|--------|
| Assertion Density | > 3 per test |
| Mock Coverage | All external deps |
| Edge Cases | Error paths tested |
| Integration | Cross-service calls |

---

## Phase 7: Production Safety Gates

**Purpose:** Verify deployment readiness

### Rollback Safety Assessment

```typescript
interface RollbackAssessment {
  canRollback: boolean;
  blockers: string[];
  dataLossRisk: "none" | "low" | "medium" | "high";
  migrationReversible: boolean;
  stateCorruptionRisk: "none" | "low" | "medium" | "high";
}
```

### Feature Flag Coverage

- New features should be behind flags for safe rollout
- Unflagged features are higher risk

### Observability Completeness

- [ ] Analytics Engine tracking
- [ ] Structured logging
- [ ] Error tracking
- [ ] Performance metrics
- [ ] Audit chain integrity

### Error Handling Coverage Score

- Try/catch coverage percentage
- Custom error types
- Error boundaries
- Graceful degradation
- Retry logic

---

## Phase 8: Intelligence Gathering

**Purpose:** External context that affects the change

### Dependency Vulnerability Scan

```bash
pnpm audit --json
```

### Breaking Change Detection in Dependencies

Check changelogs for major version bumps.

### License Compliance

Allowed licenses: MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD

### Cloudflare Changelog Cross-Reference

Check if changes align with latest Cloudflare updates.

---

## Phase 9: Execution & Verification

**Purpose:** Run all verification commands

### Parallel Verification Pipeline

```bash
# Run in parallel
pnpm run typecheck:workers &
pnpm run lint &
pnpm run format:check &
wait

# Sequential
pnpm run build
pnpm run test
```

### Execution Results

```typescript
interface ExecutionResults {
  typecheck: { success: boolean; errors: string[] };
  lint: { success: boolean; warnings: number; errors: number };
  format: { success: boolean; filesChanged: number };
  build: { success: boolean; duration: number };
  test: { success: boolean; passed: number; failed: number; skipped: number };
}
```

---

## Phase 10: Synthesis & Report Generation

**Purpose:** Combine all findings into actionable report

### Finding Aggregation

```typescript
interface AuditFinding {
  id: string;
  phase: number;
  category: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidence?: string;
  remediation: string;
  autoFixable: boolean;
  confidenceScore: number;
}
```

### Verdict Levels

| Verdict | Score | Action |
|---------|-------|--------|
| `SHIP` | 90-100 | Safe to merge |
| `SHIP_WITH_NOTES` | 70-89 | Merge with documented risks |
| `BLOCK` | 40-69 | Fix issues first |
| `CRITICAL_BLOCK` | 0-39 | Major rework required |

---

## Output Format

### JSON Report

```json
{
  "auditId": "audit-2026-02-26-abc123",
  "version": "max-level++/1.0",
  "summary": {
    "verdict": "SHIP_WITH_NOTES",
    "overallScore": 78,
    "findingCounts": {
      "critical": 0,
      "high": 2,
      "medium": 5,
      "low": 8,
      "info": 12
    },
    "estimatedFixTime": "2-3 hours"
  },
  "executiveVerdict": {
    "recommendation": "Changes are generally safe to merge after addressing high-priority findings.",
    "keyRisks": ["Missing test coverage", "Rate limiter pattern"],
    "keyStrengths": ["All contracts validated", "No security vulnerabilities"]
  },
  "changeInventory": {
    "filesChanged": 12,
    "linesAdded": 456,
    "linesRemoved": 123,
    "services": ["gateway", "planning-machine"],
    "semanticSummary": "Added new analytics phase with metric tracking"
  },
  "criticalFindings": [],
  "highFindings": [...],
  "mediumFindings": [...],
  "lowFindings": [...],
  "verificationResults": {
    "typecheck": { "success": true, "errors": [] },
    "lint": { "success": true, "warnings": 3, "errors": 0 },
    "format": { "success": true, "filesChanged": 0 },
    "build": { "success": true, "duration": 45 }
  },
  "metadata": {
    "timestamp": "2026-02-26T15:30:00Z",
    "duration": 127,
    "phaseDurations": { ... }
  }
}
```

### Human-Readable Summary

```markdown
# Max-Level++ Audit Report

## Verdict: SHIP_WITH_NOTES (78/100)

### TL;DR
Changes are generally safe to merge after addressing 2 high-priority findings.
No critical issues. Build passes. All contracts valid.

### Must Fix Before Merge
1. [HIGH] Missing test coverage - analytics-agent.ts needs tests
2. [HIGH] Rate limiter pattern - Use KV instead of Map

### What's Good
- All type contracts validated
- No security vulnerabilities
- Build and lint passing

### Execution Time: 2m 7s
```

---

## Usage

### Slash Command

```
/audit-max                    # Full audit
/audit-max --quick            # Phases 1, 4, 9 only
/audit-max --security         # Phases 1, 4 only
/audit-max --contracts        # Phases 1, 3 only
/audit-max --fix              # Run + auto-fix
```

### CI/CD Integration

```yaml
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Max-Level++ Audit
        run: |
          pnpm run audit:max -- --output=json > audit-report.json
          VERDICT=$(jq -r '.summary.verdict' audit-report.json)
          if [ "$VERDICT" = "CRITICAL_BLOCK" ]; then
            exit 1
          fi
```

---

## Codebase-Specific High-Risk Areas

### Planning Pipeline

- Phase ordering invariants from `planning-phases.ts`
- Kill-test verdict handling (CONTINUE/PIVOT/KILL)
- Multi-model orchestration output persistence

### Cross-Database Operations

- Gateway uses `foundation-primary`
- Planning-machine uses `planning-primary`
- Never mix without explicit transaction handling

### Gateway Middleware Chain

- Order: cors → correlation → logger → rateLimit → securityHeaders → auth → tenant → contextToken
- Context token must be set before service forwarding

### Agent State Persistence

- Always use `serializeAttachment`/`deserializeAttachment`
- Wrap deserialization in try/catch for hibernation recovery

### Service Bindings

- `PLANNING_SERVICE` → `foundation-planning-machine`
- `AGENT_SERVICE` → `foundation-agents`
- Verify names match deployed Workers

---

## Self-Improvement Feedback Loop

After each audit, capture:

1. **False Positives** — Findings that were incorrect
2. **Missed Issues** — Problems discovered after merge
3. **Pattern Learnings** — Common issues to add to detection

Use feedback to improve future audits.
