import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const TechArchOutputSchema = z.object({
  databaseSchema: anyField,
  apiRoutes: anyField,
  sveltekitRoutes: anyField,
  durableObjects: anyField,
  workflows: anyField,
  queueHandlers: anyField,
  mcpTools: anyField,
  cronJobs: anyField,
  wranglerChanges: anyField,
  environmentVariables: anyField,
  authFlowDecisions: anyField,
  thirdPartyIntegrations: anyArray,
  technicalDecisions: anyArray,
  /**
   * Draft tasks contributed by tech-arch toward final TASKS.json.
   * Include: infra setup, DB migrations, workers, bindings, devops tasks.
   */
  draftTasks: anyArray,
}).passthrough();

export type TechArchOutput = z.infer<typeof TechArchOutputSchema>;
