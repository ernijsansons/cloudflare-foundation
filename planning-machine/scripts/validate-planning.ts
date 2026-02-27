#!/usr/bin/env npx tsx
/**
 * Validate planning/ has required artifacts before scaffold
 */

import * as fs from "node:fs";
import * as path from "node:path";

const REQUIRED = ["BOOTSTRAP.md", "DATA_MODEL.md"];
const OPTIONAL = ["PRODUCT_ARCHITECTURE.md", "EXECUTION_RULES.md"];

export function validatePlanningDir(planningDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(planningDir)) {
    return { valid: false, errors: [`Planning dir not found: ${planningDir}`] };
  }

  for (const file of REQUIRED) {
    const p = path.join(planningDir, file);
    if (!fs.existsSync(p)) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function main(): void {
  const planningDir = process.argv[2] ?? ".";
  const resolved = path.resolve(planningDir);
  const result = validatePlanningDir(resolved);

  if (result.valid) {
    console.log("Planning artifacts valid.");
    for (const f of OPTIONAL) {
      const p = path.join(resolved, f);
      if (fs.existsSync(p)) {
        console.log(`  Found: ${f}`);
      }
    }
  } else {
    console.error("Validation failed:");
    for (const e of result.errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }
}

main();
