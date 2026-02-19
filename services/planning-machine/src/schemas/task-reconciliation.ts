/**
 * Task Reconciliation Schema — Phase 16 output.
 * This is the full TASKS.json plus reconciliation metadata.
 */

import { z } from "zod";
import { TasksOutputSchema } from "./tasks-output";

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
});

export type TaskReconciliationOutput = z.infer<typeof TaskReconciliationOutputSchema>;
