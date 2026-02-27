import { Hono } from 'hono';

import type { Env, Variables } from '../types';

/**
 * /cron/* routes — proxy to cron worker's internal endpoints
 * for doc update reports. Admin-only access.
 */
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /cron/doc-updates — fetch pending doc update reports
app.get('/doc-updates', async (c) => {
	try {
		const rows = await c.env.DB.prepare(
			`SELECT id, scanned_at, findings, raw_item_count, new_item_count, created_at
         FROM doc_update_reports
         WHERE applied = 0 AND new_item_count > 0
         ORDER BY created_at DESC
         LIMIT 10`
		).all<{
			id: number;
			scanned_at: number;
			findings: string;
			raw_item_count: number;
			new_item_count: number;
			created_at: number;
		}>();

		const reports = (rows.results ?? []).map((r) => ({
			id: r.id,
			scannedAt: new Date(r.scanned_at * 1000).toISOString(),
			findings: JSON.parse(r.findings),
			rawItemCount: r.raw_item_count,
			newItemCount: r.new_item_count,
			createdAt: new Date(r.created_at * 1000).toISOString()
		}));

		return c.json({ pending: reports.length, reports });
	} catch (e) {
		console.error('Doc updates fetch error:', e);
		return c.json({ error: 'Failed to fetch doc updates' }, 500);
	}
});

// GET /cron/doc-updates/all — fetch all reports (including applied)
app.get('/doc-updates/all', async (c) => {
	try {
		const rows = await c.env.DB.prepare(
			`SELECT id, scanned_at, findings, raw_item_count, new_item_count, applied, created_at
         FROM doc_update_reports
         ORDER BY created_at DESC
         LIMIT 50`
		).all<{
			id: number;
			scanned_at: number;
			findings: string;
			raw_item_count: number;
			new_item_count: number;
			applied: number;
			created_at: number;
		}>();

		const reports = (rows.results ?? []).map((r) => ({
			id: r.id,
			scannedAt: new Date(r.scanned_at * 1000).toISOString(),
			findings: JSON.parse(r.findings),
			rawItemCount: r.raw_item_count,
			newItemCount: r.new_item_count,
			applied: r.applied === 1,
			createdAt: new Date(r.created_at * 1000).toISOString()
		}));

		return c.json({ total: reports.length, reports });
	} catch (e) {
		return c.json({ error: 'Failed to fetch reports' }, 500);
	}
});

// PATCH /cron/doc-updates/:id — mark a report as applied
app.patch('/doc-updates/:id', async (c) => {
	try {
		const id = c.req.param('id');
		await c.env.DB.prepare('UPDATE doc_update_reports SET applied = 1 WHERE id = ?').bind(id).run();
		return c.json({ ok: true, id });
	} catch (e) {
		return c.json({ error: 'Failed to mark report as applied' }, 500);
	}
});

// GET /cron/scan-state — view last-seen state for all sources
app.get('/scan-state', async (c) => {
	try {
		const rows = await c.env.DB.prepare(
			`SELECT source, last_seen, updated_at FROM doc_scan_state ORDER BY source`
		).all<{ source: string; last_seen: string; updated_at: number }>();

		const state = (rows.results ?? []).map((r) => ({
			source: r.source,
			lastSeen: r.last_seen,
			updatedAt: new Date(r.updated_at * 1000).toISOString()
		}));

		return c.json({ sources: state.length, state });
	} catch (e) {
		return c.json({ error: 'Failed to fetch scan state' }, 500);
	}
});

export default app;
