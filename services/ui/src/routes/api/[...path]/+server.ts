import type { RequestHandler } from "./$types";
import type { Fetcher } from "@cloudflare/workers-types";

function getSessionIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/\bsession_id=([^;]+)/);
  return match ? match[1].trim() : null;
}

async function proxy(request: Request, path: string, gateway: Fetcher): Promise<Response> {
  const url = `http://_/api/${path}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  const sessionId = getSessionIdFromCookie(request.headers.get("Cookie"));
  if (sessionId && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionId}`);
  }
  return gateway.fetch(url, {
    method: request.method,
    headers,
    body: request.method !== "GET" ? request.body : undefined,
  });
}

async function proxyWithoutGateway(request: Request, path: string): Promise<Response> {
  const target = path.startsWith("public/planning/")
    ? `http://127.0.0.1:8787/api/planning/${path.replace("public/planning/", "")}${new URL(request.url).search}`
    : `http://127.0.0.1:8788/api/${path}${new URL(request.url).search}`;

  return fetch(target, {
    method: request.method,
    headers: request.headers,
    body: request.method !== "GET" ? request.body : undefined,
  });
}

export const GET: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return proxyWithoutGateway(request, params.path ?? "");
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const POST: RequestHandler = async ({ request, platform, params }) => {
  if (!platform?.env?.GATEWAY) return proxyWithoutGateway(request, params.path ?? "");
  return proxy(request, params.path ?? "", platform.env.GATEWAY);
};

export const PATCH: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));
export const PUT: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));
export const DELETE: RequestHandler = async (e) => (e.platform?.env?.GATEWAY ? proxy(e.request, e.params.path ?? "", e.platform.env.GATEWAY) : proxyWithoutGateway(e.request, e.params.path ?? ""));
