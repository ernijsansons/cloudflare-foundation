import type { PageServerLoad } from "./$types";
import { aggregateIntoDepartments, artifactsToMap } from "$lib/services/department-aggregator";
import { generateRalphLoopJSON } from "$lib/services/ralph-generator";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const runId = params.id;

  try {
    // Fetch run details and all artifacts
    const [runRes, artifactsRes] = await Promise.all([
      fetch(`/api/public/planning/runs/${runId}`),
      fetch(`/api/public/planning/runs/${runId}/artifacts`),
    ]);

    if (!runRes.ok) {
      throw new Error(`Failed to fetch run: ${runRes.statusText}`);
    }

    const run = await runRes.json();
    const artifacts = artifactsRes.ok ? await artifactsRes.json() : [];

    // Convert artifacts array to map
    const artifactMap = artifactsToMap(artifacts);

    // Aggregate into departments
    const departments = aggregateIntoDepartments(artifactMap);

    // Generate Ralph Loop JSON
    const agentJSON = generateRalphLoopJSON(artifactMap, runId);

    return {
      run,
      departments,
      agentJSON,
    };
  } catch (error) {
    console.error("Error loading Bible data:", error);
    throw error;
  }
};
