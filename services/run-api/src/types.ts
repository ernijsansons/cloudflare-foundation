/**
 * Actor 2: Ralph Loop Control Plane Types
 *
 * Isolated type definitions for the execution engine.
 * Zero dependency on product gateway types.
 */

export interface Env {
  DB: D1Database;
  BUNDLES: R2Bucket;
  RUN_CONTROLLER: DurableObjectNamespace;
  ENVIRONMENT?: string;
  SERVICE_NAME?: string;
}

// Ralph Loop State Machine States (Section 8 of Bible)
export type RalphState =
  | "PENDING"
  | "IN_PROGRESS"
  | "RUN_CHECKS"
  | "UPDATE_DOCS"
  | "COMPLETE"
  | "BLOCKED"
  | "REQUEST_APPROVAL";

// Valid state transitions per Bible Section 8
export const VALID_TRANSITIONS: Record<RalphState, RalphState[]> = {
  PENDING: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["RUN_CHECKS", "BLOCKED", "REQUEST_APPROVAL"],
  RUN_CHECKS: ["UPDATE_DOCS", "IN_PROGRESS", "BLOCKED", "REQUEST_APPROVAL"], // Can loop back for repairs
  UPDATE_DOCS: ["COMPLETE", "BLOCKED"],
  COMPLETE: [], // Terminal state
  BLOCKED: [], // Terminal state
  REQUEST_APPROVAL: ["IN_PROGRESS", "COMPLETE", "BLOCKED"], // Resume after approval
};

// Run spec schema (from .agent/schema/run-spec.schema.json)
export interface RunSpec {
  schema_version: string;
  run_id: string;
  project_id: string;
  task_type: "implementation" | "bugfix" | "refactor" | "docs" | "migration" | "audit";
  risk_level: "low" | "medium" | "high" | "critical";
  objective: string;
  repo: {
    url: string;
    base_branch: string;
  };
  branch: string;
  allowed_paths: string[];
  forbidden_paths: string[];
  required_inputs: string[];
  acceptance_criteria: string[];
  commands: {
    install?: string;
    lint?: string;
    typecheck?: string;
    test?: string;
    smoke?: string;
    deploy_dry?: string;
  };
  deliverables: string[];
  stop_conditions: string[];
  human_approval_required_for: string[];
  max_turns: number;
  model?: string;
}

// Run state tracked by RunController DO
export interface RunState {
  runId: string;
  projectId: string;
  currentState: RalphState;
  runSpec: RunSpec | null;
  repairAttempts: number;
  filesChanged: string[];
  checkResults: {
    lint: "pass" | "fail" | "skip";
    typecheck: "pass" | "fail" | "skip";
    test: "pass" | "fail" | "skip";
    smoke: "pass" | "fail" | "skip";
  };
  errors: string[];
  hookViolations: HookViolation[];
  blockedReason: string | null;
  approvalRequest: ApprovalRequest | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface HookViolation {
  hookName: "path-guard" | "forbidden-cmd" | "pre-commit-audit";
  violationType: string;
  details: string;
  filePath?: string;
  command?: string;
  timestamp: string;
}

export interface ApprovalRequest {
  action: string;
  reason: string;
  context: Record<string, unknown>;
}

// Run report schema (output of execution)
export interface RunReport {
  run_id: string;
  project_id: string;
  status: "COMPLETE" | "BLOCKED" | "REQUEST_APPROVAL";
  branch: string;
  task_type: string;
  objective: string;
  files_changed: string[];
  checks: {
    lint?: "pass" | "fail" | "skip";
    typecheck?: "pass" | "fail" | "skip";
    test?: "pass" | "fail" | "skip";
    smoke?: "pass" | "fail" | "skip";
  };
  docs_updated?: string[];
  repair_attempts?: number;
  stop_conditions_hit?: string[];
  open_risks?: string[];
  suggested_next_run?: string;
  acceptance_criteria_results: Array<{
    criterion: string;
    status: "pass" | "fail" | "skip";
    notes?: string;
  }>;
  blocked_reason?: string;
  approval_request?: ApprovalRequest;
}
