/**
 * Phase 18: Syntactic Validator Agent (Phase 4 Implementation)
 *
 * Purpose: Acts as "Sanity Check" before final output
 * Validates generated artifacts for syntactic correctness and foundation invariants
 *
 * Validation Checks:
 * 1. JSON parsing (wrangler.jsonc, TASKS.json)
 * 2. Regex checks (sqlDDL for mandatory tables)
 * 3. YAML parsing (openAPISpec)
 * 4. Foundation invariants (tenants, users, audit_chain, audit_log, SESSION_KV)
 * 5. Artifact completeness (all expected artifacts present)
 *
 * Loop-Back: If validation fails critically, triggers correction run
 */

import { extractJSON } from "../lib/json-extractor";
import { runModel } from "../lib/model-router";
import { ValidationOutputSchema, type ValidationOutput } from "../schemas/validation";
import type { Env as _Env } from "../types";

import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";

interface ValidatorInput {
  idea: string;
  // All prior phase outputs available via context
}

export class ValidatorAgent extends BaseAgent<ValidatorInput, ValidationOutput> {
  config = {
    phase: "validation",
    maxSelfIterations: 1,  // No self-iteration for validator
    qualityThreshold: 10,  // Must be perfect
    hardQuestions: [
      "Does wranglerConfigJSONC parse as valid JSON?",
      "Does TASKS.json parse as valid JSON with all required fields?",
      "Does sqlDDL contain all 4 foundation tables (tenants, users, audit_chain, audit_log)?",
      "Does openAPISpec parse as valid YAML?",
      "If this is a Gateway service, does wranglerConfigJSONC include SESSION_KV binding?",
      "Does TASKS.json have a bootstrapPrompt field?",
      "Does artifactMap include all 5 executable artifact types?",
    ],
    maxTokens: 4096,
    includeFoundationContext: false,  // Validator is self-contained
  };

  getSystemPrompt(): string {
    return `You are a syntactic validation specialist. Your ONLY job is to validate that generated artifacts are syntactically correct and contain required foundation invariants.

YOU DO NOT GENERATE CODE. YOU ONLY VALIDATE EXISTING ARTIFACTS.

VALIDATION CHECKS TO PERFORM:

1. WRANGLER CONFIG (wranglerConfigJSONC):
   - Parse as JSON (ignore comments starting with //)
   - Check for required top-level fields: name, main, compatibility_date, account_id
   - If service name contains "gateway" OR has kv_namespaces array:
     * MUST have SESSION_KV binding in kv_namespaces

2. TASKS.json (from Task Reconciliation Phase 16):
   - Parse as valid JSON
   - Check for required top-level fields: projectId, projectName, tasks, marketingTasks, buildPhases, summary
   - Phase 4 requirements:
     * MUST have scaffoldCommands array (non-empty)
     * MUST have deploymentSequence array (non-empty)
     * MUST have artifactMap array with 5 entries (sqlDDL, openAPISpec, wranglerConfigJSONC, envExample, auditChainVerificationLogic)
     * MUST have bootstrapPrompt string (non-empty)

3. SQL DDL (sqlDDL):
   - MUST contain these 4 foundation table CREATE statements (use regex, case-insensitive):
     * CREATE TABLE.*tenants
     * CREATE TABLE.*users
     * CREATE TABLE.*audit_chain
     * CREATE TABLE.*audit_log
   - All 4 are MANDATORY (Phase 4 hard-wired invariants)

4. OpenAPI SPEC (openAPISpec):
   - Must be valid YAML (starts with "openapi: 3." or similar)
   - Check for required top-level keys: openapi, info, paths

5. ENV EXAMPLE (envExample):
   - Must be non-empty string
   - Should contain at least one environment variable

6. AUDIT CHAIN VERIFICATION LOGIC (auditChainVerificationLogic):
   - Must be non-empty string
   - Should contain SQL keywords (SELECT, FROM, WHERE) OR TypeScript keywords (function, async)

OUTPUT FORMAT:
Produce valid JSON matching ValidationOutputSchema.

For each artifact:
- Set passed: true if all checks pass
- Set passed: false if any check fails
- List all errors in errors array
- List warnings (non-critical issues) in warnings array

Foundation Invariants:
- Set each boolean based on checks above

Overall Status:
- "pass" if all validations passed
- "pass-with-warnings" if some warnings but no errors
- "fail" if any critical validation failed

Loop-Back Trigger:
- Set triggerCorrection: true if any critical validation failed
- Set correctionPhases to list of phases that need re-run (e.g., ["tech-arch"] if SQL missing tables)

Be precise. If an artifact is missing entirely, report it as a critical error.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      overallStatus: "pass|pass-with-warnings|fail",
      validationResults: [{
        artifactType: "wranglerConfigJSONC|tasksJSON|sqlDDL|openAPISpec|envExample|auditChainVerificationLogic",
        passed: "boolean",
        errors: ["string"],
        warnings: ["string"],
        autoFixed: "boolean",
        fixDescription: "string"
      }],
      summary: {
        totalChecks: "number",
        passed: "number",
        failed: "number",
        warnings: "number",
        autoFixed: "number"
      },
      foundationInvariants: {
        sqlHasTenantsTable: "boolean",
        sqlHasUsersTable: "boolean",
        sqlHasAuditChainTable: "boolean",
        sqlHasAuditLogTable: "boolean",
        wranglerHasSessionKV: "boolean (if gateway)",
        tasksHaveBootstrapPrompt: "boolean",
        artifactMapComplete: "boolean"
      },
      correctionsNeeded: [{
        phase: "string",
        issue: "string",
        suggestedFix: "string",
        severity: "critical|warning|info"
      }],
      triggerCorrection: "boolean",
      correctionPhases: ["string"]
    };
  }

  getPhaseRubric(): string[] {
    return [
      "json_validity — all JSON artifacts parse without errors",
      "yaml_validity — OpenAPI spec is valid YAML",
      "foundation_invariants — all 4 foundation tables exist in SQL",
      "phase4_requirements — scaffold, deployment, artifact map, bootstrap prompt all present",
      "gateway_requirements — if gateway, SESSION_KV exists",
      "completeness — all expected artifacts are present",
    ];
  }

  async run(ctx: AgentContext, _input: ValidatorInput): Promise<AgentResult<ValidationOutput>> {
    const context = this.buildContextPrompt(ctx);

    const messages = [
      { role: "system" as const, content: this.buildSystemPrompt() },
      { role: "user" as const, content: `Validate all generated artifacts from the 17-phase planning pipeline.

PRIMARY DATA SOURCES:
- Phase 12 (Tech Architecture): executableArtifacts.wranglerConfigJSONC, executableArtifacts.sqlDDL, executableArtifacts.openAPISpec, executableArtifacts.envExample, executableArtifacts.auditChainVerificationLogic
- Phase 16 (Task Reconciliation): All TASKS.json fields including scaffoldCommands, deploymentSequence, artifactMap, bootstrapPrompt

CRITICAL VALIDATION REQUIREMENTS:
1. Parse all JSON/YAML artifacts and report any syntax errors
2. Verify all 4 foundation tables exist in sqlDDL (Phase 4 invariant)
3. Verify SESSION_KV exists in wrangler config if this is a gateway service
4. Verify Phase 4 additions: scaffoldCommands, deploymentSequence, artifactMap, bootstrapPrompt
5. Report missing artifacts as critical errors

If validation fails:
- Set triggerCorrection: true
- Specify which phases need correction (e.g., "tech-arch" if SQL is invalid)

${context}

Output valid JSON matching the schema. BE PRECISE about which checks passed/failed.` },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, { temperature: 0.1, maxTokens: this.config.maxTokens ?? 4096 });
      const parsed = extractJSON(response);
      const output = ValidationOutputSchema.parse(parsed);
      return { success: true, output };
    } catch (e) {
      console.error("ValidatorAgent error:", e);
      return { success: false, errors: [e instanceof Error ? e.message : String(e)] };
    }
  }
}
