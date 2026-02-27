#!/usr/bin/env npx tsx
/**
 * Bridge script: reads planning/ output and generates a Foundation project.
 * Inputs: {project-dir}/planning/ with BOOTSTRAP.md, DATA_MODEL.md, PRODUCT_ARCHITECTURE.md, EXECUTION_RULES.md
 * Output: runnable Foundation project
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseDataModelFile } from "./parse-data-model.js";
import { parseBootstrapFile } from "./parse-bootstrap.js";
import { parseProductArchitectureFile } from "./parse-product-architecture.js";
import { generateDrizzleSchema } from "./generate-drizzle-schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COPY_WHITELIST = new Set([
  "packages",
  "services",
  "scripts",
  "docs",
  "extensions",
  ".gitignore",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  "README.md",
  "USAGE.md",
]);

const EXCLUDE_IN_DIRS = new Set([
  "node_modules",
  "dist",
  ".svelte-kit",
  ".wrangler",
  ".output",
]);

function copyDir(src: string, dest: string, isRoot = true): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (isRoot && !COPY_WHITELIST.has(entry.name)) continue;
    if (entry.name === "planning-machine") continue;
    if (EXCLUDE_IN_DIRS.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, false);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateWranglerNames(
  projectDir: string,
  serviceName: string
): void {
  const prefix = serviceName;
  const wranglerFiles = [
    "services/gateway/wrangler.jsonc",
    "services/ui/wrangler.jsonc",
    "services/agents/wrangler.jsonc",
    "services/workflows/wrangler.jsonc",
    "services/queues/wrangler.jsonc",
    "services/cron/wrangler.jsonc",
  ];

  for (const rel of wranglerFiles) {
    const filePath = path.join(projectDir, rel);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, "utf-8");
    content = content.replace(/"name":\s*"foundation-([^"]+)"/g, `"name": "${prefix}-$1"`);
    content = content.replace(/foundation-primary/g, `${prefix}-primary`);
    content = content.replace(/foundation-files/g, `${prefix}-files`);
    content = content.replace(/foundation-audit/g, `${prefix}-audit`);
    content = content.replace(/foundation-notifications/g, `${prefix}-notifications`);
    content = content.replace(/foundation-analytics/g, `${prefix}-analytics`);
    content = content.replace(/foundation-embeddings/g, `${prefix}-embeddings`);
    content = content.replace(/foundation_events/g, `${prefix.replace(/-/g, "_")}_events`);
    content = content.replace(/foundation-webhooks/g, `${prefix}-webhooks`);
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

export interface BootstrapOptions {
  projectDir: string;
  planningDir: string;
  foundationSource?: string;
}

export async function runBootstrap(options: BootstrapOptions): Promise<void> {
  const {
    projectDir,
    planningDir,
    foundationSource = path.resolve(__dirname, "../.."),
  } = options;

  const bootstrapPath = path.join(planningDir, "BOOTSTRAP.md");
  const dataModelPath = path.join(planningDir, "DATA_MODEL.md");
  const productArchPath = path.join(planningDir, "PRODUCT_ARCHITECTURE.md");
  const executionRulesPath = path.join(planningDir, "EXECUTION_RULES.md");

  if (!fs.existsSync(bootstrapPath)) {
    throw new Error(`Missing BOOTSTRAP.md at ${planningDir}`);
  }
  if (!fs.existsSync(dataModelPath)) {
    throw new Error(`Missing DATA_MODEL.md at ${planningDir}`);
  }

  const bootstrap = parseBootstrapFile(bootstrapPath);
  const dataModel = await parseDataModelFile(dataModelPath);
  let productArch: ReturnType<typeof parseProductArchitectureFile> = {};
  if (fs.existsSync(productArchPath)) {
    productArch = parseProductArchitectureFile(productArchPath);
  }

  const serviceName =
    productArch.serviceName ??
    bootstrap.serviceName ??
    "foundation";

  fs.mkdirSync(projectDir, { recursive: true });

  copyDir(foundationSource, projectDir, true);

  updateWranglerNames(projectDir, serviceName);

  generateDrizzleSchema(dataModel.entities, projectDir, {
    keepFoundationTables: true,
  });

  if (fs.existsSync(executionRulesPath)) {
    const rules = fs.readFileSync(executionRulesPath, "utf-8");
    fs.writeFileSync(
      path.join(projectDir, "EXECUTION_RULES.md"),
      rules,
      "utf-8"
    );
  }

  const dbPkg = path.join(projectDir, "packages", "db");
  if (fs.existsSync(path.join(dbPkg, "package.json"))) {
    const genResult = spawnSync("npx", ["drizzle-kit", "generate"], {
      cwd: dbPkg,
      stdio: "inherit",
    });
    if (genResult.status !== 0) {
      console.warn("Drizzle migration generate failed (run manually: pnpm run db:generate)");
    }
  }

  console.log(`Bootstrap complete. Project at ${projectDir}`);
  console.log(`  Run: cd ${projectDir} && pnpm install && pnpm run build`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const planningDir = args[0];
  const projectDir = args[1] ?? path.join(path.dirname(planningDir), "..");

  if (!planningDir) {
    console.error("Usage: bootstrap-foundation.ts <planning-dir> [project-dir]");
    process.exit(1);
  }

  const resolvedPlanning = path.resolve(planningDir);
  const resolvedProject = path.resolve(projectDir);

  if (!fs.existsSync(resolvedPlanning)) {
    console.error(`Planning dir not found: ${resolvedPlanning}`);
    process.exit(1);
  }

  try {
    await runBootstrap({
      projectDir: resolvedProject,
      planningDir: resolvedPlanning,
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

