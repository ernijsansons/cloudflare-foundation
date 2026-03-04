-- Seed Global Claw project data
INSERT OR IGNORE INTO `planning_runs` (
  id, tenant_id, idea, refined_idea, status, current_phase, 
  quality_score, revenue_potential, mode, created_at, updated_at
) VALUES (
  'run-global-claw-2026', 
  'default', 
  'Global Claw: Autonomous E-commerce scraper and analyst', 
  'Global Claw - Market Intelligence Agent', 
  'completed', 
  'synthesis', 
  94, 
  '$25M ARR potential', 
  'cloud', 
  cast((julianday('now') - 2440587.5)*86400000 as integer) - 86400000,
  cast((julianday('now') - 2440587.5)*86400000 as integer)
);

-- Seed Overview Documentation
INSERT OR IGNORE INTO `project_documentation` (
  id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at
) VALUES (
  'doc_gc_overview',
  'default',
  'run-global-claw-2026',
  'overview',
  NULL,
  '{"executive_summary":{"concept":"Autonomous market intelligence for global e-commerce","status":"Ready for implementation","completeness":95},"vision":"Be the source of truth for real-time global pricing and sentiment","milestones":["MVP Launch","Enterprise Dashboard","Predictive Analytics"]}',
  'draft',
  'auto-generated',
  cast((julianday('now') - 2440587.5)*864000 as integer),
  cast((julianday('now') - 2440587.5)*864000 as integer)
);

-- Seed Assumptions
INSERT OR IGNORE INTO `project_documentation` (
  id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at
) VALUES (
  'doc_gc_a',
  'default',
  'run-global-claw-2026',
  'A',
  NULL,
  '{"core_assumptions":["High demand for cross-border pricing parity data","Browser-based scraping is scalable with CF Workers","AI can accurately map disparate product attributes"]}',
  'reviewed',
  'system',
  cast((julianday('now') - 2440587.5)*864000 as integer),
  cast((julianday('now') - 2440587.5)*864000 as integer)
);

-- Seed Master Checklist (Section C)
INSERT OR IGNORE INTO `project_documentation` (
  id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at
) VALUES (
  'doc_gc_c',
  'default',
  'run-global-claw-2026',
  'C',
  NULL,
  '{"core_deliverables":[{"item":"Global Scraper Engine","status":"planned"},{"item":"D1 Persistence Layer","status":"planned"},{"item":"Real-time Dashboard","status":"planned"}],"verification_steps":["D1 schema validation","Worker rate limit testing","AI mapping accuracy check"]}',
  'approved',
  'system',
  cast((julianday('now') - 2440587.5)*864000 as integer),
  cast((julianday('now') - 2440587.5)*864000 as integer)
);

-- Seed Metadata
INSERT OR IGNORE INTO `project_documentation_metadata` (
  tenant_id, project_id, completeness_percentage, total_sections, populated_sections, required_unknowns_resolved, status, last_updated
) VALUES (
  'default',
  'run-global-claw-2026',
  95,
  13,
  12,
  8,
  'approved',
  cast((julianday('now') - 2440587.5)*864000 as integer)
);
