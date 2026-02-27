#!/usr/bin/env node
/**
 * foundation-plan CLI
 * init | scaffold | validate
 */

import { program } from "commander";
import chalk from "chalk";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getMonorepoRoot(): string {
  let dir = __dirname;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return path.resolve(__dirname, "../..");
}

function runBootstrap(planningDir: string, projectDir: string): void {
  const root = getMonorepoRoot();
  const scriptPath = path.join(root, "planning-machine", "scripts", "bootstrap-foundation.ts");
  if (!fs.existsSync(scriptPath)) {
    console.error(chalk.red("Bootstrap script not found. Run from cloudflare-foundation monorepo."));
    process.exit(1);
  }
  const resolvedPlanning = path.resolve(planningDir);
  const resolvedProject = path.resolve(projectDir);
  const result = spawnSync(
    "npx",
    ["tsx", scriptPath, resolvedPlanning, resolvedProject],
    { cwd: root, encoding: "utf-8" }
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    console.error(chalk.red("Bootstrap failed:"), result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runValidate(planningDir: string): void {
  const root = getMonorepoRoot();
  const scriptPath = path.join(root, "planning-machine", "scripts", "validate-planning.ts");
  if (!fs.existsSync(scriptPath)) {
    console.error(chalk.red("Validate script not found. Run from cloudflare-foundation monorepo."));
    process.exit(1);
  }
  const resolvedDir = path.resolve(planningDir);
  const result = spawnSync(
    "npx",
    ["tsx", scriptPath, resolvedDir],
    { cwd: root, encoding: "utf-8" }
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

program
  .name("foundation-plan")
  .description("Planning Machine CLI — init, scaffold, validate");

program
  .command("init <idea>")
  .description("Create project dir + planning subdir for a product idea")
  .option("-o, --output <dir>", "Output directory", process.cwd())
  .action((idea: string, opts: { output: string }) => {
    const baseName = idea
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40);
    const projectDir = path.join(path.resolve(opts.output), baseName || "foundation-project");
    const planningDir = path.join(projectDir, "planning");

    fs.mkdirSync(planningDir, { recursive: true });

    const orchestratorHint = `# Planning Machine — ${idea}

Run the Planning Machine in Claude Code with this product idea.
Outputs (BOOTSTRAP.md, DATA_MODEL.md, PRODUCT_ARCHITECTURE.md, EXECUTION_RULES.md) will land here.

Then run: \`npx foundation-plan scaffold --from ${planningDir}\`
`;

    fs.writeFileSync(
      path.join(planningDir, "README.md"),
      orchestratorHint,
      "utf-8"
    );

    console.log(chalk.green("Created:") + ` ${projectDir}/planning/`);
    console.log(chalk.dim("Add your planning artifacts (BOOTSTRAP.md, DATA_MODEL.md, etc.) then run:"));
    console.log(chalk.cyan(`  npx foundation-plan scaffold --from ${planningDir}`));
  });

program
  .command("scaffold")
  .description("Run bridge: read planning/, generate Foundation project")
  .requiredOption("--from <dir>", "Planning directory path")
  .option("-o, --output <dir>", "Project output directory (default: parent of planning)")
  .action((opts: { from: string; output?: string }) => {
    const planningDir = path.resolve(opts.from);
    const projectDir = opts.output
      ? path.resolve(opts.output)
      : path.join(path.dirname(planningDir), "..");

    if (!fs.existsSync(planningDir)) {
      console.error(chalk.red("Planning dir not found:") + ` ${planningDir}`);
      process.exit(1);
    }

    console.log(chalk.blue("Scaffolding from") + ` ${planningDir}`);
    runBootstrap(planningDir, projectDir);
    console.log(chalk.green("Done. Run:") + ` cd ${projectDir} && pnpm install && pnpm run build`);
  });

program
  .command("validate [dir]")
  .description("Check planning/ has required artifacts before scaffold")
  .action((dir?: string) => {
    const planningDir = path.resolve(dir ?? ".");
    runValidate(planningDir);
  });

program.parse();
