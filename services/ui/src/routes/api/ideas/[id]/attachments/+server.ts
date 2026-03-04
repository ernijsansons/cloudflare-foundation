import { dev } from "$app/environment";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

async function fetchAPI(
  platform: App.Platform | undefined,
  path: string,
  options?: RequestInit
): Promise<Response> {
  if (dev) {
    return fetch(`http://127.0.0.1:8787${path}`, options);
  } else if (platform?.env?.GATEWAY) {
    const publicPath = path.replace("/api/planning/", "/api/public/planning/");
    return platform.env.GATEWAY.fetch(`https://_${publicPath}`, options);
  }
  throw new Error("Gateway not configured");
}

// POST - upload attachment
export const POST: RequestHandler = async ({ request, params, platform }) => {
  try {
    const formData = await request.formData();
    const res = await fetchAPI(platform, `/api/planning/ideas/${params.id}/attachments`, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Upload attachment error:", e);
    return json({ error: "Upload failed" }, { status: 500 });
  }
};
