#!/usr/bin/env node
/**
 * scripts/generate-compaction-context.js
 *
 * Generates compaction-context.md for context recovery after Claude Code
 * compacts the conversation. This file is re-injected via SessionStart hook.
 *
 * Usage: node scripts/generate-compaction-context.js .agent/run/current/run-spec.json > .agent/run/current/compaction-context.md
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read run-spec.json
const specPath = process.argv[2];
if (!specPath) {
  console.error('Usage: node generate-compaction-context.js <run-spec.json>');
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
} catch (error) {
  console.error(`Failed to read run-spec.json: ${error.message}`);
  process.exit(1);
}

// Get current git status using execFileSync (safer than execSync)
let filesChanged = [];
try {
  const gitStatus = execFileSync('git', ['diff', '--name-only'], {
    encoding: 'utf8',
    timeout: 5000
  }).trim();
  filesChanged = gitStatus.split('\n').filter(Boolean);
} catch (e) {
  // Ignore git errors
}

// Check for existing run state
const runDir = path.dirname(specPath);
let currentState = 'PRELOAD';
let repairAttempts = 0;
let errors = [];

const stateFile = path.join(runDir, 'state.json');
if (fs.existsSync(stateFile)) {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    currentState = state.currentState || 'PRELOAD';
    repairAttempts = state.repairAttempts || 0;
    errors = state.errors || [];
  } catch (e) {
    // Ignore state parse errors
  }
}

// Generate compaction context
const context = `# COMPACTION RECOVERY — DO NOT IGNORE

You are resuming execution after context compaction. All information below is critical.

## Run Identity

- **Run ID**: ${spec.run_id}
- **Branch**: ${spec.branch}
- **Project**: ${spec.project_id}
- **Task Type**: ${spec.task_type}

## Boundaries

### Allowed Paths
${spec.allowed_paths.map(p => `- ${p}`).join('\n')}

### Forbidden Paths
${spec.forbidden_paths.map(p => `- ${p}`).join('\n')}

## Current State

- **Ralph State**: ${currentState}
- **Repair Attempts Used**: ${repairAttempts}/3

## Progress

### Files Changed So Far
${filesChanged.length > 0 ? filesChanged.map(f => `- ${f}`).join('\n') : '- None yet'}

### Errors Encountered
${errors.length > 0 ? errors.map(e => `- ${e}`).join('\n') : '- None'}

## Stop Conditions

${spec.stop_conditions.map(s => `- ${s}`).join('\n')}

## Acceptance Criteria

${spec.acceptance_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Commands to Run

${Object.entries(spec.commands)
  .filter(([_, v]) => v)
  .map(([k, v]) => `- ${k}: \`${v}\``)
  .join('\n')}

## Objective Reminder

${spec.objective}

---

**RESUME EXECUTION FROM STATE: ${currentState}**

If you were in EXECUTE_PATCH, continue making changes.
If you were in RUN_CHECKS and had failures, you have ${3 - repairAttempts} repair attempts remaining.
`;

process.stdout.write(context);
