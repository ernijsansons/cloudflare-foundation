import { describe, it, expect } from "vitest";
import {
  AnalyticsEventSchema,
  WebhookDestinationSchema,
  FileUploadMetadataSchema,
  PlanningRunSchema,
  validateWithErrors,
} from "../index";

describe("Validation Schemas", () => {
  describe("AnalyticsEventSchema", () => {
    it("should validate a valid analytics event", () => {
      const event = {
        event: "page_view",
        tenantId: "tenant-123",
        metadata: { page: "/home" },
        value: 1,
      };

      const result = AnalyticsEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should reject empty event name", () => {
      const event = { event: "" };
      const result = AnalyticsEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it("should reject event name exceeding max length", () => {
      const event = { event: "a".repeat(101) };
      const result = AnalyticsEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe("WebhookDestinationSchema", () => {
    it("should validate a valid webhook destination", () => {
      const webhook = {
        url: "https://example.com/webhook",
        events: "run_completed,phase_completed",
        secret: "a-secret-that-is-long-enough",
      };

      const result = WebhookDestinationSchema.safeParse(webhook);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URL", () => {
      const webhook = {
        url: "not-a-url",
        events: "*",
      };

      const result = WebhookDestinationSchema.safeParse(webhook);
      expect(result.success).toBe(false);
    });

    it("should reject secret shorter than 16 characters", () => {
      const webhook = {
        url: "https://example.com/webhook",
        secret: "short",
      };

      const result = WebhookDestinationSchema.safeParse(webhook);
      expect(result.success).toBe(false);
    });

    it("should use default events value", () => {
      const webhook = {
        url: "https://example.com/webhook",
      };

      const result = WebhookDestinationSchema.safeParse(webhook);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toBe("*");
      }
    });
  });

  describe("FileUploadMetadataSchema", () => {
    it("should validate valid file metadata", () => {
      const metadata = {
        filename: "document.pdf",
        contentType: "application/pdf",
        size: 1024 * 1024, // 1MB
      };

      const result = FileUploadMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it("should reject file exceeding size limit", () => {
      const metadata = {
        filename: "large-file.pdf",
        contentType: "application/pdf",
        size: 11 * 1024 * 1024, // 11MB
      };

      const result = FileUploadMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it("should reject unsupported content type", () => {
      const metadata = {
        filename: "script.exe",
        contentType: "application/x-executable",
        size: 1024,
      };

      const result = FileUploadMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it("should reject filename with invalid characters", () => {
      const metadata = {
        filename: "../../../etc/passwd",
        contentType: "text/plain",
        size: 100,
      };

      const result = FileUploadMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });
  });

  describe("PlanningRunSchema", () => {
    it("should validate a valid planning run", () => {
      const run = {
        idea: "Build a SaaS platform for managing team knowledge bases",
        mode: "cloud" as const,
      };

      const result = PlanningRunSchema.safeParse(run);
      expect(result.success).toBe(true);
    });

    it("should reject idea shorter than 10 characters", () => {
      const run = {
        idea: "Too short",
      };

      const result = PlanningRunSchema.safeParse(run);
      expect(result.success).toBe(false);
    });

    it("should use default mode", () => {
      const run = {
        idea: "Build a really cool application",
      };

      const result = PlanningRunSchema.safeParse(run);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe("cloud");
      }
    });
  });

  describe("validateWithErrors", () => {
    it("should return success with data for valid input", () => {
      const result = validateWithErrors(AnalyticsEventSchema, {
        event: "test",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.event).toBe("test");
      }
    });

    it("should return errors for invalid input", () => {
      const result = validateWithErrors(AnalyticsEventSchema, {
        event: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain("event: Event name is required");
      }
    });
  });
});
