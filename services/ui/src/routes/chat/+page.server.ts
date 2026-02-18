import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  return {
    tenantId: locals.tenantId ?? "default",
    userId: locals.user?.userId ?? "anon",
  };
};
