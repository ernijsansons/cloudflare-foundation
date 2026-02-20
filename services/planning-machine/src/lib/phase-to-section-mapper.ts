/**
 * Phase-to-Section Mapper
 *
 * Maps planning phase outputs (Phases 1-15) to documentation sections (A-M).
 * This enables automatic documentation population as the planning pipeline executes.
 *
 * Mapping Strategy:
 * - Phase 0 (Intake) → Section A
 * - Phases 1-4 (Discovery) → Section A (enrichment)
 * - Phase 5 (Kill Test) → Section A (validation)
 * - Phases 6-8 (Strategy) → Sections B, G
 * - Phases 9-11 (Design) → Sections E, F, H, I
 * - Phases 12-14 (Execution) → Sections C, D, J, K, L
 * - Phase 15 (Synthesis) → Sections B, M, Overview
 */

import type {
  SectionA,
  SectionB,
  SectionC,
  SectionD,
  SectionE,
  SectionF,
  SectionG,
  SectionH,
  SectionI,
  SectionJ,
  SectionK,
  SectionL,
  SectionM,
  SectionId,
} from "@cloudflare/shared";

// ============================================================================
// PHASE OUTPUT INTERFACES
// ============================================================================

interface PhaseOutput {
  phase: string;
  data: unknown;
  runId: string;
}

interface SectionUpdate {
  sectionId: SectionId;
  subsectionKey?: string;
  content: Record<string, unknown>;
  populatedBy: string;
}

// ============================================================================
// PHASE-TO-SECTION MAPPING REGISTRY
// ============================================================================

type PhaseMapper = (output: PhaseOutput) => SectionUpdate[];

const PHASE_MAPPERS: Record<string, PhaseMapper> = {
  "phase-0-intake": mapIntakeToSectionA,
  "phase-1-opportunity": mapOpportunityToSectionA,
  "phase-2-customer-intel": mapCustomerIntelToSectionA,
  "phase-3-market-research": mapMarketResearchToSectionA,
  "phase-4-competitive-intel": mapCompetitiveIntelToSectionA,
  "phase-5-kill-test": mapKillTestToSectionA,
  "phase-6-revenue-expansion": mapRevenueToSectionG,
  "phase-7-strategy": mapStrategyToSectionB,
  "phase-8-business-model": mapBusinessModelToSectionG,
  "phase-9-product-design": mapProductDesignToSections,
  "phase-10-gtm": mapGTMToSectionH,
  "phase-11-content-engine": mapContentToSectionI,
  "phase-12-tech-arch": mapTechArchToSections,
  "phase-13-analytics": mapAnalyticsToSectionK,
  "phase-14-launch": mapLaunchToSections,
  "phase-15-synthesis": mapSynthesisToSections,
};

// ============================================================================
// MAIN MAPPING FUNCTION
// ============================================================================

/**
 * Map a phase output to one or more documentation section updates
 */
export function mapPhaseToSections(output: PhaseOutput): SectionUpdate[] {
  const mapper = PHASE_MAPPERS[output.phase];

  if (!mapper) {
    console.warn(`No mapper found for phase: ${output.phase}`);
    return [];
  }

  try {
    return mapper(output);
  } catch (error) {
    console.error(`Failed to map phase ${output.phase}:`, error);
    return [];
  }
}

// ============================================================================
// PHASE 0: INTAKE → SECTION A
// ============================================================================

function mapIntakeToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as { sectionA: SectionA };

  return [
    {
      sectionId: "A",
      subsectionKey: "A0_intake",
      content: data.sectionA.A0_intake as unknown as Record<string, unknown>,
      populatedBy: "phase-0-intake",
    },
    {
      sectionId: "A",
      subsectionKey: "A1_unknowns",
      content: data.sectionA.A1_unknowns as unknown as Record<string, unknown>,
      populatedBy: "phase-0-intake",
    },
    {
      sectionId: "A",
      subsectionKey: "A2_invariants",
      content: data.sectionA.A2_invariants as unknown as Record<string, unknown>,
      populatedBy: "phase-0-intake",
    },
  ];
}

// ============================================================================
// PHASES 1-4: DISCOVERY → SECTION A ENRICHMENT
// ============================================================================

function mapOpportunityToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    refined_opportunities?: Array<{ title: string; description: string }>;
    recommended_index?: number;
  };

  if (!data.refined_opportunities) return [];

  return [
    {
      sectionId: "A",
      subsectionKey: "discovery_opportunities",
      content: {
        opportunities: data.refined_opportunities,
        recommended: data.recommended_index ?? 0,
      },
      populatedBy: "phase-1-opportunity",
    },
  ];
}

function mapCustomerIntelToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    customer_segments?: Array<{ name: string; pain_points: string[] }>;
  };

  if (!data.customer_segments) return [];

  return [
    {
      sectionId: "A",
      subsectionKey: "discovery_customers",
      content: {
        segments: data.customer_segments,
      },
      populatedBy: "phase-2-customer-intel",
    },
  ];
}

function mapMarketResearchToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    tam?: string;
    sam?: string;
    som?: string;
    market_trends?: string[];
  };

  return [
    {
      sectionId: "A",
      subsectionKey: "discovery_market",
      content: {
        tam: data.tam,
        sam: data.sam,
        som: data.som,
        trends: data.market_trends,
      },
      populatedBy: "phase-3-market-research",
    },
  ];
}

function mapCompetitiveIntelToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    competitors?: Array<{ name: string; strengths: string[]; weaknesses: string[] }>;
    positioning_gaps?: string[];
  };

  return [
    {
      sectionId: "A",
      subsectionKey: "discovery_competitive",
      content: {
        competitors: data.competitors,
        positioning_gaps: data.positioning_gaps,
      },
      populatedBy: "phase-4-competitive-intel",
    },
  ];
}

function mapKillTestToSectionA(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    verdict?: "KILL" | "PIVOT" | "GO";
    risk_assessment?: Record<string, unknown>;
  };

  return [
    {
      sectionId: "A",
      subsectionKey: "validation_kill_test",
      content: {
        verdict: data.verdict,
        risk_assessment: data.risk_assessment,
      },
      populatedBy: "phase-5-kill-test",
    },
  ];
}

// ============================================================================
// PHASES 6-8: STRATEGY → SECTIONS B, G
// ============================================================================

function mapRevenueToSectionG(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    revenue_streams?: string[];
    pricing_model?: string;
    revenue_projections?: Record<string, unknown>;
  };

  return [
    {
      sectionId: "G",
      subsectionKey: "revenue_streams",
      content: {
        streams: data.revenue_streams,
        pricing_model: data.pricing_model,
        projections: data.revenue_projections,
      },
      populatedBy: "phase-6-revenue-expansion",
    },
  ];
}

function mapStrategyToSectionB(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    strategic_pillars?: string[];
    positioning_statement?: string;
    differentiators?: string[];
  };

  return [
    {
      sectionId: "B",
      subsectionKey: "strategy_pillars",
      content: {
        pillars: data.strategic_pillars,
        positioning: data.positioning_statement,
        differentiators: data.differentiators,
      },
      populatedBy: "phase-7-strategy",
    },
  ];
}

function mapBusinessModelToSectionG(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    unit_economics?: {
      cac?: string;
      ltv?: string;
      payback_period?: string;
      gross_margin?: string;
    };
    cost_structure?: Record<string, unknown>;
  };

  return [
    {
      sectionId: "G",
      subsectionKey: "unit_economics",
      content: {
        cac: data.unit_economics?.cac,
        ltv: data.unit_economics?.ltv,
        payback_period: data.unit_economics?.payback_period,
        gross_margin: data.unit_economics?.gross_margin,
        cost_structure: data.cost_structure,
      },
      populatedBy: "phase-8-business-model",
    },
  ];
}

// ============================================================================
// PHASES 9-11: DESIGN → SECTIONS E, F, H, I
// ============================================================================

function mapProductDesignToSections(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    mvp_features?: string[];
    user_flows?: string[];
    product_roadmap?: Array<{ quarter: string; features: string[] }>;
  };

  return [
    {
      sectionId: "E",
      subsectionKey: "mvp_features",
      content: {
        features: data.mvp_features,
        user_flows: data.user_flows,
      },
      populatedBy: "phase-9-product-design",
    },
    {
      sectionId: "M",
      subsectionKey: "product_roadmap",
      content: {
        roadmap: data.product_roadmap,
      },
      populatedBy: "phase-9-product-design",
    },
  ];
}

function mapGTMToSectionH(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    gtm_strategy?: string;
    acquisition_channels?: Array<{ channel: string; cac_estimate: string }>;
    launch_plan?: string[];
  };

  return [
    {
      sectionId: "H",
      subsectionKey: "gtm_strategy",
      content: {
        strategy: data.gtm_strategy,
        channels: data.acquisition_channels,
        launch_plan: data.launch_plan,
      },
      populatedBy: "phase-10-gtm",
    },
  ];
}

function mapContentToSectionI(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    content_pillars?: string[];
    seo_strategy?: string;
    brand_voice?: string;
  };

  return [
    {
      sectionId: "I",
      subsectionKey: "content_strategy",
      content: {
        pillars: data.content_pillars,
        seo: data.seo_strategy,
        voice: data.brand_voice,
      },
      populatedBy: "phase-11-content-engine",
    },
  ];
}

// ============================================================================
// PHASES 12-14: EXECUTION → SECTIONS C, D, J, K, L
// ============================================================================

function mapTechArchToSections(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    architecture_diagram?: string;
    tech_stack?: string[];
    infrastructure_plan?: Record<string, unknown>;
    security_considerations?: string[];
  };

  return [
    {
      sectionId: "D",
      subsectionKey: "architecture",
      content: {
        diagram_url: data.architecture_diagram,
        tech_stack: data.tech_stack,
        infrastructure: data.infrastructure_plan,
      },
      populatedBy: "phase-12-tech-arch",
    },
    {
      sectionId: "J",
      subsectionKey: "security_architecture",
      content: {
        considerations: data.security_considerations,
      },
      populatedBy: "phase-12-tech-arch",
    },
    {
      sectionId: "C",
      subsectionKey: "infrastructure_checklist",
      content: {
        items: [], // To be populated by task reconciliation
      },
      populatedBy: "phase-12-tech-arch",
    },
  ];
}

function mapAnalyticsToSectionK(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    kpi_framework?: {
      north_star?: string;
      supporting_metrics?: string[];
    };
    analytics_plan?: Record<string, unknown>;
  };

  return [
    {
      sectionId: "K",
      subsectionKey: "analytics_framework",
      content: {
        north_star: data.kpi_framework?.north_star,
        supporting_metrics: data.kpi_framework?.supporting_metrics,
        implementation_plan: data.analytics_plan,
      },
      populatedBy: "phase-13-analytics",
    },
  ];
}

function mapLaunchToSections(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    launch_checklist?: string[];
    timeline?: Array<{ week: number; milestone: string }>;
    risk_mitigation?: Record<string, unknown>;
  };

  return [
    {
      sectionId: "L",
      subsectionKey: "launch_operations",
      content: {
        checklist: data.launch_checklist,
        risk_mitigation: data.risk_mitigation,
      },
      populatedBy: "phase-14-launch",
    },
    {
      sectionId: "M",
      subsectionKey: "launch_timeline",
      content: {
        timeline: data.timeline,
      },
      populatedBy: "phase-14-launch",
    },
  ];
}

// ============================================================================
// PHASE 15: SYNTHESIS → SECTIONS B, M, OVERVIEW
// ============================================================================

function mapSynthesisToSections(output: PhaseOutput): SectionUpdate[] {
  const data = output.data as {
    executive_summary?: string;
    business_plan?: Record<string, unknown>;
    prioritized_actions?: string[];
    roadmap?: Array<{ phase: string; duration_weeks: number; deliverables: string[] }>;
  };

  return [
    {
      sectionId: "B",
      subsectionKey: "executive_summary",
      content: {
        summary: data.executive_summary,
        prioritized_actions: data.prioritized_actions,
      },
      populatedBy: "phase-15-synthesis",
    },
    {
      sectionId: "M",
      subsectionKey: "execution_roadmap",
      content: {
        roadmap_phases: data.roadmap,
      },
      populatedBy: "phase-15-synthesis",
    },
    // Note: Overview is auto-generated separately via doc-generator.ts
  ];
}

// ============================================================================
// HELPER: BATCH UPDATE SECTIONS
// ============================================================================

/**
 * Helper to batch multiple section updates into a single database transaction
 */
export async function batchUpdateSections(
  db: D1Database,
  projectId: string,
  updates: SectionUpdate[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Prepare batch insert/update statements
    const statements = updates.map((update) => {
      const id = crypto.randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const contentJson = JSON.stringify(update.content);

      return db
        .prepare(
          `INSERT INTO project_documentation (id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(project_id, section_id, subsection_key)
           DO UPDATE SET content = ?, populated_by = ?, last_updated = ?`
        )
        .bind(
          id,
          projectId,
          update.sectionId,
          update.subsectionKey ?? null,
          contentJson,
          "draft",
          update.populatedBy,
          now,
          now,
          // ON CONFLICT update values
          contentJson,
          update.populatedBy,
          now
        );
    });

    // Execute batch
    await db.batch(statements);

    // Update metadata
    await updateDocumentationMetadata(db, projectId);

    return { success: true };
  } catch (error) {
    console.error("Failed to batch update sections:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update project documentation metadata after section updates
 */
async function updateDocumentationMetadata(db: D1Database, projectId: string) {
  // Count populated sections
  const countResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT section_id) as populated_sections
       FROM project_documentation
       WHERE project_id = ? AND section_id != 'overview'`
    )
    .bind(projectId)
    .first<{ populated_sections: number }>();

  const populatedSections = countResult?.populated_sections ?? 0;
  const totalSections = 13; // A through M
  const completeness = Math.floor((populatedSections / totalSections) * 100);

  // Check if unknowns are resolved
  const unknownsResult = await db
    .prepare(
      `SELECT content FROM project_documentation
       WHERE project_id = ? AND section_id = 'A' AND subsection_key = 'A1_unknowns'`
    )
    .bind(projectId)
    .first<{ content: string }>();

  let unknownsResolved = 0;
  if (unknownsResult) {
    try {
      const unknowns = JSON.parse(unknownsResult.content);
      unknownsResolved = Object.values(unknowns).filter((v) => v === "RESOLVED" || (typeof v === "string" && v !== "UNKNOWN")).length;
    } catch (e) {
      console.error("Failed to parse unknowns:", e);
    }
  }

  const status = completeness >= 90 && unknownsResolved >= 5 ? "complete" : "incomplete";
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO project_documentation_metadata (project_id, completeness_percentage, total_sections, populated_sections, required_unknowns_resolved, status, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(project_id)
       DO UPDATE SET completeness_percentage = ?, populated_sections = ?, required_unknowns_resolved = ?, status = ?, last_updated = ?`
    )
    .bind(
      projectId,
      completeness,
      totalSections,
      populatedSections,
      unknownsResolved,
      status,
      now,
      // ON CONFLICT update values
      completeness,
      populatedSections,
      unknownsResolved,
      status,
      now
    )
    .run();
}
