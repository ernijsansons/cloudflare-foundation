import { TenantOnboardingWorkflow } from "./workflows/onboarding";
import { DataPipelineWorkflow } from "./workflows/data-pipeline";
import { ReportGenerationWorkflow } from "./workflows/report-gen";
import { EmailSequenceWorkflow } from "./workflows/email-sequence";

export { TenantOnboardingWorkflow, DataPipelineWorkflow, ReportGenerationWorkflow, EmailSequenceWorkflow };

export default {
  async fetch(): Promise<Response> {
    return new Response("Foundation Workflows — use workflow bindings to create instances.", { status: 200 });
  },
};
