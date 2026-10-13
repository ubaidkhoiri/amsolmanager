import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import { canManageMeeting, type Actor } from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import { divisions, meetings } from '../../../lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const TYPES = ['PLENARY', 'DIVISION'] as const;

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const scopeFilter =
		actor.systemRole === 'MOD' || actor.divisionId === null
			? eq(meetings.eventId, actor.eventId)
			: and(
					eq(meetings.eventId, actor.eventId),
					or(eq(meetings.divisionId, actor.divisionId), isNull(meetings.divisionId))
				);
	const [rows, allDivisions] = await Promise.all([
		db.query.meetings.findMany({ where: scopeFilter, orderBy: asc(meetings.startsAt) }),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) })
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	return {
		actor,
		meetings: rows.map((m) => ({
			id: m.id,
			title: m.title,
			type: m.meetingType,
			status: m.status,
			startsAt: m.startsAt?.toISOString() ?? null,
			location: m.location,
			division: m.divisionId ? (divisionName.get(m.divisionId) ?? null) : null,
			canManage: canManageMeeting(actor, { divisionId: m.divisionId })
		})),
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name })),
		canCreate: actor.systemRole !== 'COMMITTEE'
	};
};

export const actions: Actions = {
	create: async (event) => {
		const actor = requireActor(event);
		if (actor.systemRole === 'COMMITTEE') throw error(403, 'Panitia tidak bisa buat musyawarah.');
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const meetingType = String(form.get('meetingType') ?? '');
		const divisionId = String(form.get('divisionId') ?? '').trim() || null;
		const startsAtRaw = String(form.get('startsAt') ?? '').trim();
		const location = String(form.get('location') ?? '').trim() || null;
		const agenda = String(form.get('agenda') ?? '').trim();
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		if (!(TYPES as readonly string[]).includes(meetingType))
			return fail(400, { error: 'Jenis tidak valid.' });
		if (meetingType === 'DIVISION' && !divisionId)
			return fail(400, { error: 'Musyawarah divisi wajib pilih divisi.' });
		if (meetingType === 'PLENARY' && divisionId)
			return fail(400, { error: 'Musyawarah besar tanpa divisi.' });
		if (!canManageMeeting(actor, { divisionId }))
			return fail(403, { error: 'Di luar cakupan divisimu.' });
		let startsAt: Date | null = null;
		if (startsAtRaw) {
			startsAt = new Date(startsAtRaw);
			if (Number.isNaN(startsAt.getTime())) return fail(400, { error: 'Waktu tidak valid.' });
		}
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		if (divisionId) {
			const division = await db.query.divisions.findFirst({
				where: eq(divisions.id, divisionId)
			});
			if (!division || division.eventId !== actor.eventId)
				return fail(400, { error: 'Divisi tidak valid.' });
		}
		const id = crypto.randomUUID();
		await db.insert(meetings).values({
			id,
			eventId: actor.eventId,
			title,
			meetingType: meetingType as (typeof TYPES)[number],
			divisionId,
			startsAt,
			location,
			agenda,
			createdBy: actor.memberId
		});
		return { success: 'Musyawarah dibuat.', meetingId: id };
	}
};
