import { getConfig, isConfigured } from '../config.js';

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

// Retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 10000;
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export class CloudflareAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ code: number; message: string }>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'CloudflareAPIError';
  }
}

export interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: delay = initial * 2^attempt
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delay = exponentialDelay + jitter;
  // Cap at max delay
  return Math.min(delay, maxDelay);
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function cfFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  if (!isConfigured()) {
    throw new Error(
      'Cloudflare CLI not configured. Run: foundation config set --account-id <id> --api-token <token> --database-id <id>'
    );
  }

  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
  } = retryOptions;

  const config = getConfig();
  const url = `${CF_API_BASE}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = (await response.json()) as CloudflareResponse<T>;

      if (!data.success) {
        const isRetryable = RETRYABLE_STATUS_CODES.includes(response.status);
        const error = new CloudflareAPIError(
          data.errors?.[0]?.message ?? 'Unknown Cloudflare API error',
          response.status,
          data.errors,
          isRetryable
        );

        // If retryable and we have retries left, continue
        if (isRetryable && attempt < maxRetries) {
          lastError = error;
          const delay = calculateBackoff(attempt, initialDelayMs, maxDelayMs);
          console.error(
            `Request failed (${response.status}), retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          continue;
        }

        throw error;
      }

      return data.result;
    } catch (error) {
      // Network errors are retryable
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < maxRetries) {
          lastError = error as Error;
          const delay = calculateBackoff(attempt, initialDelayMs, maxDelayMs);
          console.error(
            `Network error, retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          continue;
        }
      }

      // Re-throw non-retryable errors immediately
      if (error instanceof CloudflareAPIError && !error.retryable) {
        throw error;
      }

      // For other errors, if we're out of retries, throw
      if (attempt === maxRetries) {
        throw lastError ?? error;
      }

      lastError = error as Error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError ?? new Error('Unexpected retry loop exit');
}

export function getAccountId(): string {
  const config = getConfig();
  if (!config.accountId) {
    throw new Error('Account ID not configured');
  }
  return config.accountId;
}

export function getDatabaseId(): string {
  const config = getConfig();
  if (!config.databaseId) {
    throw new Error('Database ID not configured');
  }
  return config.databaseId;
}
