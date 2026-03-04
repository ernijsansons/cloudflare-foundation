import { DurableObject } from "cloudflare:workers";

/**
 * RunController Durable Object
 *
 * State machine for Ralph Loop autonomous execution runs.
 * Tracks run progress, state transitions, and handles HITL approvals.
 */

// Ralph Loop State Machine States
export type RalphState =
  | "PENDING"
  | "PRELOAD"
  | "READ_SPEC"
  | "READ_DOCS"
  | "PLAN_PATCH"
  | "EXECUTE_PATCH"
  | "RUN_CHECKS"
  | "UPDATE_DOCS"
  | "WRITE_REPORT"
  | "REQUEST_APPROVAL"
  | "COMPLETE"
  | "BLOCKED";

// Valid state transitions
const VALID_TRANSITIONS: Record<RalphState, RalphState[]> = {
  PENDING: ["PRELOAD", "BLOCKED"],
  PRELOAD: ["READ_SPEC", "BLOCKED"],
  READ_SPEC: ["READ_DOCS", "BLOCKED"],
  READ_DOCS: ["PLAN_PATCH", "BLOCKED"],
  PLAN_PATCH: ["EXECUTE_PATCH", "REQUEST_APPROVAL", "BLOCKED"],
  EXECUTE_PATCH: ["RUN_CHECKS", "REQUEST_APPROVAL", "BLOCKED"],
  RUN_CHECKS: ["UPDATE_DOCS", "EXECUTE_PATCH", "REQUEST_APPROVAL", "BLOCKED"], // Can loop back for repairs
  UPDATE_DOCS: ["WRITE_REPORT", "BLOCKED"],
  WRITE_REPORT: ["COMPLETE", "BLOCKED"],
  REQUEST_APPROVAL: ["EXECUTE_PATCH", "RUN_CHECKS", "COMPLETE", "BLOCKED"], // Resume after approval
  COMPLETE: [], // Terminal state
  BLOCKED: [], // Terminal state
};

export interface RunSpec {
  run_id: string;
  project_id: string;
  task_type: string;
  risk_level: string;
  objective: string;
  branch: string;
  allowed_paths: string[];
  forbidden_paths: string[];
  acceptance_criteria: string[];
  commands: Record<string, string>;
  stop_conditions: string[];
  max_turns: number;
  model?: string;
}

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
  blockedReason: string | null;
  approvalRequest: {
    action: string;
    reason: string;
    context: Record<string, unknown>;
  } | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Env {
  RUN_CONTROLLER: DurableObjectNamespace;
  DB: D1Database;
  AGENT_CONTROL_BUCKET?: R2Bucket;
}

export class RunController extends DurableObject<Env> {
  private state: RunState = {
    runId: "",
    projectId: "",
    currentState: "PENDING",
    runSpec: null,
    repairAttempts: 0,
    filesChanged: [],
    checkResults: {
      lint: "skip",
      typecheck: "skip",
      test: "skip",
      smoke: "skip",
    },
    errors: [],
    blockedReason: null,
    approvalRequest: null,
    startedAt: null,
    completedAt: null,
  };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Load state from SQLite storage on construction
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<RunState>("state");
      if (stored) {
        this.state = stored;
      }
    });
  }

  private async saveState(): Promise<void> {
    await this.ctx.storage.put("state", this.state);
  }

  private async recordTransition(
    fromState: RalphState,
    toState: RalphState,
    reason?: string
  ): Promise<void> {
    const transitionId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store in DO SQLite for durability
    await this.ctx.storage.put(`transition:${transitionId}`, {
      id: transitionId,
      runId: this.state.runId,
      fromState,
      toState,
      reason,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Initialize a new run
   */
  async startRun(runId: string, runSpec: RunSpec): Promise<{ success: boolean; error?: string }> {
    if (this.state.currentState !== "PENDING" && this.state.runId) {
      return { success: false, error: "Run already started" };
    }

    this.state.runId = runId;
    this.state.projectId = runSpec.project_id;
    this.state.runSpec = runSpec;
    this.state.currentState = "PRELOAD";
    this.state.startedAt = new Date().toISOString();

    await this.recordTransition("PENDING", "PRELOAD", "Run initialized");
    await this.saveState();

    return { success: true };
  }

  /**
   * Transition to a new state
   */
  async transitionState(
    toState: RalphState,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const fromState = this.state.currentState;
    const validNextStates = VALID_TRANSITIONS[fromState];

    if (!validNextStates.includes(toState)) {
      return {
        success: false,
        error: `Invalid transition: ${fromState} → ${toState}. Valid: ${validNextStates.join(", ")}`,
      };
    }

    await this.recordTransition(fromState, toState, reason);
    this.state.currentState = toState;

    // Handle terminal states
    if (toState === "COMPLETE" || toState === "BLOCKED") {
      this.state.completedAt = new Date().toISOString();
    }

    if (toState === "BLOCKED" && reason) {
      this.state.blockedReason = reason;
    }

    await this.saveState();
    return { success: true };
  }

  /**
   * Record a file change
   */
  async recordFileChange(filePath: string): Promise<void> {
    if (!this.state.filesChanged.includes(filePath)) {
      this.state.filesChanged.push(filePath);
      await this.saveState();
    }
  }

  /**
   * Record check results
   */
  async recordCheckResult(
    check: "lint" | "typecheck" | "test" | "smoke",
    result: "pass" | "fail" | "skip"
  ): Promise<void> {
    this.state.checkResults[check] = result;
    await this.saveState();
  }

  /**
   * Increment repair attempts
   */
  async incrementRepairAttempts(): Promise<{ remaining: number; blocked: boolean }> {
    this.state.repairAttempts += 1;
    const remaining = 3 - this.state.repairAttempts;

    if (remaining <= 0) {
      await this.transitionState("BLOCKED", "Max repair attempts (3) exhausted");
      await this.saveState();
      return { remaining: 0, blocked: true };
    }

    await this.saveState();
    return { remaining, blocked: false };
  }

  /**
   * Record an error
   */
  async recordError(error: string): Promise<void> {
    this.state.errors.push(error);
    await this.saveState();
  }

  /**
   * Request human approval
   */
  async requestApproval(
    action: string,
    reason: string,
    context: Record<string, unknown> = {}
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.transitionState("REQUEST_APPROVAL", reason);
    if (!result.success) return result;

    this.state.approvalRequest = { action, reason, context };
    await this.saveState();

    return { success: true };
  }

  /**
   * Approve the pending request
   */
  async approveRun(
    approvedBy: string,
    resumeState?: RalphState
  ): Promise<{ success: boolean; error?: string }> {
    if (this.state.currentState !== "REQUEST_APPROVAL") {
      return { success: false, error: "No pending approval request" };
    }

    const targetState = resumeState || "EXECUTE_PATCH";
    const result = await this.transitionState(targetState, `Approved by ${approvedBy}`);

    if (result.success) {
      this.state.approvalRequest = null;
      await this.saveState();
    }

    return result;
  }

  /**
   * Reject the pending request
   */
  async rejectRun(
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.state.currentState !== "REQUEST_APPROVAL") {
      return { success: false, error: "No pending approval request" };
    }

    const result = await this.transitionState("BLOCKED", `Rejected by ${rejectedBy}: ${reason}`);

    if (result.success) {
      this.state.approvalRequest = null;
      await this.saveState();
    }

    return result;
  }

  /**
   * Get current run state
   */
  getRunState(): RunState {
    return { ...this.state };
  }

  /**
   * Get all transitions for this run
   */
  async getTransitions(): Promise<
    Array<{ id: string; fromState: string; toState: string; reason?: string; createdAt: string }>
  > {
    const transitions: Array<{
      id: string;
      fromState: string;
      toState: string;
      reason?: string;
      createdAt: string;
    }> = [];

    const keys = await this.ctx.storage.list({ prefix: "transition:" });
    for (const [, value] of keys) {
      transitions.push(
        value as {
          id: string;
          fromState: string;
          toState: string;
          reason?: string;
          createdAt: string;
        }
      );
    }

    return transitions.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * HTTP handler for DO
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      // GET /state - Get current state
      if (method === "GET" && url.pathname === "/state") {
        return Response.json(this.getRunState());
      }

      // GET /transitions - Get all transitions
      if (method === "GET" && url.pathname === "/transitions") {
        const transitions = await this.getTransitions();
        return Response.json(transitions);
      }

      // POST /start - Start a new run
      if (method === "POST" && url.pathname === "/start") {
        const body = (await request.json()) as { runId: string; runSpec: RunSpec };
        const result = await this.startRun(body.runId, body.runSpec);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /transition - Transition to new state
      if (method === "POST" && url.pathname === "/transition") {
        const body = (await request.json()) as { toState: RalphState; reason?: string };
        const result = await this.transitionState(body.toState, body.reason);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /file-change - Record a file change
      if (method === "POST" && url.pathname === "/file-change") {
        const body = (await request.json()) as { filePath: string };
        await this.recordFileChange(body.filePath);
        return Response.json({ success: true });
      }

      // POST /check-result - Record check result
      if (method === "POST" && url.pathname === "/check-result") {
        const body = (await request.json()) as {
          check: "lint" | "typecheck" | "test" | "smoke";
          result: "pass" | "fail" | "skip";
        };
        await this.recordCheckResult(body.check, body.result);
        return Response.json({ success: true });
      }

      // POST /repair-attempt - Increment repair attempts
      if (method === "POST" && url.pathname === "/repair-attempt") {
        const result = await this.incrementRepairAttempts();
        return Response.json(result);
      }

      // POST /error - Record an error
      if (method === "POST" && url.pathname === "/error") {
        const body = (await request.json()) as { error: string };
        await this.recordError(body.error);
        return Response.json({ success: true });
      }

      // POST /request-approval - Request human approval
      if (method === "POST" && url.pathname === "/request-approval") {
        const body = (await request.json()) as {
          action: string;
          reason: string;
          context?: Record<string, unknown>;
        };
        const result = await this.requestApproval(body.action, body.reason, body.context);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /approve - Approve pending request
      if (method === "POST" && url.pathname === "/approve") {
        const body = (await request.json()) as { approvedBy: string; resumeState?: RalphState };
        const result = await this.approveRun(body.approvedBy, body.resumeState);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /reject - Reject pending request
      if (method === "POST" && url.pathname === "/reject") {
        const body = (await request.json()) as { rejectedBy: string; reason: string };
        const result = await this.rejectRun(body.rejectedBy, body.reason);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      return Response.json({ error: "Not found" }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return Response.json({ error: message }, { status: 500 });
    }
  }
}
