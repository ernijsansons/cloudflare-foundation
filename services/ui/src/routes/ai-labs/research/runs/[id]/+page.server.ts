import type { PageServerLoad } from "./$types";
import type { PlanningArtifact, PlanningRun } from "$lib/types";
import { dev } from "$app/environment";

interface RunPhasesResponse {
  phases?: Array<{
    phase: string;
    status: string;
  }>;
}

async function fetchPublic(
  path: string,
  platform: App.Platform | undefined,
  fetchFn: typeof fetch
): Promise<Response> {
  if (platform?.env?.GATEWAY) {
    const request = new Request(`https://placeholder/api/public/${path}`);
    return platform.env.GATEWAY.fetch(request);
  }

  if (dev) {
    return fetchFn(`http://127.0.0.1:8787/api/planning/${path.replace(/^planning\//, "")}`);
  }

  return fetchFn(`https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/${path}`);
}

export const load: PageServerLoad = async ({ params, platform, fetch }) => {
  try {
    const runRes = await fetchPublic(`planning/runs/${params.id}`, platform, fetch);
    if (!runRes.ok) {
      return { run: null, artifacts: {}, error: "Run not found" };
    }

    const run = (await runRes.json()) as PlanningRun;

    const artifacts: Record<string, PlanningArtifact> = {};
    const phasesRes = await fetchPublic(`planning/runs/${params.id}/phases`, platform, fetch);
    if (phasesRes.ok) {
      const phaseData = (await phasesRes.json()) as RunPhasesResponse;
      const completedPhases = (phaseData.phases ?? [])
        .filter((phaseInfo) => phaseInfo.status === "completed")
        .map((phaseInfo) => phaseInfo.phase);

      await Promise.all(
        completedPhases.map(async (phase) => {
          const artifactRes = await fetchPublic(`planning/runs/${params.id}/artifacts/${phase}`, platform, fetch);
          if (!artifactRes.ok) {
            return;
          }
          const artifact = (await artifactRes.json()) as PlanningArtifact;
          artifacts[phase] = artifact;
        })
      );
    }

    return { run, artifacts, error: null };
  } catch (error) {
    console.error("run detail load error:", error);
    return { run: null, artifacts: {}, error: "Failed to load run" };
  }
};
