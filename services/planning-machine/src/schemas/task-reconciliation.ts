/**
 * Task Reconciliation Schema — Phase 16 output (Enhanced Phase 4)
 * This is the full TASKS.json plus reconciliation metadata.
 *
 * PHASE 4 ENHANCEMENT: Added scaffold & deployment manifest for autonomous builds
 */

import { z } from "zod";

import { TasksOutputSchema } from "./tasks-output";

// Phase 4: Scaffold Commands Schema
export const ScaffoldCommandSchema = z.object({
  command: z.string(),
  description: z.string(),
  workingDirectory: z.string().default("."),
  runInParallel: z.boolean().default(false),
});

// Phase 4: Deployment Step Schema
export const DeploymentStepSchema = z.object({
  step: z.number().int(),
  command: z.string(),
  description: z.string(),
  service: z.string().optional(),  // e.g., "gateway", "ui", "agents"
  dependsOn: z.array(z.number()).default([]),  // Step numbers this depends on
  canFail: z.boolean().default(false),  // Continue if this step fails
  expectedDuration: z.string().optional(),  // e.g., "30s", "2m"
});

// Phase 4: Artifact Mapping Schema
export const ArtifactMappingSchema = z.object({
  artifactType: z.enum(["sqlDDL", "openAPISpec", "wranglerConfigJSONC", "envExample", "auditChainVerificationLogic"]),
  sourcePath: z.string(),  // Where the artifact is generated (e.g., "output/schema.sql")
  targetPath: z.string(),  // Where it should be placed (e.g., "packages/db/schema.sql")
  required: z.boolean().default(true),
});

export const TaskReconciliationOutputSchema = TasksOutputSchema.extend({
  reconciliation: z.object({
    /** Total draft tasks received from phases 9-14 */
    draftTasksReceived: z.number().int(),
    /** Tasks that were merged/deduplicated */
    tasksMerged: z.number().int(),
    /** Security review tasks auto-added */
    securityTasksAdded: z.number().int(),
    /** Integration glue tasks auto-added */
    glueTasksAdded: z.number().int(),
    /** Test tasks auto-added for pyramid balance */
    testTasksAdded: z.number().int(),
    /** Infrastructure tasks auto-added for build phase 1 */
    infraTasksAdded: z.number().int(),
    /** Cycle detection result */
    dependencyCyclesFound: z.number().int(),
    /** Were any cycles broken and how */
    cyclesResolved: z.array(z.string()).default([]),
    /** Phases that contributed draft tasks */
    contributingPhases: z.array(z.string()).default([]),
    /** Pipeline memory lessons applied */
    lessonsApplied: z.array(z.string()).default([]),
  }),

  /** PHASE 4: Scaffold commands to build 10-Plane folder structure */
  scaffoldCommands: z.array(ScaffoldCommandSchema).default([]),

  /** PHASE 4: Deployment sequence with dependencies (prevents dependency failures) */
  deploymentSequence: z.array(DeploymentStepSchema).default([]),

  /** PHASE 4: Artifact mapping (executable artifacts → file paths) */
  artifactMap: z.array(ArtifactMappingSchema).default([]),

  /** PHASE 4: Naomi-Ready bootstrap prompt (self-contained execution instructions) */
  bootstrapPrompt: z.string().optional(),
});

export type TaskReconciliationOutput = z.infer<typeof TaskReconciliationOutputSchema>;
export type ScaffoldCommand = z.infer<typeof ScaffoldCommandSchema>;
export type DeploymentStep = z.infer<typeof DeploymentStepSchema>;
export type ArtifactMapping = z.infer<typeof ArtifactMappingSchema>;
