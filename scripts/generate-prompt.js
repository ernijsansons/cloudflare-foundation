#!/usr/bin/env node
/**
 * scripts/generate-prompt.js
 *
 * Template engine that converts run-spec.json into the executable prompt
 * that encodes the entire Ralph Loop as instructions for Claude Code.
 *
 * Usage: node scripts/generate-prompt.js .agent/run/current/run-spec.json > .agent/run/current/prompt.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read run-spec.json
const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node generate-prompt.js <run-spec.json>');
  process.exit(1);
}

const runDir = path.dirname(specPath);
let spec;

try {
  spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
} catch (error) {
  console.error(`Failed to read run-spec.json: ${error.message}`);
  process.exit(1);
}

// Read optional files
let brief = '';
let manifest = null;

const briefPath = path.join(runDir, 'brief.md');
if (fs.existsSync(briefPath)) {
  brief = fs.readFileSync(briefPath, 'utf8');
}

const manifestPath = path.join(runDir, 'doc-manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    // Ignore manifest parse errors
  }
}

// Build the prompt
const prompt = `# Execution Contract: ${spec.run_id}

You are executing a bounded development task. Follow the Ralph execution sequence exactly.

## Objective

${spec.objective}

## Constraints

- **ONLY** modify files matching: ${spec.allowed_paths.join(', ')}
- **NEVER** touch: ${spec.forbidden_paths.join(', ')}
- Maximum repair attempts: 3
- Changes outside allowed paths: STOP and report
- Risk level: ${spec.risk_level}

## Task Type

${spec.task_type.toUpperCase()}

## Task Brief

${brief || 'See run-spec.json objective.'}

## Required Documents

${manifest ? manifest.documents
  .sort((a, b) => a.priority - b.priority)
  .map(d => `- [${d.required ? 'REQUIRED' : 'OPTIONAL'}] ${d.path} — ${d.summary}`)
  .join('\n') : 'See CLAUDE.md.'}

## Acceptance Criteria

${spec.acceptance_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Check Commands

${Object.entries(spec.commands)
  .filter(([_, v]) => v)
  .map(([k, v]) => `- ${k}: \`${v}\``)
  .join('\n')}

## Stop Conditions

${spec.stop_conditions.map(s => `- ${s}`).join('\n')}

## Human Approval Required For

${spec.human_approval_required_for?.length
  ? spec.human_approval_required_for.map(a => `- ${a}`).join('\n')
  : '- None (auto-execute)'}

## Execution Sequence

### 1. PRELOAD
Read run-spec.json. Verify Git branch matches \`${spec.branch}\`. If mismatch → STOP.

### 2. READ_SPEC
Extract allowed_paths, forbidden_paths, acceptance_criteria, commands, stop_conditions from run-spec.

### 3. READ_DOCS
Read required documents in priority order (priority 1 first).
- Required documents: Read in full
- Optional documents: Skim summary only if relevant

### 4. PLAN_PATCH
Think step-by-step:
1. List ALL files you will modify
2. Verify EVERY file is within allowed_paths
3. If ANY file is outside allowed_paths → BLOCKED or REQUEST_APPROVAL

### 5. EXECUTE_PATCH
Make code changes. Hooks will automatically:
- path-guard.sh: Block edits to forbidden paths
- post-edit-lint.sh: Run lint after each edit (advisory)
- post-edit-typecheck.sh: Run typecheck after each edit (advisory)

### 6. RUN_CHECKS
Run all commands:
\`\`\`bash
${Object.values(spec.commands).filter(Boolean).join(' && ')}
\`\`\`
If checks fail → repair (max 3 attempts). If still failing → BLOCKED.

### 7. UPDATE_DOCS
**MANDATORY**: Update any documentation affected by code changes.

### 8. WRITE_REPORT
Write \`.agent/run/current/run-report.json\` with:
- status: COMPLETE | BLOCKED | REQUEST_APPROVAL
- files_changed: list of modified files
- checks: { lint, typecheck, test, smoke } results
- acceptance_criteria_results: pass/fail for each criterion

### 9. COMMIT
\`\`\`bash
git add -A
git commit -m "run: ${spec.run_id} - ${spec.objective.substring(0, 60)}"
\`\`\`

## Maximum Turns

This execution is limited to ${spec.max_turns} turns. Plan efficiently.

## Model

${spec.model || 'claude-sonnet-4-5-20250929'}

---

BEGIN EXECUTION NOW.

Start with PRELOAD: Verify you are on branch \`${spec.branch}\`.
`;

process.stdout.write(prompt);
