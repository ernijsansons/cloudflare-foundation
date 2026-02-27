import type { PageServerLoad } from "./$types";
import type { PlanningRun, PlanningArtifact } from "$lib/types";
import type { DepartmentView } from "$lib/types/bible";
import { createGatewayClient } from "$lib/server/gateway";

interface ProjectDetailResponse {
  id: string;
  name: string;
  idea_content: string;
  refined_idea?: string;
  status: string;
  current_phase: string | null;
  quality_score: number | null;
  revenue_potential: string | null;
  run_count: number;
  latest_run_id: string | null;
  mode: string;
  created_at: number;
  updated_at: number;
  runs: PlanningRun[];
}

interface BibleResponse {
  departments: DepartmentView[];
  agentJSON?: Record<string, unknown>;
}

export const load: PageServerLoad = async ({ params, platform, fetch, locals }) => {
  try {
    const gateway = createGatewayClient(platform, locals, fetch);
    const { id } = params;

    // Fetch project detail with all runs
    const project = await gateway.fetchJson<ProjectDetailResponse>(
      `/public/projects/${id}`
    );

    // Fetch artifacts for each run
    const artifactsByRun: Record<string, Record<string, PlanningArtifact>> = {};
    const allArtifacts: Record<string, PlanningArtifact> = {};

    // Get artifacts for the latest run (or all runs if needed)
    if (project.runs && project.runs.length > 0) {
      for (const run of project.runs.slice(0, 3)) { // Limit to 3 most recent runs
        try {
          const phases = await gateway.fetchJson<{ phases: Array<{ phase: string; status: string }> }>(
            `/public/planning/runs/${run.id}/phases`
          );

          const completedPhases = phases.phases?.filter(p => p.status === 'completed') || [];
          const runArtifacts: Record<string, PlanningArtifact> = {};

          for (const phaseInfo of completedPhases) {
            try {
              const artifact = await gateway.fetchJson<PlanningArtifact>(
                `/public/planning/runs/${run.id}/artifacts/${phaseInfo.phase}`
              );
              runArtifacts[phaseInfo.phase] = artifact;

              // Keep best artifact per phase (highest score or most recent)
              if (!allArtifacts[phaseInfo.phase] ||
                  (artifact.overall_score && (!allArtifacts[phaseInfo.phase].overall_score ||
                   artifact.overall_score > allArtifacts[phaseInfo.phase].overall_score!))) {
                allArtifacts[phaseInfo.phase] = artifact;
              }
            } catch {
              // Skip if artifact not found
            }
          }

          artifactsByRun[run.id] = runArtifacts;
        } catch {
          // Skip if phases fetch fails
        }
      }
    }

    // Try to get bible/departments data if available
    let departments: DepartmentView[] = [];
    let agentJSON: Record<string, unknown> | undefined;

    try {
      const bibleData = await gateway.fetchJson<BibleResponse>(
        `/public/projects/${id}/bible`
      );
      departments = bibleData.departments || [];
      agentJSON = bibleData.agentJSON;
    } catch {
      // Bible data not available, will build from artifacts
    }

    return {
      project,
      runs: project.runs || [],
      artifacts: allArtifacts,
      artifactsByRun,
      departments,
      agentJSON,
      error: null
    };
  } catch (e) {
    console.error("project load error:", e);
    return {
      project: null,
      runs: [],
      artifacts: {},
      artifactsByRun: {},
      departments: [],
      agentJSON: undefined,
      error: e instanceof Error ? e.message : "Failed to fetch project"
    };
  }
};
