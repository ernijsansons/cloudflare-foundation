import { z } from "zod";

/**
 * Validation Schema (Phase 18 - Phase 4 Implementation)
 * Syntactic validation of generated artifacts before final output
 *
 * Purpose: Catch errors early (invalid JSON, missing tables, malformed YAML)
 * before Claude Code attempts to use artifacts
 */

// Individual validation result
export const ValidationResultSchema = z.object({
  artifactType: z.enum([
    "wranglerConfigJSONC",
    "tasksJSON",
    "sqlDDL",
    "openAPISpec",
    "envExample",
    "auditChainVerificationLogic",
  ]),
  passed: z.boolean(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  autoFixed: z.boolean().default(false),
  fixDescription: z.string().optional(),
});

// Phase-specific validation (which phase needs correction)
export const PhaseCorrectionSchema = z.object({
  phase: z.string(),  // e.g., "tech-arch", "task-reconciliation"
  issue: z.string(),
  suggestedFix: z.string(),
  severity: z.enum(["critical", "warning", "info"]),
});

// Main validation output
export const ValidationOutputSchema = z.object({
  overallStatus: z.enum(["pass", "pass-with-warnings", "fail"]),

  validationResults: z.array(ValidationResultSchema).default([]),

  summary: z.object({
    totalChecks: z.number().int(),
    passed: z.number().int(),
    failed: z.number().int(),
    warnings: z.number().int(),
    autoFixed: z.number().int(),
  }),

  // Foundation invariant checks (Phase 4)
  foundationInvariants: z.object({
    sqlHasTenantsTable: z.boolean(),
    sqlHasUsersTable: z.boolean(),
    sqlHasAuditChainTable: z.boolean(),
    sqlHasAuditLogTable: z.boolean(),
    wranglerHasSessionKV: z.boolean().optional(),  // Only for gateway services
    tasksHaveBootstrapPrompt: z.boolean(),
    artifactMapComplete: z.boolean(),
  }),

  // Corrections needed (if any)
  correctionsNeeded: z.array(PhaseCorrectionSchema).default([]),

  // Loop-back trigger (if validation fails critically)
  triggerCorrection: z.boolean().default(false),
  correctionPhases: z.array(z.string()).default([]),  // Phases to re-run
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type PhaseCorrection = z.infer<typeof PhaseCorrectionSchema>;
