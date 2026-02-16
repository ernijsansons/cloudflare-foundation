import type { PageServerLoad } from "./$types";
import type { ParkedIdea } from "$lib/types";

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform?.env?.GATEWAY) {
    return { ideas: [], error: "Gateway not configured" };
  }

  try {
    const res = await platform.env.GATEWAY.fetch(
      "https://_/api/planning/parked-ideas?limit=100"
    );
    if (!res.ok) {
      return { ideas: [], error: "Failed to fetch ideas" };
    }
    const data = (await res.json()) as { items?: ParkedIdea[] };
    return { ideas: data.items ?? [], error: null };
  } catch (e) {
    console.error("idea load error:", e);
    return { ideas: [], error: "Failed to fetch ideas" };
  }
};
