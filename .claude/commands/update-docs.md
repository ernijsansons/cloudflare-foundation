# /update-docs

Scan Cloudflare release channels for updates and apply any needed changes to `C:\dev\.cloudflare\` doc files.

## Usage

```
/update-docs
/update-docs --dry-run
/update-docs --force-scan
```

- **No flags** — trigger scan, show findings, apply to doc files
- **`--dry-run`** — show what would change, write nothing
- **`--force-scan`** — trigger a fresh scan even if one ran today

---

## What You Do

### Step 1 — Read the args

Parse the command arguments:

- `DRY_RUN = args.includes("--dry-run")`
- `FORCE_SCAN = args.includes("--force-scan")`

### Step 2 — Trigger the scanner (or fetch cached results)

Run in terminal:

```bash
curl -s -X POST https://foundation-cron-production.ernijs-ansons.workers.dev/scan-docs
```

Store the JSON response. It has this shape:

```json
{
  "scannedAt": "2026-...",
  "findings": [...],
  "rawItemCount": 12,
  "newItemCount": 3
}
```

If `rawItemCount` is 0, warn the user:

> ⚠️ Scanner returned 0 raw items — sources may be failing. Check Worker logs:
> `npx wrangler tail foundation-cron-production --env production`

If `newItemCount` is 0, tell the user:

> ✅ Docs are already up to date — no changes needed.
> Last scan found no new Cloudflare releases affecting your doc files.

Then stop.

### Step 3 — Show the findings

Before applying anything, print a summary table:

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE DOC UPDATES DETECTED                                    │
├──────────┬────────────────────────────────────┬────────────────────┤
│ PRIORITY │ CHANGE                             │ FILES AFFECTED     │
├──────────┼────────────────────────────────────┼────────────────────┤
│ CRITICAL │ agents SDK updated to v0.6.0        │ BIBLE.md, MCP_...  │
│ HIGH     │ Containers limits 15× increased     │ BIBLE.md           │
│ MEDIUM   │ @cloudflare/codemode v0.1.0 new     │ SERVICES.md        │
└──────────┴────────────────────────────────────┴────────────────────┘
```

If `--dry-run`, print:

> 🔍 DRY RUN — showing findings only. No files will be modified.
> Then stop after showing the table.

### Step 4 — Apply each finding

For each finding (sorted: critical → high → medium → low):

1. Read the current content of each affected file from `C:\dev\.cloudflare\`
2. Call the AI (DeepSeek first, Claude fallback) to apply the surgical edit
3. Write only the modified files back
4. Print what changed

**AI call — use this exact prompt structure:**

```
You are a Cloudflare documentation editor. Apply ONE specific update to the provided files.

CHANGE:
Title: {changeTitle}
URL: {changeUrl}
Priority: {priority}
Action: {suggestedAction}

CURRENT FILE CONTENTS:
=== {filename} ===
{file content}

RULES:
1. Change ONLY what the action specifies
2. Do NOT reformat, restructure, or touch anything else
3. If already applied, return the file unchanged
4. Be surgical — minimum viable diff

Return ONLY this JSON (no markdown, no explanation):
{
  "files": { "BIBLE.md": "...full updated content..." },
  "summary": "one sentence: what changed and where"
}
Include ONLY files you actually modified.
```

**Provider priority:**

- Try `DEEPSEEK_API_KEY` env var first → `https://api.deepseek.com/v1/chat/completions` with `model: "deepseek-chat"`, `temperature: 0.1`
- If DeepSeek fails or key not set → try `ANTHROPIC_API_KEY` → `https://api.anthropic.com/v1/messages` with `model: "claude-sonnet-4-20250514"`
- If both fail → log error, skip this finding, continue to next

### Step 5 — Mark findings as applied

After all findings are processed, call:

```bash
# Get the report ID from the pending reports
REPORT_ID=$(curl -s https://foundation-gateway-production.ernijs-ansons.workers.dev/api/cron/doc-updates \
  -H "Authorization: Bearer $FOUNDATION_API_KEY" | jq -r '.reports[0].id')

# Mark it applied
curl -s -X PATCH "https://foundation-gateway-production.ernijs-ansons.workers.dev/api/cron/doc-updates/$REPORT_ID" \
  -H "Authorization: Bearer $FOUNDATION_API_KEY"
```

If `FOUNDATION_API_KEY` is not set, skip the mark-applied step and note:

> ⚠️ FOUNDATION_API_KEY not set — report not marked as applied. Set it to avoid reprocessing.

### Step 6 — Print completion summary

```
═══════════════════════════════════════════════════════
✅ Doc update complete

  Applied: 3 finding(s)
  Files modified:
    • C:\dev\.cloudflare\BIBLE.md
    • C:\dev\.cloudflare\patterns\MCP_SERVER.md
    • C:\dev\.cloudflare\platform\SERVICES.md

  Next: git add C:\dev\.cloudflare && git commit -m "chore: cf docs auto-update $(date +%Y-%m-%d)"
═══════════════════════════════════════════════════════
```

---

## Environment Variables Used

| Variable             | Required    | Purpose                          |
| -------------------- | ----------- | -------------------------------- |
| `DEEPSEEK_API_KEY`   | Recommended | Primary AI for doc edits (cheap) |
| `ANTHROPIC_API_KEY`  | Fallback    | Backup AI if DeepSeek fails      |
| `FOUNDATION_API_KEY` | Optional    | Marks reports as applied in D1   |

Add to your PowerShell profile (`notepad $PROFILE`) so they're always available in Claude Code:

```powershell
# Gateway token — retrieve from your KV store or session management system
$env:FOUNDATION_API_KEY = "your-foundation-api-key-here"

# DeepSeek — get your key from platform.deepseek.com
$env:DEEPSEEK_API_KEY = "sk-your-deepseek-key-here"

# Anthropic fallback — from console.anthropic.com/account/keys
$env:ANTHROPIC_API_KEY = "sk-ant-YOUR-KEY"
```

---

## Error Reference

**"rawItemCount: 0"** — All sources failed. Check wrangler tail for the cron Worker.

**"Both AI providers failed"** — Neither DEEPSEEK_API_KEY nor ANTHROPIC_API_KEY is set. Export at least one.

**"File not found"** — A finding references a doc file that doesn't exist at `C:\dev\.cloudflare\`. Log the warning and skip that finding.

**HTTP 401 from gateway** — FOUNDATION_API_KEY is wrong or expired. Skip mark-applied, docs are still updated locally.
