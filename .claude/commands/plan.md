# /plan

Run the full 15-phase planning pipeline locally using Claude Code as the AI engine.
Results sync to Cloudflare after each phase.

## Usage

```
/plan "Your SaaS idea here"
```

## Workflow

When this skill is invoked with an idea:

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
2. customer-intel
3. market-research
4. competitive-intel
5. kill-test (CRITICAL: Check verdict - KILL/PIVOT/CONTINUE)
6. revenue-expansion
7. strategy
8. business-model
9. product-design
10. gtm-marketing
11. content-engine
12. tech-arch
13. analytics
14. launch-execution
15. synthesis

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

### Step 4: Complete

After synthesis phase:
```bash
npx tsx packages/foundation-cli/src/index.ts run complete <RUN_ID>
```

Output final message:
```
Planning run <RUN_ID> complete!

Next steps:
1. Run /clear to reset context
2. Run /audit-plan <RUN_ID> to check for hallucinations with fresh eyes
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

## Important Notes

- Always cite sources for claims. Use UNKNOWN if no evidence.
- Each phase builds on prior outputs - reference them.
- Be realistic about numbers - don't hallucinate market sizes.
- The kill-test is a real decision gate - don't auto-pass.
