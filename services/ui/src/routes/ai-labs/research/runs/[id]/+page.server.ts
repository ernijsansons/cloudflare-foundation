import type { PageServerLoad } from "./$types";
import type { PlanningRun } from "$lib/types";

export const load: PageServerLoad = async ({ params, platform, fetch }) => {
  try {
    // Use the GATEWAY service binding for internal communication (bypasses auth)
    const gateway = platform?.env?.GATEWAY;

    let runRes: Response;
    if (gateway) {
      // Use service binding - call public endpoint that doesn't require auth
      const request = new Request(`https://placeholder/api/public/planning/runs/${params.id}`);
      runRes = await gateway.fetch(request);
    } else {
      // Fallback to HTTP call
      runRes = await fetch(`https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/planning/runs/${params.id}`);
    }

    if (!runRes.ok) {
      return { run: null, artifacts: {}, error: "Run not found" };
    }
    const run = (await runRes.json()) as PlanningRun;

    // Return with empty artifacts for now
    return { run, artifacts: {}, error: null };
  } catch (e) {
    console.error("run detail load error:", e);
    return { run: null, artifacts: {}, error: "Failed to load run" };
  }
};
