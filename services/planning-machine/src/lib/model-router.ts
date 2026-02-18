/**
 * Routes to different Cloudflare Workers AI models for generator/reviewer/tiebreaker
 * Includes retry logic with exponential backoff for transient failures
 */

export const MODELS = {
  generator: "@cf/meta/llama-3.1-8b-instruct",
  reviewer: "@cf/mistral/mistral-7b-instruct-v0.2",
  tiebreaker: "@cf/meta/llama-3.1-8b-instruct",
} as const;

export type ModelRole = keyof typeof MODELS;

export interface AiTextOptions {
  maxTokens?: number;
  temperature?: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function messagesToPrompt(messages: Array<{ role: string; content: string }>): string {
  return messages
    .map((m) => {
      const prefix = m.role === "system" ? "System: " : m.role === "user" ? "User: " : "Assistant: ";
      return `${prefix}${m.content}`;
    })
    .join("\n\n") + "\n\nAssistant: ";
}

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

  const prompt = messagesToPrompt(messages);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Workers AI model IDs are valid strings
      const response = await ai.run(modelId as any, {
        prompt,
        max_tokens: maxTokens,
        temperature,
      });

      const result = response as { response?: string; data?: string; error?: string };

      // Check for error response from AI service
      if (result.error) {
        throw new Error(`AI service error: ${result.error}`);
      }

      const text = result.response ?? result.data ?? "";
      if (!text) {
        throw new Error("Empty response from AI model");
      }

      return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(`Model ${role} attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message);

      // Don't wait on the last attempt
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Model ${role} failed after ${MAX_RETRIES} attempts: ${lastError?.message ?? "Unknown error"}`);
}

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
