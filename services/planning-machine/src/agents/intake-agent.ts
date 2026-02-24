/**
 * Phase 0: Intake Agent
 *
 * Interviews the user to populate Section A (Assumptions + Unknown Inputs)
 * This is the critical first step that defines constraints and success criteria
 * before any planning phases execute.
 *
 * Implements the A0-A7 intake form from the BULLETPROOF AGENTIC template.
 */

import type { Env } from "../types";
import { BaseAgent, type AgentContext, type AgentResult } from "./base-agent";
import { runModel } from "../lib/model-router";
import type { Unknowns, GlobalInvariants, SectionA } from "@foundation/shared";

export interface IntakeAgentInput {
  idea: string;
  mode?: "interactive" | "auto";
}

export interface IntakeAgentOutput {
  sectionA: SectionA;
  blockers: string[];
  ready_to_proceed: boolean;
}

const INTAKE_SYSTEM_PROMPT = `You are the Intake Agent for the BULLETPROOF AGENTIC Planning Machine. Your critical mission is to extract comprehensive structured information about a project idea to populate Section A (Assumptions + Unknown Inputs).

## Your Role

You conduct a thorough intake interview to capture:
- **A0: Idea Intake Form** - 7 subsections covering concept, outcomes, execution, data, constraints, monetization, success
- **A1: Required Unknowns** - Identify and resolve 5 critical unknowns (core directive, HITL threshold, tooling, memory, verification)
- **A2: Global Invariants** - Confirm fail-safe architectural principles

## Interview Strategy

1. **Start Broad**: Ask open-ended questions about the core idea
2. **Drill Deep**: For each A0 subsection, probe for specific details
3. **Identify Unknowns**: Flag anything missing or unclear as UNKNOWN
4. **Fail-Closed**: If critical unknowns aren't resolved, BLOCK progression

## Critical Success Criteria

✅ All A0.1-A0.7 fields populated with specific, actionable data
✅ All 5 A1 unknowns either RESOLVED or have concrete resolution plans
✅ A2 invariants confirmed
✅ Zero ambiguity - every field must be concrete, not generic

## A0 Intake Form Structure

### A0.1: Concept
- codename: unique project identifier
- thesis: one-sentence value proposition
- target_icp: specific role, company type, size
- core_directive: single highest-leverage autonomous task
- why_now: market/tech trigger

### A0.2: Outcome Unit
- definition: measurable, verifiable outcome
- proof_artifact: what gets produced as evidence
- time_to_first_outcome: latency target
- frequency: how often outcomes are delivered
- current_cost: status quo cost (time/$/risk)

### A0.3: Agentic Execution
- allowed_actions: explicit list of permitted operations
- forbidden_actions: hard constraints
- hitl_threshold: conditions requiring human approval
- required_integrations: external systems
- external_side_effects: emails, purchases, updates, etc.

### A0.4: Data & Trust
- input_sources: APIs/files/humans with licensing notes
- output_data_types: documents, messages, transactions
- data_sensitivity: PII/financial/health/minors classification
- retention_requirements: by data class
- ground_truth: what sources are considered authoritative

### A0.5: Constraints
- budget_cap: $/month
- timeline: weeks/months to MVP
- geography: market constraints
- compliance_bar: bootstrap/SOC2-ready/regulated
- performance_bar: latency, uptime, RPO/RTO

### A0.6: Monetization
- who_pays: user/boss/third party
- pricing_anchor: pricing model basis
- sales_motion: self-serve/sales-led/hybrid
- value_metric: per outcome/run/compute

### A0.7: Success & Kill Switches
- north_star: primary success metric
- supporting_metrics: secondary KPIs
- kill_conditions: 3 conditions that force KILL decision
- 30_day_done: 30-day success criteria
- 90_day_done: 90-day success criteria

## A1: Required Unknowns

You MUST resolve these 5 critical unknowns or BLOCK:

1. **core_directive**: The ONE autonomous task that matters
2. **hitl_threshold**: List of actions where mistakes are catastrophic
3. **tooling_data_gravity**: Which MCP servers/tools + CRUD actions required
4. **memory_horizon**: Minutes/days/months + what must persist
5. **verification_standard**: Sources + thresholds per claim/action

Mark each as:
- "RESOLVED" if fully defined
- "UNKNOWN" if missing (BLOCKS progression)
- Or provide the specific resolution

## A2: Global Invariants (Confirm All)

- no_raw_destructive_ops: true (LLM never executes raw operations)
- idempotent_side_effects: true (all side effects are idempotent)
- auditable_receipts: true (every action has a receipt)
- llm_gateway: "Cloudflare AI Gateway" (all LLM calls go through gateway)
- fail_closed: true (uncertainty → pause/escalate)

## Output Format

Return a structured JSON object matching the SectionA schema:

\`\`\`json
{
  "A0_intake": {
    "concept": { ... },
    "outcome_unit": { ... },
    "agentic_execution": { ... },
    "data_trust": { ... },
    "constraints": { ... },
    "monetization": { ... },
    "success_kill_switches": { ... }
  },
  "A1_unknowns": {
    "core_directive": "RESOLVED" | "UNKNOWN",
    "hitl_threshold": "RESOLVED" | "UNKNOWN",
    "tooling_data_gravity": "RESOLVED - Plaid + QuickBooks" | "UNKNOWN",
    "memory_horizon": "30 days - monthly cycles" | "UNKNOWN",
    "verification_standard": "Bank API + accounting match" | "UNKNOWN"
  },
  "A2_invariants": {
    "no_raw_destructive_ops": true,
    "idempotent_side_effects": true,
    "auditable_receipts": true,
    "llm_gateway": "Cloudflare AI Gateway",
    "fail_closed": true
  }
}
\`\`\`

## Interview Flow

1. **Opening**: "I'm the Intake Agent. I'll help you document your project idea comprehensively. Let's start with the core concept. What problem are you solving?"

2. **For each section**: Ask targeted questions to fill in blanks. Examples:
   - "Who specifically will use this? What's their role and company size?"
   - "What's the one autonomous task this agent will perform?"
   - "What happens if the agent makes a mistake? Where do we need human approval?"
   - "What data sources does this need access to? Do you have proper licensing?"
   - "What's your monthly budget cap for this project?"

3. **Validation**: Before finalizing, review all unknowns. If any are still UNKNOWN, ask follow-up questions or mark as BLOCKING.

4. **Confirmation**: "Based on our conversation, I've captured [summary]. Any corrections before we proceed?"

## Important Guidelines

- **Be thorough**: Missing data now causes failures later
- **Be specific**: Generic answers like "users" or "companies" are not acceptable
- **Probe for blockers**: If user can't answer something critical, mark it UNKNOWN and BLOCK
- **Never guess**: If information isn't provided, ask - don't make assumptions
- **Validate against template**: Every field in A0-A2 must be populated or marked UNKNOWN

Your goal: Produce a complete, unambiguous Section A that enables autonomous one-shot execution downstream.`;

export class IntakeAgent extends BaseAgent<IntakeAgentInput, IntakeAgentOutput> {
  config = {
    phase: "phase-0-intake",
    maxSelfIterations: 1,
    qualityThreshold: 8,
    hardQuestions: [
      "What is the ONE autonomous task this agent will perform?",
      "Where are human approvals absolutely required?",
      "What data sources need access?",
      "What is the monthly budget cap?",
      "What conditions would cause you to kill this project?",
    ],
    maxTokens: 4096,
    searchDepth: "basic" as const,
    includeFoundationContext: false,
  };

  constructor(env: Env) {
    super(env);
  }

  getSystemPrompt(): string {
    return INTAKE_SYSTEM_PROMPT;
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        A0_intake: { type: "object" },
        A1_unknowns: { type: "object" },
        A2_invariants: { type: "object" },
      },
      required: ["A0_intake", "A1_unknowns", "A2_invariants"],
    };
  }

  async run(
    ctx: AgentContext,
    input: IntakeAgentInput
  ): Promise<AgentResult<IntakeAgentOutput>> {
    try {
      const userPrompt = `Please help me complete the intake form for this project idea:

**Idea**: ${input.idea}

${input.mode === "auto" ? "Please make reasonable assumptions where specific details aren't provided, but mark critical unknowns as UNKNOWN if they're genuinely missing." : "Please ask me questions to fill out the complete intake form."}`;

      const systemPrompt = this.buildSystemPrompt();

      // Run model
      const response = await runModel(
        this.env.AI,
        "generator",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        {
          temperature: 0.3,
          maxTokens: 4096,
        }
      );

      // Parse output (includes validation)
      const output = await this.parseOutput(response, input);

      // IntakeAgent has custom validation in parseOutput,
      // so we don't use the generic schema validator

      return {
        success: true,
        output,
        score: output.blockers.length === 0 ? 10 : 5,
      };
    } catch (error) {
      console.error("IntakeAgent run failed:", error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private async parseOutput(
    content: string,
    _input: IntakeAgentInput
  ): Promise<IntakeAgentOutput> {
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch =
        content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
        content.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const sectionA = JSON.parse(jsonMatch[1]) as SectionA;

      // Validate required fields
      const blockers: string[] = [];

      if (!sectionA.A0_intake) {
        blockers.push("A0_intake section missing");
      } else {
        // Validate each A0 subsection
        if (!sectionA.A0_intake.concept?.core_directive) {
          blockers.push("Core directive not defined");
        }
        if (!sectionA.A0_intake.outcome_unit?.definition) {
          blockers.push("Outcome unit not defined");
        }
        if (!sectionA.A0_intake.agentic_execution?.allowed_actions?.length) {
          blockers.push("Allowed actions not defined");
        }
      }

      // Check A1 unknowns
      if (!sectionA.A1_unknowns) {
        blockers.push("A1_unknowns section missing");
      } else {
        const criticalUnknowns = [
          "core_directive",
          "hitl_threshold",
          "tooling_data_gravity",
          "memory_horizon",
          "verification_standard",
        ];
        for (const unknown of criticalUnknowns) {
          const value = sectionA.A1_unknowns[unknown as keyof Unknowns];
          if (value === "UNKNOWN") {
            blockers.push(`Critical unknown not resolved: ${unknown}`);
          }
        }
      }

      // Check A2 invariants
      if (!sectionA.A2_invariants) {
        blockers.push("A2_invariants section missing");
      } else {
        const requiredInvariants: (keyof GlobalInvariants)[] = [
          "no_raw_destructive_ops",
          "idempotent_side_effects",
          "auditable_receipts",
          "llm_gateway",
          "fail_closed",
        ];
        for (const invariant of requiredInvariants) {
          const invariantName = String(invariant);
          if (invariant === "llm_gateway") {
            if (!sectionA.A2_invariants[invariant]) {
              blockers.push(`Invariant not confirmed: ${invariantName}`);
            }
          } else if (!sectionA.A2_invariants[invariant]) {
            blockers.push(`Invariant not confirmed: ${invariantName}`);
          }
        }
      }

      return {
        sectionA,
        blockers,
        ready_to_proceed: blockers.length === 0,
      };
    } catch (error) {
      console.error("Failed to parse intake output:", error);
      throw new Error(
        `Invalid intake output format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
