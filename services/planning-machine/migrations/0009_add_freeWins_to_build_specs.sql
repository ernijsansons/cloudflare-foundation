-- Migration: Add free_wins column to build_specs table
-- Project Factory v3.0
--
-- Adds the free_wins field to persist Architecture Advisor's
-- free win suggestions (e.g., Turnstile, Analytics Engine).

ALTER TABLE build_specs ADD COLUMN free_wins TEXT NOT NULL DEFAULT '[]';

-- Create index for querying BuildSpecs by presence of free wins
CREATE INDEX IF NOT EXISTS idx_build_specs_free_wins
ON build_specs((json_array_length(free_wins) > 0));
