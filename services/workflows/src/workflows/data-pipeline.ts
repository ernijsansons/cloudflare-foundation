import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

export interface Env {
  DB: D1Database;
  FILES?: R2Bucket;
  AUDIT_QUEUE?: Queue;
}

type Params = { pipelineId?: string };

export class DataPipelineWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    await step.do("run-pipeline", async () => ({ done: true }));
  }
}
