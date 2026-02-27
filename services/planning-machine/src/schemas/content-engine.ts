import { z } from "zod";

// ============================================================================
// LEGAL & COMPLIANCE SCHEMA (Phase 1.3)
// Expands from empty objects to comprehensive structured analysis
// ============================================================================

export const LegalComplianceSchema = z.object({
  // Applicable Regulations
  applicableRegulations: z.object({
    gdpr: z.object({
      applies: z.boolean(),
      requirements: z.array(z.string()).default([]),
      implementationCost: z.string().optional(),
      launchBlocker: z.boolean(),
    }),
    ccpa: z.object({
      applies: z.boolean(),
      requirements: z.array(z.string()).default([]),
      implementationCost: z.string().optional(),
      launchBlocker: z.boolean(),
    }),
    euAiAct: z.object({
      applies: z.boolean(),
      tier: z.enum(["minimal", "limited", "high", "unacceptable"]).optional(),
      requirements: z.array(z.string()).default([]),
      launchBlocker: z.boolean(),
    }),
    industrySpecific: z.array(z.object({
      regulation: z.string(),  // e.g., "HIPAA", "FINRA", "PCI-DSS"
      applies: z.boolean(),
      requirements: z.array(z.string()),
      certificationRequired: z.boolean(),
    })).default([]),
  }),

  // Data Governance
  dataGovernance: z.object({
    dataResidency: z.object({
      required: z.boolean(),
      regions: z.array(z.string()).default([]),  // e.g., ["EU", "US", "UK"]
      cloudflareStrategy: z.string().optional(),  // How to implement with R2/D1
    }),
    retentionPolicy: z.object({
      userData: z.string(),           // e.g., "7 years after account deletion"
      analyticsData: z.string(),      // e.g., "90 days"
      auditLogs: z.string(),          // e.g., "7 years" (SOC2/HIPAA)
      backups: z.string(),
      deletionProcedure: z.string(),  // How users request deletion
    }),
    dataClassification: z.object({
      pii: z.array(z.string()).default([]),       // Fields containing PII
      sensitive: z.array(z.string()).default([]), // Extra sensitive fields
      public: z.array(z.string()).default([]),
    }),
  }),

  // AI Disclosure
  aiDisclosure: z.object({
    required: z.boolean(),
    disclosureText: z.string().optional(),
    userConsentRequired: z.boolean(),
    modelProviderCompliance: z.string().optional(),
  }),

  // Audit & Logging Requirements
  auditAndLogging: z.object({
    legalRequirements: z.array(z.string()).default([]),
    retentionPeriod: z.string(),
    accessControls: z.string(),
    immutability: z.boolean(),  // Audit hash chain requirement
  }),

  // Compliance Certifications
  complianceCertifications: z.object({
    soc2: z.object({
      required: z.boolean(),
      type: z.enum(["Type I", "Type II", "Not needed"]),
      timeline: z.string().optional(),
      bootstrapCost: z.string().optional(),
      whenToStart: z.string().optional(),
    }),
    iso27001: z.object({
      required: z.boolean(),
      timeline: z.string().optional(),
    }).optional(),
    hipaa: z.object({
      required: z.boolean(),
      subjectTo: z.string().optional(),
    }).optional(),
  }),

  // Risk Matrix
  riskMatrix: z.array(z.object({
    risk: z.string(),
    likelihood: z.enum(["high", "medium", "low"]),
    impact: z.enum(["catastrophic", "major", "moderate", "minor"]),
    mitigation: z.string(),
    bootstrapPriority: z.enum(["launch-blocker", "month-1", "month-3", "year-1"]),
  })).default([]),

  // Bootstrap Compliance Strategy
  bootstrapCompliance: z.object({
    launchBlockers: z.array(z.string()).default([]),
    canDeferUntil: z.array(z.object({
      milestone: z.string(),
      items: z.array(z.string()),
    })).default([]),
    freeTooling: z.array(z.string()).default([]),
    whenToHireLawyer: z.string(),
  }),

  // Vendor Compliance
  vendorCompliance: z.array(z.object({
    vendor: z.string(),
    dataProcessing: z.boolean(),
    dpaRequired: z.boolean(),  // Data Processing Agreement
    subProcessors: z.array(z.string()).default([]),
  })).default([]),

  // Indemnity & Liability
  indemnityAndLiability: z.object({
    limitationOfLiability: z.string(),
    indemnificationScope: z.string(),
    insuranceRecommendation: z.string().optional(),
  }),

  // Copy Templates (Original functionality)
  copyTemplates: z.object({
    privacyPolicy: z.object({
      sections: z.array(z.string()).default([]),
      keyPoints: z.array(z.string()).default([]),
    }).optional(),
    termsOfService: z.object({
      sections: z.array(z.string()).default([]),
      keyPoints: z.array(z.string()).default([]),
    }).optional(),
    cookieConsent: z.object({
      cookieTypes: z.array(z.string()).default([]),
      consentMechanism: z.string().optional(),
    }).optional(),
  }).optional(),
});

// ============================================================================
// MAIN CONTENT ENGINE OUTPUT SCHEMA
// ============================================================================

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

  // Expanded Legal Requirements (Phase 1.3)
  legalRequirements: LegalComplianceSchema.optional(),

  changelogFormat: anyField,
  /**
   * Draft tasks contributed by content-engine toward final TASKS.json.
   * Include: landing page copy tasks, email sequence tasks, UX copy tasks.
   * These are type: "marketing" tasks with humanReviewRequired: true.
   */
  draftTasks: anyArray,
}).passthrough();

export type ContentEngineOutput = z.infer<typeof ContentEngineOutputSchema>;
