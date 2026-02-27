export interface Env {
  AI: Ai; // Keep for embeddings
  DB: D1Database;
  FILES?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  TAVILY_API_KEY?: string;
  BRAVE_API_KEY?: string;
  PLANNING_WORKFLOW?: Workflow;
  WEBHOOK_QUEUE?: Queue;
  // Orchestration — multi-model parallel inference + synthesis
  ANTHROPIC_API_KEY?: string;
  MINIMAX_API_KEY?: string;
  ORCHESTRATION_ENABLED?: string; // "true" | "false" (wrangler vars are always strings)
}
