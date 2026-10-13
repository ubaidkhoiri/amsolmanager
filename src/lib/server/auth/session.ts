import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '../db/client';
import { members } from '../db/schema';
import { sessions } from '../db/schema';
import type { Actor } from './permissions';
import { randomToken, sha256Hex } from './crypto';

export const SESSION_COOKIE = 'amsol_session';
export const SESSION_TTL_DAYS = 7;

export function isSessionUsable(
	session: { expiresAt: Date; revokedAt: Date | null },
	memberStatus: string,
	now: Date = new Date()
): boolean {
	return session.revokedAt === null && session.expiresAt > now && memberStatus === 'ACTIVE';
}

export async function createSession(
	db: Db,
	memberId: string,
	ttlDays = SESSION_TTL_DAYS
): Promise<{ token: string; expiresAt: Date }> {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
	await db.insert(sessions).values({
		id: crypto.randomUUID(),
		memberId,
		sessionTokenHash: await sha256Hex(token),
		expiresAt
	});
	return { token, expiresAt };
}

export async function validateSessionToken(db: Db, rawToken: string): Promise<Actor | null> {
	const hash = await sha256Hex(rawToken);
	const session = await db.query.sessions.findFirst({
		where: eq(sessions.sessionTokenHash, hash)
	});
	if (!session) return null;
	const member = await db.query.members.findFirst({ where: eq(members.id, session.memberId) });
	if (!member) return null;
	if (!isSessionUsable(session, member.status)) return null;
	await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, session.id));
	return {
		memberId: member.id,
		eventId: member.eventId,
		divisionId: member.divisionId,
		systemRole: member.systemRole,
		name: member.name,
		position: member.organizationalPosition
	};
}

export async function revokeSession(db: Db, rawToken: string): Promise<void> {
	await db
		.update(sessions)
		.set({ revokedAt: new Date() })
		.where(
			and(eq(sessions.sessionTokenHash, await sha256Hex(rawToken)), isNull(sessions.revokedAt))
		);
}

export async function revokeMemberSessions(db: Db, memberId: string): Promise<void> {
	await db
		.update(sessions)
		.set({ revokedAt: new Date() })
		.where(and(eq(sessions.memberId, memberId), isNull(sessions.revokedAt)));
}
