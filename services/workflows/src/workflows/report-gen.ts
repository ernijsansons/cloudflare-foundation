import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

export interface Env {
  DB: D1Database;
  AUDIT_QUEUE?: Queue;
}

type Params = { reportId?: string };

export class ReportGenerationWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do("generate-report", async () => ({ done: true }));
  }
}
