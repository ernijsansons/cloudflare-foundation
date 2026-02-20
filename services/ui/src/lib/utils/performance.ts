/**
 * Performance Monitoring Utilities
 *
 * Provides utilities for measuring and reporting performance metrics:
 * - Core Web Vitals (LCP, FID, CLS)
 * - Custom timing metrics
 * - Resource loading times
 */

export interface PerformanceMetric {
	name: string;
	value: number;
	rating: 'good' | 'needs-improvement' | 'poor';
	timestamp: number;
}

export interface WebVitalsMetrics {
	lcp?: PerformanceMetric; // Largest Contentful Paint
	fid?: PerformanceMetric; // First Input Delay
	cls?: PerformanceMetric; // Cumulative Layout Shift
	fcp?: PerformanceMetric; // First Contentful Paint
	ttfb?: PerformanceMetric; // Time to First Byte
}

// Thresholds based on Core Web Vitals recommendations
const THRESHOLDS = {
	lcp: { good: 2500, poor: 4000 },
	fid: { good: 100, poor: 300 },
	cls: { good: 0.1, poor: 0.25 },
	fcp: { good: 1800, poor: 3000 },
	ttfb: { good: 800, poor: 1800 }
};

/**
 * Get rating for a metric value
 */
function getRating(
	name: keyof typeof THRESHOLDS,
	value: number
): 'good' | 'needs-improvement' | 'poor' {
	const threshold = THRESHOLDS[name];
	if (value <= threshold.good) return 'good';
	if (value <= threshold.poor) return 'needs-improvement';
	return 'poor';
}

/**
 * Create a performance metric object
 */
function createMetric(name: string, value: number): PerformanceMetric {
	return {
		name,
		value,
		rating: getRating(name as keyof typeof THRESHOLDS, value),
		timestamp: Date.now()
	};
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function measureLCP(callback: (metric: PerformanceMetric) => void): void {
	if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

	try {
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };

			const value = lastEntry.renderTime || lastEntry.loadTime || 0;
			callback(createMetric('lcp', value));
		});

		observer.observe({ type: 'largest-contentful-paint', buffered: true });
	} catch (error) {
		console.error('Error measuring LCP:', error);
	}
}

/**
 * Measure First Input Delay (FID)
 */
export function measureFID(callback: (metric: PerformanceMetric) => void): void {
	if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

	try {
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const firstInput = entries[0] as PerformanceEntry & { processingStart?: number };

			if (firstInput.processingStart) {
				const value = firstInput.processingStart - firstInput.startTime;
				callback(createMetric('fid', value));
			}
		});

		observer.observe({ type: 'first-input', buffered: true });
	} catch (error) {
		console.error('Error measuring FID:', error);
	}
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS(callback: (metric: PerformanceMetric) => void): void {
	if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

	let clsValue = 0;
	let sessionValue = 0;
	let sessionEntries: PerformanceEntry[] = [];

	try {
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };

				if (!layoutShiftEntry.hadRecentInput) {
					const firstSessionEntry = sessionEntries[0];
					const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

					if (
						sessionValue &&
						entry.startTime - lastSessionEntry.startTime < 1000 &&
						entry.startTime - firstSessionEntry.startTime < 5000
					) {
						sessionValue += layoutShiftEntry.value || 0;
						sessionEntries.push(entry);
					} else {
						sessionValue = layoutShiftEntry.value || 0;
						sessionEntries = [entry];
					}

					if (sessionValue > clsValue) {
						clsValue = sessionValue;
						callback(createMetric('cls', clsValue));
					}
				}
			}
		});

		observer.observe({ type: 'layout-shift', buffered: true });
	} catch (error) {
		console.error('Error measuring CLS:', error);
	}
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function measureFCP(callback: (metric: PerformanceMetric) => void): void {
	if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

	try {
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

			if (fcpEntry) {
				callback(createMetric('fcp', fcpEntry.startTime));
			}
		});

		observer.observe({ type: 'paint', buffered: true });
	} catch (error) {
		console.error('Error measuring FCP:', error);
	}
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function measureTTFB(callback: (metric: PerformanceMetric) => void): void {
	if (typeof window === 'undefined') return;

	try {
		const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

		if (navigationEntry) {
			const value = navigationEntry.responseStart - navigationEntry.requestStart;
			callback(createMetric('ttfb', value));
		}
	} catch (error) {
		console.error('Error measuring TTFB:', error);
	}
}

/**
 * Initialize all Web Vitals monitoring
 */
export function initWebVitals(callback: (metrics: WebVitalsMetrics) => void): () => void {
	const metrics: WebVitalsMetrics = {};

	measureLCP((metric) => {
		metrics.lcp = metric;
		callback(metrics);
	});

	measureFID((metric) => {
		metrics.fid = metric;
		callback(metrics);
	});

	measureCLS((metric) => {
		metrics.cls = metric;
		callback(metrics);
	});

	measureFCP((metric) => {
		metrics.fcp = metric;
		callback(metrics);
	});

	measureTTFB((metric) => {
		metrics.ttfb = metric;
		callback(metrics);
	});

	// Return cleanup function (currently no cleanup needed)
	return () => {
		// Future: disconnect observers if needed
	};
}

/**
 * Measure custom timing
 */
export function measureTiming(name: string, startTime: number): PerformanceMetric {
	const duration = Date.now() - startTime;
	return {
		name,
		value: duration,
		rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
		timestamp: Date.now()
	};
}

/**
 * Log performance metrics to console (development)
 */
export function logMetrics(metrics: WebVitalsMetrics): void {
	if (import.meta.env.DEV) {
		console.group('Performance Metrics');

		if (metrics.lcp) {
			console.log(`LCP: ${metrics.lcp.value.toFixed(2)}ms [${metrics.lcp.rating}]`);
		}
		if (metrics.fid) {
			console.log(`FID: ${metrics.fid.value.toFixed(2)}ms [${metrics.fid.rating}]`);
		}
		if (metrics.cls) {
			console.log(`CLS: ${metrics.cls.value.toFixed(4)} [${metrics.cls.rating}]`);
		}
		if (metrics.fcp) {
			console.log(`FCP: ${metrics.fcp.value.toFixed(2)}ms [${metrics.fcp.rating}]`);
		}
		if (metrics.ttfb) {
			console.log(`TTFB: ${metrics.ttfb.value.toFixed(2)}ms [${metrics.ttfb.rating}]`);
		}

		console.groupEnd();
	}
}

/**
 * Send performance metrics to analytics endpoint
 */
export async function reportMetrics(metrics: WebVitalsMetrics): Promise<void> {
	if (import.meta.env.PROD) {
		try {
			await fetch('/api/analytics/performance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(metrics)
			});
		} catch (error) {
			console.error('Failed to report performance metrics:', error);
		}
	}
}
