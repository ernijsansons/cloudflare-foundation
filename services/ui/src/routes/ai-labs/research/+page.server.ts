import type { PageServerLoad } from "./$types";
import type { PlanningRun } from "$lib/types";
import { createGatewayClient } from "$lib/server/gateway";

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
  try {
    const gateway = createGatewayClient(platform, locals, fetch);

    const data = await gateway.fetchJson<{ items?: PlanningRun[] }>(
      "/public/planning/runs?limit=100"
    );

    return { runs: data.items ?? [], error: null };
  } catch (e) {
    console.error("research load error:", e);
    return { runs: [], error: e instanceof Error ? e.message : "Failed to fetch runs" };
  }
};
