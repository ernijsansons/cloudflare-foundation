# Master Prompt: LLM Orchestration for Planning Phase

**Purpose:** Use this prompt when implementing or planning the multi-LLM orchestration pattern for the Cloudflare Foundation planning machine. This approach replaces single-model inference with parallel multi-model querying + synthesis, yielding 10–20%+ gains in reasoning, math, coding, and factual QA benchmarks.

**How to use:** Copy this entire document (or the relevant sections) into your prompt when asking Claude Code to implement or plan the LLM orchestration feature. Reference it explicitly: "Follow the approach in docs/PROMPT_LLM_ORCHESTRATION_PLANNING_PHASE.md."

---

## Quick Reference: Core Concept

**LLM orchestration** = query several models in parallel → collect outputs → feed to a synthesizer model that reconciles differences, picks the best answer, reduces hallucinations. Often yields 10–20%+ gains vs. single-model.

**Models:** DeepSeek (Workers AI) + Llama/Qwen (Workers AI) + MiniMax (external API) + Claude (Anthropic) for synthesis.

**Implementation:** New `orchestrator.ts` with `runOrchestratedPhase()`; agents optionally call it instead of `runModel()`.

---

## 1. Conceptual Foundation

### 1.1 What Is LLM Orchestration?

LLM orchestration (also called multi-LLM querying, ensemble inference, or LLM Council / router-synthesizer patterns) draws from:

- **Shyam Sankar (Palantir):** Multi-model deliberation for high-stakes decisions
- **Andrej Karpathy, Perplexity, others:** Query several models in parallel → collect outputs → feed to a synthesizer that reconciles differences, picks the best answer, reduces hallucinations, improves reliability

### 1.2 Core Process (5 Steps)

1. **Select diverse models** — Choose models with complementary strengths (reasoning, speed, instruction-following, creativity, long-context).
2. **Parallel inference** — Send the same prompt (or slightly varied versions) to all models concurrently. Fast on serverless (Cloudflare Workers).
3. **Collect raw outputs** — Gather all responses (text or structured JSON).
4. **Synthesize / reconcile** — Feed all answers + original question into a strong "judge" or synthesizer model.
5. **Optional extras** — Routing, self-consistency, voting, streaming.

### 1.3 Why Use This for Planning Phase?

The planning machine runs 15 phases (opportunity → customer-intel → market-research → competitive-intel → kill-test → … → synthesis). Each phase currently uses a **single** model via `runModel()` in `model-router.ts`. Replacing this with orchestration:

- **Improves quality** — Different models surface different angles; synthesis corrects errors and combines strengths.
- **Reduces hallucinations** — Cross-checking across models catches factual mistakes.
- **Better reasoning** — DeepSeek R1 excels at chain-of-thought; Claude excels at synthesis; ensemble leverages both.
- **Cost/latency tradeoff** — Use free Workers AI models for parallel calls; reserve paid Claude for synthesis only when needed.

---

## 2. Architecture Mapping to Cloudflare Foundation

### 2.1 Current Architecture (Single-Model)

```
planning-workflow.ts
  └─ runPhase(phaseName)
       └─ getAgentForPhase(phaseName) → BaseAgent
            └─ agent.run(ctx, input)
                 └─ runModel(ai, "generator", messages)  ← single model
                      └─ ai.run("@cf/meta/llama-3.1-8b-instruct", {...})
```

**Files involved:**
- `services/planning-machine/src/workflows/planning-workflow.ts` — workflow orchestration
- `services/planning-machine/src/agents/registry.ts` — phase → agent mapping
- `services/planning-machine/src/agents/base-agent.ts` — agent interface
- `services/planning-machine/src/agents/*-agent.ts` — per-phase agents (OpportunityAgent, etc.)
- `services/planning-machine/src/lib/model-router.ts` — `runModel()`, `runEmbedding()`
- `services/planning-machine/src/types.ts` — `Env` (AI binding, secrets)

### 2.2 Target Architecture (Orchestrated)

```
planning-workflow.ts
  └─ runPhase(phaseName)
       └─ getAgentForPhase(phaseName) → BaseAgent
            └─ agent.run(ctx, input)
                 └─ runOrchestratedPhase(env, agent, ctx, input)  ← NEW
                      ├─ 1. Build prompt from agent.getSystemPrompt() + agent.buildContextPrompt()
                      ├─ 2. Parallel: DeepSeek, Llama, MiniMax, Claude (all get same prompt)
                      ├─ 3. Collect results: [{ model, text }, ...]
                      ├─ 4. Synthesizer prompt: original + all answers + "reconcile and output best"
                      └─ 5. Claude (or strongest model) synthesizes → final output
```

**New/Modified files:**
- `services/planning-machine/src/lib/orchestrator.ts` — **NEW** — `runOrchestratedPhase()`, model config
- `services/planning-machine/src/lib/model-router.ts` — **MODIFY** — add `runExternalModel()` for Anthropic, MiniMax
- `services/planning-machine/src/agents/base-agent.ts` — **MODIFY** — optional `runOrchestrated()` path
- `services/planning-machine/wrangler.jsonc` — **MODIFY** — add `ANTHROPIC_API_KEY`, `MINIMAX_API_KEY` secrets
- `services/planning-machine/src/types.ts` — **MODIFY** — extend `Env` with new bindings

### 2.3 Implementation Notes (Actual Build)

**model-router.ts:** Left **unchanged**. External API calls (Anthropic, MiniMax) live entirely in `orchestrator.ts`. This keeps model-router focused on Workers AI and avoids coupling it to external providers.

**runOrchestratedPhase():** High-level wrapper for agents that use `buildContextPrompt()` only. Use `orchestrateModels()` directly for agents that build custom context (e.g., OpportunityAgent with search-enriched prompts). `runOrchestratedPhase` is available for simpler phases (strategy, market-research) that rely on the base context.

**Rollout pattern:** When adding orchestration to a new phase, agents need to:
- Override `useOrchestration()` → return `true`
- Optionally override `getOrchestratorConfig()` for phase-specific model mix or temperatures (e.g., kill-test with lower `temperatureSynthesizer` for GO/KILL decisions)
- In `run()`, check `this.env.ORCHESTRATION_ENABLED === "true"` and call `runWithOrchestration()` vs `runSingleModel()` (see OpportunityAgent, KillTestAgent)

**Manual validation:** Run `scripts/test-orchestration.ps1` with `ORCHESTRATION_ENABLED=true` and `MINIMAX_API_KEY` set. Unit tests: `services/planning-machine/src/agents/__tests__/opportunity-agent.orchestration.test.ts`.

---

## 3. Model Selection (February 2026)

### 3.1 Recommended Model Mix

| Model | Source | Strength | Cost | Binding |
|-------|--------|----------|------|---------|
| **DeepSeek R1** | Workers AI | Reasoning, math, coding | Free (tier) | `env.AI` |
| **Llama 4 Scout** | Workers AI | Balanced generalist | Free | `env.AI` |
| **Qwen 3 Coder** | Workers AI | Coding-focused | Free | `env.AI` |
| **MiniMax 2.5** | External API | Agentic, long-context, synthesis (default) | Paid | `env.MINIMAX_API_KEY` |
| **Claude 3.5 Sonnet** | Anthropic API | Synthesis, judge (optional) | Paid | `env.ANTHROPIC_API_KEY` |

### 3.2 Workers AI Model IDs (Cloudflare)

```
@cf/deepseek-ai/deepseek-r1-distill-qwen-32b   — reasoning/math/coding
@cf/meta/llama-4-scout                          — generalist (fallback: @cf/meta/llama-3.1-8b-instruct)
@cf/qwen/qwen-3-coder                           — coding
```

**Note:** Verify model IDs at https://developers.cloudflare.com/workers-ai/models/ — IDs may change. Use `@cf/meta/llama-3.1-8b-instruct` if Llama 4 Scout is unavailable.

### 3.3 External APIs

- **Anthropic:** `https://api.anthropic.com/v1/messages` — `x-api-key`, `anthropic-version: 2023-06-01`
- **MiniMax:** `https://api.minimax.chat/v1/chat/completions` (or provider-specific endpoint) — `Authorization: Bearer <key>`

---

## 4. Implementation Specification

### 4.1 Orchestrator Interface

Create `services/planning-machine/src/lib/orchestrator.ts`:

```typescript
/**
 * LLM Orchestrator — multi-model parallel inference + synthesis
 * Replaces single-model runModel() for planning phases
 */

import type { Env } from "../types";
import type { BaseAgent } from "../agents/base-agent";
import type { AgentContext, AgentResult } from "../agents/base-agent";

export interface OrchestratorConfig {
  /** Workers AI model IDs for parallel inference */
  parallelModels: string[];
  /** Model ID or "anthropic" for synthesis */
  synthesizerModel: "anthropic" | string;
  /** Max tokens per parallel call */
  maxTokensParallel?: number;
  /** Max tokens for synthesizer */
  maxTokensSynthesizer?: number;
  /** Temperature for parallel calls (0.3–0.7) */
  temperatureParallel?: number;
  /** Temperature for synthesizer (0.1–0.3) */
  temperatureSynthesizer?: number;
  /** Timeout per model in ms */
  timeoutMs?: number;
  /** Fallback: if orchestration fails, use single model? */
  fallbackToSingleModel?: boolean;
}

export interface ModelResponse {
  model: string;
  text: string;
  error?: string;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  parallelModels: [
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    "@cf/meta/llama-4-scout",
    "@cf/qwen/qwen-3-coder",
  ],
  synthesizerModel: "anthropic",
  maxTokensParallel: 4096,
  maxTokensSynthesizer: 4096,
  temperatureParallel: 0.5,
  temperatureSynthesizer: 0.2,
  timeoutMs: 60000,
  fallbackToSingleModel: true,
};

/**
 * Run a planning phase using multi-model orchestration.
 * 1. Build prompt from agent
 * 2. Call all parallel models concurrently
 * 3. Synthesize with judge model
 * 4. Parse and return structured output
 */
export async function runOrchestratedPhase<T>(
  env: Env,
  agent: BaseAgent,
  ctx: AgentContext,
  input: unknown,
  config?: Partial<OrchestratorConfig>
): Promise<AgentResult<T>> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const systemPrompt = agent.getSystemPrompt();
  const contextPrompt = (agent as any).buildContextPrompt?.(ctx) ?? JSON.stringify(ctx);
  const userPrompt = `${contextPrompt}\n\nOutput valid JSON matching the schema.`;

  // Step 1: Parallel inference
  const parallelPromises = cfg.parallelModels.map((modelId) =>
    runWorkersAIModel(env.AI, modelId, systemPrompt, userPrompt, cfg)
  );

  // Optionally add external models (MiniMax, etc.) if keys present
  if (env.MINIMAX_API_KEY) {
    parallelPromises.push(
      runMiniMaxModel(env.MINIMAX_API_KEY, systemPrompt, userPrompt, cfg)
    );
  }

  const results = await Promise.allSettled(parallelPromises);
  const modelOutputs: ModelResponse[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      model: cfg.parallelModels[i] ?? "unknown",
      text: "",
      error: r.reason?.message ?? "Unknown error",
    };
  }).filter((r) => r.text.length > 0);

  if (modelOutputs.length === 0 && cfg.fallbackToSingleModel) {
    // Fallback to single Workers AI model
    const fallback = await runWorkersAIModel(
      env.AI,
      "@cf/meta/llama-3.1-8b-instruct",
      systemPrompt,
      userPrompt,
      cfg
    );
    modelOutputs.push(fallback);
  }

  if (modelOutputs.length === 0) {
    return {
      success: false,
      errors: ["All orchestration models failed"],
    };
  }

  // Step 2: Build synthesizer prompt
  let synthPrompt = `Original task and context:\n${userPrompt}\n\n`;
  synthPrompt += `Answers from ${modelOutputs.length} AI models:\n\n`;
  modelOutputs.forEach((r) => {
    synthPrompt += `=== ${r.model} ===\n${r.text}\n\n`;
  });
  synthPrompt += `You are an expert synthesizer. Analyze all answers above. `;
  synthPrompt += `Identify agreements, disagreements, and factual errors. `;
  synthPrompt += `Combine the best parts, correct any mistakes, and output ONLY valid JSON `;
  synthPrompt += `matching the expected schema. Be concise but complete. No commentary.`;

  // Step 3: Run synthesizer
  let finalText: string;
  if (cfg.synthesizerModel === "anthropic" && env.ANTHROPIC_API_KEY) {
    finalText = await runAnthropicModel(env.ANTHROPIC_API_KEY, synthPrompt, cfg);
  } else if (typeof cfg.synthesizerModel === "string") {
    finalText = await runWorkersAIModel(
      env.AI,
      cfg.synthesizerModel,
      "You are an expert synthesizer. Output only valid JSON.",
      synthPrompt,
      cfg
    ).then((r) => r.text);
  } else {
    // No Anthropic key: use strongest Workers AI model as synthesizer
    finalText = await runWorkersAIModel(
      env.AI,
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      "You are an expert synthesizer. Output only valid JSON.",
      synthPrompt,
      cfg
    ).then((r) => r.text);
  }

  // Step 4: Parse JSON and return
  try {
    const parsed = extractJSON(finalText);
    return { success: true, output: parsed as T };
  } catch (e) {
    return {
      success: false,
      errors: [`Failed to parse synthesizer output: ${(e as Error).message}`],
    };
  }
}

async function runWorkersAIModel(
  ai: Ai,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  cfg: OrchestratorConfig
): Promise<ModelResponse> {
  const prompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant: `;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 60000);
  try {
    const response = await ai.run(modelId as any, {
      prompt,
      max_tokens: cfg.maxTokensParallel ?? 4096,
      temperature: cfg.temperatureParallel ?? 0.5,
    });
    const result = response as { response?: string; data?: string; error?: string };
    if (result.error) throw new Error(result.error);
    const text = result.response ?? result.data ?? "";
    return { model: modelId, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function runMiniMaxModel(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  cfg: OrchestratorConfig
): Promise<ModelResponse> {
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
      max_tokens: cfg.maxTokensParallel ?? 4096,
      temperature: cfg.temperatureParallel ?? 0.5,
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return { model: "MiniMax-2.5", text };
}

async function runAnthropicModel(
  apiKey: string,
  prompt: string,
  cfg: OrchestratorConfig
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: cfg.maxTokensSynthesizer ?? 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found");
  return JSON.parse(match[0]);
}
```

### 4.2 Integration with BaseAgent

Modify `base-agent.ts` to support orchestration:

```typescript
// Add to BaseAgent class:

/** Whether this agent should use orchestration (multi-model + synthesis) */
useOrchestration(): boolean {
  return false; // Override to true for phases that benefit
}

async run(ctx: AgentContext, input: TInput): Promise<AgentResult<TOutput>> {
  if (this.useOrchestration() && this.env.ORCHESTRATION_ENABLED !== false) {
    const result = await runOrchestratedPhase<TOutput>(
      this.env,
      this,
      ctx,
      input
    );
    return result;
  }
  // Existing single-model path
  return this.runSingleModel(ctx, input);
}

/** Override in subclasses; default calls existing run logic */
protected abstract runSingleModel(ctx: AgentContext, input: TInput): Promise<AgentResult<TOutput>>;
```

**Alternative (simpler):** Add a global flag in `planning-workflow.ts` or `wrangler.jsonc`:

```jsonc
// wrangler.jsonc
{
  "vars": {
    "ORCHESTRATION_ENABLED": "true"
  }
}
```

Then in each agent's `run()`, check `this.env.ORCHESTRATION_ENABLED` and call `runOrchestratedPhase` when true.

### 4.3 Phase-Specific Configuration

Some phases may need different model mixes:

| Phase | Rationale | Suggested Config |
|-------|------------|------------------|
| opportunity | Creative, market-savvy | All 4 models, Claude synthesis |
| kill-test | Critical GO/KILL decision | All 4 + higher synthesizer weight |
| tech-arch | Coding-heavy | Add Qwen Coder, DeepSeek |
| synthesis | Already aggregates | Single model or light orchestration |

Implement `getOrchestratorConfig()` in `BaseAgent`:

```typescript
getOrchestratorConfig(): Partial<OrchestratorConfig> | null {
  return null; // Use defaults
}
```

---

## 5. Production Considerations

### 5.1 Error Handling

- **Retry failed parallel calls** — Use `Promise.allSettled`; proceed if ≥1 succeeds.
- **Timeout per model** — 60s default; abort slow calls.
- **Fallback chain** — Orchestration fails → single Workers AI model → fail workflow.

### 5.2 Cost Control

- **Workers AI** — Free tier generous; monitor usage.
- **Anthropic** — Synthesis only (1 call per phase); ~$3/M input, ~$15/M output.
- **MiniMax** — Per-token; optional, gate behind `MINIMAX_API_KEY`.

### 5.3 Rate Limiting & Caching

- Use **Cloudflare AI Gateway** for logging, caching, fallbacks.
- Cache synthesizer outputs for identical inputs (e.g., KV key = hash(prompt)).

### 5.4 Streaming (Optional)

- Workers AI: `stream: true` in `ai.run()`.
- Anthropic: `stream: true` in messages API.
- Emit partial results to UI via WebSocket or SSE.

### 5.5 Prompt Engineering for Synthesizer

Standard synthesizer instructions:

```
You are an impartial expert judge. Here are answers from several AIs to the same question.
Analyze them, identify agreements/disagreements, correct factual errors, combine strengths,
and produce the single best final answer. Output ONLY valid JSON. No commentary.
```

Add phase-specific rules:

- **kill-test:** "If any model says KILL, weigh that heavily. Majority vote on GO/KILL/PIVOT."
- **opportunity:** "Prefer opportunities with highest agenticScore when tied."

---

## 6. Optional Enhancements

### 6.1 Router (Pre-Orchestration)

Use a cheap/fast model to classify the query and pick which 2–4 models to call:

```typescript
const routerPrompt = `Classify: ${idea}\nA=reasoning B=coding C=creative D=factual`;
const route = await runModel(ai, "generator", [{ role: "user", content: routerPrompt }]);
// route → ["A","C"] → call DeepSeek + Claude only
```

### 6.2 Self-Consistency

Ask each model 2–3 times with temperature 0.7, 0.8, 0.9 → take most common answer (for kill-test, math).

### 6.3 Voting + Ranking

Score outputs with another model or heuristics (length, keyword matches, schema validity).

---

## 7. Wrangler Configuration

```jsonc
// services/planning-machine/wrangler.jsonc
{
  "name": "planning-machine",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-17",
  "[[ai]]": { "binding": "AI" },
  "vars": {
    "ORCHESTRATION_ENABLED": "true"
  }
  // Secrets (set via wrangler secret put):
  // ANTHROPIC_API_KEY
  // MINIMAX_API_KEY
}
```

---

## 8. Verification Checklist

When implementing, verify:

- [ ] `orchestrator.ts` compiles; no `any` where avoidable
- [ ] `Env` includes `ANTHROPIC_API_KEY?`, `MINIMAX_API_KEY?`, `ORCHESTRATION_ENABLED?`
- [ ] At least one phase uses orchestration (e.g., opportunity)
- [ ] Fallback to single model works when external APIs fail
- [ ] JSON extraction handles markdown code blocks
- [ ] Timeouts prevent hung requests
- [ ] Durable Workflow steps remain idempotent (orchestration is inside `step.do()`)

---

## 9. Summary: Implementation Order

1. Create `orchestrator.ts` with `runOrchestratedPhase`, `runWorkersAIModel`, `runAnthropicModel`, `runMiniMaxModel`, `extractJSON`.
2. Extend `Env` in `types.ts`.
3. Add `useOrchestration()` and orchestration path to `BaseAgent` (or a wrapper).
4. Enable orchestration for `OpportunityAgent` first; test end-to-end.
5. Add `ANTHROPIC_API_KEY` secret; test synthesis.
6. Optionally add MiniMax; add `MINIMAX_API_KEY`.
7. Roll out to other phases (kill-test, tech-arch, etc.) with phase-specific configs.
8. Add AI Gateway, caching, streaming as needed.

---

*This prompt is intended for Claude Code during the planning phase. Follow it step-by-step when implementing LLM orchestration in the Cloudflare Foundation planning machine.*
