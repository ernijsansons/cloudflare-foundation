import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';

interface NaomiTask {
	id: string;
	run_id: string;
	repo_url: string;
	agent: string;
	status: string;
	phase?: string;
	vm_id?: string;
	claimed_at?: number;
	started_at?: number;
	completed_at?: number;
	retry_count?: number;
	error?: string;
	created_at: number;
	updated_at?: number;
	// Extended fields (may not exist in DB yet)
	title?: string;
	progress_pct?: number;
}

export const load: PageServerLoad = async ({ platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		// Fetch all tasks (not just roadmaps) - use naomi tasks endpoint
		const data = await gateway.fetchJson<{ tasks?: NaomiTask[]; roadmaps?: NaomiTask[] }>(
			'/public/dashboard/roadmaps'
		);

		// Handle both old (roadmaps) and new (tasks) response shapes
		const tasks = data.tasks || data.roadmaps || [];

		return {
			tasks,
			error: null
		};
	} catch (error) {
		console.error('Error fetching tasks:', error);
		return {
			tasks: [],
			error: error instanceof Error ? error.message : 'Failed to load tasks'
		};
	}
};
