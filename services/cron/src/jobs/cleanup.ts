/**
 * Data retention cleanup job.
 * Deletes old data according to retention policies.
 */

import { DATA_RETENTION_SECONDS } from "../../gateway/src/constants";

interface CleanupResult {
  table: string;
  deletedCount: number;
  error?: string;
}

/**
 * Clean up old data from the database based on retention policy.
 * @param db - D1 database instance
 * @param retentionSeconds - Retention period in seconds (default: 90 days)
 */
export async function cleanupOldData(
  db: D1Database,
  retentionSeconds: number = DATA_RETENTION_SECONDS
): Promise<CleanupResult[]> {
  const cutoff = Math.floor(Date.now() / 1000) - retentionSeconds;
  const results: CleanupResult[] = [];

  // Clean up audit chain entries
  try {
    const auditResult = await db
      .prepare("DELETE FROM audit_chain WHERE created_at < ?")
      .bind(cutoff)
      .run();
    results.push({
      table: "audit_chain",
      deletedCount: auditResult.meta.changes ?? 0,
    });
  } catch (error) {
    results.push({
      table: "audit_chain",
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Clean up read notifications (keep unread ones indefinitely)
  try {
    const notificationResult = await db
      .prepare("DELETE FROM notifications WHERE created_at < ? AND read = 1")
      .bind(cutoff)
      .run();
    results.push({
      table: "notifications",
      deletedCount: notificationResult.meta.changes ?? 0,
    });
  } catch (error) {
    // Table may not exist
    results.push({
      table: "notifications",
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Table may not exist",
    });
  }

  // Clean up old planning runs marked as deleted
  try {
    const planningResult = await db
      .prepare("DELETE FROM planning_runs WHERE status = 'deleted' AND updated_at < ?")
      .bind(cutoff)
      .run();
    results.push({
      table: "planning_runs",
      deletedCount: planningResult.meta.changes ?? 0,
    });
  } catch (error) {
    results.push({
      table: "planning_runs",
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Table may not exist",
    });
  }

  return results;
}

/**
 * Log cleanup results with structured output.
 */
export function logCleanupResults(results: CleanupResult[]): void {
  const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
  const errors = results.filter((r) => r.error);

  console.log(
    JSON.stringify({
      level: "info",
      service: "foundation-cron",
      message: "Data cleanup completed",
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalDeleted,
        tablesProcessed: results.length,
        errorsEncountered: errors.length,
      },
    })
  );
}
