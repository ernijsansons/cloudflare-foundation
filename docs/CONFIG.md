# Configuration Reference

## Environment Variables

### Required Secrets

These must be set via `wrangler secret put <NAME>`:

| Name | Description | How to Generate |
|------|-------------|-----------------|
| `CONTEXT_SIGNING_KEY` | JWT signing key | `openssl rand -base64 32` |
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret | Cloudflare Dashboard |

### Optional Secrets

| Name | Description | Default |
|------|-------------|---------|
| `BRAVE_API_KEY` | Brave Search API key | None |
| `TAVILY_API_KEY` | Tavily Search API key | None |

## Cloudflare Bindings

### D1 Databases

| Binding | Database Name | Description |
|---------|---------------|-------------|
| `DB` | `foundation-primary` | Main application database |

### KV Namespaces

| Binding | Description | Preview ID Required |
|---------|-------------|---------------------|
| `RATE_LIMIT_KV` | IP-based rate limiting | Yes |
| `SESSION_KV` | Session storage | Yes |
| `CACHE_KV` | General caching | Yes |

### R2 Buckets

| Binding | Bucket Name | Description |
|---------|-------------|-------------|
| `FILES` | `foundation-files` | File uploads |

### Queues

| Binding | Queue Name | Description |
|---------|------------|-------------|
| `AUDIT_QUEUE` | `foundation-audit` | Audit events |
| `NOTIFICATION_QUEUE` | `foundation-notifications` | Notifications |
| `ANALYTICS_QUEUE` | `foundation-analytics` | Analytics events |
| `WEBHOOK_QUEUE` | `foundation-webhooks` | Webhook delivery |

### Service Bindings

| Binding | Service | Description |
|---------|---------|-------------|
| `AGENT_SERVICE` | `foundation-agents` | Durable Object agents |
| `PLANNING_SERVICE` | `foundation-planning-machine` | Planning machine |

### Workflow Bindings

| Binding | Class | Description |
|---------|-------|-------------|
| `ONBOARDING_WORKFLOW` | `TenantOnboardingWorkflow` | Onboarding flow |
| `DATA_PIPELINE_WORKFLOW` | `DataPipelineWorkflow` | Data processing |
| `REPORT_WORKFLOW` | `ReportGenerationWorkflow` | Report generation |
| `EMAIL_WORKFLOW` | `EmailSequenceWorkflow` | Email sequences |

### AI Bindings

| Binding | Description |
|---------|-------------|
| `AI` | Workers AI |
| `ANALYTICS` | Analytics Engine |
| `VECTOR_INDEX` | Vectorize index |
| `IMAGES` | Cloudflare Images |

## wrangler.jsonc Configuration

Example configuration for the gateway service:

```jsonc
{
  "name": "foundation-gateway",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "foundation-primary",
      "database_id": "YOUR_D1_ID"
    }
  ],

  "kv_namespaces": [
    {
      "binding": "RATE_LIMIT_KV",
      "id": "YOUR_KV_ID",
      "preview_id": "YOUR_PREVIEW_KV_ID"
    }
  ],

  "r2_buckets": [
    {
      "binding": "FILES",
      "bucket_name": "foundation-files"
    }
  ],

  "services": [
    {
      "binding": "AGENT_SERVICE",
      "service": "foundation-agents"
    }
  ],

  "queues": {
    "producers": [
      { "binding": "AUDIT_QUEUE", "queue": "foundation-audit" }
    ]
  }
}
```

## Constants

Application constants are defined in `src/constants.ts`:

```typescript
// Rate limiting
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const RATE_LIMIT_DO_WINDOW_MS = 60_000;
export const RATE_LIMIT_DO_MAX_REQUESTS = 100;
export const RATE_LIMIT_MAX_HISTORY = 1000;

// File uploads
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILENAME_LENGTH = 255;
export const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain", "application/json"
];

// Timeouts
export const TURNSTILE_TIMEOUT_MS = 5000;
export const FETCH_DEFAULT_TIMEOUT_MS = 10000;

// JWT
export const JWT_EXPIRATION_SECONDS = 1800; // 30 minutes

// Request limits
export const MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024; // 10MB

// Data retention
export const DATA_RETENTION_SECONDS = 90 * 24 * 60 * 60; // 90 days
```

## Setup Script

Run the setup script to create all required resources:

```bash
./scripts/setup-all.sh
```

This will:
1. Create D1 databases
2. Create KV namespaces
3. Create R2 buckets
4. Create queues
5. Run database migrations
6. Output environment variable values

## Validation

Before deployment, run the validation script:

```bash
./scripts/validate-config.sh
```

This checks:
- All required bindings are configured
- No placeholder IDs remain
- All secrets are set
- Database migrations are applied

## .env.example

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then fill in the values from your Cloudflare dashboard or setup script output.
