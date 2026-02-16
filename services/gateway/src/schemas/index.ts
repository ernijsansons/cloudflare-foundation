/**
 * Zod validation schemas for request payloads.
 * Provides type-safe validation with detailed error messages.
 */
import { z } from "zod";

// =============================================================================
// Analytics Events
// =============================================================================

/** Schema for analytics event submissions */
export const AnalyticsEventSchema = z.object({
  event: z
    .string()
    .min(1, "Event name is required")
    .max(100, "Event name must be less than 100 characters"),
  tenantId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  value: z.number().optional(),
  timestamp: z.number().optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// =============================================================================
// Webhook Destinations
// =============================================================================

/** Schema for webhook destination registration */
export const WebhookDestinationSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z
    .string()
    .default("*")
    .describe("Comma-separated event types or '*' for all"),
  secret: z
    .string()
    .min(16, "Secret must be at least 16 characters")
    .optional(),
});

export type WebhookDestination = z.infer<typeof WebhookDestinationSchema>;

// =============================================================================
// File Uploads
// =============================================================================

/** Allowed MIME types for file uploads */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
] as const;

/** Schema for file upload metadata validation */
export const FileUploadMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must be less than 255 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Filename contains invalid characters"),
  contentType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: "File type not allowed" }),
  }),
  size: z
    .number()
    .max(10 * 1024 * 1024, "File size must be less than 10MB"),
});

export type FileUploadMetadata = z.infer<typeof FileUploadMetadataSchema>;

// =============================================================================
// Workflow Dispatch
// =============================================================================

/** Schema for workflow dispatch requests */
export const WorkflowDispatchSchema = z.object({
  workflowName: z
    .string()
    .min(1, "Workflow name is required")
    .max(100, "Workflow name must be less than 100 characters"),
  params: z.record(z.unknown()).optional(),
});

export type WorkflowDispatch = z.infer<typeof WorkflowDispatchSchema>;

// =============================================================================
// Planning Run
// =============================================================================

/** Schema for planning run creation */
export const PlanningRunSchema = z.object({
  idea: z
    .string()
    .min(10, "Idea must be at least 10 characters")
    .max(5000, "Idea must be less than 5000 characters"),
  mode: z.enum(["local", "cloud"]).default("cloud"),
  config: z.record(z.unknown()).optional(),
});

export type PlanningRun = z.infer<typeof PlanningRunSchema>;

// =============================================================================
// Tenant Operations
// =============================================================================

/** Schema for tenant creation/update */
export const TenantSchema = z.object({
  name: z
    .string()
    .min(1, "Tenant name is required")
    .max(100, "Tenant name must be less than 100 characters"),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  settings: z.record(z.unknown()).optional(),
});

export type Tenant = z.infer<typeof TenantSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate data against a schema and return formatted errors.
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success status and either data or errors
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors = result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  );
  return { success: false, errors };
}
