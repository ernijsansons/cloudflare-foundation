import { z } from "zod";

// Use z.any() passthrough for maximum leniency
const anyField = z.any().nullish();
const anyArray = z.any().nullish().default([]);

export const LandingPageBlueprintSchema = z.any().nullish();
export const DesignSystemSchema = z.any().nullish();
export const AppPageSchema = z.any().nullish();

export const ProductDesignOutputSchema = z.object({
  mvpScope: anyField,
  informationArchitecture: anyField,
  landingPageBlueprint: anyField,
  appPages: anyArray,
  designSystem: anyField,
  copyGuidance: anyField,
  conversionOptimization: anyField,
  accessibilityRequirements: anyArray,
  performanceBudget: anyField,
  recommendedTechStack: anyField,
}).passthrough();

export type ProductDesignOutput = z.infer<typeof ProductDesignOutputSchema>;
