import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, platform }) => {
	try {
		const gateway = platform?.env?.GATEWAY;
		if (!gateway) {
			return error(500, "Gateway not configured");
		}

		const { projectId } = params;
		if (!projectId) {
			return error(400, "Project ID is required");
		}

		const res = await gateway.fetch(
			new Request(`https://_/api/projects/${projectId}/docs`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			})
		);

		if (!res.ok) {
			const errorText = await res.text();
			console.error(`Failed to fetch documentation for project ${projectId}:`, errorText);
			return error(res.status, `Failed to fetch documentation: ${errorText}`);
		}

		const data = await res.json();
		return json(data);
	} catch (e) {
		console.error("Documentation fetch error:", e);
		return error(500, `Internal error: ${(e as Error).message}`);
	}
};
