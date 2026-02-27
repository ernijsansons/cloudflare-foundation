import { describe, expect, it, vi } from "vitest";

import type { Env } from "../../types";
import factoryRoutes from "../factory";

describe("factory routes forwarding", () => {
	it("forwards build-specs query params as URL search params", async () => {
		let forwardedUrl: string | null = null;

		const planningService = {
			fetch: vi.fn(async (request: Request) => {
				forwardedUrl = request.url;
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
			connect: vi.fn(),
		} as unknown as NonNullable<Env["PLANNING_SERVICE"]>;

		const env = { PLANNING_SERVICE: planningService } as Partial<Env>;
		const response = await factoryRoutes.request(
			"http://localhost/build-specs?limit=5&offset=2&status=fallback&tenant_id=tenant_123&evil=%3Cscript%3E",
			{ method: "GET" },
			env as Env
		);

		expect(response.status).toBe(200);
		expect(forwardedUrl).toBeTruthy();

		const forwarded = new URL(forwardedUrl ?? "http://invalid");
		expect(forwarded.pathname).toBe("/api/factory/build-specs");
		expect(forwarded.pathname.includes("%3F")).toBe(false);
		expect(forwarded.searchParams.get("limit")).toBe("5");
		expect(forwarded.searchParams.get("offset")).toBe("2");
		expect(forwarded.searchParams.get("status")).toBe("fallback");
		expect(forwarded.searchParams.get("tenant_id")).toBe("tenant_123");
		expect(forwarded.searchParams.has("evil")).toBe(false);
	});

	it("forwards only validated template query params", async () => {
		let forwardedUrl: string | null = null;

		const planningService = {
			fetch: vi.fn(async (request: Request) => {
				forwardedUrl = request.url;
				return new Response(JSON.stringify({ ok: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}),
			connect: vi.fn(),
		} as unknown as NonNullable<Env["PLANNING_SERVICE"]>;

		const env = { PLANNING_SERVICE: planningService } as Partial<Env>;
		const response = await factoryRoutes.request(
			"http://localhost/templates?category=api&framework=react&maxComplexity=3&includeDeprecated=true&tenant_id=tenant_abc&hack=true",
			{ method: "GET" },
			env as Env
		);

		expect(response.status).toBe(200);
		expect(forwardedUrl).toBeTruthy();

		const forwarded = new URL(forwardedUrl ?? "http://invalid");
		expect(forwarded.pathname).toBe("/api/factory/templates");
		expect(forwarded.searchParams.get("category")).toBe("api");
		expect(forwarded.searchParams.get("framework")).toBe("react");
		expect(forwarded.searchParams.get("maxComplexity")).toBe("3");
		expect(forwarded.searchParams.get("includeDeprecated")).toBe("true");
		expect(forwarded.searchParams.get("tenant_id")).toBe("tenant_abc");
		expect(forwarded.searchParams.has("hack")).toBe(false);
	});
});
