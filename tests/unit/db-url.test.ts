import { describe, expect, it } from 'vitest';
import { sanitizeDatabaseUrl } from '../../src/lib/db-url';

describe('sanitizeDatabaseUrl', () => {
	it('strips channel_binding but keeps sslmode', () => {
		const out = sanitizeDatabaseUrl(
			'postgresql://u:p@host/db?sslmode=require&channel_binding=require'
		);
		expect(out).toContain('sslmode=require');
		expect(out).not.toContain('channel_binding');
	});

	it('leaves urls without the param untouched', () => {
		const url = 'postgresql://u:p@host/db?sslmode=require';
		expect(sanitizeDatabaseUrl(url)).toBe(url);
	});

	it('returns invalid input as-is', () => {
		expect(sanitizeDatabaseUrl('not-a-url')).toBe('not-a-url');
	});

	it('strips surrounding quotes and whitespace from secrets', () => {
		expect(sanitizeDatabaseUrl('"postgresql://u:p@host/db"\n')).toBe('postgresql://u:p@host/db');
	});
});
