import type { PageServerLoad } from './$types';
import { createGatewayClient } from '$lib/server/gateway';

interface TaskLog {
	id: number;
	phase?: string;
	level: string;
	message: string;
	created_at: number;
}

interface NaomiTaskWithLogs {
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
	title?: string;
	logs: TaskLog[];
}

export const load: PageServerLoad = async ({ params, platform, fetch, locals }) => {
	try {
		const gateway = createGatewayClient(platform, locals, fetch);

		// Fetch task with logs from naomi endpoint
		const task = await gateway.fetchJson<NaomiTaskWithLogs>(
			`/naomi/tasks/${params.id}`
		);

		return {
			task,
			error: null
		};
	} catch (error) {
		console.error('Error fetching task:', error);
		return {
			task: null,
			error: error instanceof Error ? error.message : 'Task not found'
		};
	}
};
