import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import type { Db } from '../db/client';
import { accessCodes, members } from '../db/schema';
import { generateAccessCode, sha256Hex, timingSafeEqual } from './crypto';
import type { Actor, SystemRole } from './permissions';
import type { RateLimiter } from './rate-limit';

export type VerifyResult =
	{ ok: true; member: Actor } | { ok: false; reason: 'INVALID' | 'RATE_LIMITED' };

export async function verifyAccessCode(
	db: Db,
	limiter: RateLimiter,
	input: { memberId: string; code: string; rateKey: string }
): Promise<VerifyResult> {
	if (!limiter.check(input.rateKey)) return { ok: false, reason: 'RATE_LIMITED' };
	const fail = () => {
		limiter.fail(input.rateKey);
		return { ok: false, reason: 'INVALID' } as const;
	};
	const member = await db.query.members.findFirst({ where: eq(members.id, input.memberId) });
	if (!member || member.status !== 'ACTIVE') return fail();
	const now = new Date();
	const codes = await db.query.accessCodes.findMany({
		where: and(
			eq(accessCodes.eventId, member.eventId),
			eq(accessCodes.role, member.systemRole),
			eq(accessCodes.isActive, true),
			or(isNull(accessCodes.expiresAt), gt(accessCodes.expiresAt, now))
		),
		orderBy: desc(accessCodes.version)
	});
	const hash = await sha256Hex(input.code);
	const match = codes.some((c) => timingSafeEqual(c.codeHash, hash));
	if (!match) return fail();
	limiter.reset(input.rateKey);
	return {
		ok: true,
		member: {
			memberId: member.id,
			eventId: member.eventId,
			divisionId: member.divisionId,
			systemRole: member.systemRole,
			name: member.name
		}
	};
}

export async function rotateAccessCode(
	db: Db,
	input: { eventId: string; role: SystemRole }
): Promise<string> {
	const raw = generateAccessCode();
	const existing = await db.query.accessCodes.findMany({
		where: and(eq(accessCodes.eventId, input.eventId), eq(accessCodes.role, input.role)),
		orderBy: desc(accessCodes.version)
	});
	const nextVersion = (existing[0]?.version ?? 0) + 1;
	const now = new Date();
	await db
		.update(accessCodes)
		.set({ isActive: false, rotatedAt: now })
		.where(
			and(
				eq(accessCodes.eventId, input.eventId),
				eq(accessCodes.role, input.role),
				eq(accessCodes.isActive, true)
			)
		);
	await db.insert(accessCodes).values({
		id: crypto.randomUUID(),
		eventId: input.eventId,
		role: input.role,
		codeHash: await sha256Hex(raw),
		version: nextVersion
	});
	return raw;
}
