-- Delete old flat entry for Section C
DELETE FROM `project_documentation` WHERE project_id = 'run-global-claw-2026' AND section_id = 'C';

-- Seed proper subsections for Section C (Master Checklist)
INSERT OR IGNORE INTO `project_documentation` (
  id, tenant_id, project_id, section_id, subsection_key, content, status, populated_by, last_updated, created_at
) VALUES 
(
  'doc_gc_c1', 'default', 'run-global-claw-2026', 'C', 'C1_Phase_1_Scraping',
  '[{"id":"C1.1","task":"Implement base crawler with CF Browser Rendering","owner":"Ralph","tools":"Puppeteer","effort":"M","status":"done"},{"id":"C1.2","task":"Setup residential proxy rotation","owner":"Ralph","tools":"SmartProxy","effort":"S","status":"done"}]',
  'approved', 'system', cast((julianday('now') - 2440587.5)*864000 as integer), cast((julianday('now') - 2440587.5)*864000 as integer)
),
(
  'doc_gc_c2', 'default', 'run-global-claw-2026', 'C', 'C2_Phase_2_Data',
  '[{"id":"C2.1","task":"D1 schema definition for pricing history","owner":"Naomi","tools":"Wrangler","effort":"S","status":"done"},{"id":"C2.2","task":"Implement vector embeddings for product mapping","owner":"Ralph","tools":"Vectorize","effort":"L","status":"in-progress"}]',
  'approved', 'system', cast((julianday('now') - 2440587.5)*864000 as integer), cast((julianday('now') - 2440587.5)*864000 as integer)
),
(
  'doc_gc_c3', 'default', 'run-global-claw-2026', 'C', 'C3_Phase_3_UI',
  '[{"id":"C3.1","task":"Dashboard implementation (SvelteKit)","owner":"Erni","tools":"Svelte","effort":"M","status":"in-progress"},{"id":"C3.2","task":"Real-time notification system","owner":"Naomi","tools":"Queues","effort":"S","status":"todo"}]',
  'approved', 'system', cast((julianday('now') - 2440587.5)*864000 as integer), cast((julianday('now') - 2440587.5)*864000 as integer)
);
