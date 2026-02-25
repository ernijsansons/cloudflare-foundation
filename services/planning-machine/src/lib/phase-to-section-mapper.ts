/**
 * Phase-to-Section Mapper
 *
 * Maps planning phase outputs to documentation sections (A-M) using canonical
 * phase names. Legacy phase ids are normalized before mapping.
 */

import type { D1Database } from "@cloudflare/workers-types";
import {
  normalizePlanningPhase,
  type SectionA,
  type SectionId,
  type PlanningWorkflowPhaseName,
} from "@foundation/shared";

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

type PhaseMapper = (output: PhaseOutput, phase: PlanningWorkflowPhaseName) => SectionUpdate[];

const PHASE_MAPPERS: Record<PlanningWorkflowPhaseName, PhaseMapper> = {
  "phase-0-intake": mapIntakeToSectionA,
  opportunity: mapOpportunityToSectionA,
  "customer-intel": mapCustomerIntelToSectionA,
  "market-research": mapMarketResearchToSectionA,
  "competitive-intel": mapCompetitiveIntelToSectionA,
  "kill-test": mapKillTestToSectionA,
  "revenue-expansion": mapRevenueToSectionG,
  strategy: mapStrategyToSectionB,
  "business-model": mapBusinessModelToSectionG,
  "product-design": mapProductDesignToSections,
  "gtm-marketing": mapGTMToSectionH,
  "content-engine": mapContentToSectionI,
  "tech-arch": mapTechArchToSections,
  analytics: mapAnalyticsToSectionK,
  "launch-execution": mapLaunchToSections,
  synthesis: mapSynthesisToSections,
  "task-reconciliation": mapTaskReconciliationToSections,
  "diagram-generation": mapDiagramGenerationToSectionN,
  validation: mapValidationToSectionM,
};

function createUpdate(
  sectionId: SectionId,
  subsectionKey: string,
  content: Record<string, unknown>,
  phase: PlanningWorkflowPhaseName
): SectionUpdate {
  return {
    sectionId,
    subsectionKey,
    content,
    populatedBy: phase,
  };
}

/**
 * Map a phase output to one or more documentation section updates.
 */
export function mapPhaseToSections(output: PhaseOutput): SectionUpdate[] {
  const normalizedPhase = normalizePlanningPhase(output.phase);
  if (!normalizedPhase) {
    console.warn(`No mapper found for unknown phase: ${output.phase}`);
    return [];
  }

  const mapper = PHASE_MAPPERS[normalizedPhase];
  if (!mapper) {
    console.warn(`No mapper implemented for phase: ${normalizedPhase}`);
    return [];
  }

  try {
    return mapper(output, normalizedPhase);
  } catch (error) {
    console.error(`Failed to map phase ${normalizedPhase}:`, error);
    return [];
  }
}

function mapIntakeToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as { sectionA?: SectionA };
  if (!data.sectionA) {
    return [];
  }

  return [
    createUpdate("A", "A0_intake", data.sectionA.A0_intake as unknown as Record<string, unknown>, phase),
    createUpdate("A", "A1_unknowns", data.sectionA.A1_unknowns as unknown as Record<string, unknown>, phase),
    createUpdate("A", "A2_invariants", data.sectionA.A2_invariants as unknown as Record<string, unknown>, phase),
  ];
}

function mapOpportunityToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    refinedOpportunities?: Array<Record<string, unknown>>;
    recommendedIndex?: number;
    keyInsight?: string;
    unknowns?: string[];
  };

  if (!Array.isArray(data.refinedOpportunities) || data.refinedOpportunities.length === 0) {
    return [];
  }

  return [
    createUpdate(
      "A",
      "discovery_opportunities",
      {
        opportunities: data.refinedOpportunities,
        recommended_index: data.recommendedIndex ?? 0,
        key_insight: data.keyInsight ?? null,
        unknowns: data.unknowns ?? [],
      },
      phase
    ),
  ];
}

function mapCustomerIntelToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    icp?: Record<string, unknown>;
    personas?: Record<string, unknown>;
    customerLanguage?: unknown;
    jobsToBeDone?: unknown;
  };

  return [
    createUpdate(
      "A",
      "discovery_customers",
      {
        icp: data.icp ?? null,
        personas: data.personas ?? null,
        customer_language: data.customerLanguage ?? null,
        jobs_to_be_done: data.jobsToBeDone ?? null,
      },
      phase
    ),
  ];
}

function mapMarketResearchToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    marketSize?: Record<string, unknown>;
    growthRate?: string;
    marketTiming?: Record<string, unknown>;
    regulatoryFactors?: string[];
    marketRisks?: unknown;
    citations?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "A",
      "discovery_market",
      {
        market_size: data.marketSize ?? null,
        growth_rate: data.growthRate ?? null,
        timing: data.marketTiming ?? null,
        regulatory_factors: data.regulatoryFactors ?? [],
        market_risks: data.marketRisks ?? null,
        citations: data.citations ?? [],
      },
      phase
    ),
  ];
}

function mapCompetitiveIntelToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    competitors?: Array<Record<string, unknown>>;
    positioningGaps?: string[];
    messagingGaps?: string[];
    pricingGaps?: string[];
    vulnerabilities?: string[];
    citations?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "A",
      "discovery_competitive",
      {
        competitors: data.competitors ?? [],
        positioning_gaps: data.positioningGaps ?? [],
        messaging_gaps: data.messagingGaps ?? [],
        pricing_gaps: data.pricingGaps ?? [],
        vulnerabilities: data.vulnerabilities ?? [],
        citations: data.citations ?? [],
      },
      phase
    ),
  ];
}

function mapKillTestToSectionA(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    verdict?: string;
    reasoning?: string;
    topRisks?: string[];
    bootstrapFeasibility?: unknown;
    decisionRationale?: unknown;
  };

  return [
    createUpdate(
      "A",
      "validation_kill_test",
      {
        verdict: data.verdict ?? null,
        reasoning: data.reasoning ?? null,
        top_risks: data.topRisks ?? [],
        bootstrap_feasibility: data.bootstrapFeasibility ?? null,
        decision_rationale: data.decisionRationale ?? null,
      },
      phase
    ),
  ];
}

function mapRevenueToSectionG(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    expansionArcs?: Array<Record<string, unknown>>;
    recommendedPricingModel?: string;
    projectedMRR?: Record<string, unknown>;
    recommendation?: Record<string, unknown>;
  };

  return [
    createUpdate(
      "G",
      "revenue_expansion",
      {
        expansion_arcs: data.expansionArcs ?? [],
        recommended_pricing_model: data.recommendedPricingModel ?? null,
        projected_mrr: data.projectedMRR ?? null,
        recommendation: data.recommendation ?? null,
      },
      phase
    ),
  ];
}

function mapStrategyToSectionB(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    strategyNorthStar?: string;
    positioning?: Record<string, unknown>;
    strategicPillars?: Array<Record<string, unknown>>;
    recommendation?: Record<string, unknown>;
  };

  return [
    createUpdate(
      "B",
      "strategy_pillars",
      {
        north_star: data.strategyNorthStar ?? null,
        positioning: data.positioning ?? null,
        pillars: data.strategicPillars ?? [],
        recommendation: data.recommendation ?? null,
      },
      phase
    ),
  ];
}

function mapBusinessModelToSectionG(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    model?: unknown;
    pricingTiers?: Array<Record<string, unknown>>;
    unitEconomics?: Record<string, unknown>;
    recommendation?: Record<string, unknown>;
  };

  return [
    createUpdate(
      "G",
      "unit_economics",
      {
        model: data.model ?? null,
        pricing_tiers: data.pricingTiers ?? [],
        unit_economics: data.unitEconomics ?? null,
        recommendation: data.recommendation ?? null,
      },
      phase
    ),
  ];
}

function mapProductDesignToSections(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    landingPageBlueprint?: unknown;
    designSystem?: unknown;
    appPages?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "E",
      "product_design",
      {
        landing_page_blueprint: data.landingPageBlueprint ?? null,
        design_system: data.designSystem ?? null,
        app_pages: data.appPages ?? null,
      },
      phase
    ),
    createUpdate(
      "M",
      "product_tasks",
      {
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
  ];
}

function mapGTMToSectionH(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    seoStrategy?: unknown;
    contentMarketing?: unknown;
    launchPlaybook?: unknown;
    growthLoops?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "H",
      "gtm_strategy",
      {
        seo_strategy: data.seoStrategy ?? null,
        content_marketing: data.contentMarketing ?? null,
        launch_playbook: data.launchPlaybook ?? null,
        growth_loops: data.growthLoops ?? [],
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
  ];
}

function mapContentToSectionI(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    contentPillars?: unknown;
    channelPlan?: unknown;
    campaignCalendar?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "I",
      "content_strategy",
      {
        pillars: data.contentPillars ?? null,
        channel_plan: data.channelPlan ?? null,
        campaign_calendar: data.campaignCalendar ?? null,
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
  ];
}

function mapTechArchToSections(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    architecture?: unknown;
    components?: unknown;
    dataModel?: unknown;
    security?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "D",
      "architecture",
      {
        architecture: data.architecture ?? null,
        components: data.components ?? [],
        data_model: data.dataModel ?? null,
      },
      phase
    ),
    createUpdate(
      "J",
      "security_architecture",
      {
        security: data.security ?? null,
      },
      phase
    ),
    createUpdate(
      "C",
      "infra_tasks",
      {
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
  ];
}

function mapAnalyticsToSectionK(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    northStarMetric?: unknown;
    supportingMetrics?: unknown;
    instrumentationPlan?: unknown;
    dashboardSpec?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "K",
      "analytics_framework",
      {
        north_star_metric: data.northStarMetric ?? null,
        supporting_metrics: data.supportingMetrics ?? [],
        instrumentation_plan: data.instrumentationPlan ?? null,
        dashboard_spec: data.dashboardSpec ?? null,
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
  ];
}

function mapLaunchToSections(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    launchChecklist?: unknown;
    launchTimeline?: unknown;
    riskMitigation?: unknown;
    draftTasks?: Array<Record<string, unknown>>;
  };

  return [
    createUpdate(
      "L",
      "launch_operations",
      {
        checklist: data.launchChecklist ?? [],
        risk_mitigation: data.riskMitigation ?? null,
        draft_tasks: data.draftTasks ?? [],
      },
      phase
    ),
    createUpdate(
      "M",
      "launch_timeline",
      {
        timeline: data.launchTimeline ?? [],
      },
      phase
    ),
  ];
}

function mapSynthesisToSections(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    executiveSummary?: string;
    recommendation?: string;
    phasedRoadmap?: unknown;
    oneShotBuildPlan?: unknown;
  };

  return [
    createUpdate(
      "B",
      "executive_summary",
      {
        summary: data.executiveSummary ?? null,
        recommendation: data.recommendation ?? null,
      },
      phase
    ),
    createUpdate(
      "M",
      "execution_roadmap",
      {
        phased_roadmap: data.phasedRoadmap ?? [],
        one_shot_build_plan: data.oneShotBuildPlan ?? null,
      },
      phase
    ),
  ];
}

function mapTaskReconciliationToSections(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    tasks?: Array<Record<string, unknown>>;
    marketingTasks?: Array<Record<string, unknown>>;
    buildPhases?: Array<Record<string, unknown>>;
    summary?: Record<string, unknown>;
  };

  return [
    createUpdate(
      "C",
      "master_tasks",
      {
        tasks: data.tasks ?? [],
        marketing_tasks: data.marketingTasks ?? [],
        summary: data.summary ?? {},
      },
      phase
    ),
    createUpdate(
      "M",
      "build_phases",
      {
        build_phases: data.buildPhases ?? [],
        critical_path: (data.summary as { criticalPath?: unknown[] } | undefined)?.criticalPath ?? [],
      },
      phase
    ),
  ];
}

function mapDiagramGenerationToSectionN(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    diagrams?: Record<string, unknown>;
    structuredDiagrams?: Record<string, unknown>;
    visualSummary?: string;
    diagramsGenerated?: number;
    renderInstructions?: Record<string, unknown>;
    sourceDataSummary?: Record<string, unknown>;
  };

  return [
    createUpdate(
      "M",
      "visual_diagrams",
      {
        diagrams: data.diagrams ?? {},
        structured_diagrams: data.structuredDiagrams ?? {},
        visual_summary: data.visualSummary ?? "",
        diagrams_generated: data.diagramsGenerated ?? 0,
        render_instructions: data.renderInstructions ?? {},
        source_data_summary: data.sourceDataSummary ?? {},
      },
      phase
    ),
  ];
}

function mapValidationToSectionM(output: PhaseOutput, phase: PlanningWorkflowPhaseName): SectionUpdate[] {
  const data = output.data as {
    overallStatus?: string;
    validationResults?: Array<Record<string, unknown>>;
    summary?: Record<string, unknown>;
    foundationInvariants?: Record<string, unknown>;
    correctionsNeeded?: Array<Record<string, unknown>>;
    triggerCorrection?: boolean;
    correctionPhases?: string[];
  };

  return [
    createUpdate(
      "M",
      "syntactic_validation",
      {
        overall_status: data.overallStatus ?? "unknown",
        validation_results: data.validationResults ?? [],
        summary: data.summary ?? {},
        foundation_invariants: data.foundationInvariants ?? {},
        corrections_needed: data.correctionsNeeded ?? [],
        trigger_correction: data.triggerCorrection ?? false,
        correction_phases: data.correctionPhases ?? [],
      },
      phase
    ),
  ];
}

/**
 * Helper to batch multiple section updates into a single database transaction.
 */
export async function batchUpdateSections(
  db: D1Database,
  projectId: string,
  updates: SectionUpdate[]
): Promise<{ success: boolean; error?: string }> {
  try {
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
          contentJson,
          update.populatedBy,
          now
        );
    });

    await db.batch(statements);
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

async function updateDocumentationMetadata(db: D1Database, projectId: string): Promise<void> {
  const countResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT section_id) as populated_sections
       FROM project_documentation
       WHERE project_id = ? AND section_id != 'overview'`
    )
    .bind(projectId)
    .first<{ populated_sections: number }>();

  const populatedSections = countResult?.populated_sections ?? 0;
  const totalSections = 13;
  const completeness = Math.floor((populatedSections / totalSections) * 100);

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
      const unknowns = JSON.parse(unknownsResult.content) as Record<string, unknown>;
      unknownsResolved = Object.values(unknowns).filter((value) => {
        return value === "RESOLVED" || (typeof value === "string" && value !== "UNKNOWN");
      }).length;
    } catch (error) {
      console.error("Failed to parse unknowns:", error);
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
      completeness,
      populatedSections,
      unknownsResolved,
      status,
      now
    )
    .run();
}
