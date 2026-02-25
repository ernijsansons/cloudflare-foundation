import type { PageServerLoad } from "./$types";
import type { ProjectSummary } from "$lib/types";
import { createGatewayClient } from "$lib/server/gateway";

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
  try {
    const gateway = createGatewayClient(platform, locals, fetch);

    // Fetch projects (aggregated view) instead of raw runs
    // This ensures one card per project on the Kanban board
    const data = await gateway.fetchJson<{ items?: ProjectSummary[] }>(
      "/public/projects?limit=100"
    );

    return { projects: data.items ?? [], error: null };
  } catch (e) {
    console.error("research load error:", e);
    return { projects: [], error: e instanceof Error ? e.message : "Failed to fetch projects" };
  }
};
