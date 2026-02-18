import { z } from "zod";

export const SynthesisOutputSchema = z.object({
  executiveSummary: z.string(),
  oneLinePitch: z.string(),
  elevatorPitch: z.string().optional(),
  riskRegister: z.array(z.object({
    risk: z.string(),
    probability: z.string().optional(),
    impact: z.string().optional(),
    mitigation: z.string().optional(),
  })).optional(),
  keyAssumptions: z.array(z.object({
    assumption: z.string(),
    howToValidate: z.string().optional(),
  })).optional(),
  confidenceScore: z.object({
    overall: z.number().optional(),
    breakdown: z.record(z.number()).optional(),
  }).optional(),
  buildManifest: z.object({
    skillInvocations: z.array(z.object({
      skill: z.string(),
      order: z.number(),
      prompt: z.string(),
      inputArtifacts: z.array(z.string()).optional(),
      expectedOutput: z.string().optional(),
      acceptanceCriteria: z.array(z.string()).optional(),
    })).optional(),
    fileManifest: z.array(z.object({
      path: z.string(),
      action: z.enum(["create", "modify", "delete"]),
      description: z.string().optional(),
      sourcePhase: z.string().optional(),
    })).optional(),
    deploymentSteps: z.array(z.string()).optional(),
    secretsToSet: z.array(z.string()).optional(),
    postDeployChecks: z.array(z.string()).optional(),
  }),
  nextSteps: z.array(z.string()).optional(),
});

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
