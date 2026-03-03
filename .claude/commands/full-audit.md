# Full System Audit

Execute a comprehensive audit of the cloudflare-foundation-dev monorepo across all phases and systems.

## Audit Scope

### Phase 1: Infrastructure & Configuration Audit

1. **Wrangler Configuration Check**
   - Verify all `wrangler.jsonc` files have correct bindings
   - Check service binding names match deployed worker names
   - Validate D1 database IDs match actual databases
   - Confirm compatibility_date and compatibility_flags are current
   - Check for missing or misconfigured environment variables

2. **Database Schema Audit**
   - List all D1 databases and their purposes
   - Verify migrations are in sync (gateway: 0000-0011, planning: 0000-0006)
   - Check for orphaned tables or missing indexes
   - Validate foreign key relationships
   - Run: `npx wrangler d1 execute foundation-primary --remote --command="SELECT name FROM sqlite_master WHERE type='table';"`
   - Run: `npx wrangler d1 execute planning-primary --remote --command="SELECT name FROM sqlite_master WHERE type='table';"`

3. **Service Binding Verification**
   - Verify GATEWAY binds to `foundation-gateway-production`
   - Verify PLANNING_SERVICE binds correctly
   - Check all inter-service communication paths

### Phase 2: Code Quality Audit

1. **TypeScript Strict Mode**
   - Run `pnpm run typecheck:workers` and report all errors
   - Check for `any` types that should be properly typed
   - Verify all imports resolve correctly

2. **Build Verification**
   - Run `pnpm run build` from root
   - Report any build failures or warnings
   - Check bundle sizes for each service

3. **Dependency Audit**
   - Run `pnpm audit` for security vulnerabilities
   - Check for outdated critical dependencies (agents, wrangler, hono)
   - Verify version alignment across monorepo

### Phase 3: API & Route Audit

1. **Gateway Routes**
   - List all registered routes in `services/gateway/src/index.ts`
   - Verify auth middleware is applied correctly
   - Check rate limiting configuration
   - Test health endpoint: `curl https://gateway.erlvinc.com/health`

2. **Public Endpoints**
   - Audit all `/api/public/*` routes for proper access control
   - Verify no sensitive data leakage
   - Check CORS configuration

3. **Planning Machine Routes**
   - Verify all planning endpoints are proxied correctly
   - Check context token generation and validation

### Phase 4: UI Audit

1. **SvelteKit Build**
   - Run `cd services/ui && pnpm run build`
   - Check for SSR errors
   - Verify all routes compile

2. **Component Health**
   - Check ProjectCard components render all section types
   - Verify data fetching includes correct tenant_id
   - Test modal interactions

3. **Pages Deployment**
   - Verify wrangler.jsonc points to correct service bindings
   - Check environment variables in Cloudflare Pages dashboard

### Phase 5: Planning Pipeline Audit

1. **18-Phase Pipeline**
   - Verify all agents exist in `services/planning-machine/src/agents/`
   - Check registry maps all phases to agents
   - Validate phase order matches `packages/shared/src/types/planning-phases.ts`

2. **Workflow Health**
   - Check `planning-workflow.ts` is intact
   - Verify orchestrator and model router work correctly

3. **Data Flow**
   - Trace idea → planning_runs → planning_artifacts → project_documentation
   - Verify synthesis populates all 14 sections (overview, A-M)

### Phase 6: Security Audit

1. **Secrets Management**
   - List all required secrets per service
   - Verify no secrets in code or wrangler files
   - Check secret rotation status

2. **Auth Middleware**
   - Verify JWT validation in gateway
   - Check tenant isolation
   - Audit rate limiting implementation

3. **Audit Chain**
   - Verify tamper-evident hash chain is working
   - Check audit_log and audit_chain tables

### Phase 7: Production Health Check

1. **Live Endpoint Tests**
   ```bash
   curl -s https://gateway.erlvinc.com/health
   curl -s https://dashboard.erlvinc.com/api/gateway/public/projects/run-global-claw-2026/docs?tenant_id=erlvinc | head -c 500
   curl -s https://dashboard.erlvinc.com/api/gateway/public/planning/runs?tenant_id=erlvinc | head -c 500
   ```

2. **Worker Status**
   - Check all workers are deployed and healthy via Cloudflare dashboard
   - Verify no error spikes in logs

3. **Database Connectivity**
   - Test D1 queries work from each service
   - Check for connection timeouts or errors

### Phase 8: Documentation Sync Audit

1. **Project Documentation System**
   - Verify all 14 section types have corresponding UI components
   - Check TypeScript interfaces match database schema
   - Validate seed data matches interfaces

2. **CLAUDE.md Files**
   - Verify root CLAUDE.md is current
   - Check .claude/rules/ are accurate
   - Validate PROJECT_FACTORY_EXECUTION.md status

## Output Format

For each phase, report:
- **Status**: PASS / FAIL / WARNING
- **Issues Found**: List with severity (Critical/High/Medium/Low)
- **Recommended Actions**: Specific fixes needed
- **Commands Run**: Actual output from verification commands

## Final Summary

Provide:
1. Overall health score (0-100%)
2. Critical issues requiring immediate attention
3. Recommended priority order for fixes
4. Estimated effort for each fix (XS/S/M/L/XL)
