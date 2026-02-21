/**
 * Department Aggregator Service
 *
 * Aggregates planning artifacts from 16 phases into 15 department-specific views.
 * Each department pulls relevant data from multiple phases.
 */

import type { PhaseName, PlanningArtifact } from "$lib/types";
import type {
  DepartmentView,
  DepartmentId,
  DepartmentMapping,
  SectionContent,
} from "$lib/types/bible";
import {
  getDepartmentTitle,
  getDepartmentDescription,
  DEPARTMENT_CONFIGS,
} from "$lib/types/bible";

/**
 * Phase-to-Department mappings.
 * Defines which phases contribute to each department.
 */
const DEPARTMENT_MAPPINGS: Record<DepartmentId, DepartmentMapping> = {
  executive: {
    primaryPhases: ["synthesis", "strategy", "kill-test"],
    secondaryPhases: ["opportunity", "business-model"],
    sections: [
      { name: "Executive Summary", sources: ["synthesis.executiveSummary"] },
      { name: "Strategic Thesis", sources: ["strategy.thesis"] },
      { name: "Business Model", sources: ["business-model.modelType"] },
      { name: "Go/No-Go Decision", sources: ["synthesis.recommendation", "kill-test.verdict"] },
    ],
  },

  product: {
    primaryPhases: ["product-design", "tech-arch"],
    secondaryPhases: ["opportunity", "customer-intel"],
    sections: [
      { name: "Product Vision", sources: ["product-design.vision"] },
      { name: "Feature Roadmap", sources: ["product-design.features"] },
      { name: "Technical Stack", sources: ["tech-arch.stack"] },
      { name: "MVP Scope", sources: ["product-design.mvp"] },
    ],
  },

  brand: {
    primaryPhases: ["strategy"],
    secondaryPhases: ["opportunity", "customer-intel"],
    sections: [
      { name: "Brand Positioning", sources: ["strategy.positioning"] },
      { name: "Value Proposition", sources: ["strategy.valueProposition"] },
    ],
  },

  market: {
    primaryPhases: ["market-research", "competitive-intel"],
    secondaryPhases: ["opportunity"],
    sections: [
      { name: "Market Size", sources: ["market-research.marketSize"] },
      { name: "Trends", sources: ["market-research.trends"] },
      { name: "Competition", sources: ["competitive-intel.competitors"] },
    ],
  },

  customer: {
    primaryPhases: ["customer-intel"],
    secondaryPhases: ["opportunity", "market-research"],
    sections: [
      { name: "Target Customers", sources: ["customer-intel.segments"] },
      { name: "Personas", sources: ["customer-intel.personas"] },
      { name: "Pain Points", sources: ["customer-intel.painPoints"] },
    ],
  },

  revenue: {
    primaryPhases: ["business-model", "revenue-expansion"],
    secondaryPhases: ["opportunity"],
    sections: [
      { name: "Business Model", sources: ["business-model.modelType"] },
      { name: "Pricing", sources: ["business-model.pricingTiers"] },
      { name: "Revenue Streams", sources: ["revenue-expansion.streams"] },
    ],
  },

  gtm: {
    primaryPhases: ["gtm-marketing"],
    secondaryPhases: ["customer-intel", "strategy"],
    sections: [
      { name: "Marketing Strategy", sources: ["gtm-marketing.strategy"] },
      { name: "Channels", sources: ["gtm-marketing.channels"] },
      { name: "Tactics", sources: ["gtm-marketing.tactics"] },
    ],
  },

  content: {
    primaryPhases: ["content-engine"],
    secondaryPhases: ["gtm-marketing"],
    sections: [
      { name: "Content Strategy", sources: ["content-engine.strategy"] },
      { name: "Workflows", sources: ["content-engine.workflows"] },
      { name: "Distribution", sources: ["content-engine.distribution"] },
    ],
  },

  technical: {
    primaryPhases: ["tech-arch"],
    secondaryPhases: ["product-design"],
    sections: [
      { name: "System Architecture", sources: ["tech-arch.architecture"] },
      { name: "Technology Stack", sources: ["tech-arch.stack"] },
      { name: "Data Model", sources: ["tech-arch.dataModel"] },
      { name: "API Design", sources: ["tech-arch.endpoints"] },
    ],
  },

  analytics: {
    primaryPhases: ["analytics"],
    secondaryPhases: ["business-model"],
    sections: [
      { name: "Key Metrics", sources: ["analytics.kpis"] },
      { name: "Tracking Plan", sources: ["analytics.trackingPlan"] },
      { name: "Dashboards", sources: ["analytics.dashboards"] },
    ],
  },

  launch: {
    primaryPhases: ["launch-execution"],
    secondaryPhases: ["product-design", "gtm-marketing"],
    sections: [
      { name: "Launch Plan", sources: ["launch-execution.plan"] },
      { name: "Milestones", sources: ["launch-execution.milestones"] },
      { name: "Operations", sources: ["launch-execution.operations"] },
    ],
  },

  risks: {
    primaryPhases: ["kill-test"],
    secondaryPhases: ["synthesis"],
    sections: [
      { name: "Risk Factors", sources: ["kill-test.risks"] },
      { name: "Assumptions", sources: ["kill-test.assumptions"] },
      { name: "Kill Conditions", sources: ["kill-test.killConditions"] },
    ],
  },

  evidence: {
    primaryPhases: [],
    secondaryPhases: [],
    sections: [],
  },

  "agent-json": {
    primaryPhases: [],
    secondaryPhases: [],
    sections: [],
  },

  "phase-trace": {
    primaryPhases: [],
    secondaryPhases: [],
    sections: [],
  },
};

/**
 * Aggregates planning artifacts into department views.
 *
 * @param artifacts - Map of phase name to artifact
 * @returns Array of department views
 */
export function aggregateIntoDepartments(
  artifacts: Record<PhaseName, PlanningArtifact>
): DepartmentView[] {
  const departments: DepartmentView[] = [];

  for (const [deptId, mapping] of Object.entries(DEPARTMENT_MAPPINGS)) {
    const dept = aggregateDepartment(deptId as DepartmentId, mapping, artifacts);
    departments.push(dept);
  }

  return departments;
}

/**
 * Aggregates a single department.
 */
function aggregateDepartment(
  deptId: DepartmentId,
  mapping: DepartmentMapping,
  artifacts: Record<PhaseName, PlanningArtifact>
): DepartmentView {
  const sections = mapping.sections.map((sectionConfig) => {
    const content = extractSectionContent(artifacts, sectionConfig.sources);

    return {
      name: sectionConfig.name,
      content,
      sources: sectionConfig.sources.map((source) => {
        const [phase, field] = source.split(".");
        return {
          phase: phase as PhaseName,
          field,
          extracted: null,
        };
      }),
    };
  });

  const completeness = calculateCompleteness(mapping, artifacts);

  return {
    id: deptId,
    title: getDepartmentTitle(deptId),
    summary: getDepartmentDescription(deptId),
    sections,
    completeness,
    lastUpdated: Date.now(),
  };
}

/**
 * Extracts content for a section from sources.
 */
function extractSectionContent(
  artifacts: Record<PhaseName, PlanningArtifact>,
  sources: string[]
): SectionContent {
  const items: string[] = [];

  for (const source of sources) {
    const [phaseName, fieldPath] = source.split(".");
    const artifact = artifacts[phaseName as PhaseName];

    if (artifact && artifact.content) {
      const value = getNestedValue(artifact.content, fieldPath);
      if (value) {
        items.push(typeof value === "string" ? value : JSON.stringify(value));
      }
    }
  }

  if (items.length === 0) {
    return { type: "markdown", text: "_No data available_" };
  }

  if (items.length === 1) {
    return { type: "markdown", text: items[0] };
  }

  return { type: "list", items };
}

/**
 * Gets a nested value from an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Calculates department completeness based on available artifacts.
 *
 * @returns Percentage 0-100
 */
function calculateCompleteness(
  mapping: DepartmentMapping,
  artifacts: Record<PhaseName, PlanningArtifact>
): number {
  const allPhases = [...mapping.primaryPhases, ...mapping.secondaryPhases];
  if (allPhases.length === 0) return 0;

  const completedPhases = allPhases.filter((phase) => phase in artifacts).length;
  return Math.round((completedPhases / allPhases.length) * 100);
}

/**
 * Gets all artifacts as a map.
 */
export function artifactsToMap(
  artifacts: PlanningArtifact[]
): Record<PhaseName, PlanningArtifact> {
  const map: Partial<Record<PhaseName, PlanningArtifact>> = {};

  for (const artifact of artifacts) {
    map[artifact.phase] = artifact;
  }

  return map as Record<PhaseName, PlanningArtifact>;
}
