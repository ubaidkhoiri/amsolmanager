import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { verifyAccessCode } from '../../src/lib/server/auth/access-code';
import { generateAccessCode, sha256Hex } from '../../src/lib/server/auth/crypto';
import { createRateLimiter } from '../../src/lib/server/auth/rate-limit';
import {
	createSession,
	revokeSession,
	validateSessionToken
} from '../../src/lib/server/auth/session';
import { createDb, type Db } from '../../src/lib/server/db/client';
import { accessCodes, members, sessions } from '../../src/lib/server/db/schema';

function loadDatabaseUrl(): string {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
	const line = fs
		.readFileSync(path.join(root, '.env'), 'utf8')
		.split('\n')
		.find((l) => l.startsWith('DATABASE_URL='));
	if (!line) throw new Error('.env tanpa DATABASE_URL, integrasi batal');
	return line.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
}

let db: Db;
let eventId = '';
let modId = '';
let comId = '';
let modCodeId = '';
let comCodeId = '';
let modCode = '';
let comCode = '';
const limiter = createRateLimiter(1000);

beforeAll(async () => {
	db = createDb(loadDatabaseUrl());
	const found = await db.query.events.findMany();
	const event = found.find((e) => e.slug === 'genawards-cook-edition');
	if (!event) throw new Error('seed event belum ada, jalanin scripts/db-seed.mjs dulu');
	eventId = event.id;

	modId = crypto.randomUUID();
	comId = crypto.randomUUID();
	modCode = generateAccessCode();
	comCode = generateAccessCode();
	await db.insert(members).values([
		{ id: modId, eventId, name: '__test_mod__', systemRole: 'MOD' },
		{ id: comId, eventId, name: '__test_com__', systemRole: 'COMMITTEE' }
	]);
	modCodeId = crypto.randomUUID();
	comCodeId = crypto.randomUUID();
	await db.insert(accessCodes).values([
		{ id: modCodeId, eventId, role: 'MOD', codeHash: await sha256Hex(modCode), version: 901 },
		{ id: comCodeId, eventId, role: 'COMMITTEE', codeHash: await sha256Hex(comCode), version: 901 }
	]);
});

afterAll(async () => {
	await db.delete(sessions).where(inArray(sessions.memberId, [modId, comId]));
	await db.delete(accessCodes).where(inArray(accessCodes.id, [modCodeId, comCodeId]));
	await db.delete(members).where(inArray(members.id, [modId, comId]));
});

describe('access control integrasi', () => {
	it('kode valid lolos', async () => {
		const res = await verifyAccessCode(db, limiter, {
			memberId: modId,
			code: modCode,
			rateKey: 't1'
		});
		expect(res.ok).toBe(true);
	});

	it('kode salah ditolak', async () => {
		const res = await verifyAccessCode(db, limiter, {
			memberId: modId,
			code: 'salah',
			rateKey: 't2'
		});
		expect(res).toEqual({ ok: false, reason: 'INVALID' });
	});

	it('kode lintas role ditolak', async () => {
		const res = await verifyAccessCode(db, limiter, {
			memberId: comId,
			code: modCode,
			rateKey: 't3'
		});
		expect(res).toEqual({ ok: false, reason: 'INVALID' });
	});

	it('anggota nonaktif ditolak', async () => {
		await db.update(members).set({ status: 'INACTIVE' }).where(eq(members.id, comId));
		const res = await verifyAccessCode(db, limiter, {
			memberId: comId,
			code: comCode,
			rateKey: 't4'
		});
		expect(res).toEqual({ ok: false, reason: 'INVALID' });
		await db.update(members).set({ status: 'ACTIVE' }).where(eq(members.id, comId));
	});

	it('sesi valid lalu mati setelah revoke', async () => {
		const { token } = await createSession(db, modId);
		const actor = await validateSessionToken(db, token);
		expect(actor?.memberId).toBe(modId);
		await revokeSession(db, token);
		expect(await validateSessionToken(db, token)).toBeNull();
	});
});
