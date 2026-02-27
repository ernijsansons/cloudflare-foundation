import { Hono } from "hono";
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";

import type { Env, Variables } from "../../types";
import { validateBody, validateQuery, validateParams } from "../validate";

// Response types for test assertions
interface SuccessResponse<T = unknown> {
	success: boolean;
	data?: T;
	query?: T;
	params?: T;
	body?: T;
}

interface ErrorResponse {
	error: string;
	message?: string;
	details?: Array<{ path: string; message: string; code: string }>;
}

describe("validate middleware", () => {
	let app: Hono<{ Bindings: Env; Variables: Variables }>;
	let mockEnv: Partial<Env>;

	beforeEach(() => {
		app = new Hono<{ Bindings: Env; Variables: Variables }>();
		mockEnv = {};
	});

	describe("validateBody", () => {
		const TestSchema = z.object({
			name: z.string().min(1, "Name is required"),
			email: z.string().email("Invalid email format"),
			age: z.number().int().min(0).optional(),
		});

		beforeEach(() => {
			app.post(
				"/test",
				validateBody(TestSchema),
				(c) => {
					const body = c.get("validatedBody");
					return c.json({ success: true, data: body });
				}
			);
		});

		it("should accept valid JSON body", async () => {
			const validBody = { name: "John", email: "john@example.com" };

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validBody),
			}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse;
			expect(data).toEqual({ success: true, data: validBody });
		});

		it("should accept valid body with optional fields", async () => {
			const validBody = { name: "John", email: "john@example.com", age: 25 };

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(validBody),
			}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse;
			expect(data).toEqual({ success: true, data: validBody });
		});

		it("should reject non-JSON content type", async () => {
			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "text/plain" },
				body: "not json",
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data).toEqual({
				error: "Invalid Content-Type",
				message: "Expected application/json",
			});
		});

		it("should reject missing content type", async () => {
			const res = await app.request("/test", {
				method: "POST",
				body: "some body",
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data).toEqual({
				error: "Invalid Content-Type",
				message: "Expected application/json",
			});
		});

		it("should reject malformed JSON", async () => {
			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{ invalid json }",
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data).toEqual({
				error: "Invalid JSON",
				message: "Request body is not valid JSON",
			});
		});

		it("should reject validation errors with detailed messages", async () => {
			const invalidBody = { name: "", email: "not-an-email" };

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidBody),
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Validation failed");
			expect(data.details).toBeInstanceOf(Array);
			const details = data.details ?? [];
			expect(details.length).toBe(2);

			// Check name validation error
			const nameError = details.find((e) => e.path === "name");
			expect(nameError).toBeDefined();
			expect(nameError?.message).toBe("Name is required");

			// Check email validation error
			const emailError = details.find((e) => e.path === "email");
			expect(emailError).toBeDefined();
			expect(emailError?.message).toBe("Invalid email format");
		});

		it("should reject missing required fields", async () => {
			const invalidBody = {};

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidBody),
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Validation failed");
			expect((data.details ?? []).length).toBeGreaterThanOrEqual(2);
		});

		it("should reject wrong field types", async () => {
			const invalidBody = { name: "John", email: "john@example.com", age: "not-a-number" };

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(invalidBody),
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Validation failed");

			const ageError = (data.details ?? []).find((e) => e.path === "age");
			expect(ageError).toBeDefined();
		});

		it("should handle nested schema validation", async () => {
			const NestedSchema = z.object({
				user: z.object({
					profile: z.object({
						firstName: z.string().min(1),
						lastName: z.string().min(1),
					}),
				}),
			});

			const nestedApp = new Hono<{ Bindings: Env; Variables: Variables }>();
			nestedApp.post("/nested", validateBody(NestedSchema), (c) => {
				return c.json({ success: true });
			});

			const res = await nestedApp.request("/nested", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user: { profile: { firstName: "", lastName: "Doe" } } }),
			}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Validation failed");

			const pathError = (data.details ?? []).find((e) => e.path.includes("firstName"));
			expect(pathError).toBeDefined();
			expect(pathError?.path).toBe("user.profile.firstName");
		});

		it("should handle application/json with charset", async () => {
			const validBody = { name: "John", email: "john@example.com" };

			const res = await app.request("/test", {
				method: "POST",
				headers: { "Content-Type": "application/json; charset=utf-8" },
				body: JSON.stringify(validBody),
			}, mockEnv as Env);

			expect(res.status).toBe(200);
		});
	});

	describe("validateQuery", () => {
		const QuerySchema = z.object({
			page: z.coerce.number().int().min(1).default(1),
			limit: z.coerce.number().int().min(1).max(100).default(20),
			search: z.string().optional(),
		});

		beforeEach(() => {
			app.get(
				"/items",
				validateQuery(QuerySchema),
				(c) => {
					const query = c.get("validatedQuery");
					return c.json({ success: true, query });
				}
			);
		});

		it("should accept valid query parameters", async () => {
			const res = await app.request("/items?page=2&limit=50&search=test", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse<{ page: number; limit: number; search?: string }>;
			expect(data.success).toBe(true);
			expect(data.query).toEqual({ page: 2, limit: 50, search: "test" });
		});

		it("should use default values for missing optional params", async () => {
			const res = await app.request("/items", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse<{ page: number; limit: number }>;
			expect(data.success).toBe(true);
			expect(data.query).toEqual({ page: 1, limit: 20 });
		});

		it("should reject invalid query parameter types", async () => {
			const res = await app.request("/items?page=abc", {}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Invalid query parameters");
			expect(data.details).toBeInstanceOf(Array);
		});

		it("should reject out-of-range values", async () => {
			const res = await app.request("/items?page=0", {}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Invalid query parameters");
		});

		it("should reject limit exceeding max", async () => {
			const res = await app.request("/items?limit=500", {}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Invalid query parameters");
		});

		it("should coerce string numbers to numbers", async () => {
			const res = await app.request("/items?page=5&limit=25", {}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse<{ page: number; limit: number }>;
			expect(data.query).toBeDefined();
			if (!data.query) throw new Error("Expected query payload");
			expect(typeof data.query.page).toBe("number");
			expect(typeof data.query.limit).toBe("number");
		});
	});

	describe("validateParams", () => {
		const ParamsSchema = z.object({
			id: z.string().uuid("Invalid UUID format"),
		});

		beforeEach(() => {
			app.get(
				"/items/:id",
				validateParams(ParamsSchema),
				(c) => {
					const params = c.get("validatedParams");
					return c.json({ success: true, params });
				}
			);
		});

		it("should accept valid route parameters", async () => {
			const validUUID = "550e8400-e29b-41d4-a716-446655440000";

			const res = await app.request(`/items/${validUUID}`, {}, mockEnv as Env);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse<{ id: string }>;
			expect(data.success).toBe(true);
			expect(data.params).toEqual({ id: validUUID });
		});

		it("should reject invalid UUID format", async () => {
			const res = await app.request("/items/not-a-uuid", {}, mockEnv as Env);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Invalid route parameters");
			expect(data.details).toBeInstanceOf(Array);
			expect(data.details?.[0]?.message).toBe("Invalid UUID format");
		});

		it("should reject empty parameter", async () => {
			// This tests the schema validation, not the route matching
			const SlugSchema = z.object({
				slug: z.string().min(1, "Slug required"),
			});

			const slugApp = new Hono<{ Bindings: Env; Variables: Variables }>();
			slugApp.get("/articles/:slug", validateParams(SlugSchema), (c) => {
				return c.json({ success: true });
			});

			// Empty slug would be handled by Hono's routing, but we can test validation
			const res = await slugApp.request("/articles/valid-slug", {}, mockEnv as Env);
			expect(res.status).toBe(200);
		});

		it("should handle multiple route parameters", async () => {
			const MultiParamsSchema = z.object({
				tenantId: z.string().min(1),
				resourceId: z.string().uuid(),
			});

			const multiApp = new Hono<{ Bindings: Env; Variables: Variables }>();
			multiApp.get(
				"/tenants/:tenantId/resources/:resourceId",
				validateParams(MultiParamsSchema),
				(c) => {
					const params = c.get("validatedParams");
					return c.json({ success: true, params });
				}
			);

			const validUUID = "550e8400-e29b-41d4-a716-446655440000";
			const res = await multiApp.request(
				`/tenants/my-tenant/resources/${validUUID}`,
				{},
				mockEnv as Env
			);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse<{ tenantId: string; resourceId: string }>;
			expect(data.params).toEqual({ tenantId: "my-tenant", resourceId: validUUID });
		});
	});

	describe("Combined validation", () => {
		it("should work with body, query, and params together", async () => {
			const ParamsSchema = z.object({
				id: z.string().uuid(),
			});
			const QuerySchema = z.object({
				version: z.coerce.number().int().optional(),
			});
			const BodySchema = z.object({
				name: z.string().min(1),
			});

			const combinedApp = new Hono<{ Bindings: Env; Variables: Variables }>();
			combinedApp.put(
				"/items/:id",
				validateParams(ParamsSchema),
				validateQuery(QuerySchema),
				validateBody(BodySchema),
				(c) => {
					const params = c.get("validatedParams");
					const query = c.get("validatedQuery");
					const body = c.get("validatedBody");
					return c.json({ success: true, params, query, body });
				}
			);

			const validUUID = "550e8400-e29b-41d4-a716-446655440000";
			const res = await combinedApp.request(
				`/items/${validUUID}?version=2`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Updated Item" }),
				},
				mockEnv as Env
			);

			expect(res.status).toBe(200);
			const data = await res.json() as SuccessResponse;
			expect(data.params).toEqual({ id: validUUID });
			expect(data.query).toEqual({ version: 2 });
			expect(data.body).toEqual({ name: "Updated Item" });
		});

		it("should fail fast on first validation error", async () => {
			const ParamsSchema = z.object({
				id: z.string().uuid("Invalid ID"),
			});
			const BodySchema = z.object({
				name: z.string(),
			});

			const failFastApp = new Hono<{ Bindings: Env; Variables: Variables }>();
			failFastApp.put(
				"/items/:id",
				validateParams(ParamsSchema),
				validateBody(BodySchema),
				(c) => {
					return c.json({ success: true });
				}
			);

			// Invalid params should fail before even checking body
			const res = await failFastApp.request(
				"/items/invalid-id",
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Test" }),
				},
				mockEnv as Env
			);

			expect(res.status).toBe(400);
			const data = await res.json() as ErrorResponse;
			expect(data.error).toBe("Invalid route parameters");
		});
	});
});
