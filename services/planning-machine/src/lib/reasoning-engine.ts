/**
 * 5-Phase Deep Reasoning Protocol
 * Every agent follows: DECOMPOSE -> RESEARCH -> CHALLENGE -> SYNTHESIZE -> SELF-SCORE
 */

export type ReasoningPhase = "decompose" | "research" | "challenge" | "synthesize" | "self_score";

export interface SubQuestion {
  question: string;
  importance: "high" | "medium" | "low";
  uncertainty: "high" | "medium" | "low";
  revenueRelevance: "high" | "medium" | "low";
}

export interface Evidence {
  claim: string;
  sourceUrl?: string;
  sourceTitle?: string;
  snippet?: string;
  searchProvider?: string;
  evidenceScore: "VERIFIED" | "SUPPORTED" | "UNCERTAIN" | "UNSUPPORTED";
}

export interface ReasoningState {
  phase: ReasoningPhase;
  subQuestions: SubQuestion[];
  evidence: Evidence[];
  challenges: string[];
  synthesis?: string;
  selfScore?: number;
  iteration: number;
}

export const REASONING_PROTOCOL = `
PHASE 1 - DECOMPOSE (do not answer yet):
- Break the task into 15-20 specific sub-questions
- Rank by: (a) importance to revenue, (b) uncertainty, (c) customer impact
- Identify what you DO NOT KNOW — list explicit unknowns
- Ask: "What question am I NOT asking that I should be?"

PHASE 2 - RESEARCH (tools only, no synthesis):
- For each sub-question: 2+ search queries from different angles
- Use BOTH Tavily AND Brave — triangulate results
- Extract specific facts, numbers, quotes, URLs
- Record every source with retrieval date
- Flag: "I found conflicting information on X" — research the conflict

PHASE 3 - ADVERSARIAL CHALLENGE (argue against yourself):
- "What would a domain expert criticize about my findings?"
- "What am I assuming that might be wrong?"
- "What obvious competitor/risk/customer segment am I ignoring?"
- "If I were an investor, what would I challenge?"
- Research the challenges with MORE tool calls

PHASE 4 - SYNTHESIZE (now you can write):
- Only from evidence gathered in phases 2-3
- Every claim cites a source
- Confidence per section: HIGH, MEDIUM, LOW, UNKNOWN
- Evidence score per claim: VERIFIED / SUPPORTED / UNCERTAIN / UNSUPPORTED

PHASE 5 - SELF-SCORE (evaluate before submission):
- Score own output on the phase-specific rubric (0-10 per dimension)
- If ANY dimension < 7: identify the weakest area, loop back to Phase 2
- Up to 5 self-revision rounds before submitting to reviewer
`;

export const UNIVERSAL_RUBRIC_DIMENSIONS = [
  "evidence_coverage",
  "factual_accuracy",
  "completeness",
  "actionability",
  "revenue_relevance",
] as const;
