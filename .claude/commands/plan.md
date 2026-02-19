# /plan

Run the full 16-phase planning pipeline locally using Claude Code as the AI engine.
Results sync to Cloudflare after each phase. Produces TASKS.json — the one-shot build artifact.

## Usage

```
/plan "Your SaaS idea here"
```

## Workflow

When this skill is invoked with an idea:

### Step 0: Intake (Capture Constraints)

Before creating the run, gather product constraints. Ask the user (or use defaults if not provided):

**Required intake fields:**
```json
{
  "idea": "<the idea from the command>",
  "techStack": "Cloudflare-native (Workers, D1, KV, R2, Queues, Durable Objects, SvelteKit)",
  "teamSize": "1-2 engineers + AI agents",
  "budgetRange": "bootstrap",
  "mvpTargetDate": "YYYY-MM-DD or null",
  "existingIntegrations": [],
  "mustAvoid": [],
  "complianceRequirements": [],
  "deploymentTarget": "Cloudflare Pages + Workers"
}
```

If the user has not specified `budgetRange`, `teamSize`, or `mustAvoid` in their command, use the defaults above.

Store the intake JSON — it will be synced as the `__intake__` artifact and injected into every phase's system prompt.

Sync intake:
```bash
echo '<INTAKE_JSON>' | npx tsx packages/foundation-cli/src/index.ts sync __intake__ <RUN_ID> --stdin
```

### Step 1: Create Run

Execute in terminal:
```bash
cd C:\dev\.cloudflare\cloudflare-foundation-dev
npx tsx packages/foundation-cli/src/index.ts run create "<IDEA>" --mode local
```

Capture the run ID from output (format: `run_xxxxx_xxxxxx`).

### Step 2: Execute Each Phase

For each phase in order, generate the output and sync it:

**Phase Order:**
1. opportunity
2. customer-intel (use live web search if TAVILY_API_KEY or BRAVE_SEARCH_API_KEY is set)
3. market-research (use live web search — inject citations into output)
4. competitive-intel (use live web search — inject citations into output)
5. kill-test (CRITICAL: Check verdict - KILL/PIVOT/CONTINUE)
6. revenue-expansion
7. strategy
8. business-model
9. product-design (include `draftTasks` array — frontend pages, API endpoints, DB tables)
10. gtm-marketing (include `draftTasks` array — campaigns, SEO, ad setup)
11. content-engine (include `draftTasks` array — landing page copy, email sequences)
12. tech-arch (include `draftTasks` array — infra, migrations, Workers, bindings)
13. analytics (include `draftTasks` array — Analytics Engine, event tracking, monitoring)
14. launch-execution (include `draftTasks` array — deploy scripts, runbooks, PR descriptions)
15. synthesis
16. task-reconciliation (Phase 16 — generates TASKS.json from draftTasks across phases 9-14)

**For each phase:**

1. Get context from prior phases:
```bash
npx tsx packages/foundation-cli/src/index.ts context <RUN_ID> --phase <PHASE> --json
```

2. Generate phase output following the agent prompt guidelines below.

3. Sync the output:
```bash
echo '<JSON_OUTPUT>' | npx tsx packages/foundation-cli/src/index.ts sync <PHASE> <RUN_ID> --stdin
```

### Step 3: Handle Kill-Test Verdict

At the kill-test phase, the verdict determines next steps:

- **CONTINUE**: Proceed to revenue-expansion and remaining phases
- **PIVOT**: Return to opportunity phase with new direction (max 3 pivots)
- **KILL**: Stop the run, mark as killed

### Step 4: Phase 16 — Task Reconciliation

After synthesis, run the task-reconciliation phase. This reads `draftTasks` from phases 9–14 and produces TASKS.json.

Get draft tasks from phases 9–14:
```bash
npx tsx packages/foundation-cli/src/index.ts context <RUN_ID> --phase task-reconciliation --json
```

Generate Phase 16 output following the task-reconciliation schema below, then sync:
```bash
echo '<TASKS_JSON_OUTPUT>' | npx tsx packages/foundation-cli/src/index.ts sync task-reconciliation <RUN_ID> --stdin
```

Then generate scaffold files:
```bash
npx tsx planning-machine/scripts/generate-scaffold.ts <RUN_ID>
```

This writes `planning-machine/output/<RUN_ID>/TASKS.json` and scaffold docs.

### Step 5: Complete

After task-reconciliation phase:
```bash
npx tsx packages/foundation-cli/src/index.ts run complete <RUN_ID>
```

Output final message:
```
Planning run <RUN_ID> complete!

TASKS.json generated at: planning-machine/output/<RUN_ID>/TASKS.json

Next steps:
1. Review TASKS.json — check buildPhases, dependency graph, naomiPrompts
2. Provision infrastructure following planning-machine/output/<RUN_ID>/BOOTSTRAP.md
3. Send to Naomi: POST /api/naomi/tasks/bulk-create with TASKS.json body
4. Run /audit-plan <RUN_ID> to verify no hallucinations
5. Capture lessons after build: npx tsx planning-machine/scripts/capture-lessons.ts add ...
```

---

## Phase Output Guidelines

### opportunity

Find 3-5 opportunity variants of the idea, ranked by revenue potential.

```json
{
  "refinedOpportunities": [
    {
      "idea": "Refined version of the idea",
      "targetMarket": "Who this serves",
      "revenueCeiling": "$X-Y annually",
      "customerUrgency": "high|medium|low",
      "competitionDensity": "saturated|moderate|emerging",
      "feasibility": "straightforward|moderate|challenging"
    }
  ],
  "recommendedIndex": 0,
  "rationale": "Why this is the best opportunity"
}
```

### customer-intel

Deep customer research and pain point analysis.

```json
{
  "targetSegments": [
    {
      "name": "Segment name",
      "description": "Who they are",
      "size": "Estimated market size",
      "painPoints": ["Pain 1", "Pain 2"],
      "currentSolutions": ["How they solve it today"],
      "willingnessToPay": "Price range"
    }
  ],
  "icpProfile": {
    "title": "Ideal customer title",
    "company": "Company characteristics",
    "triggers": "What triggers purchase"
  }
}
```

### market-research

Market sizing, trends, and dynamics.

```json
{
  "tam": "Total addressable market",
  "sam": "Serviceable addressable market",
  "som": "Serviceable obtainable market",
  "growthRate": "X% CAGR",
  "trends": ["Trend 1", "Trend 2"],
  "tailwinds": ["Positive force 1"],
  "headwinds": ["Challenge 1"]
}
```

### competitive-intel

Competitive landscape analysis.

```json
{
  "directCompetitors": [
    {
      "name": "Competitor",
      "positioning": "Their angle",
      "pricing": "Price model",
      "strengths": ["Strength 1"],
      "weaknesses": ["Weakness 1"]
    }
  ],
  "indirectCompetitors": [],
  "competitiveAdvantage": "Our differentiation",
  "moat": "Defensibility strategy"
}
```

### kill-test

Critical go/no-go decision gate.

```json
{
  "verdict": "CONTINUE|PIVOT|KILL",
  "confidence": 0.85,
  "reasoning": "Why this verdict",
  "criticalRisks": [
    {
      "risk": "Risk description",
      "mitigation": "How to address"
    }
  ],
  "pivotDirection": "If PIVOT, what direction",
  "parkedForFuture": {
    "reason": "If KILL, why park for later",
    "revisitEstimateMonths": 12,
    "note": "Conditions for revisit"
  }
}
```

### revenue-expansion

Revenue model and expansion opportunities.

```json
{
  "primaryRevenue": {
    "model": "subscription|usage|transaction",
    "pricing": "Pricing tiers",
    "unit": "Per seat, per API call, etc."
  },
  "expansionOpportunities": [
    {
      "opportunity": "Upsell/cross-sell opportunity",
      "timing": "When to introduce",
      "revenueImpact": "Expected lift"
    }
  ],
  "ltv": "Estimated lifetime value",
  "cac": "Target customer acquisition cost"
}
```

### strategy

Strategic positioning and roadmap.

```json
{
  "vision": "Long-term vision",
  "mission": "Current mission",
  "positioning": "Market positioning statement",
  "strategicPriorities": [
    {
      "priority": "Priority 1",
      "rationale": "Why this matters",
      "kpis": ["Metric 1", "Metric 2"]
    }
  ],
  "milestones": [
    {
      "milestone": "Q1 goal",
      "timeline": "Q1 2025"
    }
  ]
}
```

### business-model

Business model canvas and unit economics.

```json
{
  "valueProposition": "Core value prop",
  "customerSegments": ["Segment 1"],
  "channels": ["Channel 1"],
  "revenueStreams": ["Stream 1"],
  "keyResources": ["Resource 1"],
  "keyActivities": ["Activity 1"],
  "keyPartners": ["Partner type"],
  "costStructure": ["Major cost 1"],
  "unitEconomics": {
    "ltv": "$X",
    "cac": "$Y",
    "paybackMonths": Z,
    "grossMargin": "X%"
  }
}
```

### product-design

Product specs and user experience.

```json
{
  "coreFeatures": [
    {
      "feature": "Feature name",
      "userStory": "As a X, I want Y, so that Z",
      "priority": "must-have|should-have|nice-to-have"
    }
  ],
  "mvpScope": ["Feature 1", "Feature 2"],
  "userJourney": [
    {
      "stage": "Awareness",
      "touchpoints": ["Touchpoint 1"],
      "emotion": "Curious"
    }
  ],
  "technicalRequirements": ["Requirement 1"]
}
```

### gtm-marketing

Go-to-market strategy.

```json
{
  "launchStrategy": {
    "type": "big-bang|soft-launch|beta",
    "targetAudience": "Initial audience",
    "channels": ["Channel 1"]
  },
  "positioning": "Positioning statement",
  "messaging": {
    "headline": "Main headline",
    "subheadline": "Supporting message",
    "keyBenefits": ["Benefit 1"]
  },
  "marketingChannels": [
    {
      "channel": "Content marketing",
      "strategy": "Approach",
      "budget": "$X/month",
      "expectedCac": "$Y"
    }
  ]
}
```

### content-engine

Content strategy and calendar.

```json
{
  "contentPillars": [
    {
      "pillar": "Topic area",
      "purpose": "Why this content",
      "formats": ["Blog", "Video"]
    }
  ],
  "contentCalendar": [
    {
      "week": 1,
      "content": "Content piece",
      "format": "Blog post",
      "goal": "Awareness"
    }
  ],
  "seoStrategy": {
    "primaryKeywords": ["Keyword 1"],
    "contentGaps": ["Gap 1"]
  }
}
```

### tech-arch

Technical architecture and stack.

```json
{
  "architecture": {
    "type": "monolith|microservices|serverless",
    "rationale": "Why this architecture"
  },
  "stack": {
    "frontend": "Technology choice",
    "backend": "Technology choice",
    "database": "Technology choice",
    "infrastructure": "Cloud provider"
  },
  "integrations": ["Integration 1"],
  "scalabilityPlan": "How to scale",
  "securityConsiderations": ["Security measure 1"]
}
```

### analytics

Metrics and measurement framework.

```json
{
  "northStarMetric": {
    "metric": "Key metric",
    "target": "Target value",
    "rationale": "Why this metric"
  },
  "funnel": [
    {
      "stage": "Awareness",
      "metrics": ["Metric 1"],
      "targets": ["Target 1"]
    }
  ],
  "dashboards": [
    {
      "name": "Executive dashboard",
      "metrics": ["Revenue", "Users"],
      "frequency": "Weekly"
    }
  ]
}
```

### launch-execution

Launch plan and execution checklist.

```json
{
  "launchDate": "Target date",
  "prelaunchChecklist": [
    {
      "task": "Task 1",
      "owner": "Role",
      "deadline": "Date",
      "status": "pending|complete"
    }
  ],
  "launchDayPlan": {
    "timeline": ["9am: Task 1", "10am: Task 2"],
    "contingencies": ["If X, then Y"]
  },
  "postLaunchPriorities": ["Priority 1"]
}
```

### synthesis

Final summary and executive brief.

```json
{
  "executiveSummary": "1-2 paragraph summary",
  "opportunity": "The opportunity in one sentence",
  "strategy": "The strategy in one sentence",
  "keyMetrics": {
    "tam": "$X",
    "targetRevenue": "$Y in Year 1",
    "targetUsers": "Z users"
  },
  "topRisks": ["Risk 1"],
  "nextSteps": ["Step 1", "Step 2"],
  "confidence": 0.8,
  "recommendation": "GO|CAUTION|NO-GO"
}
```

---

### draftTasks (required in phases 9–14)

Each of phases 9–14 must include a `draftTasks` array in their output. These are compact task definitions that Phase 16 reconciles into the final TASKS.json.

Draft task format:
```json
{
  "title": "Create users table migration",
  "type": "code",
  "category": "database",
  "priority": "p0",
  "description": "Create D1 migration for users table with tenant_id isolation",
  "filesToCreate": ["migrations/0001_users.sql"],
  "filesToModify": [],
  "dependencies": [],
  "integrationHints": {
    "exports": ["users table"],
    "apiEndpoints": [],
    "environmentVarsRequired": []
  },
  "estimatedEffort": "xs",
  "securityRelevant": false,
  "sourcePhase": "tech-arch"
}
```

### task-reconciliation

Phase 16 output. Reads all `draftTasks` from phases 9–14 and produces the complete ordered task list.

**Input context includes:**
- `draftTasksByPhase`: merged draft tasks from all phases
- `intakeConstraints`: from `__intake__` artifact
- `projectContext`: extracted from tech-arch, product-design
- `pipelineMemory`: lessons from `planning-machine/memory/pipeline-memory.json`

**Output format:**
```json
{
  "projectId": "<RUN_ID>",
  "projectName": "Product Name",
  "generatedAt": "ISO8601",
  "version": "1.0",
  "summary": {
    "totalTasks": 0,
    "totalMarketingTasks": 0,
    "byCategory": {},
    "byPriority": {},
    "criticalPath": [],
    "buildPhases": 8,
    "estimatedTotalEffort": "~X engineer-hours (AI-assisted)"
  },
  "intakeConstraints": {},
  "buildPhases": [
    { "id": 1, "name": "Infrastructure & Provisioning", "taskIds": [] },
    { "id": 2, "name": "Database Schema & Migrations", "taskIds": [] },
    { "id": 3, "name": "Backend Core (Auth, Business Logic, APIs)", "taskIds": [] },
    { "id": 4, "name": "Frontend (Pages, Components, Routing)", "taskIds": [] },
    { "id": 5, "name": "Integrations & Middleware", "taskIds": [] },
    { "id": 6, "name": "Testing (Unit, Integration, E2E)", "taskIds": [] },
    { "id": 7, "name": "Marketing & Content", "taskIds": [] },
    { "id": 8, "name": "Launch (Deploy, Monitoring, Runbooks, PRs)", "taskIds": [] }
  ],
  "tasks": [],
  "marketingTasks": [],
  "pipelineMemoryUsed": [],
  "researchCitationCount": 0,
  "reconciliation": {
    "draftTasksReceived": 0,
    "tasksMerged": 0,
    "securityTasksAdded": 0,
    "glueTasksAdded": 0,
    "testTasksAdded": 0,
    "infraTasksAdded": 0,
    "dependencyCyclesFound": 0,
    "cyclesResolved": 0,
    "contributingPhases": [],
    "lessonsApplied": []
  }
}
```

**Phase 16 instructions:**
1. Merge all draftTasks — deduplicate by semantic similarity
2. Add infrastructure tasks (wrangler setup, D1/KV/R2 provisioning) as Build Phase 1
3. For every task touching auth/payment/user data: add a blocking security-review companion task
4. Balance test pyramid: ensure at least 1 integration test per 5 unit tests
5. Build dependency graph — detect and break cycles
6. Assign buildPhase 1–8 by category + dependency order
7. Write `naomiPrompt` for each task — must be completely self-contained (min 300 chars)
8. Populate `integrationContract` for each code task
9. Set `git.branchName` = `feature/task-XXX-<slug>` for each task
10. Set `git.mergeStrategy: "human-review-required"` for tasks touching gateway/auth/payments

---

## Important Notes

- Always cite sources for claims in phases 2–4. Use real search results if search keys are available.
- Each phase builds on prior outputs - reference them.
- Be realistic about numbers - don't hallucinate market sizes.
- The kill-test is a real decision gate - don't auto-pass.
- Phases 9–14 MUST include `draftTasks` arrays — Phase 16 depends on them.
- Phase 16 `naomiPrompt` fields must be completely self-contained (no "see prior context").
