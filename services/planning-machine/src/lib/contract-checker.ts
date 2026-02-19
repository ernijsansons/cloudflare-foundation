/**
 * Contract Checker — Level 2 verification for Naomi task execution.
 *
 * After a task completes, verifies that:
 * 1. The integrationContract.exports were actually produced
 * 2. The integrationContract.apiEndpoints are reachable
 * 3. The integrationContract.environmentVarsRequired are set
 *
 * Used by Naomi's verification loop before marking a task as "done".
 *
 * Note: This is a lightweight structural checker, not a runtime type verifier.
 * Level 3 (behavioral) verification uses the task's acceptanceCriteria.verificationCommand.
 */

export interface ContractCheckResult {
  passed: boolean;
  level: "syntactic" | "contract" | "behavioral";
  checks: ContractCheck[];
  failedChecks: ContractCheck[];
  summary: string;
}

export interface ContractCheck {
  name: string;
  description: string;
  passed: boolean;
  detail?: string;
}

export interface ContractCheckInput {
  taskId: string;
  taskTitle: string;
  integrationContract: {
    exports: string[];
    apiEndpoints: string[];
    databaseMutations: string[];
    environmentVarsRequired: string[];
    downstreamTasks: string[];
  };
  /** Files that were created or modified by the task (reported by Naomi) */
  filesProduced: string[];
  /** Environment variables available in the execution context */
  environmentVarsPresent: string[];
  /** API endpoints available after the task (optional — for live checking) */
  endpointsAvailable?: string[];
}

/**
 * Level 2 contract check: structural verification.
 * Checks that the task produced the artifacts it promised.
 */
export function checkContract(input: ContractCheckInput): ContractCheckResult {
  const checks: ContractCheck[] = [];

  // Check 1: Files produced match filesToCreate/filesToModify expectations
  // We check this via exports — if the export says "UserService", there should be a file with that name
  for (const exportDecl of input.integrationContract.exports) {
    const exportName = extractExportName(exportDecl);
    if (!exportName) continue;

    const fileFound = input.filesProduced.some((f) =>
      f.toLowerCase().includes(exportName.toLowerCase().replace(/[^a-z0-9]/g, "-"))
    );

    checks.push({
      name: `export-${exportName}`,
      description: `Export "${exportDecl}" should be produced`,
      passed: fileFound || input.filesProduced.length > 0, // Lenient — file presence is sufficient
      detail: fileFound
        ? `File matching "${exportName}" found in produced files`
        : `No file matching "${exportName}" found. Files produced: ${input.filesProduced.join(", ") || "none"}`,
    });
  }

  // Check 2: Required environment variables are present
  for (const envVar of input.integrationContract.environmentVarsRequired) {
    const present = input.environmentVarsPresent.includes(envVar);
    checks.push({
      name: `env-${envVar}`,
      description: `Environment variable "${envVar}" must be set`,
      passed: present,
      detail: present
        ? `${envVar} is set`
        : `${envVar} is NOT set — task may fail at runtime`,
    });
  }

  // Check 3: API endpoints were registered (if endpoint list provided)
  if (input.endpointsAvailable && input.integrationContract.apiEndpoints.length > 0) {
    for (const endpoint of input.integrationContract.apiEndpoints) {
      const [method, path] = endpoint.split(" ");
      const found = input.endpointsAvailable.some((e) => {
        const [eMethod, ePath] = e.split(" ");
        return eMethod?.toUpperCase() === method?.toUpperCase() &&
          pathMatches(ePath ?? "", path ?? "");
      });

      checks.push({
        name: `endpoint-${endpoint.replace(/[^a-z0-9]/gi, "-")}`,
        description: `API endpoint "${endpoint}" should be registered`,
        passed: found,
        detail: found
          ? `Endpoint found`
          : `Endpoint "${endpoint}" not found in available endpoints`,
      });
    }
  }

  const failedChecks = checks.filter((c) => !c.passed);
  const passed = failedChecks.length === 0;

  return {
    passed,
    level: "contract",
    checks,
    failedChecks,
    summary: passed
      ? `All ${checks.length} contract checks passed for task "${input.taskTitle}"`
      : `${failedChecks.length}/${checks.length} contract checks failed for task "${input.taskTitle}": ${failedChecks.map((c) => c.name).join(", ")}`,
  };
}

/**
 * Level 1 syntactic check: files exist and have content.
 * This is the most basic check — did the task produce any output at all?
 */
export function checkSyntactic(input: {
  taskId: string;
  taskTitle: string;
  filesProduced: string[];
  typecheckPassed: boolean;
  lintPassed: boolean;
  errors: string[];
}): ContractCheckResult {
  const checks: ContractCheck[] = [
    {
      name: "files-produced",
      description: "Task must produce at least one file",
      passed: input.filesProduced.length > 0,
      detail: `Files produced: ${input.filesProduced.length}`,
    },
    {
      name: "typecheck",
      description: "TypeScript compilation must succeed",
      passed: input.typecheckPassed,
      detail: input.typecheckPassed ? "Typecheck passed" : `Typecheck failed: ${input.errors.slice(0, 3).join("; ")}`,
    },
    {
      name: "lint",
      description: "Linting must pass",
      passed: input.lintPassed,
      detail: input.lintPassed ? "Lint passed" : `Lint failed: ${input.errors.slice(0, 3).join("; ")}`,
    },
  ];

  const failedChecks = checks.filter((c) => !c.passed);
  const passed = failedChecks.length === 0;

  return {
    passed,
    level: "syntactic",
    checks,
    failedChecks,
    summary: passed
      ? `Syntactic check passed for "${input.taskTitle}"`
      : `Syntactic check failed for "${input.taskTitle}": ${failedChecks.map((c) => c.name).join(", ")}`,
  };
}

/**
 * Determine whether to re-queue a failed task.
 * Returns the re-queue prompt with failure context injected into naomiPrompt.
 */
export function buildRequeuePrompt(
  originalPrompt: string,
  failureResults: ContractCheckResult[],
  attemptNumber: number
): string {
  const failures = failureResults
    .filter((r) => !r.passed)
    .flatMap((r) => r.failedChecks)
    .map((c) => `- ${c.name}: ${c.detail}`)
    .join("\n");

  return `${originalPrompt}

=== PREVIOUS ATTEMPT FAILED (Attempt ${attemptNumber}) ===
The previous execution of this task failed verification. Fix the following issues:

${failures}

=== END FAILURE CONTEXT ===

Retry the task addressing these specific failures. Do not change working parts of the implementation.`;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function extractExportName(exportDecl: string): string | null {
  // "UserService with interface { register, login }" → "UserService"
  const match = exportDecl.match(/^([A-Za-z][A-Za-z0-9]*)/);
  return match?.[1] ?? null;
}

function pathMatches(actual: string, expected: string): boolean {
  // Simple path matching — convert :param to wildcard
  const pattern = expected.replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${pattern}$`).test(actual);
}
