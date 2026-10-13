import { describe, expect, it } from 'vitest';
import { sha256Hex, timingSafeEqual } from '../../src/lib/server/auth/crypto';
import { isSessionUsable } from '../../src/lib/server/auth/session';
import {
	canManageMembers,
	hasDivisionScope,
	type Actor
} from '../../src/lib/server/auth/permissions';
import { createRateLimiter } from '../../src/lib/server/auth/rate-limit';

const mod: Actor = {
	memberId: 'm1',
	eventId: 'e1',
	divisionId: null,
	systemRole: 'MOD',
	name: 'Mod'
};
const admin: Actor = {
	memberId: 'm2',
	eventId: 'e1',
	divisionId: 'd1',
	systemRole: 'DIVISION_ADMIN',
	name: 'Admin'
};

describe('crypto', () => {
	it('hash stabil dan 64 hex', async () => {
		const a = await sha256Hex('kode-rahasia');
		expect(a).toBe(await sha256Hex('kode-rahasia'));
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});

	it('timingSafeEqual bedakan string', () => {
		expect(timingSafeEqual('abc', 'abc')).toBe(true);
		expect(timingSafeEqual('abc', 'abd')).toBe(false);
		expect(timingSafeEqual('abc', 'abcd')).toBe(false);
	});
});

describe('isSessionUsable', () => {
	it('tolak kadaluarsa, revoke, dan nonaktif', () => {
		const past = new Date(Date.now() - 1000);
		const future = new Date(Date.now() + 1000);
		expect(isSessionUsable({ expiresAt: past, revokedAt: null }, 'ACTIVE')).toBe(false);
		expect(isSessionUsable({ expiresAt: future, revokedAt: new Date() }, 'ACTIVE')).toBe(false);
		expect(isSessionUsable({ expiresAt: future, revokedAt: null }, 'INACTIVE')).toBe(false);
		expect(isSessionUsable({ expiresAt: future, revokedAt: null }, 'ACTIVE')).toBe(true);
	});
});

describe('permissions', () => {
	it('hanya MOD kelola anggota', () => {
		expect(canManageMembers(mod)).toBe(true);
		expect(canManageMembers(admin)).toBe(false);
	});

	it('scope divisi ketat', () => {
		expect(hasDivisionScope(mod, 'd9')).toBe(true);
		expect(hasDivisionScope(admin, 'd1')).toBe(true);
		expect(hasDivisionScope(admin, 'd2')).toBe(false);
	});
});

describe('rate limiter', () => {
	it('blokir setelah batas, reset buka lagi', () => {
		const limiter = createRateLimiter(2, 60_000);
		expect(limiter.check('k')).toBe(true);
		limiter.fail('k');
		limiter.fail('k');
		expect(limiter.check('k')).toBe(false);
		limiter.reset('k');
		expect(limiter.check('k')).toBe(true);
	});
});
