export interface RateLimiter {
	check: (key: string) => boolean;
	fail: (key: string) => void;
	reset: (key: string) => void;
}

export function createRateLimiter(maxAttempts = 10, windowMs = 10 * 60 * 1000): RateLimiter {
	const attempts = new Map<string, number[]>();
	return {
		check(key) {
			const now = Date.now();
			const hits = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
			attempts.set(key, hits);
			return hits.length < maxAttempts;
		},
		fail(key) {
			const hits = attempts.get(key) ?? [];
			hits.push(Date.now());
			attempts.set(key, hits);
		},
		reset(key) {
			attempts.delete(key);
		}
	};
}

export const loginRateLimiter = createRateLimiter();
