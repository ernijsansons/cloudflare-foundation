/**
 * Factory Endpoints Integration Tests
 *
 * Tests the full request flow: UI → Gateway → Planning Service
 * Covers happy paths and error scenarios for factory endpoints.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Env } from "../../types";
import publicRoutes from "../public";

describe("Factory Endpoints Integration Tests", () => {
	let mockEnv: Partial<Env>;
	let planningService: NonNullable<Env["PLANNING_SERVICE"]>;
	let mockDB: D1Database;

	beforeEach(() => {
		planningService = {
			fetch: vi.fn(),
			connect: vi.fn(),
		} as unknown as NonNullable<Env["PLANNING_SERVICE"]>;

		// Mock D1 database for audit logging
		mockDB = {
			prepare: vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					first: vi.fn().mockResolvedValue(null),
					run: vi.fn().mockResolvedValue({ success: true }),
					all: vi.fn().mockResolvedValue({ results: [] }),
				}),
			}),
		} as unknown as D1Database;

		mockEnv = {
			PLANNING_SERVICE: planningService,
			CONTEXT_SIGNING_KEY: "test-signing-key-min-32-chars-long-for-hmac",
			DB: mockDB,
		};

		vi.clearAllMocks();
	});

	describe("GET /api/public/factory/templates", () => {
		it("should proxy templates request to planning service and return data", async () => {
			const mockTemplates = {
				items: [
					{
						id: "1",
						slug: "cloudflare-workers-api",
						name: "Cloudflare Workers API",
						description: "Simple API template",
						category: "api",
						framework: "hono",
						source: "cloudflare",
						complexity: 2,
						estimatedCostLow: 0,
						estimatedCostMid: 5,
						estimatedCostHigh: 20,
						bindings: ["d1_databases"],
						tags: ["api", "rest"],
						deprecated: false,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
				total: 1,
			};

			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify(mockTemplates), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/templates",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as typeof mockTemplates;
			expect(data).toEqual(mockTemplates);
			expect(data.items).toHaveLength(1);
			expect(data.items[0].slug).toBe("cloudflare-workers-api");
		});

		it("should handle planning service unavailable (503)", async () => {
			// Simulate planning service being unavailable
			const envWithoutService: Partial<Env> = {
				CONTEXT_SIGNING_KEY: "test-signing-key-min-32-chars-long-for-hmac",
			};

			const response = await publicRoutes.request(
				"http://localhost/factory/templates",
				{ method: "GET" },
				envWithoutService as Env
			);

			expect(response.status).toBe(503);
			const data = (await response.json()) as { error: string };
			expect(data.error).toBe("Planning service not configured");
		});

		it("should include tenant_id query parameter when proxying", async () => {
			let forwardedUrl: string | null = null;

			(planningService.fetch as any).mockImplementation(async (request: Request) => {
				forwardedUrl = request.url;
				return new Response(JSON.stringify({ items: [], total: 0 }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			});

			await publicRoutes.request(
				"http://localhost/factory/templates?tenant_id=custom-tenant",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(forwardedUrl).toBeTruthy();
			expect(forwardedUrl).toContain("tenant_id=custom-tenant");
		});
	});

	describe("GET /api/public/factory/capabilities", () => {
		it("should proxy capabilities request and return data", async () => {
			const mockCapabilities = {
				items: [
					{
						id: "1",
						slug: "d1",
						name: "D1 Database",
						description: "SQLite database",
						bindingType: "d1_databases",
						hasFreeQuota: true,
						freeQuota: "5M reads/day, 5GB storage",
						paidPricing: "$0.75/M reads",
						bestFor: ["structured-data", "relational"],
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
				total: 1,
			};

			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify(mockCapabilities), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/capabilities",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as typeof mockCapabilities;
			expect(data).toEqual(mockCapabilities);
			expect(data.items[0].slug).toBe("d1");
		});
	});

	describe("GET /api/public/factory/build-specs", () => {
		it("should proxy build specs list request", async () => {
			const mockBuildSpecs = {
				buildSpecs: [
					{
						id: "spec-1",
						runId: "run-123",
						recommended: {
							slug: "cloudflare-workers-api",
							name: "Cloudflare Workers API",
							score: 95,
							reasoning: "Best fit for API project",
							bindings: [],
							estimatedCost: { bootstrap: 0, growth: 5, scale: 20 },
							motionTier: "none",
							complexity: 2,
							tradeoffs: [],
						},
						alternatives: [],
						dataModel: { tables: [], indexes: [], migrations: [] },
						apiRoutes: [],
						frontend: null,
						agents: [],
						freeWins: [],
						growthPath: null,
						scaffoldCommand: "npm create cloudflare@latest",
						totalEstimatedMonthlyCost: { bootstrap: 0, growth: 5, scale: 20 },
						status: "draft",
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				],
				pagination: { limit: 50, offset: 0, count: 1 },
			};

			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify(mockBuildSpecs), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/build-specs",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as typeof mockBuildSpecs;
			expect(data.buildSpecs).toHaveLength(1);
			expect(data.buildSpecs[0].runId).toBe("run-123");
		});

		it("should support limit query parameter", async () => {
			let forwardedUrl: string | null = null;

			(planningService.fetch as any).mockImplementation(async (request: Request) => {
				forwardedUrl = request.url;
				return new Response(
					JSON.stringify({ buildSpecs: [], pagination: { limit: 10, offset: 0, count: 0 } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			});

			await publicRoutes.request(
				"http://localhost/factory/build-specs?limit=10",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(forwardedUrl).toBeTruthy();
			expect(forwardedUrl).toContain("limit=10");
		});
	});

	describe("GET /api/public/factory/build-specs/:runId", () => {
		it("should proxy build spec detail request", async () => {
			const mockBuildSpec = {
				id: "spec-1",
				runId: "run-123",
				recommended: {
					slug: "cloudflare-workers-api",
					name: "Cloudflare Workers API",
					score: 95,
					reasoning: "Best fit for API project",
					bindings: [],
					estimatedCost: { bootstrap: 0, growth: 5, scale: 20 },
					motionTier: "none",
					complexity: 2,
					tradeoffs: [],
				},
				alternatives: [],
				dataModel: { tables: [], indexes: [], migrations: [] },
				apiRoutes: [],
				frontend: null,
				agents: [],
				freeWins: [],
				growthPath: null,
				scaffoldCommand: "npm create cloudflare@latest",
				totalEstimatedMonthlyCost: { bootstrap: 0, growth: 5, scale: 20 },
				status: "draft",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify(mockBuildSpec), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/build-specs/run-123",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as typeof mockBuildSpec;
			expect(data.runId).toBe("run-123");
			expect(data.recommended.slug).toBe("cloudflare-workers-api");
		});

		it("should return 404 when build spec not found", async () => {
			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify({ error: "BuildSpec not found for this run" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/build-specs/nonexistent",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(404);
		});
	});

	describe("GET /api/public/factory/templates/:slug", () => {
		it("should proxy template detail request", async () => {
			const mockTemplate = {
				id: "1",
				slug: "cloudflare-workers-api",
				name: "Cloudflare Workers API",
				description: "Simple API template",
				category: "api",
				framework: "hono",
				source: "cloudflare",
				complexity: 2,
				estimatedCostLow: 0,
				estimatedCostMid: 5,
				estimatedCostHigh: 20,
				bindings: ["d1_databases"],
				tags: ["api", "rest"],
				deprecated: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify(mockTemplate), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/templates/cloudflare-workers-api",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(200);
			const data = (await response.json()) as typeof mockTemplate;
			expect(data.slug).toBe("cloudflare-workers-api");
		});

		it("should return 404 when template not found", async () => {
			(planningService.fetch as any).mockResolvedValue(
				new Response(JSON.stringify({ error: "Template not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/templates/nonexistent-template",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(404);
		});
	});

	describe("Context Token (Inter-Service Auth)", () => {
		it("should include X-Context-Token header when proxying", async () => {
			let forwardedRequest: Request | undefined;

			(planningService.fetch as any).mockImplementation(async (request: Request) => {
				forwardedRequest = request;
				return new Response(JSON.stringify({ items: [], total: 0 }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			});

			await publicRoutes.request(
				"http://localhost/factory/templates",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(forwardedRequest).toBeTruthy();
			const contextToken = forwardedRequest?.headers.get("X-Context-Token");
			expect(contextToken).toBeTruthy();
			expect(contextToken).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/); // JWT format
		});
	});

	describe("Error Handling", () => {
		it("should handle planning service errors gracefully", async () => {
			(planningService.fetch as any).mockRejectedValue(new Error("Service timeout"));

			const response = await publicRoutes.request(
				"http://localhost/factory/templates",
				{ method: "GET" },
				mockEnv as Env
			);

			expect(response.status).toBe(503);
			const data = (await response.json()) as { error: string };
			expect(data.error).toBe("Planning service unavailable");
		});

		it("should handle malformed responses from planning service", async () => {
			(planningService.fetch as any).mockResolvedValue(
				new Response("invalid json", {
					status: 200,
					headers: { "Content-Type": "application/json" },
				})
			);

			const response = await publicRoutes.request(
				"http://localhost/factory/templates",
				{ method: "GET" },
				mockEnv as Env
			);

			// Should pass through the response as-is (proxy behavior)
			expect(response.status).toBe(200);
		});
	});
});
