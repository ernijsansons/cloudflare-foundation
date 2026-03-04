import { DurableObject } from "cloudflare:workers";
import type { Env, RalphState, RunSpec, RunState, HookViolation, ApprovalRequest } from "../types";
import { VALID_TRANSITIONS } from "../types";

/**
 * RunController Durable Object
 *
 * Actor 2: Isolated state machine for Ralph Loop execution.
 * Enforces deterministic transitions per PRODUCTION_BIBLE Section 8.
 *
 * State Flow:
 *   PENDING → IN_PROGRESS → RUN_CHECKS → UPDATE_DOCS → COMPLETE
 *   Any state → BLOCKED (on hook violation or max repairs)
 */
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
    hookViolations: [],
    blockedReason: null,
    approvalRequest: null,
    startedAt: null,
    completedAt: null,
  };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
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
    reason?: string,
    hookSource?: string
  ): Promise<void> {
    const transitionId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.ctx.storage.put(`transition:${transitionId}`, {
      id: transitionId,
      runId: this.state.runId,
      fromState,
      toState,
      reason,
      hookSource,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Initialize a new run - PENDING → IN_PROGRESS
   */
  async startRun(runId: string, runSpec: RunSpec): Promise<{ success: boolean; error?: string }> {
    if (this.state.currentState !== "PENDING" && this.state.runId) {
      return { success: false, error: "Run already started" };
    }

    this.state.runId = runId;
    this.state.projectId = runSpec.project_id;
    this.state.runSpec = runSpec;
    this.state.currentState = "IN_PROGRESS";
    this.state.startedAt = new Date().toISOString();

    await this.recordTransition("PENDING", "IN_PROGRESS", "Run initialized");
    await this.saveState();

    return { success: true };
  }

  /**
   * Transition to a new state with validation
   */
  async transitionState(
    toState: RalphState,
    reason?: string,
    hookSource?: string
  ): Promise<{ success: boolean; error?: string }> {
    const fromState = this.state.currentState;
    const validNextStates = VALID_TRANSITIONS[fromState];

    if (!validNextStates.includes(toState)) {
      return {
        success: false,
        error: `Invalid transition: ${fromState} → ${toState}. Valid: ${validNextStates.join(", ")}`,
      };
    }

    await this.recordTransition(fromState, toState, reason, hookSource);
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
   * Record a hook violation and transition to BLOCKED
   * Called when path-guard, forbidden-cmd, or pre-commit-audit fails
   */
  async recordHookViolation(violation: HookViolation): Promise<{ success: boolean }> {
    this.state.hookViolations.push(violation);
    this.state.errors.push(`[${violation.hookName}] ${violation.violationType}: ${violation.details}`);

    // Any hook violation → BLOCKED
    await this.transitionState(
      "BLOCKED",
      `Hook violation: ${violation.hookName} - ${violation.violationType}`,
      violation.hookName
    );

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
   * Record check results (lint, typecheck, test, smoke)
   */
  async recordCheckResult(
    check: "lint" | "typecheck" | "test" | "smoke",
    result: "pass" | "fail" | "skip"
  ): Promise<void> {
    this.state.checkResults[check] = result;
    await this.saveState();
  }

  /**
   * Increment repair attempts - max 3 per Bible Section 8
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
   * Request human approval - transitions to REQUEST_APPROVAL
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
   * Approve pending request - resume execution
   */
  async approveRun(approvedBy: string): Promise<{ success: boolean; error?: string }> {
    if (this.state.currentState !== "REQUEST_APPROVAL") {
      return { success: false, error: "No pending approval request" };
    }

    const result = await this.transitionState("IN_PROGRESS", `Approved by ${approvedBy}`);

    if (result.success) {
      this.state.approvalRequest = null;
      await this.saveState();
    }

    return result;
  }

  /**
   * Reject pending request - transition to BLOCKED
   */
  async rejectRun(rejectedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
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
    Array<{
      id: string;
      fromState: string;
      toState: string;
      reason?: string;
      hookSource?: string;
      createdAt: string;
    }>
  > {
    const transitions: Array<{
      id: string;
      fromState: string;
      toState: string;
      reason?: string;
      hookSource?: string;
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
          hookSource?: string;
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
      // GET /state
      if (method === "GET" && url.pathname === "/state") {
        return Response.json(this.getRunState());
      }

      // GET /transitions
      if (method === "GET" && url.pathname === "/transitions") {
        const transitions = await this.getTransitions();
        return Response.json(transitions);
      }

      // POST /start
      if (method === "POST" && url.pathname === "/start") {
        const body = (await request.json()) as { runId: string; runSpec: RunSpec };
        const result = await this.startRun(body.runId, body.runSpec);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /transition
      if (method === "POST" && url.pathname === "/transition") {
        const body = (await request.json()) as {
          toState: RalphState;
          reason?: string;
          hookSource?: string;
        };
        const result = await this.transitionState(body.toState, body.reason, body.hookSource);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /hook-violation - Critical: path-guard or forbidden-cmd violation
      if (method === "POST" && url.pathname === "/hook-violation") {
        const body = (await request.json()) as HookViolation;
        const result = await this.recordHookViolation(body);
        return Response.json(result);
      }

      // POST /file-change
      if (method === "POST" && url.pathname === "/file-change") {
        const body = (await request.json()) as { filePath: string };
        await this.recordFileChange(body.filePath);
        return Response.json({ success: true });
      }

      // POST /check-result
      if (method === "POST" && url.pathname === "/check-result") {
        const body = (await request.json()) as {
          check: "lint" | "typecheck" | "test" | "smoke";
          result: "pass" | "fail" | "skip";
        };
        await this.recordCheckResult(body.check, body.result);
        return Response.json({ success: true });
      }

      // POST /repair-attempt
      if (method === "POST" && url.pathname === "/repair-attempt") {
        const result = await this.incrementRepairAttempts();
        return Response.json(result);
      }

      // POST /error
      if (method === "POST" && url.pathname === "/error") {
        const body = (await request.json()) as { error: string };
        await this.recordError(body.error);
        return Response.json({ success: true });
      }

      // POST /request-approval
      if (method === "POST" && url.pathname === "/request-approval") {
        const body = (await request.json()) as {
          action: string;
          reason: string;
          context?: Record<string, unknown>;
        };
        const result = await this.requestApproval(body.action, body.reason, body.context);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /approve
      if (method === "POST" && url.pathname === "/approve") {
        const body = (await request.json()) as { approvedBy: string };
        const result = await this.approveRun(body.approvedBy);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // POST /reject
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
