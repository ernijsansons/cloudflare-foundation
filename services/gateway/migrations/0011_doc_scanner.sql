-- Migration: 0011_doc_scanner.sql
-- Adds tables for the Cloudflare doc auto-update scanner

-- Tracks last-seen state per source (npm versions, RSS dates, etc.)
CREATE TABLE IF NOT EXISTS doc_scan_state (
  source      TEXT    PRIMARY KEY,
  last_seen   TEXT    NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Stores Claude-analyzed update reports with actionable findings
CREATE TABLE IF NOT EXISTS doc_update_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  scanned_at      INTEGER NOT NULL,
  findings        TEXT    NOT NULL, -- JSON array of Finding objects
  raw_item_count  INTEGER NOT NULL DEFAULT 0,
  new_item_count  INTEGER NOT NULL DEFAULT 0,
  applied         INTEGER NOT NULL DEFAULT 0, -- 0=pending, 1=applied
  created_at      INTEGER NOT NULL
);

-- Index for fast pending report lookups
CREATE INDEX IF NOT EXISTS idx_doc_reports_applied
  ON doc_update_reports (applied, created_at DESC);
