import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { rotateAccessCode } from '../../../lib/server/auth/access-code';
import { canManageMembers } from '../../../lib/server/auth/permissions';
import { revokeMemberSessions } from '../../../lib/server/auth/session';
import { getDb } from '../../../lib/server/db/client';
import { divisions, members } from '../../../lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const ROLES = ['MOD', 'DIVISION_ADMIN', 'COMMITTEE'] as const;

function requireMod(event: { locals: App.Locals }) {
	if (!event.locals.actor || !canManageMembers(event.locals.actor)) throw error(403, 'Khusus MOD.');
	return event.locals.actor;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireMod(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const [allMembers, allDivisions] = await Promise.all([
		db.query.members.findMany(),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) })
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	return {
		members: allMembers.map((m) => ({
			id: m.id,
			name: m.name,
			position: m.organizationalPosition,
			systemRole: m.systemRole,
			status: m.status,
			division: m.divisionId ? (divisionName.get(m.divisionId) ?? null) : null
		})),
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name })),
		roles: [...ROLES]
	};
};

export const actions: Actions = {
	register: async (event) => {
		const actor = requireMod(event);
		const form = await event.request.formData();
		const name = String(form.get('name') ?? '').trim();
		const systemRole = String(form.get('systemRole') ?? '');
		const divisionId = String(form.get('divisionId') ?? '').trim() || null;
		const position = String(form.get('position') ?? '').trim() || null;
		if (name.length < 2 || name.length > 80)
			return fail(400, { error: 'Nama 2 sampai 80 karakter.' });
		if (!(ROLES as readonly string[]).includes(systemRole))
			return fail(400, { error: 'Role tidak valid.' });
		if (systemRole === 'DIVISION_ADMIN' && !divisionId)
			return fail(400, { error: 'Admin divisi wajib punya divisi.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		if (divisionId) {
			const division = await db.query.divisions.findFirst({ where: eq(divisions.id, divisionId) });
			if (!division || division.eventId !== actor.eventId)
				return fail(400, { error: 'Divisi tidak valid.' });
		}
		await db.insert(members).values({
			id: crypto.randomUUID(),
			eventId: actor.eventId,
			divisionId,
			name,
			organizationalPosition: position,
			systemRole: systemRole as (typeof ROLES)[number]
		});
		return { success: 'Anggota terdaftar.' };
	},
	setStatus: async (event) => {
		const actor = requireMod(event);
		const form = await event.request.formData();
		const memberId = String(form.get('memberId') ?? '');
		const status = String(form.get('status') ?? '');
		if (status !== 'ACTIVE' && status !== 'INACTIVE')
			return fail(400, { error: 'Status tidak valid.' });
		if (memberId === actor.memberId && status === 'INACTIVE')
			return fail(400, { error: 'Tidak bisa nonaktifkan diri sendiri.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const target = await db.query.members.findFirst({ where: eq(members.id, memberId) });
		if (!target || target.eventId !== actor.eventId)
			return fail(404, { error: 'Anggota tidak ada.' });
		await db.update(members).set({ status, updatedAt: new Date() }).where(eq(members.id, memberId));
		if (status === 'INACTIVE') await revokeMemberSessions(db, memberId);
		return { success: 'Status diperbarui.' };
	},
	rotateCode: async (event) => {
		const actor = requireMod(event);
		const form = await event.request.formData();
		const role = String(form.get('role') ?? '');
		if (!(ROLES as readonly string[]).includes(role))
			return fail(400, { error: 'Role tidak valid.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const raw = await rotateAccessCode(db, {
			eventId: actor.eventId,
			role: role as (typeof ROLES)[number]
		});
		return { newCode: raw, newCodeRole: role };
	}
};
