-- Migration: Add cost_notes column to template_registry table
-- Project Factory v3.0
--
-- Adds the cost_notes field to store pricing caveats and explanations
-- (e.g., "Cost varies with AI model usage", "Depends on file storage volume").

ALTER TABLE template_registry ADD COLUMN cost_notes TEXT;
