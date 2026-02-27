/**
 * Seeded PRNG — Deterministic random number generation
 *
 * Uses the mulberry32 algorithm for reproducible random numbers.
 * Same seed always produces the same sequence of numbers.
 *
 * Use cases:
 * - Phase quality score variation (deterministic per run+phase)
 * - Training/test splits in ML (reproducible experiments)
 * - Any place where reproducibility is required
 */

/**
 * Simple hash function for string to number conversion
 *
 * @param str - Input string
 * @returns Non-negative integer hash
 */
function hashCode(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

/**
 * Mulberry32 PRNG — Fast, good distribution, 32-bit state
 *
 * @param seed - Initial seed value
 * @returns Function that returns values in [0, 1)
 */
function mulberry32(seed: number): () => number {
	return function () {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Create a seeded random number generator
 *
 * @param seed - Numeric seed for reproducibility
 * @returns Function that returns deterministic values in [0, 1)
 *
 * @example
 * const rng = createSeededRandom(12345);
 * console.log(rng()); // Always same value for seed 12345
 * console.log(rng()); // Always same second value
 */
export function createSeededRandom(seed: number): () => number {
	return mulberry32(seed);
}

/**
 * Generate seed from runId + phase for deterministic per-phase variation
 *
 * @param runId - Planning run UUID
 * @param phase - Phase name
 * @returns Numeric seed
 *
 * @example
 * const seed = generatePhaseSeed("abc-123", "opportunity");
 * // Same runId + phase always gives same seed
 */
export function generatePhaseSeed(runId: string, phase: string): number {
	return hashCode(`${runId}:${phase}`);
}

/**
 * Get deterministic variation in range [-range, +range]
 *
 * @param runId - Planning run UUID
 * @param phase - Phase name
 * @param index - Element index (for multiple values per phase)
 * @param range - Max absolute variation (default 5)
 * @returns Integer in range [-range, +range]
 *
 * @example
 * // Same inputs always give same output
 * const variation = getDeterministicVariation("abc-123", "opportunity", 0, 5);
 * // Returns value between -5 and +5 (inclusive)
 */
export function getDeterministicVariation(
	runId: string,
	phase: string,
	index: number,
	range: number = 5
): number {
	const seed = hashCode(`${runId}:${phase}:${index}`);
	const rng = mulberry32(seed);
	// Generate value in [-range, +range]
	return Math.floor(rng() * (range * 2 + 1)) - range;
}

/**
 * Seeded Fisher-Yates shuffle for deterministic array randomization
 *
 * @param array - Array to shuffle (not mutated)
 * @param seed - Seed string for reproducibility
 * @returns New shuffled array
 *
 * @example
 * const items = [1, 2, 3, 4, 5];
 * const shuffled = seededShuffle(items, "experiment-42");
 * // Same seed always gives same shuffle order
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
	const result = [...array];
	const rng = mulberry32(hashCode(seed));

	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}

/**
 * Seeded train/test split for ML reproducibility
 *
 * @param items - Array of items to split
 * @param testRatio - Fraction for test set (0-1)
 * @param seed - Seed string for reproducibility
 * @returns Object with train and test arrays
 *
 * @example
 * const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 * const { train, test } = seededTrainTestSplit(data, 0.2, "experiment-42");
 * // Same seed always gives same split
 */
export function seededTrainTestSplit<T>(
	items: T[],
	testRatio: number,
	seed: string
): { train: T[]; test: T[] } {
	const shuffled = seededShuffle(items, seed);
	const splitIndex = Math.floor(shuffled.length * (1 - testRatio));

	return {
		train: shuffled.slice(0, splitIndex),
		test: shuffled.slice(splitIndex),
	};
}
