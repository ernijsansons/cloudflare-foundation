import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("session_id");
  if (sessionId && event.platform?.env?.SESSION_KV) {
    const session = await event.platform.env.SESSION_KV.get(`session:${sessionId}`, "json");
    if (session && typeof session === "object" && "tenantId" in session) {
      event.locals.user = session as { tenantId: string; userId: string };
      event.locals.tenantId = (session as { tenantId: string }).tenantId;
    }
  }
  return resolve(event);
};
