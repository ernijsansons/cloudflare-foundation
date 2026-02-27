import { cleanupOldData, logCleanupResults } from './jobs/cleanup';
import { runDocScanner, type DocUpdateReport } from './jobs/doc-scanner';

export interface Env {
	DB: D1Database;
	DEEPSEEK_API_KEY?: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Deep health check - verifies dependencies
		if (url.pathname === '/health') {
			const checks: Record<string, boolean> = {
				db: false,
				doc_scan_state: false,
				doc_update_reports: false
			};

			// Check database connectivity
			try {
				await env.DB.prepare('SELECT 1').first();
				checks.db = true;
			} catch {
				// DB check failed
			}

			// Check doc scanner tables
			try {
				await env.DB.prepare('SELECT COUNT(*) FROM doc_scan_state').first();
				checks.doc_scan_state = true;
			} catch {
				// Scanner table check failed
			}

			try {
				await env.DB.prepare('SELECT COUNT(*) FROM doc_update_reports').first();
				checks.doc_update_reports = true;
			} catch {
				// Reports table check failed
			}

			const allHealthy = Object.values(checks).every(Boolean);
			return Response.json(
				{
					status: allHealthy ? 'ok' : 'degraded',
					service: 'foundation-cron',
					timestamp: new Date().toISOString(),
					schedules: ['0 * * * * (hourly doc scan)', '0 0 * * * (daily cleanup)'],
					checks
				},
				{ status: allHealthy ? 200 : 503 }
			);
		}

		// Manual doc scan trigger
		if (url.pathname === '/scan-docs' && request.method === 'POST') {
			try {
				const report = await runDocScanner(env.DB, env);
				return Response.json({
					status: 'complete',
					timestamp: new Date().toISOString(),
					report
				});
			} catch (error) {
				console.error('Manual doc scan failed:', error);
				return Response.json({ error: 'Doc scan failed' }, { status: 500 });
			}
		}

		return new Response('Foundation Cron — scheduled tasks only', { status: 200 });
	},

	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		const cron = event.cron;
		if (cron === '0 * * * *') {
			// Hourly: Doc scanner
			console.log('Hourly doc scan:', new Date().toISOString());
			ctx.waitUntil(
				runDocScanner(env.DB, env)
					.then((report: DocUpdateReport) => {
						console.log(`Doc scan complete: ${report.newItemCount} updates found`);
					})
					.catch((err: unknown) => {
						console.error('Doc scan failed:', err);
					})
			);
		} else if (cron === '0 0 * * *') {
			// Daily cleanup job
			console.log('Daily cleanup cron:', new Date().toISOString());
			ctx.waitUntil(
				cleanupOldData(env.DB)
					.then(logCleanupResults)
					.catch((err: unknown) => {
						console.error('Cleanup job failed:', err);
					})
			);
		}
	}
};
