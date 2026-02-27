import type { PageServerLoad } from "./$types";
import type { PlanningRun } from "$lib/types";
import { dev } from "$app/environment";

export const load: PageServerLoad = async ({ platform }) => {
  try {
    let res: Response;

    if (dev) {
      // Development: direct fetch to planning-machine
      res = await fetch("http://127.0.0.1:8787/api/planning/runs?limit=100");
    } else if (platform?.env?.GATEWAY) {
      // Production: use service binding
      res = await platform.env.GATEWAY.fetch("https://_/api/public/planning/runs?limit=100");
    } else {
      return { runs: [], error: "Gateway not configured" };
    }

    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to fetch portfolio runs:", res.status, text);
      return { runs: [], error: "Failed to fetch runs" };
    }
    const data = (await res.json()) as { items?: PlanningRun[] };
    return { runs: data.items ?? [], error: null };
  } catch (e) {
    console.error("portfolio load error:", e);
    return { runs: [], error: "Failed to fetch runs" };
  }
};
