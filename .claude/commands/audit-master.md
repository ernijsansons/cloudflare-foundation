# Master System Audit

**THE ULTIMATE AUDIT** - Complete verification of the entire cloudflare-foundation-dev ecosystem.

Run this audit to get a comprehensive health report across all systems, phases, and integrations.

---

## PART 1: INFRASTRUCTURE LAYER

### 1.1 Worker Deployments
Verify all 7 workers are deployed and healthy:

| Worker | Production Name | Check |
|--------|-----------------|-------|
| Gateway | foundation-gateway-production | `curl https://gateway.erlvinc.com/health` |
| Planning Machine | foundation-planning-machine-production | Service binding only |
| Agents | foundation-agents-production | Service binding only |
| Workflows | foundation-workflows-production | Service binding only |
| Queues | foundation-queues-production | Service binding only |
| Cron | foundation-cron-production | Internal |
| UI | erlvinc-dashboard (Pages) | `curl https://dashboard.erlvinc.com` |

### 1.2 D1 Databases
Three databases - verify all exist and are accessible:

```bash
# Foundation Primary (gateway, agents)
cd services/gateway && npx wrangler d1 execute foundation-primary --remote --command="SELECT COUNT(*) as tables FROM sqlite_master WHERE type='table';"

# Planning Primary (planning-machine)
cd services/planning-machine && npx wrangler d1 execute planning-primary --remote --command="SELECT COUNT(*) as tables FROM sqlite_master WHERE type='table';"

# Agent Control Primary (run-api)
cd services/run-api && npx wrangler d1 execute agent-control-primary --remote --command="SELECT COUNT(*) as tables FROM sqlite_master WHERE type='table';"
```

### 1.3 Bindings Verification
Check all wrangler.jsonc files have correct bindings:
- D1 database IDs match actual databases
- Service bindings point to production workers
- KV namespaces configured
- R2 buckets bound
- AI bindings present

---

## PART 2: RESEARCH PIPELINE (Planning Machine)

### 2.1 Agent Inventory
All 18 agents must exist in `services/planning-machine/src/agents/`:
```
opportunity, customer-intel, market-research, competitive-intel,
kill-test, revenue-expansion, strategy, business-model,
product-design, gtm, content-engine, tech-arch,
analytics, launch-execution, synthesis, task-reconciliation,
diagram-generator, validator
```

### 2.2 Phase Flow
Verify phase execution order and gates:
- Phases 1-4: Research (web search enabled)
- Phase 5: Kill-test GATE (CONTINUE/PIVOT/KILL)
- Phases 6-14: Strategy & Planning
- Phase 15: Synthesis (creates documentation)
- Phases 16-18: Finalization

### 2.3 Workflow Integrity
Check `services/planning-machine/src/workflows/planning-workflow.ts`:
- ~900 lines, orchestrates full pipeline
- Quality scoring loop
- Error recovery

### 2.4 Planning Database Health
```bash
cd services/planning-machine
npx wrangler d1 execute planning-primary --remote --command="
SELECT
  (SELECT COUNT(*) FROM planning_runs) as runs,
  (SELECT COUNT(*) FROM planning_artifacts) as artifacts,
  (SELECT COUNT(*) FROM ideas) as ideas;
"
```

---

## PART 3: PRODUCTION SYSTEM (UI + Documentation)

### 3.1 Project Documentation
Verify all 14 sections exist and render:
```bash
curl -s "https://dashboard.erlvinc.com/api/gateway/public/projects/run-global-claw-2026/docs?tenant_id=erlvinc" | python3 -c "
import json,sys
d=json.load(sys.stdin)
sections = sorted(d.get('sections',{}).keys())
expected = ['A','B','C','D','E','F','G','H','I','J','K','L','M','overview']
print('Sections found:', sections)
print('Missing:', set(expected) - set(sections))
print('Status:', 'PASS' if sections == expected else 'FAIL')
"
```

### 3.2 UI Components
Each section must have a working Svelte component:
```
services/ui/src/lib/components/ProjectCard/
├── OverviewTab.svelte  → overview section
├── SectionA.svelte     → A (Assumptions)
├── SectionB.svelte     → B (North Star)
├── SectionC.svelte     → C (Checklist)
├── SectionD.svelte     → D (Architecture)
├── SectionE.svelte     → E (Frontend)
├── SectionF.svelte     → F (Backend)
├── SectionG.svelte     → G (Pricing)
├── SectionH.svelte     → H (GTM)
├── SectionI.svelte     → I (Brand)
├── SectionJ.svelte     → J (Security)
├── SectionK.svelte     → K (Testing)
├── SectionL.svelte     → L (Operations)
└── SectionM.svelte     → M (Roadmap)
```

### 3.3 Kanban Board
Production page at `/ai-labs/production`:
- 4 columns: Backlog, In Progress, Review, Done
- Cards show project name, status, phase
- Click opens documentation modal

---

## PART 4: API LAYER

### 4.1 Gateway Routes
Test critical endpoints:
```bash
# Health
curl -s https://gateway.erlvinc.com/health

# Public planning runs
curl -s "https://gateway.erlvinc.com/api/public/planning/runs?limit=5" | head -c 500

# Public project docs
curl -s "https://gateway.erlvinc.com/api/public/projects/run-global-claw-2026/docs?tenant_id=erlvinc" | head -c 500

# Public factory templates
curl -s "https://gateway.erlvinc.com/api/public/factory/templates" | head -c 500
```

### 4.2 Auth & Security
- JWT validation on protected routes
- Tenant isolation working
- Rate limiting configured
- CORS properly set

---

## PART 5: CODE QUALITY

### 5.1 TypeScript
```bash
cd /path/to/cloudflare-foundation-dev
pnpm run typecheck:workers
```
Must complete with 0 errors.

### 5.2 Build
```bash
pnpm run build
```
Must complete successfully.

### 5.3 Dependencies
```bash
pnpm audit
pnpm outdated
```
Check for critical vulnerabilities and outdated packages.

---

## PART 6: SECRETS & CONFIG

### 6.1 Required Secrets
Verify these are set via `wrangler secret list`:

| Service | Secret | Required |
|---------|--------|----------|
| planning-machine | ANTHROPIC_API_KEY | Yes |
| planning-machine | TAVILY_API_KEY | Yes |
| planning-machine | BRAVE_API_KEY | Optional |
| planning-machine | NVIDIA_API_KEY | Optional |
| gateway | CONTEXT_SIGNING_KEY | Yes |

### 6.2 Environment Variables
Check Pages dashboard for UI environment variables:
- GATEWAY_URL (optional override)

---

## PART 7: LIVE SMOKE TEST

Execute this sequence to verify end-to-end functionality:

1. **Load Dashboard**: https://dashboard.erlvinc.com
2. **Navigate to AI Labs → Production**
3. **Click Global Claw card**
4. **Verify Overview tab shows data**
5. **Click through all tabs (A-M)**
6. **Each tab should display formatted content**

---

## AUDIT REPORT TEMPLATE

```
=====================================
MASTER AUDIT REPORT
Date: [DATE]
=====================================

INFRASTRUCTURE
--------------
[ ] Workers deployed: X/7
[ ] Databases accessible: X/3
[ ] Bindings correct: YES/NO

RESEARCH PIPELINE
-----------------
[ ] Agents present: X/18
[ ] Workflow intact: YES/NO
[ ] Planning DB healthy: YES/NO

PRODUCTION SYSTEM
-----------------
[ ] Doc sections: X/14
[ ] UI components: X/14
[ ] Kanban working: YES/NO

API LAYER
---------
[ ] Gateway health: PASS/FAIL
[ ] Public endpoints: X/X working
[ ] Auth working: YES/NO

CODE QUALITY
------------
[ ] TypeScript: X errors
[ ] Build: PASS/FAIL
[ ] Vulnerabilities: X critical

OVERALL HEALTH SCORE: XX/100

CRITICAL ISSUES
---------------
1. [Issue description]
2. [Issue description]

RECOMMENDED ACTIONS
-------------------
1. [Priority 1 fix]
2. [Priority 2 fix]
```

---

## RUN THIS AUDIT

To execute this audit, use the claude command:
```
/audit-master
```

Or run individual audits:
```
/audit-research    — Research pipeline only
/audit-production  — Production system only
/full-audit        — Detailed infrastructure audit
```
