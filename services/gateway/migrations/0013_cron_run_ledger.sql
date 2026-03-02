-- Migration: 0013_cron_run_ledger.sql
-- Adds a dedicated run ledger for cron job execution auditing.
-- Records EVERY run attempt (success or failure) for fail-closed verification.

CREATE TABLE IF NOT EXISTS cron_run_ledger (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id         TEXT    NOT NULL UNIQUE,      -- UUID correlation ID (run_<timestamp>_<random>)
  job_name       TEXT    NOT NULL,             -- 'doc_scanner' | 'cleanup'
  cron_schedule  TEXT    NOT NULL,             -- '0 * * * *' | '0 0 * * *'
  status         TEXT    NOT NULL,             -- 'started' | 'completed' | 'failed'
  started_at     INTEGER NOT NULL,             -- Unix timestamp
  completed_at   INTEGER,                      -- Unix timestamp (NULL if in progress)
  duration_ms    INTEGER,                      -- Execution duration in milliseconds
  summary        TEXT,                         -- JSON: { itemsFound, errorsEncountered, etc. }
  error_message  TEXT,                         -- Error details if failed
  created_at     INTEGER NOT NULL              -- Unix timestamp
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cron_ledger_job_status
  ON cron_run_ledger (job_name, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_cron_ledger_run_id
  ON cron_run_ledger (run_id);

CREATE INDEX IF NOT EXISTS idx_cron_ledger_started
  ON cron_run_ledger (started_at DESC);
