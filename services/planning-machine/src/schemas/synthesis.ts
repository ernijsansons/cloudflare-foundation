import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const SynthesisOutputSchema = z.object({
  executiveSummary: anyField,
  oneLinePitch: anyField,
  elevatorPitch: anyField,
  riskRegister: anyArray,
  keyAssumptions: anyArray,
  confidenceScore: anyField,
  buildManifest: anyField,
  nextSteps: anyArray,
}).passthrough();

export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
