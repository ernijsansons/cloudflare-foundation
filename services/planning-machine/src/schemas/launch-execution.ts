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
}).passthrough();

export type LaunchExecutionOutput = z.infer<typeof LaunchExecutionOutputSchema>;
