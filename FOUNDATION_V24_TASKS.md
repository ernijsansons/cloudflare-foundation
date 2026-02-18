# FOUNDATION v2.4 — Claude Code Task List

> **Purpose**: Sequential task list for Claude Code to implement Foundation Prompt v2.4 changes.
> **Reference**: `C:\dev\.cloudflare\cloudflare-foundation-prompt 2.4.md`
> **Knowledge Base**: `C:\dev\.cloudflare\` (INDEX.md, BIBLE.md, patterns/, templates/, research/)
> **Generated**: February 10, 2026

---

## PREREQUISITES

Before starting any task, Claude Code MUST:
1. Read `C:\dev\.cloudflare\cloudflare-foundation-prompt 2.4.md` in full
2. Read `C:\dev\.cloudflare\BIBLE.md` for architecture decisions
3. Read `C:\dev\.cloudflare\INDEX.md` for file routing
4. Confirm the target monorepo exists at the expected path

---

## TASK 1: Update BIBLE.md with v2.4 Architecture Decisions

**Reference**: `C:\dev\.cloudflare\BIBLE.md`

Add the following architecture decisions:

- DECISION 14 — SvelteKit replaces React Router v7. All frontend applications use SvelteKit with @sveltejs/adapter-cloudflare. Rationale: Better Cloudflare integration, smaller bundles, native Workers Static Assets support. adapter-cloudflare-workers is DEPRECATED.
- DECISION 15 — 10-Plane Architecture (up from 8). Plane 9: Media & Transformation (Images, Stream). Plane 10: Observability (Analytics Engine, Logpush, Audit Hash Chain). Moved Analytics Engine from "Data" to dedicated observability plane.
- DECISION 16 — Gateway-Signed Context Tokens. Gateway signs tenant context into 60s-TTL JWT after auth. Downstream Workers verify token instead of re-running auth.
- DECISION 17 — DO Naming Taxonomy. Pattern: {tenantId}:{purpose}:{identifier}. Prevents orphaned DOs, enables tenant-scoped cleanup.
- DECISION 18 — Audit Hash Chain. Every audit event includes SHA-256 hash of previous event. Tamper-evident, immutable audit trail per tenant.
- DECISION 19 — Turnstile on Public Forms. All public-facing forms must include Turnstile verification.
- DECISION 20 — TenantRateLimiter Durable Object. Strongly consistent per-tenant rate limiting via dedicated DO.

Update the architecture diagram to show 10 planes. Bump version references from v2.3 to v2.4.

---

## TASK 2: Update INDEX.md Routing

**Reference**: `C:\dev\.cloudflare\INDEX.md`

Add to COMMON WORKFLOWS section:
- "Need public form protection?" → See Turnstile pattern in patterns/SECURITY.md
- "Need per-tenant rate limiting?" → See TenantRateLimiter in patterns/DURABLE_OBJECTS.md
- "Need tamper-evident audit trail?" → See Audit Hash Chain in patterns/SECURITY.md
- "Building SvelteKit frontend?" → See patterns/SVELTEKIT.md

Add to FILE MANIFEST:
- patterns/SVELTEKIT.md (~200 lines) — SvelteKit on Cloudflare Workers patterns

---

## TASK 3: Create patterns/SVELTEKIT.md

Create `C:\dev\.cloudflare\patterns\SVELTEKIT.md` covering:
1. Project setup: npx create-cloudflare@latest --framework=sveltekit
2. svelte.config.js with adapter-cloudflare
3. wrangler.jsonc for SvelteKit (main, assets.directory, assets.binding, run_worker_first)
4. src/app.d.ts — typing Cloudflare bindings in App.Platform
5. Binding access via event.platform.env in +server.ts, +page.server.ts, hooks.server.ts
6. Drizzle D1 integration in SvelteKit (src/lib/server/db.ts pattern)
7. Agent WebSocket integration (Svelte stores, not React hooks)
8. Turnstile component integration (client widget + server verification)
9. Local dev: wrangler dev .svelte-kit/cloudflare/_worker.js
10. Common Mistakes table

Target: ~200 lines. Follow existing pattern file conventions.

---

## TASK 4: Update patterns/SECURITY.md with v2.4 Additions

Append to `C:\dev\.cloudflare\patterns\SECURITY.md`:

### Turnstile Integration
- Client-side widget embedding, server-side verification middleware (Hono), form action pattern for SvelteKit, error handling, test keys for dev

### Gateway-Signed Context Tokens
- JWT signing after auth middleware, HS256 with CONTEXT_SIGNING_KEY, 60s TTL, downstream verification, privilege escalation prevention

### Audit Hash Chain
- D1 schema for audit_chain table, appendAuditEvent() function, verifyAuditChain() function, SHA-256 via Web Crypto API, Common Mistakes table

---

## TASK 5: Update patterns/DURABLE_OBJECTS.md with TenantRateLimiter

Append to `C:\dev\.cloudflare\patterns\DURABLE_OBJECTS.md`:

### TenantRateLimiter DO Pattern
- Full class implementation (sliding window algorithm)
- DO naming: {tenantId}:rate-limit:api
- /check and /configure endpoints
- Gateway integration
- Comparison table: KV-based vs DO-based vs Workers Rate Limiting API

---

## TASK 6: Update skill/SKILL.md

Update `C:\dev\.cloudflare\skill\SKILL.md`:
- Version references: v0.3.0 → v0.3.7+ everywhere
- Add SvelteKit to framework stack table
- Add Turnstile, Analytics Engine, TenantRateLimiter, Audit Hash Chain
- Ensure compatibility_date >= 2025-09-25
- Note adapter-cloudflare-workers is DEPRECATED

---

## TASK 7: Update research/SERVICES_MASTER.md with New Primitives

Add entries to `C:\dev\.cloudflare\research\SERVICES_MASTER.md` for:
1. Calls (WebRTC/SFU) — Tier 3 (future)
2. Turnstile — Tier 1 (integrated in v2.4)
3. Analytics Engine — Tier 1 (promoted from Tier 2)
4. Email Service (Send) — Tier 1 (already integrated)
5. Agents SDK v0.3.7+ updates — Tier 1
6. Cloudflare Images / Transformations — Tier 2

---

## TASK 8: Verify Foundation Prompt Consistency

Read `C:\dev\.cloudflare\cloudflare-foundation-prompt 2.4.md` and verify:
1. All 18 primitive categories in checklist table
2. All 10 planes in architecture diagram
3. All wrangler.jsonc configs have compatibility_date: "2025-09-25"
4. SvelteKit replaces React Router v7 in ALL references
5. TenantRateLimiter in agents wrangler bindings + migrations
6. TURNSTILE_SECRET and CONTEXT_SIGNING_KEY in Env interface

---

## TASK 9: Create Drizzle Schema for Audit Chain

Create audit_chain Drizzle schema in packages/db/schema/audit-chain.ts (or document in SECURITY.md if monorepo doesn't exist yet).

---

## TASK 10: Create NxtSpin v2.4 Implementation Mapping

Create `C:\dev\.cloudflare\research\NXTSPIN_V24_MAPPING.md` mapping all 10 planes to NxtSpin-specific implementations (AlphaEngine, ARROS, DataCollector, equipment identification, listing search, etc.).

---

## EXECUTION ORDER SUMMARY

| Order | Task | Effort | Dependencies |
|-------|------|--------|-------------|
| 1 | Update BIBLE.md | 15 min | None |
| 2 | Update INDEX.md | 10 min | Task 1 |
| 3 | Create SVELTEKIT.md | 30 min | None |
| 4 | Update SECURITY.md | 25 min | None |
| 5 | Update DURABLE_OBJECTS.md | 20 min | None |
| 6 | Update SKILL.md | 15 min | Tasks 1-5 |
| 7 | Update SERVICES_MASTER.md | 15 min | None |
| 8 | Verify Foundation Prompt | 10 min | Tasks 1-7 |
| 9 | Create Audit Chain Schema | 10 min | Task 4 |
| 10 | Create NxtSpin Mapping | 20 min | All |

**Total estimated effort**: ~170 minutes (~2.8 hours)

---

## CLAUDE CODE EXECUTION NOTES

- Always read the referenced file BEFORE making edits
- Preserve existing content — APPEND new sections, don't overwrite
- Follow existing formatting conventions in each file
- Use code fences with language tags (typescript, jsonc, bash, sql)
- Include "Common Mistakes" tables where specified
- All code examples must use TypeScript strict mode
- All wrangler configs must use .jsonc format with $schema
- Reference v2.4 explicitly in any new content headers

---

**END OF TASK LIST. Execute sequentially.**
