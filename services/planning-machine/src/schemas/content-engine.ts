import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const ContentEngineOutputSchema = z.object({
  onboardingCopy: anyField,
  transactionalEmails: anyField,
  emptyStates: anyArray,
  errorMessages: anyField,
  successMessages: anyField,
  loadingStates: anyField,
  faqContent: anyArray,
  legalRequirements: anyField,
  changelogFormat: anyField,
}).passthrough();

export type ContentEngineOutput = z.infer<typeof ContentEngineOutputSchema>;
