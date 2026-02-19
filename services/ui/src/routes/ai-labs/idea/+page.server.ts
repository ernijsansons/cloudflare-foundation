import type { PageServerLoad, Actions } from "./$types";
import { dev } from "$app/environment";
import { fail, redirect } from "@sveltejs/kit";

export interface Idea {
  id: string;
  name: string;
  content: string;
  contentLength?: number;
  status: string;
  created_at: number;
  updated_at: number;
}

async function fetchAPI(
  platform: App.Platform | undefined,
  path: string,
  options?: RequestInit
): Promise<Response> {
  if (dev) {
    return fetch(`http://127.0.0.1:8787${path}`, options);
  } else if (platform?.env?.GATEWAY) {
    return platform.env.GATEWAY.fetch(`https://_${path}`, options);
  }
  throw new Error("Gateway not configured");
}

export const load: PageServerLoad = async ({ platform }) => {
  try {
    const res = await fetchAPI(platform, "/api/planning/ideas?limit=100");

    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to fetch ideas:", res.status, text);
      return { ideas: [], error: "Failed to fetch ideas" };
    }
    const data = (await res.json()) as { items?: Idea[] };
    return { ideas: data.items ?? [], error: null };
  } catch (e) {
    console.error("ideas load error:", e);
    return { ideas: [], error: "Failed to fetch ideas" };
  }
};

export const actions: Actions = {
  create: async ({ request, platform }) => {
    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const content = formData.get("content")?.toString().trim();

    if (!name) {
      return fail(400, { error: "Name is required", name, content });
    }
    if (!content) {
      return fail(400, { error: "Content is required", name, content });
    }

    try {
      const res = await fetchAPI(platform, "/api/planning/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content, status: "draft" }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to create idea:", res.status, text);
        return fail(500, { error: "Failed to create idea", name, content });
      }

      const idea = (await res.json()) as Idea;
      redirect(303, `/ai-labs/idea/${idea.id}`);
    } catch (e) {
      if (e instanceof Response || (e as { status?: number })?.status === 303) {
        throw e;
      }
      console.error("create idea error:", e);
      return fail(500, { error: "Failed to create idea", name, content });
    }
  },

  startResearch: async ({ request, platform }) => {
    const formData = await request.formData();
    const ideaId = formData.get("ideaId")?.toString();

    if (!ideaId) {
      return fail(400, { error: "Idea ID is required" });
    }

    try {
      const res = await fetchAPI(platform, `/api/planning/ideas/${ideaId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cloud" }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to start research:", res.status, text);
        return fail(500, { error: "Failed to start research" });
      }

      const run = (await res.json()) as { id: string };
      redirect(303, `/ai-labs/research/runs/${run.id}`);
    } catch (e) {
      if (e instanceof Response || (e as { status?: number })?.status === 303) {
        throw e;
      }
      console.error("start research error:", e);
      return fail(500, { error: "Failed to start research" });
    }
  },
};
