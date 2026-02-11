import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

export interface Env {
  DB: D1Database;
  AUDIT_QUEUE?: Queue;
}

type Params = { tenantId?: string; email?: string };

export class TenantOnboardingWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do("onboard-tenant", async () => {
      const tenantId = event.payload.tenantId ?? "default";
      return { tenantId, done: true };
    });
  }
}
