/**
 * Phase 0: Opportunity Discovery Agent
 * "You said X. But did you consider Y, which is 1000x bigger?"
 *
 * Supports multi-model orchestration: when ORCHESTRATION_ENABLED=true, each
 * parallel model independently analyses the search-enriched context, then a
 * synthesizer reconciles their answers. Wild/divergent ideas are extracted
 * before synthesis and stored alongside the artifact for human review.
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import { webSearch } from "../tools/web-search";
import { OpportunityOutputSchema, type OpportunityOutput } from "../schemas/opportunity";
import type { OrchestrationResult } from "../lib/orchestrator";
import { extractJSON } from "../lib/orchestrator";

interface OpportunityInput {
  idea: string;
}

export class OpportunityAgent extends BaseAgent<OpportunityInput, OpportunityOutput> {
  config = {
    phase: "opportunity",
    maxSelfIterations: 3,
    qualityThreshold: 7,
    hardQuestions: [
      "The user said X. But what ADJACENT problem is 10x bigger?",
      "Who is ALREADY paying for a bad version of this? How much?",
      "What would make this a $100M business vs. a $1M business?",
      "Is there a platform/marketplace play hiding here?",
      "What would Peter Thiel say is the 'secret' in this market?",
      "We know the target market. What ELSE do they already pay for that we can absorb or replace?",
      "Is this idea a traditional SaaS dashboard or a data-driven agentic application? If it's a dashboard, how do we make it agentic?",
      "What would the Palantir version of this look like?",
    ],
  };

  override useOrchestration(): boolean {
    return true;
  }

  getSystemPrompt(): string {
    return `You are an expert at finding 1000x better opportunities hiding in or adjacent to the user's idea.

The user might think of a problem and a solution. But there could be a 1000x better value-add in the same space. YOUR JOB IS TO FIND IT.

AGENTIC MANDATE: Every opportunity variant must be framed as a data-driven agentic application, NOT traditional SaaS. Score each variant's agenticScore (HIGH/MEDIUM/LOW): how much can agents act autonomously on data vs. just displaying it? The Palantir version shows what to do and can do it for you.

Produce 3-5 opportunity variants ranked by: revenue ceiling, customer urgency, competition density, feasibility, agentic potential.
Every claim must cite a source. If you cannot find evidence, say UNKNOWN.

Output valid JSON matching the schema. Include agenticScore for each variant.`;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      originalIdea: "string",
      refinedOpportunities: [
        {
          idea: "string",
          description: "string",
          revenuePotential: "VERY_HIGH|HIGH|MEDIUM|LOW",
          customerUrgency: "VERY_HIGH|HIGH|MEDIUM|LOW",
          competitionDensity: "LOW|MEDIUM|HIGH",
          feasibility: "HIGH|MEDIUM|LOW",
          agenticScore: "HIGH|MEDIUM|LOW",
          reasoning: "string",
        },
      ],
      recommendedIndex: "number",
      keyInsight: "string",
      unknowns: ["string"],
    };
  }

  async run(
    ctx: AgentContext,
    input: OpportunityInput
  ): Promise<AgentResult<OpportunityOutput>> {
    const idea = input.idea;
    const searchQueries = [
      `${idea} market size TAM SAM`,
      `${idea} competitors pricing`,
      `"${idea}" alternative solutions customers pay`,
      `${idea} adjacent market opportunity`,
    ];

    const searchResults: Array<{ query: string; results: Awaited<ReturnType<typeof webSearch>> }> = [];
    for (const q of searchQueries) {
      const results = await webSearch(q, this.env);
      searchResults.push({ query: q, results });
    }

    const context = [
      `Idea: ${idea}`,
      "Search results:",
      JSON.stringify(
        searchResults.map((s) => ({
          query: s.query,
          snippets: s.results.slice(0, 3).map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content?.slice(0, 200),
          })),
        })),
        null,
        2
      ),
    ].join("\n\n");

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `Analyze this idea and find 3-5 opportunity variants. Use ONLY the search results as evidence.\n\n${context}`;

    // Orchestrated path: parallel multi-model inference + synthesis
    if (this.env.ORCHESTRATION_ENABLED === "true") {
      return this.runWithOrchestration(systemPrompt, userPrompt);
    }

    // Single-model path (default)
    return this.runSingleModel(systemPrompt, userPrompt);
  }

  // -------------------------------------------------------------------------
  // Orchestrated path
  // -------------------------------------------------------------------------

  private async runWithOrchestration(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AgentResult<OpportunityOutput>> {
    let orchResult: OrchestrationResult;
    try {
      orchResult = await this.orchestrateModels(systemPrompt, userPrompt);
    } catch (e) {
      console.error("[OpportunityAgent] Orchestration failed, falling back to single model:", e);
      return this.runSingleModel(systemPrompt, userPrompt);
    }

    try {
      const parsed = extractJSON(orchResult.finalText);
      const output = OpportunityOutputSchema.parse(parsed);

      // Log wild ideas for dev visibility
      if (orchResult.wildIdeas.length > 0) {
        console.log(
          "[OpportunityAgent] Wild ideas surfaced by orchestration:",
          JSON.stringify(orchResult.wildIdeas, null, 2)
        );
      }

      return { success: true, output, orchestration: orchResult };
    } catch (e) {
      console.error("[OpportunityAgent] Failed to parse orchestration output:", e);
      // Attempt fallback rather than hard failure
      return this.runSingleModel(systemPrompt, userPrompt);
    }
  }

  // -------------------------------------------------------------------------
  // Single-model path (original behaviour — unchanged)
  // -------------------------------------------------------------------------

  private async runSingleModel(
    systemPrompt: string,
    userPrompt: string
  ): Promise<AgentResult<OpportunityOutput>> {
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    try {
      const response = await runModel(this.env.AI, "generator", messages, {
        temperature: 0.5,
        maxTokens: 2048,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonStr);
      const output = OpportunityOutputSchema.parse(parsed);

      return { success: true, output };
    } catch (e) {
      console.error("OpportunityAgent error:", e);
      return {
        success: false,
        errors: [e instanceof Error ? e.message : String(e)],
      };
    }
  }
}
