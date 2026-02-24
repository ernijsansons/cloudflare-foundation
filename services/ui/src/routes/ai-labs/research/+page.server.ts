import type { PageServerLoad } from "./$types";
import type { PlanningRun } from "$lib/types";
import { dev } from "$app/environment";

export const load: PageServerLoad = async ({ platform, fetch }) => {
  try {
    // Use the GATEWAY service binding for internal communication (bypasses auth)
    const gateway = platform?.env?.GATEWAY;

    let response;
    if (gateway) {
      // Use service binding - call public endpoint that doesn't require auth
      const request = new Request('https://placeholder/api/public/planning/runs?limit=100&tenant_id=default');
      response = await gateway.fetch(request);
    } else if (dev) {
      // Development: direct fetch to local planning service
      response = await fetch("http://127.0.0.1:8787/api/planning/runs?limit=100");
    } else {
      // Fallback to HTTP call
      response = await fetch('https://foundation-gateway-production.ernijs-ansons.workers.dev/api/public/planning/runs?limit=100');
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed to fetch runs:", response.status, text);
      return { runs: [], error: "Failed to fetch runs" };
    }
    const data = (await response.json()) as { items?: PlanningRun[] };
    return { runs: data.items ?? [], error: null };
  } catch (e) {
    console.error("research load error:", e);
    return { runs: [], error: "Failed to fetch runs" };
  }
};
