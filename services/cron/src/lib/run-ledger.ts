/**
 * run-ledger.ts
 * Records every cron job execution for fail-closed auditing.
 * Every run (success or failure) is persisted to the cron_run_ledger table.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobName = 'doc_scanner' | 'cleanup';
export type RunStatus = 'started' | 'completed' | 'failed';

export interface RunContext {
	runId: string;
	jobName: JobName;
	cronSchedule: string;
	startedAt: number;
}

export interface RunSummary {
	itemsProcessed?: number;
	itemsFound?: number;
	newItemCount?: number;
	errorsEncountered?: number;
	sources?: string[];
	tablesCleanedUp?: string[];
	rowsDeleted?: number;
	[key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Generate a unique run ID with timestamp prefix for sortability.
 * Format: run_<base36-timestamp>_<random>
 */
export function generateRunId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 10);
	return `run_${timestamp}_${random}`;
}

/**
 * Get current Unix timestamp in seconds.
 */
function nowUnix(): number {
	return Math.floor(Date.now() / 1000);
}

// ---------------------------------------------------------------------------
// Run Ledger Operations
// ---------------------------------------------------------------------------

/**
 * Record the start of a cron run.
 * Creates a new row with status 'started'.
 */
export async function recordRunStart(
	db: D1Database,
	jobName: JobName,
	cronSchedule: string
): Promise<RunContext> {
	const runId = generateRunId();
	const now = nowUnix();

	await db
		.prepare(
			`INSERT INTO cron_run_ledger
       (run_id, job_name, cron_schedule, status, started_at, created_at)
       VALUES (?, ?, ?, 'started', ?, ?)`
		)
		.bind(runId, jobName, cronSchedule, now, now)
		.run();

	console.log(
		JSON.stringify({
			level: 'info',
			service: 'foundation-cron',
			event: 'run_started',
			runId,
			jobName,
			cronSchedule,
			timestamp: new Date().toISOString()
		})
	);

	return { runId, jobName, cronSchedule, startedAt: now };
}

/**
 * Record successful completion of a cron run.
 * Updates the row with status 'completed', duration, and summary.
 */
export async function recordRunComplete(
	db: D1Database,
	ctx: RunContext,
	summary: RunSummary
): Promise<void> {
	const now = nowUnix();
	const durationMs = (now - ctx.startedAt) * 1000;

	await db
		.prepare(
			`UPDATE cron_run_ledger
       SET status = 'completed',
           completed_at = ?,
           duration_ms = ?,
           summary = ?
       WHERE run_id = ?`
		)
		.bind(now, durationMs, JSON.stringify(summary), ctx.runId)
		.run();

	console.log(
		JSON.stringify({
			level: 'info',
			service: 'foundation-cron',
			event: 'run_completed',
			runId: ctx.runId,
			jobName: ctx.jobName,
			durationMs,
			summary,
			timestamp: new Date().toISOString()
		})
	);
}

/**
 * Record failed cron run.
 * Updates the row with status 'failed' and error message.
 */
export async function recordRunFailed(
	db: D1Database,
	ctx: RunContext,
	error: unknown
): Promise<void> {
	const now = nowUnix();
	const durationMs = (now - ctx.startedAt) * 1000;
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;

	await db
		.prepare(
			`UPDATE cron_run_ledger
       SET status = 'failed',
           completed_at = ?,
           duration_ms = ?,
           error_message = ?
       WHERE run_id = ?`
		)
		.bind(now, durationMs, errorMessage, ctx.runId)
		.run();

	console.log(
		JSON.stringify({
			level: 'error',
			service: 'foundation-cron',
			event: 'run_failed',
			runId: ctx.runId,
			jobName: ctx.jobName,
			durationMs,
			error: errorMessage,
			stack: errorStack,
			timestamp: new Date().toISOString()
		})
	);
}

/**
 * Execute a job with full audit trail.
 * Wrapper that handles start/complete/fail recording automatically.
 */
export async function withAuditTrail<T>(
	db: D1Database,
	jobName: JobName,
	cronSchedule: string,
	fn: (ctx: RunContext) => Promise<T>,
	summaryFn: (result: T) => RunSummary
): Promise<T> {
	const ctx = await recordRunStart(db, jobName, cronSchedule);

	try {
		const result = await fn(ctx);
		await recordRunComplete(db, ctx, summaryFn(result));
		return result;
	} catch (error) {
		await recordRunFailed(db, ctx, error);
		throw error;
	}
}
