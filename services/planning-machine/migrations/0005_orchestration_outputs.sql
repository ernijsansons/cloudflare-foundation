-- Migration: Add orchestration output columns to planning_artifacts
-- Stores per-model raw outputs and wild/divergent ideas from multi-model orchestration

-- Raw text output from each parallel model
-- JSON array: [{ "model": "@cf/deepseek-ai/...", "text": "...", "durationMs": 1234, "error": null }, ...]
ALTER TABLE planning_artifacts ADD COLUMN model_outputs TEXT;

-- Divergent ideas surfaced before synthesis collapses them
-- JSON array: [{ "model": "...", "wildIdea": "...", "reasoning": "..." }, ...]
ALTER TABLE planning_artifacts ADD COLUMN wild_ideas TEXT;
