/**
 * Query Parameter Validation — Whitelist-based parameter forwarding
 *
 * Security: Only forward explicitly allowed query parameters to prevent
 * injection attacks when proxying requests to downstream services.
 */

/**
 * Parameter validation configuration
 */
type ParamConfig =
	| { type: 'number'; min?: number; max?: number; default?: number }
	| { type: 'string'; maxLength?: number; pattern?: RegExp }
	| { type: 'enum'; values: readonly string[] };

type AllowedParams = Record<string, ParamConfig>;

/**
 * Allowed parameters for /api/factory/build-specs endpoint
 */
const BUILD_SPECS_PARAMS: AllowedParams = {
	limit: { type: 'number', min: 1, max: 100, default: 50 },
	offset: { type: 'number', min: 0, max: 10000, default: 0 },
	status: { type: 'enum', values: ['draft', 'approved', 'rejected', 'fallback'] },
} as const;

/**
 * Allowed parameters for /api/factory/templates endpoint
 */
const TEMPLATES_PARAMS: AllowedParams = {
	category: { type: 'string', maxLength: 50 },
	framework: { type: 'string', maxLength: 50 },
	maxComplexity: { type: 'number', min: 1, max: 5 },
	maxCostMid: { type: 'number', min: 0, max: 1000 },
	source: { type: 'enum', values: ['cloudflare', 'bible', 'community', 'custom'] },
	includeDeprecated: { type: 'enum', values: ['true', 'false'] },
	tags: { type: 'string', maxLength: 200 },
} as const;

/**
 * Validate and sanitize query parameters against whitelist
 *
 * @param url - Request URL
 * @param allowedParams - Parameter whitelist with validation rules
 * @returns Sanitized query string (without leading ?)
 */
export function validateQueryParams(url: URL, allowedParams: AllowedParams): string {
	const sanitized = new URLSearchParams();

	for (const [key, config] of Object.entries(allowedParams)) {
		const raw = url.searchParams.get(key);

		if (raw === null) {
			// Use default if provided (only for number type)
			if (config.type === 'number' && config.default !== undefined) {
				sanitized.set(key, String(config.default));
			}
			continue;
		}

		// Validate based on type
		switch (config.type) {
			case 'number': {
				const num = parseInt(raw, 10);
				if (isNaN(num)) continue;
				const min = config.min ?? -Infinity;
				const max = config.max ?? Infinity;
				const clamped = Math.max(min, Math.min(max, num));
				sanitized.set(key, String(clamped));
				break;
			}
			case 'string': {
				const maxLen = config.maxLength ?? 100;
				// Remove potentially dangerous characters
				const trimmed = raw
					.slice(0, maxLen)
					.trim()
					.replace(/[<>"'`;]/g, '');
				if (trimmed) {
					sanitized.set(key, trimmed);
				}
				break;
			}
			case 'enum': {
				if (config.values.includes(raw)) {
					sanitized.set(key, raw);
				}
				break;
			}
		}
	}

	return sanitized.toString();
}

/**
 * Build validated query string for /api/factory/build-specs endpoint
 */
export function validateBuildSpecsParams(url: URL): string {
	return validateQueryParams(url, BUILD_SPECS_PARAMS);
}

/**
 * Build validated query string for /api/factory/templates endpoint
 */
export function validateTemplatesParams(url: URL): string {
	return validateQueryParams(url, TEMPLATES_PARAMS);
}
