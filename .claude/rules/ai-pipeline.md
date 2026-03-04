---
paths:
  - "services/planning-machine/**"
  - "**/agents/**"
  - "**/ai/**"
---

# AI Pipeline Rules

## Agent Pattern
- Extend Agent<Env, State> from agents SDK
- Define initialState with sensible defaults
- Implement validateStateChange() for state guards
- Use this.setState() for state updates

## Workflows
- Use step.do() for durable execution steps
- Structured retries: { retries: { max: N, backoff: "exponential" } }
- Emit webhook events in separate steps
- Never modify state outside of steps

## Workers AI
- Use AI binding for inference
- Respect rate limits and token budgets
- Cache responses where appropriate
- Log token usage for cost tracking

## AI Gateway
- Route through AI Gateway for observability
- Enable caching for repeated queries
- Track costs per tenant/run

## Phase Agents (Planning Machine)
- Each phase has a dedicated agent class
- Validate phase output with Zod schemas
- Record quality scores per phase
- Support revision loop (max 3 iterations)

## MCP Integration
- Use RPC transport for same-Worker connections
- HTTP transport only for cross-Worker or external
- Implement elicitation for user confirmations
