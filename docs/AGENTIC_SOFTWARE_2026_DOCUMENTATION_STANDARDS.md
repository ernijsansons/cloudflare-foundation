# Elite Agentic Software Documentation Standards (2026)

## Executive Summary

This document defines the comprehensive documentation requirements for **elite agentic software in 2026** - autonomous systems capable of **one-shot execution** with zero additional human context required.

Our planning machine produces this documentation automatically through a 15-phase pipeline that culminates in a complete, validated, execution-ready documentation package.

---

## Core Principles

### 1. One-Shot Execution
- **Zero additional context required** after documentation is complete
- Agents can execute autonomously with full understanding of:
  - What they can do (allowed actions)
  - What they cannot do (forbidden actions)
  - When to ask for help (HITL thresholds)
  - How to verify correctness (verification standards)
  - Where state lives (memory horizon)

### 2. Fail-Closed by Default
- **Uncertainty → Pause & Escalate**
- No raw destructive operations
- All side effects are idempotent
- Every action has an auditable receipt

### 3. Human-in-the-Loop Precision
- HITL thresholds are **specific and measurable**
- Not "high value transactions" but "transactions > $10,000"
- Not "important changes" but "schema migrations affecting > 1000 rows"

---

## Section-by-Section Requirements

### Section A: Assumptions + Unknown Inputs (CRITICAL)

**Purpose**: Defines all constraints, boundaries, and success criteria upfront.

**Required Subsections**:

#### A0.1: Concept
- ✅ **codename**: Unique project identifier
- ✅ **thesis**: One-sentence value proposition
- ✅ **target_icp**: Specific role, company type, size (not "users" or "companies")
- ✅ **core_directive**: **THE** single highest-leverage autonomous task
- ✅ **why_now**: Market/tech trigger making this possible now

#### A0.2: Outcome Unit
- ✅ **definition**: Measurable, verifiable outcome (not a feature, an outcome)
- ✅ **proof_artifact**: What gets produced as evidence (PDF, API response, database record)
- ✅ **time_to_first_outcome**: Latency target (< 5 minutes, < 1 hour, etc.)
- ✅ **frequency**: How often outcomes are delivered (per run, daily, weekly)
- ✅ **current_cost**: Status quo cost (time/$$/risk)

#### A0.3: Agentic Execution (CRITICAL FOR 2026)
- ✅ **allowed_actions**: Explicit list of permitted operations
  - Example: "Read bank account transactions via Plaid API"
  - Example: "Generate reconciliation report (PDF)"
  - Example: "Send email notification to finance team"
- ✅ **forbidden_actions**: Hard constraints
  - Example: "Initiate money transfers"
  - Example: "Modify historical transactions"
  - Example: "Delete records"
- ✅ **hitl_threshold**: Conditions requiring human approval (MUST be specific)
  - ❌ Bad: "Large transactions"
  - ✅ Good: "Any transaction > $10,000"
  - ✅ Good: "Discrepancies > 5% of total"
  - ✅ Good: "Unmatched transactions after 2 retries"
- ✅ **required_integrations**: External systems (Plaid, Stripe, QuickBooks)
- ✅ **external_side_effects**: Emails, webhooks, purchases, updates

#### A0.4: Data & Trust
- ✅ **input_sources**: APIs/files/humans with licensing notes
  - Example: `{ source: "Plaid API", licensing: "OAuth delegated access per customer" }`
- ✅ **output_data_types**: Documents, messages, transactions
- ✅ **data_sensitivity**: PII/financial/health/minors classification
- ✅ **retention_requirements**: By data class (7 years GAAP, 90 days temp data)
- ✅ **ground_truth**: What sources are considered authoritative
  - Example: "Bank API data is source of truth for transactions"

#### A0.5: Constraints
- ✅ **budget_cap**: $$/month
- ✅ **timeline**: Weeks/months to MVP
- ✅ **geography**: Market constraints
- ✅ **compliance_bar**: bootstrap/SOC2-ready/regulated
- ✅ **performance_bar**: Latency, uptime, RPO/RTO
  - Example: "p95 < 30s, 99.9% uptime"

#### A0.6: Monetization
- ✅ **who_pays**: User/boss/third party
- ✅ **pricing_anchor**: Pricing model basis
- ✅ **sales_motion**: self-serve/sales-led/hybrid
- ✅ **value_metric**: per outcome/run/compute

#### A0.7: Success & Kill Switches
- ✅ **north_star**: Primary success metric
- ✅ **supporting_metrics**: Secondary KPIs
- ✅ **kill_conditions**: **Exactly 3** conditions that force KILL decision
  - Example: "Accuracy < 95% after 100 runs"
  - Example: "HITL rate > 50%"
  - Example: "Churn > 10%/month"
- ✅ **30_day_done**: 30-day success criteria
- ✅ **90_day_done**: 90-day success criteria

#### A1: Required Unknowns (ALL MUST BE RESOLVED)
- ✅ **core_directive**: The ONE autonomous task that matters
- ✅ **hitl_threshold**: List of actions where mistakes are catastrophic
- ✅ **tooling_data_gravity**: Which MCP servers/tools + CRUD actions required
- ✅ **memory_horizon**: Minutes/days/months + what must persist
- ✅ **verification_standard**: Sources + thresholds per claim/action

**Status Values**:
- "UNKNOWN" = BLOCKS progression
- "RESOLVED" = Confirmed as not applicable or already defined elsewhere
- Specific resolution = e.g., "RESOLVED - Plaid + QuickBooks APIs"

#### A2: Global Invariants (ALL MUST BE TRUE)
- ✅ **no_raw_destructive_ops**: LLM never executes raw DELETE/DROP operations
- ✅ **idempotent_side_effects**: All side effects are idempotent (can run N times safely)
- ✅ **auditable_receipts**: Every action has a receipt (UUID, timestamp, input/output)
- ✅ **llm_gateway**: All LLM calls go through gateway (e.g., "Cloudflare AI Gateway")
- ✅ **fail_closed**: Uncertainty → pause/escalate (never guess)

---

### Section B: North Star Metric

**Purpose**: Single metric that defines product success.

**Required**:
- ✅ Business statement (why this exists)
- ✅ Differentiation (why not competitors)
- ✅ Success metrics:
  - North star (e.g., "Weekly reconciliations per paying customer")
  - Supporting metrics (accuracy, time saved, HITL rate)

---

### Section C: Master Checklist (CRITICAL FOR EXECUTION)

**Purpose**: Detailed task breakdown with Definition of Done.

**Required Structure**:
- ✅ C1: Agent Definition
  - C1.1: Core directive locked
  - C1.2: System prompt + boundaries
  - C1.3: Tool manifest
- ✅ C2: Tool Definition
  - C2.1: MCP servers configured
  - C2.2: Tool permissions matrix
- ✅ C3: Infrastructure
  - C3.1: Cloudflare resources provisioned
  - C3.2: Database schema deployed
- ✅ C4-C20: Remaining categories

**Task Format**:
```json
{
  "id": "C1.1",
  "task": "Core Directive locked",
  "dod": "Single directive, outcome unit, proof artifact defined",
  "owner": "GM",
  "tools": "doc",
  "effort": "S",
  "dependencies": ["A0"],
  "status": "done" | "in-progress" | "pending"
}
```

---

### Section D: Cloudflare Architecture (REQUIRED)

**Purpose**: Technical architecture decisions and data models.

**Required**:
- ✅ Architecture diagram
- ✅ Component decisions:
  - Workers (API, background jobs)
  - D1 (database schema)
  - R2 (file storage)
  - KV (cache, sessions)
  - Durable Objects (stateful coordination)
  - Queues (async processing)
  - Workflows (long-running orchestration)
- ✅ Data model (ER diagram + table definitions)
- ✅ API design (routes + request/response formats)

---

### Section E: Frontend System

**Purpose**: UX primitives and component library.

**Required**:
- ✅ Design system (colors, typography, spacing)
- ✅ Component library (buttons, forms, modals)
- ✅ Onboarding flow (user activation)
- ✅ Key user journeys

---

### Section F: Backend/Middleware (CRITICAL FOR AGENTIC)

**Purpose**: Workflow patterns and verification.

**Required**:
- ✅ Workflow patterns (Temporal, Cloudflare Workflows)
- ✅ MCP governance (tool permissions, rate limits)
- ✅ Receipts & verification:
  - Every autonomous action → UUID + timestamp + input/output
  - Verification chain (how to prove correctness)
- ✅ Admin panel (monitoring + manual overrides)

---

### Section G: Pricing + Unit Economics

**Purpose**: Revenue model and sustainability.

**Required**:
- ✅ Value metric (what customer pays for)
- ✅ Cost drivers (COGS breakdown)
- ✅ Markup model (target margin)
- ✅ Unit economics (CAC, LTV, payback period)

---

### Section H: Go-to-Market

**Purpose**: Acquisition and growth strategy.

**Required**:
- ✅ Positioning (why now, why us)
- ✅ Proof assets (case studies, demos)
- ✅ Acquisition channels (SEO, content, partnerships)
- ✅ Funnel metrics (conversion rates at each stage)

---

### Section I: Brand Identity

**Purpose**: Naming, visual identity, messaging.

**Required**:
- ✅ Naming (product name, domain)
- ✅ Visual identity (logo, color palette)
- ✅ Content templates (blog posts, social)

---

### Section J: Security + Compliance (CRITICAL FOR PRODUCTION)

**Purpose**: Threat mitigation and regulatory compliance.

**Required**:
- ✅ Threat model (STRIDE analysis)
- ✅ Controls:
  - Authentication (OAuth, JWT, etc.)
  - Authorization (RBAC, ABAC)
  - Data encryption (at rest, in transit)
  - Input validation
  - Rate limiting
- ✅ Data handling (PII, financial, health)
- ✅ Incident response (24/7 on-call, runbooks)
- ✅ Compliance (SOC2, GDPR, HIPAA)

---

### Section K: Testing + Observability (CRITICAL FOR VERIFICATION)

**Purpose**: Continuous verification and monitoring.

**Required**:
- ✅ Testing strategy:
  - Unit tests (Jest, Vitest)
  - Integration tests (Playwright)
  - E2E tests (Cypress)
  - **Continuous evals** (LLM verification on every run)
- ✅ Monitoring:
  - Uptime SLO (99.9%)
  - Latency targets (p95 < 500ms)
  - Error rates (< 0.1%)
- ✅ Observability:
  - Distributed tracing
  - Structured logging
  - Metrics dashboards
- ✅ Rollback strategy (blue-green, canary)

---

### Section L: Operations Playbook (REQUIRED FOR MAINTENANCE)

**Purpose**: Day-to-day operations and support.

**Required**:
- ✅ Operating cadence (standups, retros, planning)
- ✅ Support workflow (Tier 1-3 escalation)
- ✅ Churn playbook (win-back campaigns)
- ✅ Billing operations (Stripe automation)
- ✅ Incident response (PagerDuty, runbooks)

---

### Section M: Execution Roadmap (REQUIRED FOR PLANNING)

**Purpose**: 90-day execution plan with gates.

**Required**:
- ✅ Phases:
  - Phase 0: Foundation (infra setup)
  - Phase 1: MVP (core features)
  - Phase 2: Beta (user validation)
  - Phase 3: Launch (public release)
  - Phase 4: Scale (growth)
- ✅ Week-by-week gates
- ✅ Critical path (dependencies)
- ✅ Risk mitigation

---

## Overview Section (Auto-Generated)

**Purpose**: High-level executive summary synthesized from all sections.

**Structure**:
```json
{
  "executive_summary": {
    "concept": "From Section A",
    "status": "planning | in-progress | completed",
    "completeness": 95,
    "key_metrics": { "north_star": "From Section B" }
  },
  "quick_stats": {
    "budget": "From Section A",
    "timeline": "From Section A",
    "north_star_metric": "From Section B",
    "current_phase": "Phase 2: Beta"
  },
  "health_indicators": {
    "documentation_complete": true,
    "unknowns_resolved": true,
    "checklist_progress": 85,
    "security_coverage": 100
  },
  "critical_path": {
    "next_milestone": "From Section M",
    "blockers": [],
    "dependencies": []
  },
  "quick_actions": [
    { "label": "Review Assumptions", "link": "#section-A" },
    { "label": "View Roadmap", "link": "#section-M" }
  ]
}
```

---

## Validation Checklist (2026 Standards)

### Phase 0: Intake ✅
- [ ] A0-A7 fully populated
- [ ] All 5 A1 unknowns resolved (not "UNKNOWN")
- [ ] All A2 invariants confirmed (all `true`)
- [ ] Core directive is specific and measurable
- [ ] HITL thresholds are quantified (not "high" or "critical")

### Planning Phases 1-15 ✅
- [ ] Each phase populates assigned sections
- [ ] Phase outputs are validated against rubrics
- [ ] RAG context is embedded for future retrieval

### Documentation Synthesis ✅
- [ ] All 13 sections (A-M) populated
- [ ] Completeness ≥ 90%
- [ ] Quality score ≥ 80
- [ ] No blockers for execution

### Agentic Execution Readiness ✅
- [ ] Core directive defined
- [ ] Allowed actions enumerated
- [ ] Forbidden actions enumerated
- [ ] HITL thresholds specific
- [ ] Security controls present (Section J)
- [ ] Testing strategy comprehensive (Section K)
- [ ] Operations playbook exists (Section L)
- [ ] Master checklist complete (Section C)
- [ ] Unknowns resolved (A1)

---

## Quality Score Calculation

**Formula**:
```
Quality Score = Completeness (30) + Unknowns (20) + Critical Sections (50)

Where:
- Completeness: (populated_sections / 13) * 30
- Unknowns: (resolved_unknowns / 5) * 20
- Critical Sections: presence of A, C, D, J, K (10 points each)

Minimum for Production: 80/100
```

---

## Integration with Naomi (One-Shot Execution)

When quality score ≥ 80 and all blockers resolved:

1. **Assign to Naomi** via production Kanban
2. **Naomi receives**:
   - Complete TASKS.json (from Phase 16)
   - Full documentation package (Sections A-M)
   - Planning artifacts (all 15 phases)
3. **Naomi executes**:
   - Uses Section A for constraints
   - Uses Section C for checklist
   - Uses Section D for architecture
   - Uses Section J for security
   - Uses Section K for testing
   - Uses Section L for operations
4. **Verification**:
   - Continuous evals (Section K)
   - Receipt validation (Section F)
   - Security scanning (Section J)

---

## What Makes This "Elite" for 2026?

### 1. Zero Ambiguity
- Every constraint is explicit
- Every boundary is defined
- Every threshold is quantified

### 2. Fail-Safe Architecture
- Destructive ops require human approval
- Side effects are idempotent
- Every action is auditable

### 3. Verification by Default
- Continuous evals on every run
- Ground truth sources defined
- Verification standard specified

### 4. Production-Ready from Day 1
- Security controls comprehensive
- Operations playbook complete
- Incident response defined

### 5. Human-in-the-Loop Precision
- Not "ask when unsure"
- But "ask when transaction > $10k OR discrepancy > 5%"

---

## Maintenance

### When to Re-Run Synthesis
- After any manual section edits
- When adding new unknowns
- When architecture changes
- Before assigning to Naomi

### Version Control
- Documentation is versioned with planning runs
- Each synthesis creates new artifact
- Historical versions preserved in D1

---

## Conclusion

This documentation system enables **true one-shot agentic execution** by:
1. Capturing all constraints upfront (Section A)
2. Defining measurable success (Section B)
3. Breaking down execution (Section C)
4. Specifying architecture (Sections D-F)
5. Ensuring security (Section J)
6. Enabling verification (Section K)
7. Supporting operations (Section L)
8. Planning execution (Section M)

**Result**: Naomi can build entire products autonomously with zero additional context.

This is the standard for **elite agentic software in 2026**.
