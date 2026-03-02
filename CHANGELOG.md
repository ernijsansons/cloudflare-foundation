# Changelog

All notable changes to cloudflare-foundation-dev will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Cron run ledger (`cron_run_ledger` table) for fail-closed audit trail of scheduled jobs
- `GET /api/cron/runs` endpoint to query cron execution history
- `GET /api/cron/health` endpoint for monitoring cron job health
- `withAuditTrail()` utility for wrapping cron jobs with automatic start/complete/fail recording
- Structured JSON logging with correlation IDs for all cron runs

### Changed
- Upgraded Cloudflare Agents SDK from 0.5.0 to 0.7.1
- Upgraded `@cloudflare/ai-chat` from 0.1.2 to 0.1.7 (peer dependency)
- Upgraded `zod` from 3.23.0 to 3.25.0 (peer dependency)
- Cron handlers now record every execution (success and failure) to D1

### Notes
- Gateway service remains on `agents@0.0.73` intentionally (lightweight MCP routing only)
- New features in agents 0.7.x (diagnostics channel, keepAlive, waitForMcpConnections) are available but not yet adopted
