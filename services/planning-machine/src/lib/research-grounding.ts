/**
 * Research grounding layer — validates that planning phase outputs contain
 * real citations from web search, not hallucinated claims.
 *
 * Phases 2 (market-research), 3 (competitive-intel), 4 (customer-intel) MUST
 * provide citations. This module provides:
 *  1. Pre-phase search retrieval injected into agent prompts
 *  2. Post-phase citation validation
 *  3. A citation count gate (minimum 5 for market-research, 3 for others)
 */

import { webSearch, type SearchResult } from "../tools/web-search";
import type { Env } from "../types";

export interface GroundedSearchBundle {
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
}

export interface GroundingValidationResult {
  isValid: boolean;
  citationCount: number;
  minimumRequired: number;
  missingCitations: string[];
  warnings: string[];
}

/** Minimum citation requirements per phase */
const MINIMUM_CITATIONS: Record<string, number> = {
  "market-research": 5,
  "competitive-intel": 3,
  "customer-intel": 3,
};

/**
 * Run targeted searches for a phase and return structured search bundles
 * to inject into the agent's user prompt.
 */
export async function groundPhaseWithSearch(
  env: Env,
  phase: "market-research" | "competitive-intel" | "customer-intel",
  idea: string,
  searchQueries: string[]
): Promise<GroundedSearchBundle[]> {
  const bundles: GroundedSearchBundle[] = [];

  for (const query of searchQueries) {
    try {
      const results = await webSearch(query, env, {
        maxResults: 6,
        searchDepth: phase === "market-research" ? "advanced" : "basic",
        deduplicate: true,
      });

      bundles.push({
        query,
        results: results
          .filter((r) => r.url && r.url !== "")
          .slice(0, 5)
          .map((r: SearchResult) => ({
            title: r.title,
            url: r.url,
            snippet: r.content?.slice(0, 400) ?? "",
          })),
      });
    } catch (e) {
      console.warn(`[research-grounding] Search failed for query "${query}":`, e);
    }
  }

  return bundles;
}

/**
 * Format search bundles into a prompt section that can be injected
 * directly into an agent's user message.
 */
export function formatGroundingContext(bundles: GroundedSearchBundle[]): string {
  if (bundles.length === 0) {
    return "⚠️ No search results available. Set TAVILY_API_KEY or BRAVE_API_KEY for grounded research.";
  }

  const lines: string[] = [
    "=== LIVE SEARCH RESULTS (cite these URLs in your output) ===",
    "",
  ];

  for (const bundle of bundles) {
    lines.push(`Query: "${bundle.query}"`);
    for (const r of bundle.results) {
      lines.push(`  - [${r.title}](${r.url})`);
      if (r.snippet) lines.push(`    ${r.snippet}`);
    }
    lines.push("");
  }

  lines.push("=== END SEARCH RESULTS ===");
  lines.push("");
  lines.push(
    "CITATION REQUIREMENT: Every market size claim, competitor data point, and customer insight " +
      "MUST reference one of the URLs above. Add a `citations` array to your output with: " +
      '{ claim: "what you are asserting", url: "source URL", date: "date accessed" }. ' +
      "Claims without citations will be flagged as hallucinations during audit."
  );

  return lines.join("\n");
}

/**
 * Validate that a phase output contains the minimum required citations.
 * Returns validation result with specific missing citation warnings.
 */
export function validateCitations(
  phase: string,
  output: Record<string, unknown>
): GroundingValidationResult {
  const minimumRequired = MINIMUM_CITATIONS[phase] ?? 0;
  const citations = (output["citations"] as unknown[] | undefined) ?? [];
  const citationCount = Array.isArray(citations) ? citations.length : 0;

  const missingCitations: string[] = [];
  const warnings: string[] = [];

  if (minimumRequired > 0 && citationCount < minimumRequired) {
    missingCitations.push(
      `Phase ${phase} requires at least ${minimumRequired} citations but found ${citationCount}`
    );
  }

  // Check for specific required fields that should have citations
  if (phase === "market-research") {
    const marketSize = output["marketSize"] as Record<string, unknown> | undefined;
    if (marketSize?.tam && !marketSize?.tamSource) {
      warnings.push("TAM figure present but tamSource URL is missing");
    }
    if (marketSize?.sam && !marketSize?.samSource) {
      warnings.push("SAM figure present but samSource URL is missing");
    }
    const pricingLandscape = output["pricingLandscape"] as unknown[] | undefined;
    if (!pricingLandscape || pricingLandscape.length < 3) {
      warnings.push("Market research requires at least 3 competitors in pricingLandscape");
    }
  }

  if (phase === "competitive-intel") {
    const competitors = output["competitors"] as unknown[] | undefined;
    if (!competitors || competitors.length === 0) {
      warnings.push("No competitors found — competitive intel must include real competitors");
    }
  }

  return {
    isValid: citationCount >= minimumRequired,
    citationCount,
    minimumRequired,
    missingCitations,
    warnings,
  };
}

/**
 * Standard citation schema to inject into agent system prompts.
 * Tells the LLM exactly what citation format is required.
 */
export const CITATION_SCHEMA_PROMPT = `
MANDATORY CITATION REQUIREMENTS:
Your output MUST include a "citations" array. Each citation must have:
{
  "claim": "The specific claim you are making (e.g., 'TAM is $4.2B by 2027')",
  "url": "The source URL from the search results above",
  "date": "${new Date().toISOString().split("T")[0]}",
  "confidence": "high | medium | low"
}

DO NOT fabricate URLs. Only cite URLs that appear in the search results provided.
Mark claims you cannot source as confidence: "low" and add a note in the claim: "UNSOURCED - estimated".
Minimum required citations: See phase requirements above.
`;
