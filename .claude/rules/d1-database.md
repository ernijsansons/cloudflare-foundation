---
paths:
  - "packages/db/**"
  - "**/migrations/**"
  - "**/schema/**"
---

# D1 Database Rules

## Drizzle ORM
- Use sqliteTable from drizzle-orm/sqlite-core
- Export all tables from packages/db/schema/index.ts
- Use typed enums for status fields

## Schema Design
- snake_case for column names
- TEXT for IDs (UUIDs as strings)
- INTEGER for timestamps (Unix milliseconds)
- Use proper foreign key references

## Migrations
- Sequential numbering: 0000, 0001, 0002...
- Descriptive names: 0012_agent_runs.sql
- NEVER modify existing migrations (0000-0011 for gateway, 0000-0006 for planning)
- Include indexes for frequently queried columns

## Queries
- ALWAYS use .bind() for parameterized queries
- Use .all() for multiple rows, .first() for single
- Handle null results explicitly
- Batch related operations in transactions

## Two Separate Databases
- foundation-primary: gateway, agents, workflows
- planning-primary: planning-machine only
- NEVER cross-query between databases
