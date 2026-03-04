-- Seed run-verification-001 into Actor 2 control plane
INSERT OR IGNORE INTO runs (
  run_id, project_id, task_type, risk_level, status, objective, branch, 
  num_turns, created_at, started_at, completed_at, tenant_id
) VALUES (
  'run-verification-001',
  'foundation-control',
  'implementation',
  'low',
  'COMPLETE',
  'Add a /v1/health endpoint to services/gateway/src/routes/runs.ts that returns { status: ''ok'', version: ''1.0.0'' }.',
  'agent/run-verification-001',
  18,
  datetime('now', '-15 minutes'),
  datetime('now', '-14 minutes'),
  datetime('now'),
  'default'
);

-- Seed audit trail for the run
INSERT OR IGNORE INTO run_transitions (id, run_id, from_state, to_state, reason, created_at) VALUES
('tr_1', 'run-verification-001', 'PENDING', 'IN_PROGRESS', 'Run started', datetime('now', '-14 minutes')),
('tr_2', 'run-verification-001', 'IN_PROGRESS', 'RUN_CHECKS', 'Code changes applied', datetime('now', '-5 minutes')),
('tr_3', 'run-verification-001', 'RUN_CHECKS', 'UPDATE_DOCS', 'Checks passed', datetime('now', '-2 minutes')),
('tr_4', 'run-verification-001', 'UPDATE_DOCS', 'COMPLETE', 'Documentation updated', datetime('now'));
