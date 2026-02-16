export interface Env {
  AI: Ai;
  DB: D1Database;
  FILES?: R2Bucket;
  VECTOR_INDEX?: VectorizeIndex;
  TAVILY_API_KEY?: string;
  BRAVE_API_KEY?: string;
  PLANNING_WORKFLOW?: Workflow;
  WEBHOOK_QUEUE?: Queue;
}
