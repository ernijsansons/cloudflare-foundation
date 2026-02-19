import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const LaunchExecutionOutputSchema = z.object({
  ninetyDayPlan: anyField,
  metricsFramework: anyField,
  toolStack: anyArray,
  budgetAllocation: anyField,
  buildSchedule: anyField,
  /**
   * Draft tasks contributed by launch-execution toward final TASKS.json.
   * Include: deployment tasks, monitoring setup, PR descriptions, runbooks, post-launch tasks.
   */
  draftTasks: anyArray,
}).passthrough();

export type LaunchExecutionOutput = z.infer<typeof LaunchExecutionOutputSchema>;
