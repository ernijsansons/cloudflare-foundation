/**
 * Documentation Generator Library
 *
 * Auto-generates the Overview tab from all documentation sections
 */

import type {
  ProjectDocumentation,
  OverviewSection,
  ExecutiveSummary,
  QuickStats,
  HealthIndicators,
  CriticalPath,
  QuickAction,
  ChecklistItem,
  SecurityControl,
  ThreatModel,
  Milestone,
} from "../types";

export function generateOverview(sections: Partial<ProjectDocumentation>): OverviewSection {
  const executiveSummary = generateExecutiveSummary(sections);
  const quickStats = generateQuickStats(sections);
  const healthIndicators = generateHealthIndicators(sections);
  const criticalPath = generateCriticalPath(sections);
  const quickActions = generateQuickActions(sections);

  return {
    executive_summary: executiveSummary,
    quick_stats: quickStats,
    health_indicators: healthIndicators,
    critical_path: criticalPath,
    quick_actions: quickActions,
  };
}

function generateExecutiveSummary(sections: Partial<ProjectDocumentation>): ExecutiveSummary {
  const concept =
    sections.A?.A0_intake?.concept?.thesis ??
    sections.A?.A0_intake?.concept?.codename ??
    "Project concept not yet defined";

  const completeness = calculateCompleteness(sections);

  const status = calculateProjectStatus(sections);

  const keyMetrics = extractKeyMetrics(sections);

  return {
    concept,
    status,
    completeness,
    key_metrics: keyMetrics,
  };
}

function generateQuickStats(sections: Partial<ProjectDocumentation>): QuickStats {
  const budget = sections.A?.A0_intake?.constraints?.budget_cap ?? "Not specified";
  const timeline = sections.A?.A0_intake?.constraints?.timeline ?? "Not specified";
  const northStarMetric = sections.B?.success_metrics?.north_star ?? "Not defined";
  const currentPhase = getCurrentPhase(sections);

  return {
    budget,
    timeline,
    north_star_metric: northStarMetric,
    current_phase: currentPhase,
  };
}

function generateHealthIndicators(sections: Partial<ProjectDocumentation>): HealthIndicators {
  const completeness = calculateCompleteness(sections);
  const documentationComplete = completeness >= 90;

  const unknownsResolved = checkUnknownsResolved(sections);

  const checklistProgress = calculateChecklistProgress(sections);

  const securityCoverage = calculateSecurityCoverage(sections);

  return {
    documentation_complete: documentationComplete,
    unknowns_resolved: unknownsResolved,
    checklist_progress: checklistProgress,
    security_coverage: securityCoverage,
  };
}

function generateCriticalPath(sections: Partial<ProjectDocumentation>): CriticalPath {
  const nextMilestone = getNextMilestone(sections);
  const blockers = identifyBlockers(sections);
  const dependencies = extractCriticalDependencies(sections);

  return {
    next_milestone: nextMilestone,
    blockers,
    dependencies,
  };
}

function generateQuickActions(sections: Partial<ProjectDocumentation>): QuickAction[] {
  const actions: QuickAction[] = [
    { label: "Review Assumptions", link: "#section-A" },
    { label: "View Roadmap", link: "#section-M" },
    { label: "Check Checklist", link: "#section-C" },
  ];

  // Add conditional actions based on project state
  const unknownsResolved = checkUnknownsResolved(sections);
  if (!unknownsResolved) {
    actions.unshift({ label: "⚠️ Resolve Unknowns", link: "#section-A" });
  }

  const completeness = calculateCompleteness(sections);
  if (completeness < 50) {
    actions.push({ label: "Complete Documentation", link: "#section-A" });
  }

  return actions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateCompleteness(sections: Partial<ProjectDocumentation>): number {
  const requiredSections: (keyof ProjectDocumentation)[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
  const totalSections = requiredSections.length;
  const populatedSections = requiredSections.filter((sectionId) => {
    const section = sections[sectionId];
    return section && Object.keys(section).length > 0;
  }).length;

  return Math.floor((populatedSections / totalSections) * 100);
}

function calculateProjectStatus(
  sections: Partial<ProjectDocumentation>
): "planning" | "in-progress" | "blocked" | "complete" {
  const completeness = calculateCompleteness(sections);
  const unknownsResolved = checkUnknownsResolved(sections);
  const blockers = identifyBlockers(sections);

  if (blockers.length > 0) {
    return "blocked";
  }

  if (completeness >= 90 && unknownsResolved) {
    return "complete";
  }

  if (completeness >= 50) {
    return "in-progress";
  }

  return "planning";
}

function extractKeyMetrics(sections: Partial<ProjectDocumentation>): Record<string, string | number> {
  const metrics: Record<string, string | number> = {};

  if (sections.A?.A0_intake?.success_kill_switches) {
    metrics["North Star"] = sections.A.A0_intake.success_kill_switches.north_star;
  }

  if (sections.B?.success_metrics) {
    metrics["Target ASR"] = `${sections.B.success_metrics.autonomous_success_rate_target}%`;
    metrics["Target Cost/Outcome"] = sections.B.success_metrics.cost_per_outcome_target;
  }

  if (sections.G?.unit_economics) {
    metrics["Gross Profit/Outcome"] = sections.G.unit_economics.gross_profit_per_outcome;
    metrics["Breakeven Outcomes"] = sections.G.unit_economics.breakeven_outcomes;
  }

  return metrics;
}

function getCurrentPhase(sections: Partial<ProjectDocumentation>): string {
  const completeness = calculateCompleteness(sections);

  if (!sections.A || Object.keys(sections.A).length === 0) {
    return "Phase 0: Intake";
  }

  if (completeness < 30) {
    return "Discovery (Phases 1-4)";
  }

  if (completeness < 50) {
    return "Validation (Phase 5: Kill Test)";
  }

  if (completeness < 70) {
    return "Strategy (Phases 6-8)";
  }

  if (completeness < 85) {
    return "Design (Phases 9-11)";
  }

  if (completeness < 95) {
    return "Execution Planning (Phases 12-14)";
  }

  return "Synthesis (Phase 15)";
}

function checkUnknownsResolved(sections: Partial<ProjectDocumentation>): boolean {
  if (!sections.A?.A1_unknowns) {
    return false;
  }

  const unknowns = sections.A.A1_unknowns;
  const criticalUnknowns = ["core_directive", "hitl_threshold", "tooling_data_gravity", "memory_horizon", "verification_standard"];

  const resolvedCount = criticalUnknowns.filter((key) => {
    const value = unknowns[key as keyof typeof unknowns];
    return value === "RESOLVED" || (typeof value === "string" && value !== "UNKNOWN");
  }).length;

  // All 5 critical unknowns must be resolved
  return resolvedCount === 5;
}

function calculateChecklistProgress(sections: Partial<ProjectDocumentation>): number {
  if (!sections.C) {
    return 0;
  }

  let totalItems = 0;
  let completedItems = 0;

  // Iterate through all checklist categories (C1-C20)
  for (const key of Object.keys(sections.C)) {
    const items = sections.C[key as keyof typeof sections.C];
    if (Array.isArray(items)) {
      totalItems += items.length;
      completedItems += (items as ChecklistItem[]).filter((item) => item.status === "done").length;
    }
  }

  if (totalItems === 0) {
    return 0;
  }

  return Math.floor((completedItems / totalItems) * 100);
}

function calculateSecurityCoverage(sections: Partial<ProjectDocumentation>): number {
  if (!sections.J) {
    return 0;
  }

  let totalControls = 0;
  let implementedControls = 0;

  if (sections.J.security_controls) {
    totalControls += sections.J.security_controls.length;
    implementedControls += sections.J.security_controls.filter((control: SecurityControl) => control.implementation_status === "implemented").length;
  }

  if (sections.J.threat_model) {
    totalControls += sections.J.threat_model.length;
    implementedControls += sections.J.threat_model.filter((threat: ThreatModel) => threat.mitigation && threat.mitigation.length > 0).length;
  }

  if (totalControls === 0) {
    return 0;
  }

  return Math.floor((implementedControls / totalControls) * 100);
}

function getNextMilestone(sections: Partial<ProjectDocumentation>): string {
  if (!sections.M?.weekly_milestones || sections.M.weekly_milestones.length === 0) {
    return "Define roadmap milestones";
  }

  // Find the first incomplete milestone
  const nextMilestone = sections.M.weekly_milestones.find((milestone: Milestone) => {
    // Milestones are considered incomplete if we haven't passed their week yet
    // This is a simplified heuristic - in practice you'd compare against current date
    return true;
  });

  return nextMilestone ? nextMilestone.milestone_name : "All milestones complete";
}

function identifyBlockers(sections: Partial<ProjectDocumentation>): string[] {
  const blockers: string[] = [];

  // Check for unresolved unknowns
  if (!checkUnknownsResolved(sections)) {
    blockers.push("Critical unknowns not resolved (Section A)");
  }

  // Check for blocked checklist items
  if (sections.C) {
    for (const key of Object.keys(sections.C)) {
      const items = sections.C[key as keyof typeof sections.C];
      if (Array.isArray(items)) {
        const blockedItems = (items as ChecklistItem[]).filter((item) => item.status === "blocked");
        if (blockedItems.length > 0) {
          blockers.push(`${blockedItems.length} blocked checklist items in ${key}`);
        }
      }
    }
  }

  // Check for missing critical sections
  const criticalSections: Array<keyof ProjectDocumentation> = ["A", "B", "C", "D"];
  for (const sectionId of criticalSections) {
    if (!sections[sectionId] || Object.keys(sections[sectionId]!).length === 0) {
      blockers.push(`Missing critical section: ${String(sectionId)}`);
    }
  }

  return blockers;
}

function extractCriticalDependencies(sections: Partial<ProjectDocumentation>): string[] {
  const dependencies: string[] = [];

  if (!sections.C) {
    return dependencies;
  }

  // Extract dependencies from checklist items
  for (const key of Object.keys(sections.C)) {
    const items = sections.C[key as keyof typeof sections.C];
    if (Array.isArray(items)) {
      for (const item of items as ChecklistItem[]) {
        if (item.status === "pending" && item.dependencies.length > 0) {
          dependencies.push(`${item.task} depends on: ${item.dependencies.join(", ")}`);
        }
      }
    }
  }

  // Limit to top 5 most critical
  return dependencies.slice(0, 5);
}
