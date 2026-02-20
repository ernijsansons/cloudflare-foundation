import type { Context, Next } from 'hono';
import type { Env } from '../types';
import { KVCache, CACHE_TTL } from '../lib/cache';

export interface CacheMiddlewareOptions {
	/**
	 * TTL in seconds
	 */
	ttl?: number;

	/**
	 * Cache key prefix
	 */
	prefix?: string;

	/**
	 * Custom cache key generator
	 */
	keyGenerator?: (c: Context) => string;

	/**
	 * Condition to determine if response should be cached
	 */
	shouldCache?: (c: Context, response: Response) => boolean;

	/**
	 * HTTP methods to cache (default: GET only)
	 */
	methods?: string[];

	/**
	 * Vary header support - cache different responses based on headers
	 */
	varyHeaders?: string[];
}

/**
 * Generate cache key from request
 */
function generateCacheKey(c: Context, options: CacheMiddlewareOptions): string {
	if (options.keyGenerator) {
		return options.keyGenerator(c);
	}

	const url = new URL(c.req.url);
	const method = c.req.method;

	// Base key: method + pathname + query
	let key = `${method}:${url.pathname}${url.search}`;

	// Add vary headers if specified
	if (options.varyHeaders && options.varyHeaders.length > 0) {
		const varyParts = options.varyHeaders
			.map((header) => {
				const value = c.req.header(header);
				return value ? `${header}:${value}` : '';
			})
			.filter(Boolean)
			.join('|');

		if (varyParts) {
			key += `|${varyParts}`;
		}
	}

	return key;
}

/**
 * Default condition - cache only successful GET responses
 */
function defaultShouldCache(c: Context, response: Response): boolean {
	return c.req.method === 'GET' && response.status === 200;
}

/**
 * Create cache middleware
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
	const {
		ttl = CACHE_TTL.MEDIUM,
		prefix = 'http-cache',
		methods = ['GET'],
		shouldCache = defaultShouldCache
	} = options;

	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		// Skip if cache KV not configured
		if (!c.env.CACHE_KV) {
			await next();
			return;
		}

		// Skip if method not cacheable
		if (!methods.includes(c.req.method)) {
			await next();
			return;
		}

		const cache = new KVCache(c.env.CACHE_KV);
		const cacheKey = generateCacheKey(c, options);

		// Try to get cached response
		const cached = await cache.get<{
			body: string;
			status: number;
			headers: Record<string, string>;
		}>(cacheKey, { prefix });

		if (cached) {
			// Return cached response
			const response = new Response(cached.body, {
				status: cached.status,
				headers: {
					...cached.headers,
					'X-Cache': 'HIT',
					'X-Cache-Key': cacheKey
				}
			});

			return response;
		}

		// Cache miss - execute handler
		await next();

		// Get the response
		const response = c.res;

		// Check if we should cache this response
		if (!shouldCache(c, response)) {
			return;
		}

		try {
			// Clone response to read body
			const clonedResponse = response.clone();
			const body = await clonedResponse.text();

			// Extract headers to cache
			const headers: Record<string, string> = {};
			clonedResponse.headers.forEach((value, key) => {
				// Skip cache control headers
				if (!key.toLowerCase().startsWith('x-cache')) {
					headers[key] = value;
				}
			});

			// Cache the response
			await cache.set(
				cacheKey,
				{
					body,
					status: response.status,
					headers
				},
				{ ttl, prefix }
			);

			// Add cache headers to original response
			c.res.headers.set('X-Cache', 'MISS');
			c.res.headers.set('X-Cache-Key', cacheKey);
		} catch (error) {
			console.error('Cache middleware error:', error);
			// Don't fail the request if caching fails
		}
	};
}

/**
 * Invalidate cache for a specific path
 */
export async function invalidateCache(
	kv: KVNamespace,
	path: string,
	options?: { prefix?: string }
): Promise<void> {
	const cache = new KVCache(kv);
	const prefix = options?.prefix || 'http-cache';
	const key = `GET:${path}`;

	await cache.delete(key, { prefix });
}

/**
 * Invalidate all cache entries with a prefix
 */
export async function invalidateCachePrefix(
	kv: KVNamespace,
	prefix: string
): Promise<void> {
	const cache = new KVCache(kv);
	await cache.deleteByPrefix(prefix);
}

/**
 * Example usage:
 *
 * ```typescript
 * import { Hono } from 'hono';
 * import { cacheMiddleware, CACHE_TTL } from './middleware/cache';
 *
 * const app = new Hono();
 *
 * // Cache all GET requests for 5 minutes
 * app.use('*', cacheMiddleware({ ttl: CACHE_TTL.MEDIUM }));
 *
 * // Cache specific routes with different TTLs
 * app.get(
 *   '/api/projects/:id/docs',
 *   cacheMiddleware({
 *     ttl: CACHE_TTL.LONG,
 *     prefix: 'project-docs',
 *     keyGenerator: (c) => {
 *       const projectId = c.req.param('id');
 *       return `project:${projectId}`;
 *     }
 *   }),
 *   async (c) => {
 *     // Handler logic
 *   }
 * );
 *
 * // Cache with vary headers (different cache per user)
 * app.get(
 *   '/api/user/profile',
 *   cacheMiddleware({
 *     ttl: CACHE_TTL.HOUR,
 *     varyHeaders: ['Authorization']
 *   }),
 *   async (c) => {
 *     // Handler logic
 *   }
 * );
 *
 * // Invalidate cache on mutations
 * app.put('/api/projects/:id/docs', async (c) => {
 *   // Update logic...
 *
 *   // Invalidate cache
 *   const projectId = c.req.param('id');
 *   await invalidateCache(
 *     c.env.CACHE_KV,
 *     `/api/projects/${projectId}/docs`
 *   );
 *
 *   return c.json({ success: true });
 * });
 * ```
 */
