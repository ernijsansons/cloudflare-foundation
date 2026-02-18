import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

export interface Env {
  DB: D1Database;
  AUDIT_QUEUE?: Queue;
}

type Params = { sequenceId?: string; email?: string };

export class EmailSequenceWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do("send-sequence", async () => ({ done: true }));
  }
}
