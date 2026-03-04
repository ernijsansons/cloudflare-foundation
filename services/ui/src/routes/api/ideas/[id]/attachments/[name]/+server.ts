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

// GET - download attachment
export const GET: RequestHandler = async ({ params, platform }) => {
  try {
    const res = await fetchAPI(
      platform,
      `/api/planning/ideas/${params.id}/attachments/${encodeURIComponent(params.name)}`
    );

    if (!res.ok) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition":
          res.headers.get("content-disposition") || `attachment; filename="${params.name}"`,
      },
    });
  } catch (e) {
    console.error("Download attachment error:", e);
    return json({ error: "Download failed" }, { status: 500 });
  }
};

// DELETE - remove attachment
export const DELETE: RequestHandler = async ({ params, platform }) => {
  try {
    const res = await fetchAPI(
      platform,
      `/api/planning/ideas/${params.id}/attachments/${encodeURIComponent(params.name)}`,
      { method: "DELETE" }
    );

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Delete attachment error:", e);
    return json({ error: "Delete failed" }, { status: 500 });
  }
};
