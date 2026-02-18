import { z } from "zod";

export const LaunchExecutionOutputSchema = z.object({
  ninetyDayPlan: z.object({
    weeks: z.array(z.object({
      theme: z.string(),
      dailyActions: z.array(z.string()),
      kpis: z.array(z.string()).optional(),
      budget: z.string().optional(),
      toolsNeeded: z.array(z.string()).optional(),
    })),
  }),
  metricsFramework: z.object({
    northStarMetric: z.string(),
    weeklyMetrics: z.array(z.string()).optional(),
    leadIndicators: z.array(z.string()).optional(),
    pivotTriggers: z.array(z.string()).optional(),
  }),
  toolStack: z.array(z.object({
    function: z.string(),
    tool: z.string(),
    cost: z.string().optional(),
  })).optional(),
  budgetAllocation: z.record(z.string()).optional(),
  buildSchedule: z.object({
    week1to2: z.string().optional(),
    week3to4: z.string().optional(),
    week5to8: z.string().optional(),
    week9to12: z.string().optional(),
  }).optional(),
});

export type LaunchExecutionOutput = z.infer<typeof LaunchExecutionOutputSchema>;
