export interface Env {
  AI: Ai; // Keep for embeddings
  DB: D1Database;
  FILES?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  TAVILY_API_KEY?: string;
  BRAVE_API_KEY?: string;
  PLANNING_WORKFLOW?: Workflow;
  WEBHOOK_QUEUE?: Queue;
  // NVIDIA NIM API for Kimi K2.5 / GLM-5
  NVIDIA_API_KEY?: string;
  // Orchestration — multi-model parallel inference + synthesis
  ANTHROPIC_API_KEY?: string;
  MINIMAX_API_KEY?: string;
  ORCHESTRATION_ENABLED?: string; // "true" | "false" (wrangler vars are always strings)
  CONTEXT_SIGNING_KEY?: string;
}
