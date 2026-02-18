/**
 * Multi-model reviewer — Mistral reviews, tiebreaker on conflict
 */

import { runModel } from "./model-router";
import { UNIVERSAL_RUBRIC_DIMENSIONS } from "./reasoning-engine";

export type ReviewVerdict = "ACCEPT" | "REVISE" | "REJECT";

/**
 * Extract JSON from text more robustly
 * Handles markdown code blocks and finds balanced braces
 */
function extractJSON(text: string): string | null {
  // First, try to find JSON in markdown code block
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) {
    const content = mdMatch[1].trim();
    if (content.startsWith("{") && content.endsWith("}")) {
      return content;
    }
  }

  // Find the first complete JSON object with balanced braces
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export interface ReviewResult {
  verdict: ReviewVerdict;
  scores: Record<string, number>;
  feedback: string;
  iteration: number;
}

const UNIVERSAL_RUBRIC = UNIVERSAL_RUBRIC_DIMENSIONS.join(", ");

export async function reviewArtifact(
  ai: Ai,
  phase: string,
  artifactContent: string,
  phaseRubric: string[],
  iteration: number = 1
): Promise<ReviewResult> {
  const rubric = phaseRubric.length > 0
    ? `${UNIVERSAL_RUBRIC}. Phase-specific: ${phaseRubric.join(", ")}`
    : UNIVERSAL_RUBRIC;

  const prompt = `You are a strict reviewer. Evaluate this ${phase} artifact.

Universal rubric dimensions (0-10 each): ${UNIVERSAL_RUBRIC}
${phaseRubric.length > 0 ? `Phase-specific: ${phaseRubric.join(", ")}` : ""}

Artifact:
${artifactContent.slice(0, 8000)}

Score each dimension 0-10. Then give verdict:
- ACCEPT: all dimensions >= 7
- REVISE: any dimension < 7 but >= 4
- REJECT: any dimension < 4

Output JSON only:
{
  "scores": { "evidence_coverage": N, "factual_accuracy": N, "completeness": N, "actionability": N, "revenue_relevance": N },
  "verdict": "ACCEPT" | "REVISE" | "REJECT",
  "feedback": "Specific feedback for improvement if REVISE or REJECT"
}`;

  const response = await runModel(ai, "reviewer", [
    { role: "system", content: "You output ONLY valid JSON. No markdown, no extra text." },
    { role: "user", content: prompt },
  ], {
    temperature: 0.1,
    maxTokens: 1024,
  });

  // Extract JSON using robust parser
  const jsonStr = extractJSON(response);

  if (!jsonStr) {
    console.warn("Reviewer: Could not extract JSON from response:", response.slice(0, 200));
    return {
      verdict: "REVISE",
      scores: {},
      feedback: "Could not extract JSON from reviewer response. Defaulting to REVISE.",
      iteration,
    };
  }

  try {
    const parsed = JSON.parse(jsonStr) as {
      scores?: Record<string, number>;
      verdict?: string;
      feedback?: string;
    };
    const verdict = (parsed.verdict ?? "REVISE") as ReviewVerdict;
    const scores = parsed.scores ?? {};
    const feedback = parsed.feedback ?? "";

    return {
      verdict: ["ACCEPT", "REVISE", "REJECT"].includes(verdict) ? verdict : "REVISE",
      scores,
      feedback,
      iteration,
    };
  } catch (e) {
    console.warn("Reviewer: JSON parse failed:", e, "JSON string:", jsonStr.slice(0, 200));
    return {
      verdict: "REVISE",
      scores: {},
      feedback: "Could not parse reviewer response JSON. Defaulting to REVISE.",
      iteration,
    };
  }
}

export async function tiebreakerReview(
  ai: Ai,
  phase: string,
  artifactContent: string,
  priorFeedback: string
): Promise<ReviewVerdict> {
  const prompt = `You are the tiebreaker. The reviewer said REVISE after multiple rounds with this feedback: ${priorFeedback}

Artifact (excerpt):
${artifactContent.slice(0, 4000)}

Should we ACCEPT (artifact is good enough) or REJECT (needs major revision)? Output ONLY: ACCEPT or REJECT`;

  const response = await runModel(ai, "tiebreaker", [
    { role: "user", content: prompt },
  ], {
    temperature: 0.1,
    maxTokens: 64,
  });

  const upper = response.trim().toUpperCase();
  if (upper.includes("ACCEPT")) return "ACCEPT";
  if (upper.includes("REJECT")) return "REJECT";
  return "REVISE";
}
