import type { PageServerLoad } from "./$types";
import type { PlanningRun, PlanningArtifact, PhaseName } from "$lib/types";
import { STAGES } from "$lib/types";
import { dev } from "$app/environment";

const DEV_API_BASE = "http://127.0.0.1:8787";

export const load: PageServerLoad = async ({ params, platform }) => {
  try {
    let runRes: Response;

    if (dev) {
      // Development: direct fetch to planning-machine
      runRes = await fetch(`${DEV_API_BASE}/api/planning/runs/${params.id}`);
    } else if (platform?.env?.GATEWAY) {
      // Production: use service binding
      runRes = await platform.env.GATEWAY.fetch(
        `https://_/api/planning/runs/${params.id}`
      );
    } else {
      return { run: null, artifacts: {}, error: "Gateway not configured" };
    }

    if (!runRes.ok) {
      return { run: null, artifacts: {}, error: "Run not found" };
    }
    const run = (await runRes.json()) as PlanningRun;

    // Fetch artifacts for each phase
    const artifacts: Record<string, PlanningArtifact> = {};
    const allPhases: PhaseName[] = STAGES.flatMap((s) => s.phases);

    for (const phase of allPhases) {
      try {
        let res: Response;
        if (dev) {
          res = await fetch(
            `${DEV_API_BASE}/api/planning/runs/${params.id}/artifacts/${phase}`
          );
        } else {
          res = await platform!.env.GATEWAY.fetch(
            `https://_/api/planning/runs/${params.id}/artifacts/${phase}`
          );
        }
        if (res.ok) {
          artifacts[phase] = (await res.json()) as PlanningArtifact;
        }
      } catch {
        // Artifact not yet generated
      }
    }

    return { run, artifacts, stages: STAGES, error: null };
  } catch (e) {
    console.error("run detail load error:", e);
    return { run: null, artifacts: {}, error: "Failed to load run" };
  }
};
