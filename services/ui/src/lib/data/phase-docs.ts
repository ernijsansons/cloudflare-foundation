import type { PhaseName, PhaseDocumentation } from "$lib/types";

export const phaseDocs: Record<PhaseName, PhaseDocumentation> = {
  opportunity: {
    title: "Opportunity Analysis",
    purpose: "Refine the raw idea into validated opportunities with market potential",
    inputs: ["Raw idea description", "Initial context"],
    outputs: ["Refined opportunities array", "Key insight", "Recommended opportunity index", "Unknown factors to investigate"],
    successCriteria: ["3+ refined opportunity variants", "Clear recommendation with rationale", "Identified unknowns for next phases"],
  },
  "customer-intel": {
    title: "Customer Intelligence",
    purpose: "Build detailed customer profiles, pain points, and jobs-to-be-done",
    inputs: ["Refined opportunity", "Market context"],
    outputs: ["Customer segments", "Pain points per segment", "Jobs to be done", "Buying triggers"],
    successCriteria: ["3+ customer segments identified", "Specific pain points with severity", "Clear value proposition per segment"],
  },
  "market-research": {
    title: "Market Research",
    purpose: "Analyze market size, trends, and dynamics for the opportunity",
    inputs: ["Refined opportunity", "Customer segments"],
    outputs: ["TAM/SAM/SOM estimates", "Market trends", "Growth projections", "Regulatory factors"],
    successCriteria: ["Sourced market size estimates", "Identified growth drivers", "Clear market timing assessment"],
  },
  "competitive-intel": {
    title: "Competitive Intelligence",
    purpose: "Map the competitive landscape and identify positioning opportunities",
    inputs: ["Market research", "Customer segments"],
    outputs: ["Competitor matrix", "Positioning gaps", "Competitive advantages", "Threats and moats"],
    successCriteria: ["5+ competitors analyzed", "Clear differentiation strategy", "Identified market gaps"],
  },
  "kill-test": {
    title: "Kill Test",
    purpose: "Critical evaluation to KILL, PIVOT, or CONTINUE the opportunity",
    inputs: ["All discovery phase outputs"],
    outputs: ["Verdict (KILL/PIVOT/CONTINUE)", "Risk assessment", "Critical blockers", "Pivot suggestions if applicable"],
    successCriteria: ["Clear verdict with rationale", "Quantified risk factors", "Actionable next steps"],
  },
  "revenue-expansion": {
    title: "Revenue Expansion",
    purpose: "Identify revenue streams, pricing models, and expansion opportunities",
    inputs: ["Validated opportunity", "Customer segments", "Competitive intel"],
    outputs: ["Revenue model options", "Pricing strategies", "Expansion vectors", "Revenue projections"],
    successCriteria: ["Multiple revenue streams identified", "Pricing validated against market", "Clear path to profitability"],
  },
  strategy: {
    title: "Strategy",
    purpose: "Define the overall business strategy and competitive positioning",
    inputs: ["Revenue model", "Market research", "Competitive intel"],
    outputs: ["Strategic pillars", "Positioning statement", "Key differentiators", "Strategic milestones"],
    successCriteria: ["Clear strategic direction", "Defensible positioning", "Measurable milestones"],
  },
  "business-model": {
    title: "Business Model",
    purpose: "Design the complete business model and unit economics",
    inputs: ["Strategy", "Revenue model", "Customer segments"],
    outputs: ["Business model canvas", "Unit economics", "Cost structure", "Key partnerships"],
    successCriteria: ["Positive unit economics", "Clear value chain", "Identified key resources"],
  },
  "product-design": {
    title: "Product Design",
    purpose: "Define product features, MVP scope, and product roadmap",
    inputs: ["Business model", "Customer intel", "Strategy"],
    outputs: ["Feature prioritization", "MVP definition", "Product roadmap", "User flows"],
    successCriteria: ["MVP scope clearly defined", "Features mapped to customer needs", "Realistic development timeline"],
  },
  "gtm-marketing": {
    title: "Go-to-Market & Marketing",
    purpose: "Plan the go-to-market strategy and marketing approach",
    inputs: ["Product design", "Customer segments", "Positioning"],
    outputs: ["GTM strategy", "Marketing channels", "Launch plan", "Customer acquisition model"],
    successCriteria: ["Clear launch strategy", "CAC estimates by channel", "First 100 customer plan"],
  },
  "content-engine": {
    title: "Content Engine",
    purpose: "Design the content strategy for acquisition and engagement",
    inputs: ["GTM strategy", "Customer segments", "Positioning"],
    outputs: ["Content pillars", "Content calendar", "SEO strategy", "Distribution channels"],
    successCriteria: ["Content mapped to funnel stages", "Clear content differentiation", "Measurable content KPIs"],
  },
  "tech-arch": {
    title: "Technical Architecture",
    purpose: "Define the technical architecture and infrastructure requirements",
    inputs: ["Product design", "Business model", "Scale projections"],
    outputs: ["System architecture", "Tech stack recommendations", "Infrastructure plan", "Security considerations"],
    successCriteria: ["Scalable architecture", "Clear build vs buy decisions", "Security requirements met"],
  },
  analytics: {
    title: "Analytics & Metrics",
    purpose: "Define the metrics framework and analytics strategy",
    inputs: ["Business model", "GTM strategy", "Product design"],
    outputs: ["KPI framework", "Analytics implementation plan", "Dashboard specifications", "Experimentation plan"],
    successCriteria: ["Clear success metrics", "Attribution model defined", "Data infrastructure planned"],
  },
  "launch-execution": {
    title: "Launch Execution",
    purpose: "Create the detailed launch plan and execution timeline",
    inputs: ["All prior phase outputs"],
    outputs: ["Launch checklist", "Timeline with milestones", "Resource allocation", "Risk mitigation plan"],
    successCriteria: ["Comprehensive launch checklist", "Dependencies mapped", "Contingency plans in place"],
  },
  synthesis: {
    title: "Synthesis",
    purpose: "Consolidate all insights into an actionable business plan",
    inputs: ["All phase outputs"],
    outputs: ["Executive summary", "Full business plan", "Investment thesis", "Next actions"],
    successCriteria: ["Coherent narrative", "All sections aligned", "Clear call to action"],
  },
};

// Get all phases in order
export const PHASE_ORDER: PhaseName[] = [
  "opportunity",
  "customer-intel",
  "market-research",
  "competitive-intel",
  "kill-test",
  "revenue-expansion",
  "strategy",
  "business-model",
  "product-design",
  "gtm-marketing",
  "content-engine",
  "tech-arch",
  "analytics",
  "launch-execution",
  "synthesis",
];

// Get phase index (1-15)
export function getPhaseIndex(phase: PhaseName): number {
  return PHASE_ORDER.indexOf(phase) + 1;
}

// Get phase by index (1-15)
export function getPhaseByIndex(index: number): PhaseName | undefined {
  return PHASE_ORDER[index - 1];
}
