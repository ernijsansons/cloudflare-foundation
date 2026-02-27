import type { PageServerLoad } from "./$types";
import type { ParkedIdea } from "$lib/types";
import { dev } from "$app/environment";

export const load: PageServerLoad = async ({ platform }) => {
  try {
    let res: Response;

    if (dev) {
      // Development: direct fetch to planning-machine
      res = await fetch("http://127.0.0.1:8787/api/planning/parked-ideas?limit=100");
    } else if (platform?.env?.GATEWAY) {
      // Production: use service binding
      res = await platform.env.GATEWAY.fetch(
        "https://_/api/public/planning/parked-ideas?limit=100"
      );
    } else {
      return { ideas: [], error: "Gateway not configured" };
    }

    if (!res.ok) {
      return { ideas: [], error: "Failed to fetch ideas" };
    }
    const data = (await res.json()) as { items?: ParkedIdea[] };
    return { ideas: data.items ?? [], error: null };
  } catch (e) {
    console.error("parked-ideas load error:", e);
    return { ideas: [], error: "Failed to fetch ideas" };
  }
};
