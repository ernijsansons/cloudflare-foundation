#!/usr/bin/env node
/**
 * apply-updates.mjs
 *
 * Fetches pending Cloudflare doc update reports from the foundation gateway,
 * then uses Claude to apply each suggested edit to the local doc files.
 *
 * Usage:
 *   node scripts/apply-updates.mjs
 *   node scripts/apply-updates.mjs --dry-run    (preview only, no file writes)
 *   node scripts/apply-updates.mjs --env staging
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY env var set
 *   FOUNDATION_API_KEY env var set (your gateway auth token)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/ → cloudflare-foundation-dev/ → cloudflare/ (the doc root)
const DOC_ROOT = path.resolve(__dirname, "..", "..");

// Validate DOC_ROOT is correct
if (!fs.existsSync(path.join(DOC_ROOT, "BIBLE.md"))) {
  console.error(`\n❌ DOC_ROOT misconfigured. BIBLE.md not found at:\n   ${DOC_ROOT}`);
  process.exit(1);
}
console.log(`📁 Doc root: ${DOC_ROOT}`);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GATEWAY_URLS = {
  production: "https://gateway.erlvinc.com",
  staging: "https://gateway-staging.erlvinc.com",
  local: "http://localhost:8787",
};

const env = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : "production";

const DRY_RUN = process.argv.includes("--dry-run");
const GATEWAY_URL = GATEWAY_URLS[env] ?? GATEWAY_URLS.production;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FOUNDATION_API_KEY = process.env.FOUNDATION_API_KEY;

if (!DEEPSEEK_API_KEY && !ANTHROPIC_API_KEY) {
  console.warn("⚠️  No AI env vars set — will apply edits using Claude Code directly");
}

// ---------------------------------------------------------------------------
// Fetch pending reports
// ---------------------------------------------------------------------------

async function fetchPendingReports() {
  const headers = {
    "Content-Type": "application/json",
    ...(FOUNDATION_API_KEY ? { Authorization: `Bearer ${FOUNDATION_API_KEY}` } : {}),
  };

  const res = await fetch(`${GATEWAY_URL}/api/cron/doc-updates`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch reports: HTTP ${res.status}\n${await res.text()}`);
  }

  const data = await res.json();
  return data;
}

// ---------------------------------------------------------------------------
// Multi-provider AI caller
// ---------------------------------------------------------------------------

/**
 * Apply doc edit using whichever AI is available.
 * Priority: DeepSeek env var → Anthropic env var → error (user must apply manually)
 */
async function callAI(prompt) {
  // 1. Try DeepSeek (fast + cheap, good for structured edits)
  if (DEEPSEEK_API_KEY) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          max_tokens: 8000,
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content: "You are a documentation editor. Return ONLY valid JSON. No markdown. No explanation.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        const clean = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(clean);
        console.log("   🤖 DeepSeek applied the edit");
        return parsed;
      }
    } catch (e) {
      console.warn(`   ⚠️  DeepSeek failed: ${e.message}`);
    }
  }

  // 2. Try Anthropic API key if set
  if (ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: "You are a documentation editor. Return ONLY valid JSON. No markdown. No explanation.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.find((b) => b.type === "text")?.text ?? "";
        const clean = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(clean);
        console.log("   🤖 Claude (API) applied the edit");
        return parsed;
      }
    } catch (e) {
      console.warn(`   ⚠️  Claude API failed: ${e.message}`);
    }
  }

  // 3. No provider available — print instructions for Claude Code user
  console.log("\n   🤖 No AI env vars set. Paste this into Claude Code to apply manually:");
  console.log("   ─────────────────────────────────────────────────────────────────");
  console.log(prompt.slice(0, 800) + (prompt.length > 800 ? "\n   [... truncated ...]" : ""));
  console.log("   ─────────────────────────────────────────────────────────────────");
  return null;
}

// ---------------------------------------------------------------------------
// Apply a single finding using Claude
// ---------------------------------------------------------------------------

async function applyFinding(finding) {
  const { affectedFiles, changeTitle, suggestedAction, changeUrl, priority } = finding;

  console.log(`\n📝 Applying: [${priority.toUpperCase()}] ${changeTitle}`);
  console.log(`   Action: ${suggestedAction}`);
  console.log(`   Files: ${affectedFiles.join(", ")}`);

  if (DRY_RUN) {
    console.log("   ⏭  DRY RUN — skipping file edit");
    return true; // Count as success in dry run
  }

  // Read current content of affected files
  const fileContents = {};
  for (const file of affectedFiles) {
    const filePath = path.join(DOC_ROOT, file);
    if (fs.existsSync(filePath)) {
      fileContents[file] = fs.readFileSync(filePath, "utf8");
    } else {
      console.warn(`   ⚠️  File not found: ${filePath}`);
    }
  }

  if (Object.keys(fileContents).length === 0) {
    console.warn("   ⚠️  No files found, skipping");
    return false;
  }

  // Build prompt for Claude
  const prompt = `You are a Cloudflare documentation editor. Apply a specific update to the provided doc files.

CHANGE DETECTED:
Title: ${changeTitle}
Source URL: ${changeUrl}
Priority: ${priority}

WHAT TO DO:
${suggestedAction}

CURRENT FILE CONTENTS:
${Object.entries(fileContents)
  .map(([file, content]) => `=== ${file} ===\n${content}`)
  .join("\n\n")}

YOUR TASK:
1. Apply the suggested change precisely and minimally — only change what needs changing
2. Do NOT reformat, restructure, or touch unrelated sections
3. If the change is already applied, output the file unchanged
4. Update version numbers, add new sections, fix stale info as needed

Respond with ONLY a JSON object in this exact format:
{
  "files": {
    "BIBLE.md": "...full updated file content...",
    "patterns/MCP_SERVER.md": "...full updated file content..."
  },
  "summary": "one sentence description of what was changed"
}

Include ONLY the files you actually modified. If a file needed no changes, omit it.`;

  const result = await callAI(prompt);
  if (!result) {
    console.error("   ❌ AI call failed — skipping");
    return false;
  }

  const filesUpdated = Object.keys(result.files ?? {}).length;
  if (filesUpdated === 0) {
    console.warn("   ⚠️  No files were modified");
    return false;
  }

  for (const [file, content] of Object.entries(result.files ?? {})) {
    const filePath = path.join(DOC_ROOT, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`   ✅ Updated: ${file}`);
  }

  if (result.summary) {
    console.log(`   💬 ${result.summary}`);
  }

  return true;
}

// ---------------------------------------------------------------------------
// Mark report as applied
// ---------------------------------------------------------------------------

async function markReportApplied(reportId) {
  const headers = {
    "Content-Type": "application/json",
    ...(FOUNDATION_API_KEY ? { Authorization: `Bearer ${FOUNDATION_API_KEY}` } : {}),
  };

  try {
    const res = await fetch(`${GATEWAY_URL}/api/cron/doc-updates/${reportId}`, {
      method: "PATCH",
      headers,
    });

    if (!res.ok) {
      console.error(`   Failed to mark report ${reportId}: HTTP ${res.status}`);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`   Failed to mark report ${reportId}: ${e.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔍 Fetching pending doc updates from ${GATEWAY_URL}...`);
  if (DRY_RUN) console.log("   (DRY RUN — no files will be modified)");

  let data;
  try {
    data = await fetchPendingReports();
  } catch (e) {
    console.error("❌ Failed to fetch reports:", e.message);
    console.log("\n💡 Tip: Is the gateway running? Try: node scripts/apply-updates.mjs --env local");
    process.exit(1);
  }

  console.log(`\n📊 Found ${data.pending} pending report(s)`);

  if (data.pending === 0) {
    console.log("✅ Everything up to date — no doc changes needed");
    return;
  }

  // Process each report
  for (const report of data.reports) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📋 Report from ${report.scannedAt}`);
    console.log(`   ${report.newItemCount} finding(s) from ${report.rawItemCount} scanned items`);

    // Sort by priority: critical → high → medium → low
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...report.findings].sort(
      (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    );

    let successCount = 0;
    for (const finding of sorted) {
      const success = await applyFinding(finding);
      if (success) successCount++;
    }

    // Mark report as applied only if at least one finding was successfully applied
    if (!DRY_RUN && successCount > 0) {
      const marked = await markReportApplied(report.id);
      if (marked) {
        console.log(`\n✅ Report ${report.id} marked as applied (${successCount}/${sorted.length} findings applied)`);
      } else {
        console.warn(`\n⚠️  Failed to mark report ${report.id} as applied`);
      }
    } else if (!DRY_RUN && successCount === 0) {
      console.warn(`\n⚠️  Report ${report.id} NOT marked as applied — no findings were successfully applied`);
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("🎉 Done! Your Cloudflare docs are up to date.");
  console.log("   Commit the changes: git add C:\\dev\\.cloudflare && git commit -m 'chore: auto-update CF docs'");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
