import type { Context, Next } from "hono";
import type { z } from "zod";

import type { Env, Variables } from "../types";

/**
 * Validation middleware factory for Zod schemas.
 *
 * Creates middleware that validates request bodies against a Zod schema.
 * On validation failure, returns 400 with detailed error messages.
 * On success, sets validated data on context via `c.set("validatedBody", data)`.
 *
 * @example
 * ```ts
 * import { validateBody } from "../middleware/validate";
 * import { PlanningRunSchema } from "../schemas";
 *
 * app.post("/api/runs", validateBody(PlanningRunSchema), async (c) => {
 *   const body = c.get("validatedBody"); // Type-safe validated data
 *   // ... handle request
 * });
 * ```
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
	return async (
		c: Context<{ Bindings: Env; Variables: Variables & { validatedBody: T } }>,
		next: Next
	) => {
		try {
			const contentType = c.req.header("Content-Type") || "";

			// Only validate JSON bodies
			if (!contentType.includes("application/json")) {
				return c.json(
					{
						error: "Invalid Content-Type",
						message: "Expected application/json",
					},
					400
				);
			}

			let body: unknown;
			try {
				body = await c.req.json();
			} catch {
				return c.json(
					{
						error: "Invalid JSON",
						message: "Request body is not valid JSON",
					},
					400
				);
			}

			const result = schema.safeParse(body);

			if (!result.success) {
				const errors = result.error.errors.map((err) => ({
					path: err.path.join(".") || "(root)",
					message: err.message,
					code: err.code,
				}));

				return c.json(
					{
						error: "Validation failed",
						details: errors,
					},
					400
				);
			}

			// Set validated data on context for route handler
			c.set("validatedBody", result.data);
			await next();
		} catch (error) {
			console.error("[VALIDATE] Unexpected error:", error);
			return c.json(
				{
					error: "Validation error",
					message: "An unexpected error occurred during validation",
				},
				500
			);
		}
	};
}

/**
 * Validation middleware factory for query parameters.
 *
 * Creates middleware that validates query parameters against a Zod schema.
 * On validation failure, returns 400 with detailed error messages.
 * On success, sets validated data on context via `c.set("validatedQuery", data)`.
 *
 * @example
 * ```ts
 * import { validateQuery } from "../middleware/validate";
 * import { z } from "zod";
 *
 * const QuerySchema = z.object({
 *   page: z.coerce.number().min(1).default(1),
 *   limit: z.coerce.number().min(1).max(100).default(20),
 * });
 *
 * app.get("/api/items", validateQuery(QuerySchema), async (c) => {
 *   const { page, limit } = c.get("validatedQuery");
 *   // ... handle request
 * });
 * ```
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
	return async (
		c: Context<{ Bindings: Env; Variables: Variables & { validatedQuery: T } }>,
		next: Next
	) => {
		try {
			const query = c.req.query();
			const result = schema.safeParse(query);

			if (!result.success) {
				const errors = result.error.errors.map((err) => ({
					path: err.path.join(".") || "(root)",
					message: err.message,
					code: err.code,
				}));

				return c.json(
					{
						error: "Invalid query parameters",
						details: errors,
					},
					400
				);
			}

			c.set("validatedQuery", result.data);
			await next();
		} catch (error) {
			console.error("[VALIDATE] Query validation error:", error);
			return c.json(
				{
					error: "Validation error",
					message: "An unexpected error occurred during query validation",
				},
				500
			);
		}
	};
}

/**
 * Validation middleware factory for route parameters.
 *
 * Creates middleware that validates route parameters against a Zod schema.
 * On validation failure, returns 400 with detailed error messages.
 * On success, sets validated data on context via `c.set("validatedParams", data)`.
 *
 * @example
 * ```ts
 * import { validateParams } from "../middleware/validate";
 * import { z } from "zod";
 *
 * const ParamsSchema = z.object({
 *   id: z.string().uuid("Invalid ID format"),
 * });
 *
 * app.get("/api/items/:id", validateParams(ParamsSchema), async (c) => {
 *   const { id } = c.get("validatedParams");
 *   // ... handle request
 * });
 * ```
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
	return async (
		c: Context<{ Bindings: Env; Variables: Variables & { validatedParams: T } }>,
		next: Next
	) => {
		try {
			const params = c.req.param();
			const result = schema.safeParse(params);

			if (!result.success) {
				const errors = result.error.errors.map((err) => ({
					path: err.path.join(".") || "(root)",
					message: err.message,
					code: err.code,
				}));

				return c.json(
					{
						error: "Invalid route parameters",
						details: errors,
					},
					400
				);
			}

			c.set("validatedParams", result.data);
			await next();
		} catch (error) {
			console.error("[VALIDATE] Params validation error:", error);
			return c.json(
				{
					error: "Validation error",
					message: "An unexpected error occurred during parameter validation",
				},
				500
			);
		}
	};
}
