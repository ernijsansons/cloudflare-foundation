# Research Grounding — Preventing Hallucinated Market Data

## The Problem

Without live web search, AI agents in phases 2–4 will:
- Fabricate competitor names, features, and pricing
- Invent market size numbers (TAM/SAM/SOM)
- Hallucinate customer pain points without real evidence
- Produce tasks based on a product that doesn't match actual market conditions

All downstream phases (strategy, architecture, task generation) are built on this foundation. Hallucinated research produces wrong tasks for the wrong product.

## The Solution: Tavily/Brave Grounding

The `research-grounding.ts` module runs before phases 2, 3, and 4:

```typescript
import { groundPhaseWithSearch } from "../lib/research-grounding";

const bundles = await groundPhaseWithSearch(env, "market-research", idea, [
  `${idea} market size 2024`,
  `${idea} competitors pricing`,
  `${idea} customer problems Reddit`,
]);

const groundingContext = formatGroundingContext(bundles);
// → inject into agent system prompt
```

## Search Query Strategy

Each phase uses phase-specific queries:

**Phase 2 (Market Research):**
- `{idea} market size TAM SAM SOM 2024`
- `{idea} industry growth rate`
- `{idea} target customer demographics`
- `{idea} pricing models SaaS`

**Phase 3 (Competitive Intel):**
- `{idea} competitors comparison`
- `{idea} alternative tools`
- top 5 competitor names + `pricing features reviews`

**Phase 4 (Customer Intel):**
- `{idea} customer complaints Reddit`
- `{idea} problems forum`
- `{idea} user reviews G2 Capterra`

## Citations Schema

Every research phase output must include a `citations` array:

```json
{
  "citations": [
    {
      "url": "https://example.com/report",
      "title": "SaaS Market Report 2024",
      "publishedDate": "2024-01-10",
      "relevance": "market-size",
      "quote": "The global SaaS market reached $197B in 2023",
      "confidence": "high"
    }
  ]
}
```

`confidence` values:
- `high` — primary source, recent, directly relevant
- `medium` — secondary source or slightly dated
- `low` — indirect evidence, use with caution

## Minimum Citation Requirements

The `validateCitations()` function enforces:

| Phase | Minimum Citations |
|-------|-------------------|
| market-research | 5 |
| competitive-intel | 3 |
| customer-intel | 3 |

If a phase produces fewer citations than required, the workflow logs a warning and the phase output is flagged with `researchQuality: "insufficient"`.

The Phase 16 reconciliation agent reads this flag and adds a `[LOW RESEARCH QUALITY]` warning to the naomiPrompts for tasks generated from that phase's data.

## Environment Setup

Set one of these in `.dev.vars`:

```
# Option 1: Tavily (recommended — designed for AI agents)
TAVILY_API_KEY=tvly-xxxxxxxxxx

# Option 2: Brave Search
BRAVE_SEARCH_API_KEY=xxxxxxxxxx
```

The `groundPhaseWithSearch()` function tries Tavily first, falls back to Brave.

## What Happens Without Search Keys

If neither key is set:
- Phases 2–4 run without grounding
- Output schemas still require `citations: []` (empty array is valid)
- All phases complete but are flagged `researchQuality: "ungrounded"`
- Phase 16 adds a top-level warning to TASKS.json
- The kill test (Phase 5) will likely output KILL or PIVOT since no evidence supports GO

This is intentional — the system degrades gracefully but makes the lack of grounding visible.

## Viewing Research Quality

After a planning run:

```bash
npx tsx planning-machine/scripts/generate-scaffold.ts <RUN_ID>
cat planning-machine/output/<RUN_ID>/TASKS.json | jq '.researchCitationCount'
```

A `researchCitationCount` above 15 indicates well-grounded research.
