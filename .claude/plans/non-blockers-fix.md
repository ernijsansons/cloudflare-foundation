# Plan: Fix Remaining Non-Blockers

## Overview

This plan addresses the remaining non-blocking issues identified in the stabilization pass:
1. UI accessibility warnings (Svelte a11y)
2. Wrangler placeholder documentation
3. Uncommitted changes from previous sessions

---

## Task 1: Fix UI Accessibility Warnings

### 1.1 TopBar.svelte — Missing aria-label (Line 47)

**File:** `services/ui/src/lib/components/TopBar.svelte`

**Issue:** User button has no accessible label.

**Fix:** Add `aria-label="User menu"` to the button.

```svelte
<!-- Before -->
<button class="user-btn" type="button">

<!-- After -->
<button class="user-btn" type="button" aria-label="User menu">
```

---

### 1.2 CreateModal.svelte — Dialog accessibility (Line 53)

**File:** `services/ui/src/lib/components/CreateModal.svelte`

**Issues:**
1. Dialog missing `tabindex` for focus management
2. Click event without keyboard handler

**Fix:** Add `tabindex="-1"` and `onkeydown` handler.

```svelte
<!-- Before -->
<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

<!-- After -->
<div
  class="modal"
  onclick={(e) => e.stopPropagation()}
  onkeydown={(e) => e.key === "Escape" && onClose()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
```

---

### 1.3 ArtifactViewer.svelte — State reference warning (Line 9)

**File:** `services/ui/src/lib/components/ArtifactViewer.svelte`

**Issue:** `expanded` prop captured at initialization, not reactive.

**Fix:** Use `$derived` instead of `$state` for initial value.

```svelte
<!-- Before -->
let isExpanded = $state(expanded);

<!-- After -->
let isExpanded = $state(false);
$effect(() => { isExpanded = expanded; });
```

Or simpler: just use `expanded` directly if no local toggle needed, or initialize once.

---

### 1.4 +page.svelte — State reference warning (Line 20)

**File:** `services/ui/src/routes/ai-labs/research/runs/[id]/+page.svelte`

**Issue:** `data.run?.current_phase` captured at initialization.

**Current code already has $effect to handle updates (lines 24-28), but initial value capture triggers warning.**

**Fix:** Initialize to default, let $effect set the correct value.

```svelte
<!-- Before -->
let selectedPhase = $state<PhaseName>(
  data.run?.current_phase ?? "opportunity"
);

<!-- After -->
let selectedPhase = $state<PhaseName>("opportunity");

$effect(() => {
  if (data.run?.current_phase) {
    selectedPhase = data.run.current_phase;
  }
});
```

---

## Task 2: Document Wrangler Placeholders

**Decision:** Placeholders are intentional for template repos. Create setup documentation instead of removing them.

**Action:** Add a `SETUP.md` or update `README.md` with placeholder replacement instructions.

### Placeholder Summary

| Service | Binding | Placeholder |
|---------|---------|-------------|
| gateway | RATE_LIMIT_KV | KV_ID_HERE |
| gateway | SESSION_KV | KV_ID_HERE |
| gateway | DB | D1_ID_HERE |
| agents | DB | D1_ID_HERE |
| agents | CACHE_KV | KV_ID_HERE |
| workflows | DB | D1_ID_HERE |
| queues | DB | D1_ID_HERE |
| planning-machine | DB | D1_ID_HERE |

**Recommended:** Run `bash scripts/setup-all.sh` which should auto-replace these after creating resources.

---

## Task 3: Handle Uncommitted Changes

### 3.1 planning-machine/src/index.ts

**Changes:** Simplified health check (removed deep dependency checks)

**Assessment:** This is a simplification that removes redundant health probe logic. The change is valid.

**Action:** Review and commit if acceptable, or restore original if deep health checks are needed.

---

### 3.2 queues/src/index.ts

**Changes:**
1. Removed error classification logic (QueueErrorType, classifyError)
2. Removed structured logging (logQueueError, logQueueSuccess)
3. Simplified timestamp from Unix seconds to milliseconds
4. Removed fetch handler (health endpoint)

**Assessment:** This is a significant simplification. May lose observability.

**Options:**
- **A) Commit as-is:** Accept simplified queue handler
- **B) Restore:** Revert to original with error classification
- **C) Hybrid:** Keep error classification, simplify health check

**Recommendation:** Option A (commit as-is) unless observability is critical.

---

## Execution Order

1. **Fix UI a11y warnings** (4 files, low risk)
2. **Commit UI fixes**
3. **Review uncommitted service changes** (planning-machine, queues)
4. **Commit or discard service changes**
5. **Update README with placeholder instructions** (optional)
6. **Final build verification**

---

## Verification

After all changes:

```bash
npx pnpm run build      # Should have fewer/no Svelte warnings
npx pnpm run test       # Should still pass 22 tests
npx pnpm run typecheck:workers  # Should pass
```
