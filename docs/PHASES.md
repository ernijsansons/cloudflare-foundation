# Planning Machine Phases

The Planning Machine runs ideas through a 15-phase validation and planning pipeline. This document describes each phase, its purpose, inputs, outputs, and success criteria.

## Phase Pipeline Overview

```
Discovery (1-4)     Validation (5)     Strategy (6-8)     Design (9-11)     Execution (12-15)
   │                    │                 │                  │                   │
   ▼                    ▼                 ▼                  ▼                   ▼
┌────────┐         ┌─────────┐      ┌──────────┐      ┌───────────┐      ┌────────────┐
│ Opport.│         │Kill-Test│      │  Revenue │      │  Product  │      │ Tech Arch  │
│ Custom.│   ──►   │         │ ──►  │  Strategy│ ──►  │  GTM      │ ──►  │ Analytics  │
│ Market │         │GO/KILL/ │      │  Business│      │  Content  │      │ Launch     │
│ Compet.│         │ PIVOT   │      │          │      │           │      │ Synthesis  │
└────────┘         └─────────┘      └──────────┘      └───────────┘      └────────────┘
```

## Stage 1: Discovery

### Phase 1: Opportunity Analysis

**Purpose:** Refine the raw idea into validated opportunities with market potential.

**Inputs:**
- Raw idea description
- Initial context

**Outputs:**
- Refined opportunities array (3+ variants)
- Key insight
- Recommended opportunity index
- Unknown factors to investigate

**Success Criteria:**
- 3+ refined opportunity variants generated
- Clear recommendation with rationale
- Identified unknowns for next phases

---

### Phase 2: Customer Intelligence

**Purpose:** Build detailed customer profiles, pain points, and jobs-to-be-done.

**Inputs:**
- Refined opportunity
- Market context

**Outputs:**
- Customer segments (3+)
- Pain points per segment with severity
- Jobs to be done
- Buying triggers

**Success Criteria:**
- 3+ customer segments identified
- Specific pain points with severity ratings
- Clear value proposition per segment

---

### Phase 3: Market Research

**Purpose:** Analyze market size, trends, and dynamics for the opportunity.

**Inputs:**
- Refined opportunity
- Customer segments

**Outputs:**
- TAM/SAM/SOM estimates
- Market trends
- Growth projections
- Regulatory factors

**Success Criteria:**
- Sourced market size estimates
- Identified growth drivers
- Clear market timing assessment

---

### Phase 4: Competitive Intelligence

**Purpose:** Map the competitive landscape and identify positioning opportunities.

**Inputs:**
- Market research
- Customer segments

**Outputs:**
- Competitor matrix (5+ competitors)
- Positioning gaps
- Competitive advantages
- Threats and moats

**Success Criteria:**
- 5+ competitors analyzed
- Clear differentiation strategy
- Identified market gaps

---

## Stage 2: Validation

### Phase 5: Kill Test

**Purpose:** Critical evaluation gate to KILL, PIVOT, or GO with the opportunity.

**Inputs:**
- All discovery phase outputs

**Outputs:**
- Verdict: `KILL` | `PIVOT` | `GO`
- Risk assessment
- Critical blockers
- Pivot suggestions (if PIVOT)
- Parked idea record (if KILL with future potential)

**Success Criteria:**
- Clear verdict with rationale
- Quantified risk factors
- Actionable next steps

**Special Behavior:**
- `KILL`: Run terminates, idea optionally parked for future
- `PIVOT`: Clears discovery phases and restarts from Phase 1 (max 3 pivots)
- `GO`: Proceeds to Strategy phases

---

## Stage 3: Strategy

### Phase 6: Revenue Expansion

**Purpose:** Identify revenue streams, pricing models, and expansion opportunities.

**Inputs:**
- Validated opportunity
- Customer segments
- Competitive intel

**Outputs:**
- Revenue model options
- Pricing strategies
- Expansion vectors
- Revenue projections

**Success Criteria:**
- Multiple revenue streams identified
- Pricing validated against market
- Clear path to profitability

---

### Phase 7: Strategy

**Purpose:** Define the overall business strategy and competitive positioning.

**Inputs:**
- Revenue model
- Market research
- Competitive intel

**Outputs:**
- Strategic pillars
- Positioning statement
- Key differentiators
- Strategic milestones

**Success Criteria:**
- Clear strategic direction
- Defensible positioning
- Measurable milestones

---

### Phase 8: Business Model

**Purpose:** Design the complete business model and unit economics.

**Inputs:**
- Strategy
- Revenue model
- Customer segments

**Outputs:**
- Business model canvas
- Unit economics (CAC, LTV, payback)
- Cost structure
- Key partnerships

**Success Criteria:**
- Positive unit economics
- Clear value chain
- Identified key resources

---

## Stage 4: Design

### Phase 9: Product Design

**Purpose:** Define product features, MVP scope, and product roadmap.

**Inputs:**
- Business model
- Customer intel
- Strategy

**Outputs:**
- Feature prioritization matrix
- MVP definition
- Product roadmap (quarters)
- User flows

**Success Criteria:**
- MVP scope clearly defined
- Features mapped to customer needs
- Realistic development timeline

---

### Phase 10: Go-to-Market & Marketing

**Purpose:** Plan the go-to-market strategy and marketing approach.

**Inputs:**
- Product design
- Customer segments
- Positioning

**Outputs:**
- GTM strategy
- Marketing channels with CAC estimates
- Launch plan
- Customer acquisition model

**Success Criteria:**
- Clear launch strategy
- CAC estimates by channel
- First 100 customer acquisition plan

---

### Phase 11: Content Engine

**Purpose:** Design the content strategy for acquisition and engagement.

**Inputs:**
- GTM strategy
- Customer segments
- Positioning

**Outputs:**
- Content pillars
- Content calendar
- SEO strategy
- Distribution channels

**Success Criteria:**
- Content mapped to funnel stages
- Clear content differentiation
- Measurable content KPIs

---

## Stage 5: Execution

### Phase 12: Technical Architecture

**Purpose:** Define the technical architecture and infrastructure requirements.

**Inputs:**
- Product design
- Business model
- Scale projections

**Outputs:**
- System architecture diagram
- Tech stack recommendations
- Infrastructure plan
- Security considerations

**Success Criteria:**
- Scalable architecture
- Clear build vs buy decisions
- Security requirements documented

---

### Phase 13: Analytics & Metrics

**Purpose:** Define the metrics framework and analytics strategy.

**Inputs:**
- Business model
- GTM strategy
- Product design

**Outputs:**
- KPI framework (North Star + supporting metrics)
- Analytics implementation plan
- Dashboard specifications
- Experimentation/A/B testing plan

**Success Criteria:**
- Clear success metrics
- Attribution model defined
- Data infrastructure planned

---

### Phase 14: Launch Execution

**Purpose:** Create the detailed launch plan and execution timeline.

**Inputs:**
- All prior phase outputs

**Outputs:**
- Launch checklist
- Timeline with milestones
- Resource allocation
- Risk mitigation plan

**Success Criteria:**
- Comprehensive launch checklist
- Dependencies mapped
- Contingency plans in place

---

### Phase 15: Synthesis

**Purpose:** Consolidate all insights into an actionable business plan.

**Inputs:**
- All phase outputs

**Outputs:**
- Executive summary
- Full business plan document
- Investment thesis (if applicable)
- Prioritized next actions

**Success Criteria:**
- Coherent narrative across all phases
- All sections aligned and consistent
- Clear call to action

---

## Review Process

When `requireReview: true` is set, each phase output goes through a review cycle:

1. **Agent generates output**
2. **Reviewer evaluates** against phase rubric
3. **Verdict:** `ACCEPT` | `REVISE` | `REJECT`
   - `ACCEPT`: Phase complete, proceed
   - `REVISE`: Re-run agent with feedback (max 3 iterations)
   - `REJECT`: Goes to tiebreaker review

After max revisions, a tiebreaker review makes final decision.

---

## Pivot Mechanics

When kill-test returns `PIVOT`:

1. Discovery phases (1-4) are cleared
2. Kill-test (5) is cleared
3. Pipeline restarts from Phase 1
4. Maximum 3 pivots allowed
5. After 3 pivots, next PIVOT becomes `PIVOT_EXHAUSTED` (treated as KILL)

Each pivot attempts to find a more viable angle on the original idea.
