/**
 * LLM Orchestrator — multi-model parallel inference + synthesis
 *
 * Pattern: query several models in parallel → collect raw outputs →
 * extract wild/divergent ideas → synthesize with a strong judge model.
 *
 * Each model's full response and any wild ideas are returned so callers
 * can persist them alongside the synthesized artifact.
 */

import type { Env } from "../types";
import type { BaseAgent } from "../agents/base-agent";
import type { AgentContext, AgentResult } from "../agents/base-agent";

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface OrchestratorConfig {
  /** Workers AI model IDs for parallel inference */
  parallelModels: string[];
  /** "minimax" | "anthropic" for external API; or a Workers AI model ID string */
  synthesizerModel: "minimax" | "anthropic" | string;
  /** Max tokens per parallel call (default: 4096) */
  maxTokensParallel?: number;
  /** Max tokens for synthesizer (default: 4096) */
  maxTokensSynthesizer?: number;
  /** Temperature for parallel calls — higher = more diverse (default: 0.5) */
  temperatureParallel?: number;
  /** Temperature for synthesizer — lower = more faithful (default: 0.2) */
  temperatureSynthesizer?: number;
  /** Timeout per model in ms (default: 60000) */
  timeoutMs?: number;
  /** Fall back to single model if orchestration fails (default: true) */
  fallbackToSingleModel?: boolean;
}

export interface ModelResponse {
  model: string;
  /** Full raw text returned by the model. Empty string on error. */
  text: string;
  /** Wall-clock duration for this model's call */
  durationMs: number;
  /** Set when the model call failed */
  error?: string;
}

export interface WildIdea {
  /** Which model produced this wild idea */
  model: string;
  /** The divergent idea, phrased concisely */
  wildIdea: string;
  /** Why this idea is considered divergent from the other models' outputs */
  reasoning: string;
}

export interface OrchestrationResult {
  /** The synthesized, final output text (JSON string from the judge model) */
  finalText: string;
  /** ALL model responses including failed ones (text="" on error) */
  modelOutputs: ModelResponse[];
  /** Divergent ideas extracted before synthesis collapsed them */
  wildIdeas: WildIdea[];
  /** Which model was used as the synthesizer */
  synthesizerModel: string;
  /** Total wall-clock duration of the full orchestration */
  totalDurationMs: number;
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: Required<OrchestratorConfig> = {
  parallelModels: [
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    "@cf/meta/llama-4-scout",
    "@cf/qwen/qwen-3-coder",
  ],
  synthesizerModel: "minimax",
  maxTokensParallel: 4096,
  maxTokensSynthesizer: 4096,
  temperatureParallel: 0.5,
  temperatureSynthesizer: 0.2,
  timeoutMs: 60000,
  fallbackToSingleModel: true,
};

// Fast, cheap model used for wild-ideas extraction (not synthesis)
const WILD_IDEAS_EXTRACTOR_MODEL = "@cf/meta/llama-3.1-8b-instruct";
// Single-model fallback when all orchestration fails
const FALLBACK_MODEL = "@cf/meta/llama-3.1-8b-instruct";

// ---------------------------------------------------------------------------
// Core public function: orchestrateModels()
// ---------------------------------------------------------------------------

/**
 * Run parallel inference across multiple models, extract wild ideas, then
 * synthesize a final answer. Returns the full OrchestrationResult so callers
 * can persist per-model outputs and wild ideas alongside the synthesized artifact.
 */
export async function orchestrateModels(
  env: Env,
  systemPrompt: string,
  userPrompt: string,
  config?: Partial<OrchestratorConfig>
): Promise<OrchestrationResult> {
  const cfg: Required<OrchestratorConfig> = { ...DEFAULT_CONFIG, ...config };
  const orchestrationStart = Date.now();

  // ---- Step 1: Parallel inference ----------------------------------------
  const parallelCalls = cfg.parallelModels.map((modelId) =>
    runWorkersAIModel(env.AI, modelId, systemPrompt, userPrompt, cfg)
  );

  // Optionally include MiniMax as 4th parallel model (only when not used as synthesizer)
  if (env.MINIMAX_API_KEY && cfg.synthesizerModel !== "minimax") {
    parallelCalls.push(
      runMiniMaxModel(env.MINIMAX_API_KEY, systemPrompt, userPrompt, cfg)
    );
  }

  const settled = await Promise.allSettled(parallelCalls);

  // Collect ALL responses — including failures — so they can be stored
  const allModelOutputs: ModelResponse[] = settled.map((r, i) => {
    const modelId = i < cfg.parallelModels.length
      ? cfg.parallelModels[i]!
      : "MiniMax-M2.5";

    if (r.status === "fulfilled") return r.value;
    return {
      model: modelId,
      text: "",
      durationMs: 0,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });

  const successfulOutputs = allModelOutputs.filter((r) => r.text.length > 0);

  // ---- Fallback: if every parallel call failed ----------------------------
  if (successfulOutputs.length === 0) {
    if (!cfg.fallbackToSingleModel) {
      throw new Error("All orchestration models failed and fallback is disabled");
    }
    console.warn("[orchestrator] All parallel models failed — falling back to single model");
    const fallback = await runWorkersAIModel(
      env.AI,
      FALLBACK_MODEL,
      systemPrompt,
      userPrompt,
      cfg
    );
    return {
      finalText: fallback.text,
      modelOutputs: [...allModelOutputs, fallback],
      wildIdeas: [],
      synthesizerModel: FALLBACK_MODEL,
      totalDurationMs: Date.now() - orchestrationStart,
    };
  }

  // ---- Step 2: Wild ideas extraction + synthesis (concurrent) ------------
  const [wildIdeas, finalText, synthesizerUsed] = await Promise.all([
    extractWildIdeas(env.AI, successfulOutputs),
    runSynthesis(env, successfulOutputs, userPrompt, cfg),
    Promise.resolve(
      cfg.synthesizerModel === "minimax" && env.MINIMAX_API_KEY
        ? "MiniMax-M2.5"
        : cfg.synthesizerModel === "anthropic" && env.ANTHROPIC_API_KEY
          ? "claude-3-5-sonnet-20241022"
          : cfg.synthesizerModel === "anthropic" || cfg.synthesizerModel === "minimax"
            ? "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" // fallback when no key
            : cfg.synthesizerModel
    ),
  ]);

  return {
    finalText,
    modelOutputs: allModelOutputs,
    wildIdeas,
    synthesizerModel: synthesizerUsed,
    totalDurationMs: Date.now() - orchestrationStart,
  };
}

// ---------------------------------------------------------------------------
// High-level function: runOrchestratedPhase()
// For simpler agents that don't build custom context — uses agent.buildContextPrompt()
// ---------------------------------------------------------------------------

/**
 * Full orchestration pipeline that builds the prompt from the agent's own
 * methods. Use this for agents without custom context building (e.g., strategy,
 * market-research). For agents that do their own search/enrichment (e.g.,
 * opportunity), use orchestrateModels() directly after building messages.
 */
export async function runOrchestratedPhase<T>(
  env: Env,
  agent: BaseAgent,
  ctx: AgentContext,
  _input: unknown,
  config?: Partial<OrchestratorConfig>
): Promise<{ result: AgentResult<T>; orchestration: OrchestrationResult }> {
  const systemPrompt = agent.getSystemPrompt();
  // buildContextPrompt is protected — access via cast for orchestrator use
  const contextPrompt = (agent as unknown as { buildContextPrompt: (ctx: AgentContext) => string })
    .buildContextPrompt(ctx);
  const userPrompt = `${contextPrompt}\n\nOutput valid JSON matching the schema.`;

  const orchestration = await orchestrateModels(env, systemPrompt, userPrompt, config);

  try {
    const parsed = extractJSON(orchestration.finalText) as T;
    return {
      result: { success: true, output: parsed, orchestration },
      orchestration,
    };
  } catch (e) {
    return {
      result: {
        success: false,
        errors: [`Failed to parse orchestration output: ${(e as Error).message}`],
        orchestration,
      },
      orchestration,
    };
  }
}

// ---------------------------------------------------------------------------
// Internal: synthesis
// ---------------------------------------------------------------------------

async function runSynthesis(
  env: Env,
  successfulOutputs: ModelResponse[],
  userPrompt: string,
  cfg: Required<OrchestratorConfig>
): Promise<string> {
  let synthPrompt = `Original task:\n${userPrompt}\n\n`;
  synthPrompt += `Answers from ${successfulOutputs.length} AI models:\n\n`;
  for (const r of successfulOutputs) {
    synthPrompt += `=== ${r.model} ===\n${r.text}\n\n`;
  }
  synthPrompt += [
    "You are an impartial expert synthesizer. Analyze all answers above:",
    "- Identify points of agreement and disagreement across models",
    "- Correct any factual errors using cross-model verification",
    "- Combine the strongest reasoning and insights from each model",
    "- Output ONLY valid JSON matching the required schema",
    "- Be comprehensive but not verbose",
    "- No commentary, explanations, or markdown outside the JSON object",
  ].join("\n");

  if (cfg.synthesizerModel === "minimax" && env.MINIMAX_API_KEY) {
    const result = await runMiniMaxModel(
      env.MINIMAX_API_KEY,
      "You are an expert synthesizer. Output only valid JSON.",
      synthPrompt,
      { ...cfg, maxTokensParallel: cfg.maxTokensSynthesizer, temperatureParallel: cfg.temperatureSynthesizer }
    );
    return result.text;
  }

  if (cfg.synthesizerModel === "anthropic" && env.ANTHROPIC_API_KEY) {
    return runAnthropicModel(env.ANTHROPIC_API_KEY, synthPrompt, cfg);
  }

  // Fallback: use DeepSeek R1 when no external synthesizer key
  const synthModel =
    cfg.synthesizerModel !== "anthropic" && cfg.synthesizerModel !== "minimax"
      ? cfg.synthesizerModel
      : "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";

  const result = await runWorkersAIModel(
    env.AI,
    synthModel,
    "You are an expert synthesizer. Output only valid JSON.",
    synthPrompt,
    { ...cfg, maxTokensParallel: cfg.maxTokensSynthesizer, temperatureParallel: cfg.temperatureSynthesizer }
  );
  return result.text;
}

// ---------------------------------------------------------------------------
// Internal: wild ideas extraction
// ---------------------------------------------------------------------------

async function extractWildIdeas(
  ai: Ai,
  outputs: ModelResponse[]
): Promise<WildIdea[]> {
  if (outputs.length < 2) {
    // Need at least 2 models to find divergence
    return [];
  }

  const outputsBlock = outputs
    .map((r) => `=== ${r.model} ===\n${r.text.slice(0, 1500)}`)
    .join("\n\n");

  const wildIdeasPrompt =
    `System: You are an idea analyst specializing in divergent thinking.\n\n` +
    `User: Given the following answers from multiple AI models on the same task, ` +
    `identify the single most divergent, unconventional, or surprising idea that each model proposed ` +
    `which is NOT substantially present in the other models' answers. ` +
    `Only include models that genuinely proposed something unique. ` +
    `If a model's output is similar to the others, omit it.\n\n` +
    `${outputsBlock}\n\n` +
    `Output ONLY a JSON array (no other text):\n` +
    `[{ "model": "model-id", "wildIdea": "concise idea description", "reasoning": "why this is divergent" }]\n` +
    `If no truly divergent ideas exist, output an empty array: []\n\nAssistant: `;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await ai.run(WILD_IDEAS_EXTRACTOR_MODEL as any, {
      prompt: wildIdeasPrompt,
      max_tokens: 1024,
      temperature: 0.1,
    });

    const result = response as { response?: string; data?: string };
    const text = result.response ?? result.data ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is WildIdea =>
        typeof item === "object" &&
        item !== null &&
        typeof item.model === "string" &&
        typeof item.wildIdea === "string" &&
        typeof item.reasoning === "string"
    );
  } catch (e) {
    // Wild ideas extraction is best-effort; never block the main flow
    console.warn("[orchestrator] Wild ideas extraction failed:", e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Internal: model runners
// ---------------------------------------------------------------------------

/**
 * Workers AI ai.run() does not support AbortSignal (as of 2025).
 * We use Promise.race to enforce timeout: the caller returns after timeoutMs
 * even if the underlying request continues in the background.
 */
async function runWorkersAIModel(
  ai: Ai,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  cfg: Pick<Required<OrchestratorConfig>, "maxTokensParallel" | "temperatureParallel" | "timeoutMs">
): Promise<ModelResponse> {
  const start = Date.now();
  const prompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant: `;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Model ${modelId} timed out after ${cfg.timeoutMs}ms`)),
      cfg.timeoutMs
    );
  });

  try {
    const runPromise = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await ai.run(modelId as any, {
        prompt,
        max_tokens: cfg.maxTokensParallel,
        temperature: cfg.temperatureParallel,
      });
      return response as { response?: string; data?: string; error?: string };
    })();

    const result = await Promise.race([runPromise, timeoutPromise]);

    if (result.error) {
      throw new Error(`AI service error: ${result.error}`);
    }

    const text = result.response ?? result.data ?? "";
    if (!text) throw new Error("Empty response from model");

    return { model: modelId, text, durationMs: Date.now() - start };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[orchestrator] Model ${modelId} failed (${Date.now() - start}ms):`, msg);
    return { model: modelId, text: "", durationMs: Date.now() - start, error: msg };
  }
}

async function runAnthropicModel(
  apiKey: string,
  synthesisPrompt: string,
  cfg: Pick<Required<OrchestratorConfig>, "maxTokensSynthesizer" | "temperatureSynthesizer" | "timeoutMs">
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: cfg.maxTokensSynthesizer,
        temperature: cfg.temperatureSynthesizer,
        messages: [{ role: "user", content: synthesisPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as { content?: Array<{ type: string; text: string }> };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "";
    if (!text) throw new Error("Empty response from Anthropic");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function runMiniMaxModel(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  cfg: Pick<Required<OrchestratorConfig>, "maxTokensParallel" | "temperatureParallel" | "timeoutMs">
): Promise<ModelResponse> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const res = await fetch("https://api.minimax.chat/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: cfg.maxTokensParallel,
        temperature: cfg.temperatureParallel,
      }),
      signal: controller.signal,
    });

    const data = await res.json() as { choices?: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty response from MiniMax");
    return { model: "MiniMax-M2.5", text, durationMs: Date.now() - start };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[orchestrator] MiniMax failed:", msg);
    return { model: "MiniMax-M2.5", text: "", durationMs: Date.now() - start, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Internal: JSON extraction
// ---------------------------------------------------------------------------

/**
 * Extract the first JSON object or array from a string.
 * Handles both raw JSON and markdown code fences (```json ... ```).
 */
export function extractJSON(text: string): unknown {
  // Strip markdown code fence if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1]!.trim() : text;

  // Try to find a JSON object or array
  const objMatch = candidate.match(/\{[\s\S]*\}/);
  const arrMatch = candidate.match(/\[[\s\S]*\]/);

  // Prefer object over array (most agent outputs are objects)
  const jsonStr = objMatch ?? arrMatch;
  if (!jsonStr) {
    throw new Error("No JSON found in synthesizer output");
  }

  return JSON.parse(jsonStr[0]);
}
