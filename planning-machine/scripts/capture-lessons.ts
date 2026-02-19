/**
 * capture-lessons.ts
 *
 * Post-build script to add lessons to pipeline-memory.json.
 * Run after a successful product build to capture what worked and what didn't.
 *
 * Usage:
 *   npx tsx planning-machine/scripts/capture-lessons.ts add \
 *     --product-type "crud-saas" \
 *     --category "task-sizing" \
 *     --lesson "Auth tasks should be split: data-model, service, middleware, UI" \
 *     --applies-to "backend,auth"
 *
 *   npx tsx planning-machine/scripts/capture-lessons.ts list
 *
 *   npx tsx planning-machine/scripts/capture-lessons.ts prune --min-evidence 2
 *
 * The memory file is read by Phase 16 (task-reconciliation-agent.ts) to improve
 * task quality for future products.
 */

import * as fs from "fs";
import * as path from "path";

const MEMORY_FILE = path.join(
  process.cwd(),
  "planning-machine",
  "memory",
  "pipeline-memory.json"
);

interface Lesson {
  id: string;
  productType: "crud-saas" | "marketplace" | "dev-tool" | "content-platform" | "other";
  category: "task-sizing" | "integration" | "security" | "testing" | "devops" | "ordering" | "naomi-prompt";
  lesson: string;
  evidenceCount: number;
  appliesTo: string[];
  addedAt: string;
  lastSeenAt: string;
}

interface PipelineMemory {
  version: string;
  description: string;
  lessons: Lesson[];
}

function loadMemory(): PipelineMemory {
  if (!fs.existsSync(MEMORY_FILE)) {
    return {
      version: "1.0",
      description:
        "Cross-product lessons captured after each successful build. Injected into Phase 16 reconciliation to improve task quality for future products.",
      lessons: [],
    };
  }
  const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
  return JSON.parse(raw) as PipelineMemory;
}

function saveMemory(memory: PipelineMemory): void {
  fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith("--")) {
      const key = args[i]!.slice(2);
      const value = args[i + 1] && !args[i + 1]!.startsWith("--") ? args[i + 1]! : "true";
      result[key] = value;
      if (value !== "true") i++;
    }
  }
  return result;
}

function cmdAdd(args: Record<string, string>): void {
  const memory = loadMemory();

  const lesson = args["lesson"];
  const category = args["category"];
  const productType = args["product-type"] ?? "other";
  const appliesTo = (args["applies-to"] ?? "").split(",").filter(Boolean);

  if (!lesson || !category) {
    console.error("--lesson and --category are required");
    process.exit(1);
  }

  // Check for duplicate lesson text
  const existing = memory.lessons.find(
    (l) => l.lesson.toLowerCase() === lesson.toLowerCase()
  );
  if (existing) {
    existing.evidenceCount += 1;
    existing.lastSeenAt = new Date().toISOString();
    console.log(`[memory] Updated existing lesson "${existing.id}" (evidence: ${existing.evidenceCount})`);
    saveMemory(memory);
    return;
  }

  const id = `lesson-${String(memory.lessons.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();

  const newLesson: Lesson = {
    id,
    productType: productType as Lesson["productType"],
    category: category as Lesson["category"],
    lesson,
    evidenceCount: 1,
    appliesTo,
    addedAt: now,
    lastSeenAt: now,
  };

  memory.lessons.push(newLesson);
  saveMemory(memory);
  console.log(`[memory] Added lesson ${id}: "${lesson}"`);
}

function cmdList(): void {
  const memory = loadMemory();
  if (memory.lessons.length === 0) {
    console.log("[memory] No lessons captured yet.");
    return;
  }

  console.log(`[memory] ${memory.lessons.length} lessons:\n`);
  for (const l of memory.lessons) {
    console.log(`  ${l.id} [${l.category}] (evidence: ${l.evidenceCount})`);
    console.log(`    "${l.lesson}"`);
    console.log(`    applies-to: ${l.appliesTo.join(", ") || "general"}`);
    console.log(`    product-type: ${l.productType}`);
    console.log();
  }
}

function cmdPrune(args: Record<string, string>): void {
  const memory = loadMemory();
  const minEvidence = parseInt(args["min-evidence"] ?? "2", 10);
  const before = memory.lessons.length;
  memory.lessons = memory.lessons.filter((l) => l.evidenceCount >= minEvidence);
  const removed = before - memory.lessons.length;
  saveMemory(memory);
  console.log(`[memory] Pruned ${removed} low-evidence lessons (kept ${memory.lessons.length})`);
}

function cmdBulk(args: Record<string, string>): void {
  const file = args["file"];
  if (!file) {
    console.error("--file is required for bulk import");
    process.exit(1);
  }

  const raw = fs.readFileSync(file, "utf-8");
  const items = JSON.parse(raw) as Array<{
    category: string;
    productType?: string;
    lesson: string;
    appliesTo?: string[];
  }>;

  const memory = loadMemory();
  let added = 0;
  let updated = 0;

  for (const item of items) {
    const existing = memory.lessons.find(
      (l) => l.lesson.toLowerCase() === item.lesson.toLowerCase()
    );
    if (existing) {
      existing.evidenceCount += 1;
      existing.lastSeenAt = new Date().toISOString();
      updated++;
    } else {
      const id = `lesson-${String(memory.lessons.length + 1).padStart(3, "0")}`;
      const now = new Date().toISOString();
      memory.lessons.push({
        id,
        productType: (item.productType ?? "other") as Lesson["productType"],
        category: item.category as Lesson["category"],
        lesson: item.lesson,
        evidenceCount: 1,
        appliesTo: item.appliesTo ?? [],
        addedAt: now,
        lastSeenAt: now,
      });
      added++;
    }
  }

  saveMemory(memory);
  console.log(`[memory] Bulk import: ${added} added, ${updated} updated`);
}

// ── Main ──────────────────────────────────────────────────────────────────

const [, , command, ...rest] = process.argv;
const args = parseArgs(rest);

switch (command) {
  case "add":
    cmdAdd(args);
    break;
  case "list":
    cmdList();
    break;
  case "prune":
    cmdPrune(args);
    break;
  case "bulk":
    cmdBulk(args);
    break;
  default:
    console.log(`
capture-lessons — pipeline memory management

Usage:
  add    Add a lesson from a completed build
  list   List all captured lessons
  prune  Remove lessons with low evidence count
  bulk   Import lessons from a JSON file

Examples:
  npx tsx planning-machine/scripts/capture-lessons.ts add \\
    --product-type crud-saas \\
    --category task-sizing \\
    --lesson "Always split auth into: schema, service, middleware, UI — never one task" \\
    --applies-to "backend,auth"

  npx tsx planning-machine/scripts/capture-lessons.ts list

  npx tsx planning-machine/scripts/capture-lessons.ts prune --min-evidence 2
`);
    process.exit(command ? 1 : 0);
}
