# Foundation v2.5 — Task List

Single source-of-truth task file for full execution. Use this for future runs.

## Purpose

Implement the Cloudflare Agentic Foundation v2.5 end-to-end: update the knowledge base (BIBLE, INDEX, patterns, skill, research), add SvelteKit and v2.4/v2.5 security and DO patterns, document v2.5 capabilities (Images binding, Rate Limiting, Event Subscriptions), verify the v2.5 prompt, create the audit-chain Drizzle schema and packages/db.

## Reference

- **Canonical prompt:** `cloudflare-foundation-prompt 2.5.md` (v2.5 capability-complete edition).
- **Out of scope:** NxtSpin mapping; original v2.4 Task 10 omitted.

## Knowledge base path

- **Edits:** `C:\dev\.cloudflare\` (BIBLE.md, INDEX.md, patterns/, skill/SKILL.md, research/SERVICES_MASTER.md).
- **Workspace (Tasks 10–11):** `c:\dev\.cloudflare\cloudflare-foundation-dev` (packages/db, FOUNDATION_V25_TASKS.md, verification report).

## Prerequisites

| #  | Prerequisite              | Action                                                                 |
|----|---------------------------|------------------------------------------------------------------------|
| P1 | Read Foundation v2.5 prompt | Read cloudflare-foundation-prompt 2.5.md in full.                   |
| P2 | Read BIBLE                | Read BIBLE.md to locate where to add decisions and diagram.          |
| P3 | Read INDEX                | Read INDEX.md for COMMON WORKFLOWS and FILE MANIFEST layout.          |
| P4 | Confirm paths             | Knowledge base under C:\dev\.cloudflare\; schema under packages/db.   |

---

## Task 1: Update BIBLE.md with Foundation architecture decisions

- **Reference:** C:\dev\.cloudflare\BIBLE.md
- **Steps:** 1) Add section **Foundation Architecture Decisions (v2.5)**. 2) Add DECISION 14–20 (SvelteKit, 10-plane, context tokens, DO naming, audit hash chain, Turnstile, TenantRateLimiter). 3) Insert the 10-plane ASCII diagram from the v2.5 prompt. 4) Bump version refs to v2.5.
- **Acceptance:** All 7 decisions and the 10-plane diagram present; version refs say v2.5.
- **Output:** BIBLE.md with new section; no existing content removed.

---

## Task 2: Update INDEX.md routing and manifest

- **Reference:** C:\dev\.cloudflare\INDEX.md
- **Steps:** 1) In COMMON WORKFLOWS add: public form protection → SECURITY.md (Turnstile); per-tenant rate limiting → DURABLE_OBJECTS.md (TenantRateLimiter); tamper-evident audit trail → SECURITY.md (Audit Hash Chain); SvelteKit frontend → SVELTEKIT.md; in-Worker image transform → Foundation prompt Plane 9 / IMAGES binding. 2) In FILE MANIFEST add: patterns/SVELTEKIT.md (~200 lines).
- **Acceptance:** All entries point to correct files; FILE MANIFEST includes SVELTEKIT.md.
- **Depends:** Task 1; Task 3 for SVELTEKIT.md existence before final verify.

---

## Task 3: Create patterns/SVELTEKIT.md

- **Reference:** New file C:\dev\.cloudflare\patterns\SVELTEKIT.md
- **Steps:** Project setup; svelte.config.js with adapter-cloudflare; wrangler.jsonc (main, assets, run_worker_first); app.d.ts; binding access in +server.ts, +page.server.ts, hooks.server.ts; Drizzle D1 in SvelteKit; Agent WebSocket (Svelte stores); Turnstile (client + server); local dev command; Common Mistakes table. Use code fences (typescript, jsonc, bash); ~200 lines.
- **Acceptance:** File exists; 10 topics covered; code blocks tagged; Common Mistakes table present.

---

## Task 4: Update patterns/SECURITY.md with v2.4/v2.5 additions

- **Reference:** C:\dev\.cloudflare\patterns\SECURITY.md
- **Steps:** **Append:** 1) Turnstile integration (client widget, server verify Hono, SvelteKit form action, errors, test keys). 2) Gateway-signed context tokens (JWT HS256, CONTEXT_SIGNING_KEY, 60s TTL, downstream verification). 3) Audit hash chain (D1 schema, appendAuditEvent(), verifyAuditChain(), SHA-256 Web Crypto, Common Mistakes table). Headers reference v2.4/v2.5.
- **Acceptance:** All three subsections present with code; no existing content removed.

---

## Task 5: Update patterns/DURABLE_OBJECTS.md with TenantRateLimiter

- **Reference:** C:\dev\.cloudflare\patterns\DURABLE_OBJECTS.md
- **Steps:** **Append** TenantRateLimiter DO pattern: full class (sliding-window); DO naming `{tenantId}:rate-limit:api`; /check and /configure endpoints; gateway integration; comparison table (KV vs DO vs Workers Rate Limiting API, Wrangler 4.36+).
- **Acceptance:** Table includes Workers Rate Limiting API; implementation matches prompt.

---

## Task 6: Update skill/SKILL.md

- **Reference:** C:\dev\.cloudflare\skill\SKILL.md
- **Steps:** Version refs v0.3.7+; add SvelteKit to framework stack table; add Turnstile, Analytics Engine, TenantRateLimiter, Audit Hash Chain, Images binding, Workers Rate Limiting to feature lists; compatibility_date >= 2025-09-25; note adapter-cloudflare-workers DEPRECATED, use adapter-cloudflare only.
- **Acceptance:** All bullets reflected; no broken references.
- **Depends:** Tasks 1–5 for consistency.

---

## Task 7: Update research/SERVICES_MASTER.md

- **Reference:** C:\dev\.cloudflare\research\SERVICES_MASTER.md
- **Steps:** Add/update: Calls (WebRTC/SFU) Tier 3 (future); Turnstile Tier 1; Analytics Engine Tier 1; Email Service (Send) Tier 1; Agents SDK v0.3.7+ Tier 1; Cloudflare Images / Transformations Tier 2 with Workers binding (transform, draw, output, info); Workers Rate Limiting binding Tier 2; Queues Event Subscriptions Tier 2; Automatic resource provisioning (wrangler 4.45+) in setup. Keep existing table structure.
- **Acceptance:** All listed services present with correct tier; v2.5 items included.

---

## Task 8: Update patterns/QUEUES_AND_DLQ.md with Event Subscriptions (v2.5)

- **Reference:** C:\dev\.cloudflare\patterns\QUEUES_AND_DLQ.md
- **Steps:** **Append** subsection Queues Event Subscriptions (v2.5): description (R2, KV, Workers AI, Workflows, Vectorize); how to create subscription (wrangler or dashboard); example R2 upload → event → Queue → Worker; custom retention 60s–14 days. Code fences; reference v2.5.
- **Acceptance:** Event Subscriptions and retention documented; no existing content removed.

---

## Task 9: Verify Foundation v2.5 prompt consistency

- **Reference:** cloudflare-foundation-prompt 2.5.md (read-only)
- **Steps:** Verify: (1) Checklist 20+ primitive categories (incl. Images, Rate Limiting). (2) 10-plane diagram present. (3) All wrangler examples compatibility_date "2025-09-25". (4) SvelteKit everywhere, no React Router. (5) TenantRateLimiter in agents wrangler + migrations. (6) TURNSTILE_SECRET and CONTEXT_SIGNING_KEY in Env. (7) IMAGES in gateway wrangler and Env. (8) packages/db schema includes audit-chain.ts in tree. Document mismatches; suggest one-line fixes if needed.
- **Acceptance:** All 8 checks performed; report written (e.g. FOUNDATION_V25_VERIFICATION.md).
- **Depends:** Tasks 1–8.

---

## Task 10: Create packages/db and audit-chain Drizzle schema

- **Reference:** Workspace cloudflare-foundation-dev; v2.5 prompt audit_chain columns.
- **Steps:** 1) Create packages/db/ with package.json, tsconfig.json, optional drizzle.config.ts, schema/. 2) Create schema/audit-chain.ts (tenant_id, seq, event_type, payload, previous_hash, hash, created_at). 3) Export from schema/index.ts. 4) Ensure gateway/migrations can import schema.
- **Acceptance:** Drizzle schema matches SECURITY.md and prompt; index exports audit_chain.
- **Depends:** Task 4.

---

## Task 11: Create FOUNDATION_V25_TASKS.md

- **Reference:** This file (cloudflare-foundation-dev/FOUNDATION_V25_TASKS.md)
- **Steps:** Task list mirroring the plan (Tasks 1–11, no NxtSpin); Purpose; Reference; Knowledge base path; Prerequisites; each task with title, reference, steps, acceptance; execution order table; execution notes; "Execute sequentially."
- **Acceptance:** File exists; all 11 tasks described; order and notes clear.
- **Depends:** Task 9 and Task 10 complete.

---

## Execution order

| Order | Task                     | Dependencies |
|-------|--------------------------|--------------|
| 1     | T1 BIBLE                 | None         |
| 2     | T2 INDEX                 | T1           |
| 3     | T3 SVELTEKIT             | None         |
| 4     | T4 SECURITY              | None         |
| 5     | T5 DURABLE_OBJECTS       | None         |
| 6     | T6 SKILL                 | T1–T5        |
| 7     | T7 SERVICES_MASTER       | None         |
| 8     | T8 QUEUES_AND_DLQ        | None         |
| 9     | T9 Verify v2.5           | T1–T8        |
| 10    | T10 packages/db + audit-chain | T4       |
| 11    | T11 FOUNDATION_V25_TASKS.md | T9, T10  |

**Recommended:** T1 → T2 after T1; T3, T4, T5, T7, T8 in parallel where possible; then T6 → T9 → T10 (T10 after T4) → T11.

---

## Execution notes

- Read each referenced file **before** editing.
- **Append** new sections; do not overwrite unless the task says "replace."
- Follow existing formatting: code fences with `typescript`, `jsonc`, `bash`, `sql`; "Common Mistakes" tables where specified.
- TypeScript strict; wrangler configs `.jsonc` with `$schema`.
- Reference **v2.5** (or v2.4 where historically accurate) in new content headers.
- All edits under `C:\dev\.cloudflare\` except Task 10 (workspace packages/db) and Task 11 (workspace FOUNDATION_V25_TASKS.md).

**Execute sequentially where dependencies require it; parallelize only when no dependency is violated.**
