# /audit-plan

Audit a planning run for hallucinations, inconsistencies, and unsourced claims.

**CRITICAL**: This skill must be run AFTER `/clear` to ensure fresh context with no memory of generating the content.

## Usage

```
/audit-plan <run-id>
```

## Purpose

When you generated a planning run, you may have:
- Made up statistics without sources
- Created internally contradictory claims
- Hallucinated market data or competitor info
- Made overly optimistic projections

This audit catches those issues by reviewing with completely fresh context.

## Workflow

### Step 1: Fetch Audit Prompt

```bash
cd C:\dev\.cloudflare\cloudflare-foundation-dev
npx tsx packages/foundation-cli/src/index.ts audit <RUN_ID>
```

This outputs a structured audit prompt with all artifacts.

### Step 2: Systematic Review

For each phase artifact, check:

#### 1. Unsourced Claims
- Any statistics (percentages, market sizes, growth rates)
- Any "X% of users do Y" claims
- Any specific numbers that aren't cited
- Mark each as: SOURCED | UNSOURCED | UNKNOWN

#### 2. Internal Contradictions
Compare across phases:
- Does market-research TAM match business-model assumptions?
- Does customer-intel pricing match revenue-expansion model?
- Does competitive-intel positioning match strategy differentiation?
- Does tech-arch scale match analytics targets?

#### 3. Logical Gaps
- Are there unstated assumptions?
- Do conclusions follow from evidence?
- Are there missing steps in reasoning?

#### 4. Hallucination Indicators
Red flags to look for:
- Very specific numbers without sources (e.g., "47.3% CAGR")
- Competitor details that seem fabricated
- Market data that's too convenient
- Claims that can't be verified

#### 5. Outdated Information
- Check if referenced technologies are current
- Verify market conditions haven't changed
- Ensure regulatory info is up to date

### Step 3: Generate Audit Report

Output JSON report:

```json
{
  "summary": "Overall assessment in 1-2 sentences",
  "overallScore": 75,
  "issues": [
    {
      "phase": "market-research",
      "severity": "critical|high|medium|low",
      "type": "unsourced|contradiction|logical_gap|hallucination|outdated",
      "claim": "The specific claim that's problematic",
      "problem": "Why this is an issue",
      "suggestion": "How to fix it"
    }
  ],
  "strengths": [
    "What's done well"
  ],
  "recommendations": [
    "Overall recommendations for improvement"
  ]
}
```

### Step 4: Offer Fixes

After presenting the audit report, ask:

```
Would you like me to fix these issues? I can:
1. Update specific phases with corrections
2. Add [UNVERIFIED] tags to unsourced claims
3. Resolve contradictions by adjusting related phases

Which issues should I address?
```

### Step 5: Apply Fixes (if requested)

For each fix:
1. Generate corrected phase output
2. Sync using:
```bash
echo '<CORRECTED_JSON>' | npx tsx packages/foundation-cli/src/index.ts sync <PHASE> <RUN_ID> --stdin
```

---

## Scoring Rubric

### Overall Score (0-100)

- **90-100**: Excellent - minimal issues, well-sourced
- **75-89**: Good - some unsourced claims, no major issues
- **50-74**: Fair - multiple issues need attention
- **25-49**: Poor - significant hallucinations or contradictions
- **0-24**: Critical - requires major revision

### Severity Levels

- **Critical**: Fundamental flaw that invalidates the analysis
- **High**: Significant issue that affects conclusions
- **Medium**: Notable issue that should be addressed
- **Low**: Minor issue, nice to fix but not blocking

---

## Example Audit Output

```json
{
  "summary": "Generally solid analysis with 3 unsourced market claims and 1 internal contradiction between pricing assumptions.",
  "overallScore": 72,
  "issues": [
    {
      "phase": "market-research",
      "severity": "high",
      "type": "unsourced",
      "claim": "The API management market is growing at 32% CAGR",
      "problem": "No source cited for this growth rate",
      "suggestion": "Find and cite industry report (e.g., Gartner, Forrester) or mark as estimated"
    },
    {
      "phase": "business-model",
      "severity": "medium",
      "type": "contradiction",
      "claim": "Average contract value of $50k/year",
      "problem": "Contradicts customer-intel which suggests SMB focus with $500/mo pricing",
      "suggestion": "Align pricing across phases - either enterprise ($50k) or SMB ($6k/yr)"
    },
    {
      "phase": "competitive-intel",
      "severity": "low",
      "type": "hallucination",
      "claim": "Competitor X has 47 enterprise customers",
      "problem": "This specific number is suspicious - likely fabricated",
      "suggestion": "Remove specific number or find public source (press releases, case studies)"
    }
  ],
  "strengths": [
    "Customer segments are well-defined with clear pain points",
    "Technical architecture is realistic and well-reasoned",
    "Go-to-market strategy aligns with target market"
  ],
  "recommendations": [
    "Add citations to all market size and growth claims",
    "Reconcile SMB vs Enterprise focus across all phases",
    "Remove or verify all specific competitor metrics"
  ]
}
```

---

## Important Notes

1. **Fresh Context is Critical**: This audit only works if you have NO memory of generating the content. Run `/clear` first.

2. **Be Skeptical**: Assume everything is wrong until proven right. Your job is to find issues.

3. **Don't Defend**: You may have generated this content, but treat it as if someone else did. Be objective.

4. **Prioritize**: Focus on issues that would change business decisions, not minor wording issues.

5. **Suggest Fixes**: Don't just identify problems - propose concrete solutions.
