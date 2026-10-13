import { describe, expect, it } from 'vitest';
import { isDbConfigured } from '../../src/lib/health';

describe('isDbConfigured', () => {
	it('false when no url anywhere', () => {
		expect(isDbConfigured(undefined, undefined)).toBe(false);
	});

	it('true when platform env url set', () => {
		expect(isDbConfigured('postgresql://x', undefined)).toBe(true);
	});

	it('true when local url set', () => {
		expect(isDbConfigured(undefined, 'postgresql://x')).toBe(true);
	});
});
