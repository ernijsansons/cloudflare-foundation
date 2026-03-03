# Research Phase Audit

Deep audit of the Planning Machine research pipeline - the 18-phase AI research engine.

## Audit Checklist

### 1. Agent Registry Verification
Check all 18 agents exist and are properly registered:
```
services/planning-machine/src/agents/
├── opportunity-agent.ts
├── customer-intel-agent.ts
├── market-research-agent.ts
├── competitive-intel-agent.ts
├── kill-test-agent.ts
├── revenue-expansion-agent.ts
├── strategy-agent.ts
├── business-model-agent.ts
├── product-design-agent.ts
├── gtm-agent.ts
├── content-engine-agent.ts
├── tech-arch-agent.ts
├── analytics-agent.ts
├── launch-execution-agent.ts
├── synthesis-agent.ts
├── task-reconciliation-agent.ts
├── diagram-generator-agent.ts
└── validator-agent.ts
```

### 2. Phase Order Validation
Verify canonical phase order in `packages/shared/src/types/planning-phases.ts`:
1. opportunity → 2. customer-intel → 3. market-research → 4. competitive-intel
5. kill-test (GATE) → 6. revenue-expansion → 7. strategy → 8. business-model
9. product-design → 10. gtm-marketing → 11. content-engine → 12. tech-arch
13. analytics → 14. launch-execution → 15. synthesis → 16. task-reconciliation
17. diagram-generation → 18. validation

### 3. Database Tables (planning-primary)
Verify these tables exist and have correct schema:
- `planning_runs` - Run metadata, status, current phase
- `planning_artifacts` - Phase outputs (JSON), quality scores
- `planning_sources` - Web search citations
- `planning_memory` - RAG embeddings
- `planning_quality` - Per-dimension scores
- `orchestration_outputs` - Multi-model results
- `ideas` - Idea cards

Run:
```bash
cd services/planning-machine
npx wrangler d1 execute planning-primary --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 4. Workflow Integrity
Check `planning-workflow.ts` (~900 lines):
- Phase execution loop intact
- Kill-test gate logic working (CONTINUE/PIVOT/KILL)
- Quality scoring and reviewer loop
- Error handling and retries

### 5. Orchestrator Health
Verify `services/planning-machine/src/lib/orchestrator.ts`:
- Multi-model parallel inference (Workers AI + Anthropic + Nvidia)
- Model routing logic
- Fallback handling

### 6. Web Search Integration
Check search agents have working API keys:
- TAVILY_API_KEY for Tavily search
- BRAVE_API_KEY for Brave search
- Verify customer-intel, market-research, competitive-intel agents use search

### 7. API Endpoints
Test planning machine routes via gateway proxy:
```bash
# List runs
curl -s "https://gateway.erlvinc.com/api/public/planning/runs?tenant_id=default" | head -c 500

# Get run details
curl -s "https://gateway.erlvinc.com/api/public/planning/runs/{RUN_ID}" | head -c 500

# Get phase artifacts
curl -s "https://gateway.erlvinc.com/api/public/planning/runs/{RUN_ID}/artifacts/{PHASE}" | head -c 500
```

### 8. Quality Metrics
For existing runs, check:
- Quality scores populated (0-100)
- Reviewer feedback stored
- Artifact validation passing

### 9. Documentation Synthesis
Verify synthesis agent populates project_documentation:
- All 14 sections created (overview, A-M)
- Content matches TypeScript interfaces
- Status progression: draft → reviewed → approved

### 10. Task Reconciliation
Check task-reconciliation agent:
- Merges draftTasks from phases 9-14
- Produces valid TASKS.json
- Tasks have proper structure (id, description, dependencies, effort)

## Output Required

1. **Agent Status Table**: Each agent with status (Present/Missing/Broken)
2. **Database Health**: Table counts and sample data
3. **API Response Check**: Success/failure for each endpoint
4. **Issues Found**: List with severity
5. **Recommendations**: Priority-ordered fixes
