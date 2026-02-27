import type { PageServerLoad } from "./$types";
import type { PlanningArtifact, PlanningRun } from "$lib/types";
import { createGatewayClient } from "$lib/server/gateway";

interface RunPhasesResponse {
  phases?: Array<{
    phase: string;
    status: string;
  }>;
}

export const load: PageServerLoad = async ({ params, platform, fetch, locals }) => {
  try {
    const gateway = createGatewayClient(platform, locals, fetch);

    const run = await gateway.fetchJson<PlanningRun>(`/public/planning/runs/${params.id}`);

    const artifacts: Record<string, PlanningArtifact> = {};
    try {
      const phaseData = await gateway.fetchJson<RunPhasesResponse>(`/public/planning/runs/${params.id}/phases`);
      const completedPhases = (phaseData.phases ?? [])
        .filter((phaseInfo) => phaseInfo.status === "completed")
        .map((phaseInfo) => phaseInfo.phase);

      await Promise.all(
        completedPhases.map(async (phase) => {
          try {
            const artifact = await gateway.fetchJson<PlanningArtifact>(`/public/planning/runs/${params.id}/artifacts/${phase}`);
            artifacts[phase] = artifact;
          } catch (e) {
            console.error(`Failed to fetch artifact for phase ${phase}:`, e);
          }
        })
      );
    } catch (e) {
      console.error("Failed to fetch phases:", e);
    }

    return { run, artifacts, error: null };
  } catch (error) {
    console.error("run detail load error:", error);
    return { run: null, artifacts: {}, error: error instanceof Error ? error.message : "Failed to load run" };
  }
};
