import { TenantOnboardingWorkflow } from "./workflows/onboarding";
import { DataPipelineWorkflow } from "./workflows/data-pipeline";
import { ReportGenerationWorkflow } from "./workflows/report-gen";
import { EmailSequenceWorkflow } from "./workflows/email-sequence";

export { TenantOnboardingWorkflow, DataPipelineWorkflow, ReportGenerationWorkflow, EmailSequenceWorkflow };

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health endpoint
    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "foundation-workflows",
        timestamp: new Date().toISOString(),
        workflows: [
          "TenantOnboardingWorkflow",
          "DataPipelineWorkflow",
          "ReportGenerationWorkflow",
          "EmailSequenceWorkflow",
        ],
      });
    }

    return new Response("Foundation Workflows — use workflow bindings to create instances.", { status: 200 });
  },
};
