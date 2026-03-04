# General Rules

## Project Identity
cloudflare-foundation-dev is a 10-plane serverless monorepo built on Cloudflare Workers.

## Branch Conventions
- Feature: `agent/run_<date>_<sequence>`
- Commit: `run: <run_id> - <short objective>`

## Extension Strategy
All new code goes in NEW files. Existing files only get:
- New import statements
- New route registrations (append to index)
- New export statements (append to barrel exports)

## Documentation
- Update docs when code changes affect documented behavior
- Keep comments minimal and meaningful
- No auto-generated docstrings unless explicitly requested

## When to Stop
- Change needed outside allowed_paths → stop, request approval
- Schema migration required → stop, request approval
- Auth/billing logic change → stop, request approval
- 3 consecutive check failures → stop, write BLOCKED report
- Missing credentials → stop, report

## Three D1 Databases (NEVER mix them)
| Database | Used By | Migrations |
|----------|---------|------------|
| foundation-primary | gateway, agents, workflows | services/gateway/migrations/ |
| planning-primary | planning-machine | services/planning-machine/migrations/ |
| agent-control-primary | run-api (Actor 2) | services/run-api/migrations/ |
