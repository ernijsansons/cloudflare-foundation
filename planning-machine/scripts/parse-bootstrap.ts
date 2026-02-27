/**
 * Parser for BOOTSTRAP.md - extracts steps, wrangler bindings, Drizzle schema hints
 */

import * as fs from "node:fs";

export interface BootstrapStep {
  number: number;
  title: string;
  content: string;
}

export interface WranglerBinding {
  type: "d1" | "kv" | "r2" | "queue" | "service" | "workflow";
  binding: string;
  databaseName?: string;
  databaseId?: string;
  id?: string;
}

export interface ParsedBootstrap {
  steps: BootstrapStep[];
  wranglerBindings: WranglerBinding[];
  serviceName?: string;
  drizzleSchemaHints?: string[];
}

const STEP_PATTERN = /^##?\s*Step\s+(\d+)[:\s]+(.+)$/im;
const D1_BINDING_PATTERN = /D1\s*[:\s]+\s*(\w+)\s*(?:\|\s*([^|\n]+))?/gi;
const D1_DATABASE_PATTERN = /database[_\s]?name[:\s]+\s*["']?([\w-]+)["']?/gi;
const SERVICE_NAME_PATTERN = /(?:service|project|app)\s+name[:\s]+\s*["']?([\w-]+)["']?/gi;

/**
 * Parse BOOTSTRAP.md and extract structured information.
 */
export function parseBootstrap(content: string): ParsedBootstrap {
  const steps: BootstrapStep[] = [];
  const wranglerBindings: WranglerBinding[] = [];
  let serviceName: string | undefined;
  const drizzleSchemaHints: string[] = [];

  const lines = content.split("\n");
  let currentStep: BootstrapStep | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stepMatch = line.match(STEP_PATTERN);
    if (stepMatch) {
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        number: parseInt(stepMatch[1], 10),
        title: stepMatch[2].trim(),
        content: "",
      };
      continue;
    }

    if (currentStep) {
      currentStep.content += (currentStep.content ? "\n" : "") + line;
    }

    // Extract D1 bindings
    const d1Match = line.matchAll(D1_BINDING_PATTERN);
    for (const m of d1Match) {
      wranglerBindings.push({
        type: "d1",
        binding: m[1],
        databaseName: undefined,
      });
    }

    const dbNameMatch = line.matchAll(D1_DATABASE_PATTERN);
    for (const m of dbNameMatch) {
      if (wranglerBindings.length > 0) {
        const last = wranglerBindings[wranglerBindings.length - 1];
        if (last.type === "d1") last.databaseName = m[1];
      }
    }

    const svcMatch = line.matchAll(SERVICE_NAME_PATTERN);
    for (const m of svcMatch) {
      if (!serviceName) serviceName = m[1];
    }
  }

  if (currentStep) {
    steps.push(currentStep);
  }

  return {
    steps,
    wranglerBindings,
    serviceName,
    drizzleSchemaHints,
  };
}

/**
 * Parse BOOTSTRAP.md from file path.
 */
export function parseBootstrapFile(filePath: string): ParsedBootstrap {
  const content = fs.readFileSync(filePath, "utf-8");
  return parseBootstrap(content);
}
