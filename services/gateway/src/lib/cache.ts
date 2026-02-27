/**
 * KV Caching Layer
 *
 * Provides a simple caching interface using Cloudflare KV.
 * Supports TTL, cache invalidation, and conditional caching.
 */

export interface CacheOptions {
	/**
	 * Time-to-live in seconds
	 */
	ttl?: number;

	/**
	 * Cache key prefix for namespacing
	 */
	prefix?: string;

	/**
	 * Whether to cache null/undefined values
	 */
	cacheNulls?: boolean;

	/**
	 * Custom cache key generator
	 */
	keyGenerator?: (...args: any[]) => string;
}

export interface CacheStats {
	hits: number;
	misses: number;
	sets: number;
	deletes: number;
	errors: number;
}

/**
 * Cache wrapper with statistics tracking
 */
export class KVCache {
	private kv: KVNamespace;
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		sets: 0,
		deletes: 0,
		errors: 0
	};

	constructor(kv: KVNamespace) {
		this.kv = kv;
	}

	/**
	 * Get value from cache
	 */
	async get<T>(key: string, options?: { prefix?: string }): Promise<T | null> {
		const fullKey = this.buildKey(key, options?.prefix);

		try {
			const value = await this.kv.get(fullKey, 'json');

			if (value !== null) {
				this.stats.hits++;
				return value as T;
			}

			this.stats.misses++;
			return null;
		} catch (error) {
			this.stats.errors++;
			console.error('Cache get error:', error);
			return null;
		}
	}

	/**
	 * Set value in cache
	 */
	async set<T>(
		key: string,
		value: T,
		options?: { ttl?: number; prefix?: string; cacheNulls?: boolean }
	): Promise<void> {
		// Skip caching null/undefined unless explicitly enabled
		if (!options?.cacheNulls && (value === null || value === undefined)) {
			return;
		}

		const fullKey = this.buildKey(key, options?.prefix);

		try {
			const kvOptions = options?.ttl ? { expirationTtl: options.ttl } : undefined;

			await this.kv.put(fullKey, JSON.stringify(value), kvOptions);
			this.stats.sets++;
		} catch (error) {
			this.stats.errors++;
			console.error('Cache set error:', error);
		}
	}

	/**
	 * Delete value from cache
	 */
	async delete(key: string, options?: { prefix?: string }): Promise<void> {
		const fullKey = this.buildKey(key, options?.prefix);

		try {
			await this.kv.delete(fullKey);
			this.stats.deletes++;
		} catch (error) {
			this.stats.errors++;
			console.error('Cache delete error:', error);
		}
	}

	/**
	 * Delete all keys with a specific prefix
	 */
	async deleteByPrefix(prefix: string): Promise<void> {
		try {
			// List all keys with prefix
			const list = await this.kv.list({ prefix });

			// Delete each key
			await Promise.all(list.keys.map((key) => this.kv.delete(key.name)));

			this.stats.deletes += list.keys.length;
		} catch (error) {
			this.stats.errors++;
			console.error('Cache delete by prefix error:', error);
		}
	}

	/**
	 * Get or set - fetch from cache, or execute function and cache result
	 */
	async getOrSet<T>(
		key: string,
		fetcher: () => Promise<T>,
		options?: CacheOptions
	): Promise<T> {
		// Try to get from cache first
		const cached = await this.get<T>(key, { prefix: options?.prefix });

		if (cached !== null) {
			return cached;
		}

		// Cache miss - fetch fresh data
		try {
			const fresh = await fetcher();

			// Cache the result
			await this.set(key, fresh, {
				ttl: options?.ttl,
				prefix: options?.prefix,
				cacheNulls: options?.cacheNulls
			});

			return fresh;
		} catch (error) {
			this.stats.errors++;
			throw error;
		}
	}

	/**
	 * Wrap a function with caching
	 */
	cached<Args extends any[], Result>(
		fn: (...args: Args) => Promise<Result>,
		options?: CacheOptions
	): (...args: Args) => Promise<Result> {
		return async (...args: Args): Promise<Result> => {
			// Generate cache key
			const key = options?.keyGenerator
				? options.keyGenerator(...args)
				: this.defaultKeyGenerator(fn.name, args);

			return this.getOrSet(key, () => fn(...args), options);
		};
	}

	/**
	 * Get cache statistics
	 */
	getStats(): CacheStats {
		return { ...this.stats };
	}

	/**
	 * Reset cache statistics
	 */
	resetStats(): void {
		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0,
			deletes: 0,
			errors: 0
		};
	}

	/**
	 * Build full cache key with prefix
	 */
	private buildKey(key: string, prefix?: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}

	/**
	 * Default cache key generator
	 */
	private defaultKeyGenerator(fnName: string, args: any[]): string {
		const argsKey = JSON.stringify(args);
		return `fn:${fnName}:${argsKey}`;
	}
}

/**
 * Cache TTL presets
 */
export const CACHE_TTL = {
	/** 1 minute */
	SHORT: 60,

	/** 5 minutes */
	MEDIUM: 300,

	/** 15 minutes */
	LONG: 900,

	/** 1 hour */
	HOUR: 3600,

	/** 1 day */
	DAY: 86400,

	/** 1 week */
	WEEK: 604800
} as const;

/**
 * Cache key builders for common patterns
 */
export const CacheKeys = {
	projectDocs: (projectId: string) => `project:${projectId}:docs`,
	projectDocsSection: (projectId: string, sectionId: string) =>
		`project:${projectId}:section:${sectionId}`,
	projectMetadata: (projectId: string) => `project:${projectId}:metadata`,
	userProfile: (userId: string) => `user:${userId}:profile`,
	apiResponse: (endpoint: string, params: Record<string, any>) =>
		`api:${endpoint}:${JSON.stringify(params)}`
} as const;

/**
 * Example usage:
 *
 * ```typescript
 * import { KVCache, CACHE_TTL, CacheKeys } from './lib/cache';
 *
 * const cache = new KVCache(env.CACHE_KV);
 *
 * // Get or fetch project documentation
 * const docs = await cache.getOrSet(
 *   CacheKeys.projectDocs(projectId),
 *   async () => {
 *     // Fetch from database
 *     return await db.query.projectDocs.findMany({ where: ... });
 *   },
 *   { ttl: CACHE_TTL.MEDIUM }
 * );
 *
 * // Wrap a function with caching
 * const getCachedUser = cache.cached(
 *   async (userId: string) => {
 *     return await db.query.users.findFirst({ where: { id: userId } });
 *   },
 *   {
 *     ttl: CACHE_TTL.HOUR,
 *     keyGenerator: (userId) => CacheKeys.userProfile(userId)
 *   }
 * );
 *
 * // Invalidate cache
 * await cache.delete(CacheKeys.projectDocs(projectId));
 * await cache.deleteByPrefix(`project:${projectId}`);
 * ```
 */
