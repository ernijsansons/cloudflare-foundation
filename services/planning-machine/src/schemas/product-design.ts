import { z } from "zod";

export const LandingPageBlueprintSchema = z.object({
  aboveTheFold: z.object({
    headline: z.string(),
    subheadline: z.string(),
    heroDescription: z.string().optional(),
    ctaText: z.string(),
    ctaColor: z.string().optional(),
    socialProof: z.string().optional(),
  }),
  sections: z.array(z.object({
    purpose: z.string(),
    headline: z.string(),
    copyFramework: z.string().optional(),
    contentGuidance: z.string().optional(),
  })).optional(),
});

export const DesignSystemSchema = z.object({
  colorPalette: z.object({
    primary: z.string(),
    primaryReasoning: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    surface: z.string().optional(),
    text: z.string().optional(),
    emotionalReasoning: z.string().optional(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    fontScale: z.string().optional(),
  }).optional(),
  spacing: z.string().optional(),
  borderRadius: z.string().optional(),
  iconStyle: z.string().optional(),
});

export const AppPageSchema = z.object({
  route: z.string(),
  purpose: z.string(),
  layout: z.string().optional(),
  components: z.array(z.string()).optional(),
  dataNeeded: z.array(z.string()).optional(),
  emptyState: z.string().optional(),
  loadingState: z.string().optional(),
  errorState: z.string().optional(),
});

export const ProductDesignOutputSchema = z.object({
  mvpScope: z.object({
    userStories: z.array(z.string()).optional(),
    featurePriority: z.array(z.object({
      feature: z.string(),
      priority: z.enum(["must_have", "nice_to_have", "future"]),
      reasoning: z.string().optional(),
    })).optional(),
    outOfScope: z.array(z.string()).optional(),
  }),
  informationArchitecture: z.object({
    siteMap: z.array(z.object({ path: z.string(), purpose: z.string() })).optional(),
    userFlows: z.array(z.string()).optional(),
    activationMetric: z.string().optional(),
  }).optional(),
  landingPageBlueprint: LandingPageBlueprintSchema,
  appPages: z.array(AppPageSchema).optional(),
  designSystem: DesignSystemSchema,
  copyGuidance: z.object({
    voiceAndTone: z.string().optional(),
    headlineFormulas: z.array(z.string()).optional(),
    ctaVariations: z.array(z.string()).optional(),
    microcopy: z.record(z.string()).optional(),
    socialProofStrategy: z.string().optional(),
  }).optional(),
  conversionOptimization: z.object({
    frictionPoints: z.array(z.string()).optional(),
    trustSignals: z.array(z.string()).optional(),
    urgencyTactics: z.array(z.string()).optional(),
  }).optional(),
  accessibilityRequirements: z.array(z.string()).optional(),
  performanceBudget: z.object({
    lcp: z.string().optional(),
    fid: z.string().optional(),
    cls: z.string().optional(),
  }).optional(),
  recommendedTechStack: z.object({
    framework: z.string().optional(),
    styling: z.string().optional(),
    hosting: z.string().optional(),
    claudeCodeSkills: z.array(z.string()).optional(),
    mapLibrary: z.string().optional(),
    mapLibraryReason: z.string().optional(),
  }).optional(),
});

export type ProductDesignOutput = z.infer<typeof ProductDesignOutputSchema>;
