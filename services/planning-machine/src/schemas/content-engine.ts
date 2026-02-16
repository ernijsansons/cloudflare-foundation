import { z } from "zod";

export const ContentEngineOutputSchema = z.object({
  onboardingCopy: z.object({
    steps: z.array(z.object({
      screenTitle: z.string(),
      bodyText: z.string(),
      fieldLabels: z.record(z.string()).optional(),
      fieldPlaceholders: z.record(z.string()).optional(),
      helperText: z.string().optional(),
      buttonText: z.string(),
      progressText: z.string().optional(),
    })).optional(),
    welcomeScreen: z.object({
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
    }).optional(),
    firstRunGuidance: z.object({
      tooltipCopy: z.string().optional(),
      calloutCopy: z.string().optional(),
    }).optional(),
  }),
  transactionalEmails: z.object({
    welcome: z.object({
      subjectLines: z.array(z.string()),
      body: z.string(),
      cta: z.string(),
    }).optional(),
    passwordReset: z.object({
      subject: z.string(),
      body: z.string(),
      securityNote: z.string().optional(),
    }).optional(),
    trialExpiring: z.object({
      subjectLines: z.array(z.string()),
      body: z.string(),
      upgradeCta: z.string(),
    }).optional(),
    invoiceReceipt: z.object({
      subject: z.string(),
      body: z.string(),
    }).optional(),
    featureAnnouncement: z.object({
      subject: z.string(),
      body: z.string(),
    }).optional(),
  }).optional(),
  emptyStates: z.array(z.object({
    pageRoute: z.string(),
    headline: z.string(),
    body: z.string(),
    ctaText: z.string(),
    illustration: z.string().optional(),
  })).optional(),
  errorMessages: z.object({
    validation: z.record(z.string()).optional(),
    apiErrors: z.record(z.string()).optional(),
    networkErrors: z.object({
      offline: z.string(),
      timeout: z.string(),
      retry: z.string(),
    }).optional(),
    paymentErrors: z.record(z.string()).optional(),
  }).optional(),
  successMessages: z.record(z.string()).optional(),
  loadingStates: z.record(z.string()).optional(),
  faqContent: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
  })).optional(),
  legalRequirements: z.object({
    privacyPolicy: z.object({
      dataCollected: z.array(z.string()).optional(),
      purpose: z.string().optional(),
      retentionPeriod: z.string().optional(),
      thirdParties: z.array(z.string()).optional(),
      userRights: z.array(z.string()).optional(),
    }).optional(),
    termsOfService: z.object({
      scope: z.string().optional(),
      acceptableUse: z.string().optional(),
      liabilityLimits: z.string().optional(),
      termination: z.string().optional(),
    }).optional(),
    cookieConsent: z.object({
      categories: z.array(z.string()).optional(),
      consentMechanism: z.string().optional(),
    }).optional(),
    gdprCompliance: z.object({
      lawfulBasis: z.string().optional(),
      dataSubjectRights: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  changelogFormat: z.object({
    template: z.string(),
    frequency: z.string().optional(),
  }).optional(),
});

export type ContentEngineOutput = z.infer<typeof ContentEngineOutputSchema>;
