# Quick Reference: Elite Agentic Documentation System (2026)

## 🎯 One-Page Overview

### What This System Does
**Automatically generates complete, execution-ready documentation** for agentic software through a 15-phase planning pipeline. Enables **one-shot autonomous execution** with **zero additional human context** required.

---

## 📊 Section Structure (14 Total)

| Section | Name | Populated By | Critical? |
|---------|------|--------------|-----------|
| **Overview** | Executive Summary | Auto-generated | ⭐ View First |
| **A** | Assumptions + Unknowns | Phase 0 (Intake) | 🔥 CRITICAL |
| **B** | North Star Metric | Phase 15 (Synthesis) | ⭐ |
| **C** | Master Checklist | Phases 12-14 | 🔥 CRITICAL |
| **D** | Architecture | Phase 12 (Tech Arch) | 🔥 CRITICAL |
| **E** | Frontend System | Phase 9 (Product Design) | |
| **F** | Backend/Middleware | Phase 12 (Tech Arch) | |
| **G** | Pricing + Unit Economics | Phases 6, 8 | |
| **H** | Go-to-Market | Phases 10, 11 | |
| **I** | Brand Identity | Phase 11 | |
| **J** | Security + Compliance | Phase 12 (Tech Arch) | 🔥 CRITICAL |
| **K** | Testing + Observability | Phase 13 (Analytics) | 🔥 CRITICAL |
| **L** | Operations Playbook | Phase 14 (Launch) | |
| **M** | Execution Roadmap | Phase 15 (Synthesis) | |

---

## 🔥 Critical Section A (Assumptions)

### A0: Intake Form (7 Subsections)
1. **Concept**: codename, thesis, target ICP, **core directive**, why now
2. **Outcome Unit**: definition, proof artifact, time to first, frequency, current cost
3. **Agentic Execution**: allowed actions, forbidden actions, **HITL thresholds**, integrations
4. **Data & Trust**: input sources, sensitivity, ground truth
5. **Constraints**: budget, timeline, compliance, performance
6. **Monetization**: who pays, pricing anchor, value metric
7. **Success & Kill Switches**: north star, **3 kill conditions**, 30/90-day done

### A1: Unknowns (All MUST be Resolved)
- ✅ core_directive
- ✅ hitl_threshold
- ✅ tooling_data_gravity
- ✅ memory_horizon
- ✅ verification_standard

### A2: Invariants (All MUST be True)
- ✅ no_raw_destructive_ops
- ✅ idempotent_side_effects
- ✅ auditable_receipts
- ✅ llm_gateway
- ✅ fail_closed

---

## 🚀 Quality Score

```
Quality Score = Completeness (30) + Unknowns (20) + Critical Sections (50)

Minimum for Production: 80/100
```

**Completeness**: (populated_sections / 13) × 30
**Unknowns**: (resolved_unknowns / 5) × 20
**Critical Sections**: A, C, D, J, K present (10 points each)

---

## 🔑 Key Files

### Backend
```
services/gateway/src/routes/project-docs.ts       # Documentation API
services/gateway/src/lib/doc-generator.ts         # Overview generation
services/planning-machine/src/agents/intake-agent.ts  # Phase 0 intake
services/planning-machine/src/lib/phase-to-section-mapper.ts  # Phase → Section
services/planning-machine/src/workflows/doc-synthesis-workflow.ts  # Validation
```

### Frontend
```
services/ui/src/lib/components/ProjectCard/ProjectCard.svelte  # Main card
services/ui/src/lib/components/ProjectCard/Sidebar.svelte      # Navigation
services/ui/src/lib/components/ProjectCard/SectionA-M.svelte   # Section renderers
services/ui/src/routes/ai-labs/production/+page.svelte         # Kanban modal
```

### Database
```
services/gateway/migrations/0005_project_documentation.sql  # Schema
```

### Types
```
packages/shared/src/types/project-documentation.ts  # All section types
```

---

## 📡 API Endpoints

```http
# Fetch all documentation
GET /api/projects/:projectId/docs

# Fetch specific section
GET /api/projects/:projectId/docs/sections/:sectionId

# Update section
PUT /api/projects/:projectId/docs/sections/:sectionId

# Generate overview
POST /api/projects/:projectId/docs/generate-overview

# Export documentation
GET /api/projects/:projectId/docs/export?format=json|markdown
```

---

## ✅ Validation Checklist

### Before Assigning to Naomi
- [ ] Quality score ≥ 80
- [ ] Completeness ≥ 90%
- [ ] All unknowns resolved (not "UNKNOWN")
- [ ] Core directive defined
- [ ] HITL thresholds specific (not "high" or "critical")
- [ ] Security controls present (Section J)
- [ ] Testing strategy comprehensive (Section K)
- [ ] Master checklist complete (Section C)

---

## 🎯 HITL Threshold Examples

### ❌ Bad (Vague)
- "Large transactions"
- "Important changes"
- "Risky operations"

### ✅ Good (Specific)
- "Any transaction > $10,000"
- "Schema migrations affecting > 1000 rows"
- "Unmatched transactions after 2 retries"
- "Discrepancies > 5% of total"

---

## 🧪 Testing

```bash
# Run unit tests
cd services/planning-machine
npm test

# Run specific test
npm test doc-flow.test.ts

# Check coverage
npm test -- --coverage
```

---

## 🚨 Troubleshooting

### Documentation Not Populating
```bash
# Check database
wrangler d1 execute foundation-primary --command="SELECT * FROM project_documentation WHERE project_id = 'YOUR_ID'"

# Check workflow logs
wrangler tail planning-machine-workflow
```

### Unknowns Not Resolved
- Run intake agent in interactive mode
- Manually update Section A via API
- Re-run synthesis workflow

### Quality Score Too Low
```bash
# Run synthesis to get detailed report
wrangler workflows trigger doc-synthesis --param="projectId=YOUR_ID"

# View report
wrangler d1 execute foundation-primary --command="SELECT * FROM planning_artifacts WHERE phase = 'doc-synthesis' ORDER BY created_at DESC LIMIT 1"
```

---

## 📚 Documentation Links

- **Standards**: `docs/AGENTIC_SOFTWARE_2026_DOCUMENTATION_STANDARDS.md`
- **Implementation Guide**: `docs/COMPLETE_DOCUMENTATION_SYSTEM_GUIDE.md`
- **Completion Summary**: `docs/IMPLEMENTATION_COMPLETE.md`

---

## 🎓 Quick Start

### 1. Run Planning Pipeline
```
1. Navigate to /ai-labs/research
2. Submit idea
3. Wait for completion (Phases 0-15)
```

### 2. View Documentation
```
1. Navigate to /ai-labs/production
2. Click project card
3. Modal opens with full documentation
4. Navigate sections via sidebar
```

### 3. Assign to Naomi
```
1. Verify quality score ≥ 80
2. Check completeness ≥ 90%
3. Click "Assign to Naomi"
4. Enter repo URL
5. Naomi executes one-shot
```

---

## 🏆 Success Criteria

**Documentation Quality**:
- Average completeness: **95%**
- Average quality score: **87/100**
- Unknowns resolution: **100%**

**User Experience**:
- Time to understand: **< 5 min**
- Section navigation: **< 1s**
- Doc load time: **< 2s**

**Business Impact**:
- One-shot success rate: **> 80%**
- Context-gathering reduction: **> 90%**
- Documentation reuse: **> 50%**

---

**Status**: ✅ Production-Ready
**Version**: 1.0.0
**Last Updated**: 2026-02-19

---

**For detailed information, see**: `COMPLETE_DOCUMENTATION_SYSTEM_GUIDE.md`
