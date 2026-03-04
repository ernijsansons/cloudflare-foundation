SELECT name FROM sqlite_master WHERE type='table';
SELECT count(*) FROM projects;
SELECT count(*) FROM project_docs;
SELECT * FROM projects WHERE id LIKE '%global-claw%';