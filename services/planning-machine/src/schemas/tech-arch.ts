import { z } from "zod";

export const TechArchOutputSchema = z.object({
  databaseSchema: z.object({
    newTables: z.array(z.object({
      name: z.string(),
      drizzleCode: z.string().optional(),
      migrationSQL: z.string(),
      relationships: z.array(z.string()).optional(),
    })),
    schemaFile: z.string().optional(),
    migrationFile: z.string().optional(),
  }),
  apiRoutes: z.object({
    routes: z.array(z.object({
      method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
      path: z.string(),
      requestBody: z.string().optional(),
      responseBody: z.string().optional(),
      auth: z.enum(["required", "optional", "public"]),
      description: z.string().optional(),
    })),
    gatewayChanges: z.string().optional(),
  }),
  sveltekitRoutes: z.object({
    routes: z.array(z.object({
      path: z.string(),
      files: z.array(z.string()).optional(),
      dataLoad: z.string().optional(),
      components: z.array(z.string()).optional(),
    })),
  }).optional(),
  durableObjects: z.object({
    newAgents: z.array(z.object({
      className: z.string(),
      stateShape: z.string().optional(),
      methods: z.array(z.string()).optional(),
      wranglerBinding: z.string(),
    })).optional(),
  }).optional(),
  workflows: z.object({
    existingToFill: z.array(z.object({
      name: z.string(),
      implementation: z.string().optional(),
    })).optional(),
    newWorkflows: z.array(z.object({
      name: z.string(),
      params: z.string().optional(),
      steps: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
  queueHandlers: z.object({
    existingToFill: z.array(z.object({
      queue: z.string(),
      messageSchema: z.string().optional(),
    })).optional(),
    messageSchemas: z.record(z.string()).optional(),
  }).optional(),
  mcpTools: z.object({
    newTools: z.array(z.object({
      name: z.string(),
      inputSchema: z.string().optional(),
      outputSchema: z.string().optional(),
    })).optional(),
  }).optional(),
  cronJobs: z.object({
    jobs: z.array(z.object({
      expression: z.string(),
      action: z.string(),
      service: z.string().optional(),
    })).optional(),
  }).optional(),
  wranglerChanges: z.record(z.string()).optional(),
  environmentVariables: z.object({
    secrets: z.array(z.object({
      name: z.string(),
      description: z.string(),
      howToObtain: z.string().optional(),
    })).optional(),
    devVars: z.string().optional(),
  }).optional(),
  authFlowDecisions: z.object({
    signupMethod: z.string(),
    sessionDuration: z.string().optional(),
    roleBasedAccess: z.object({
      roles: z.array(z.string()),
      permissionsPerRole: z.record(z.array(z.string())).optional(),
    }).optional(),
  }).optional(),
  thirdPartyIntegrations: z.array(z.object({
    api: z.string(),
    sdk: z.string().optional(),
    service: z.string().optional(),
    envVar: z.string().optional(),
  })).optional(),
  technicalDecisions: z.array(z.object({
    category: z.string(),
    preferred: z.string(),
    avoid: z.string(),
    reason: z.string(),
    cloudflareNative: z.boolean(),
  })).optional(),
});

export type TechArchOutput = z.infer<typeof TechArchOutputSchema>;
