/**
 * Consistent date formatting utilities
 * Backend timestamps are in SECONDS, not milliseconds
 */

/**
 * Format a Unix timestamp (seconds) as a localized date string
 */
export function formatDate(timestamp?: number | null): string {
  if (!timestamp) return "";
  // Convert seconds to milliseconds
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

/**
 * Format a Unix timestamp (seconds) as a localized date and time string
 */
export function formatDateTime(timestamp?: number | null): string {
  if (!timestamp) return "";
  // Convert seconds to milliseconds
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Format a Unix timestamp (seconds) as a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp?: number | null): string {
  if (!timestamp) return "";

  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

  return formatDate(timestamp);
}

/**
 * Format a Unix timestamp (seconds) as ISO 8601 string
 */
export function formatISODate(timestamp?: number | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}
