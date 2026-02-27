/**
 * Routes to Cloudflare Workers AI models
 * Includes retry logic with exponential backoff for transient failures
 */

// Use llama-3.3-70b (128K context) for all roles
export const MODELS = {
  generator: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  reviewer: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  tiebreaker: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
} as const;

export type ModelRole = keyof typeof MODELS;

export interface AiTextOptions {
  maxTokens?: number;
  temperature?: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runModel(
  ai: Ai,
  role: ModelRole,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: AiTextOptions
): Promise<string> {
  const modelId = MODELS[role];
  const temperature = options?.temperature ?? (role === "generator" ? 0.3 : 0.1);
  const maxTokens = options?.maxTokens ?? 4096;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.run(modelId, {
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const result = response as { response?: string; error?: string };

      if (result.error) {
        throw new Error(`AI model error: ${result.error}`);
      }

      const text = result.response ?? "";
      if (!text) {
        throw new Error("Empty response from AI model");
      }

      return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(`Model ${role} (${modelId}) attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

      // Don't wait on the last attempt
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Model ${role} failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? "Unknown error"}`);
}

/**
 * Embeddings use Cloudflare Workers AI
 */
export async function runEmbedding(ai: Ai, text: string): Promise<number[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.run("@cf/baai/bge-base-en-v1.5", {
        text: [text],
      });

      const result = response as { data?: number[][]; error?: string };

      if (result.error) {
        throw new Error(`Embedding service error: ${result.error}`);
      }

      const embedding = result.data?.[0];
      if (!embedding || embedding.length === 0) {
        throw new Error("Empty embedding from AI model");
      }

      return embedding;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(`Embedding attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Embedding failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? "Unknown error"}`);
}
