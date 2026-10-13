import { error, fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { canAdvancePublication, type Actor } from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import { divisions, members, publications } from '../../../lib/server/db/schema';
import { canTransition, PUBLICATION_TRANSITIONS } from '../../../lib/workflow';
import type { Actions, PageServerLoad } from './$types';

type Db = ReturnType<typeof getDb>;

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

async function loadPublication(db: Db, actor: Actor, id: string) {
	const pub = await db.query.publications.findFirst({ where: eq(publications.id, id) });
	if (!pub || pub.eventId !== actor.eventId) throw error(404, 'Konten tidak ada.');
	return pub;
}

function validUrl(raw: string): boolean {
	try {
		const u = new URL(raw);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const status = event.url.searchParams.get('status')?.trim() || null;
	const clauses = [eq(publications.eventId, actor.eventId)];
	if (status && (PUBLICATION_TRANSITIONS[status] !== undefined || status === 'PUBLISHED'))
		clauses.push(eq(publications.status, status as typeof publications.$inferSelect.status));
	const [rows, allDivisions, allMembers] = await Promise.all([
		db.query.publications.findMany({
			where: and(...clauses),
			orderBy: asc(publications.scheduledAt)
		}),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) }),
		db.query.members.findMany()
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	const memberName = new Map(allMembers.map((m) => [m.id, m.name]));
	return {
		actor,
		items: rows.map((p) => ({
			id: p.id,
			title: p.title,
			channel: p.channel,
			format: p.format,
			status: p.status,
			scheduled: p.scheduledAt ? p.scheduledAt.toISOString().slice(0, 16).replace('T', ' ') : null,
			division: divisionName.get(p.divisionId) ?? '?',
			design: p.designOwnerId ? (memberName.get(p.designOwnerId) ?? '?') : '-',
			copy: p.copyOwnerId ? (memberName.get(p.copyOwnerId) ?? '?') : '-',
			publishedUrl: p.publishedUrl,
			nextStatuses: PUBLICATION_TRANSITIONS[p.status] ?? []
		})),
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name })),
		members: allMembers.map((m) => ({ id: m.id, name: m.name })),
		statuses: [...Object.keys(PUBLICATION_TRANSITIONS)],
		selectedStatus: status,
		canCreate: actor.systemRole !== 'COMMITTEE'
	};
};

export const actions: Actions = {
	create: async (event) => {
		const actor = requireActor(event);
		if (actor.systemRole === 'COMMITTEE') throw error(403, 'Panitia tidak bisa buat konten.');
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const channel = String(form.get('channel') ?? '').trim();
		const format = String(form.get('format') ?? '').trim();
		const caption = String(form.get('caption') ?? '').trim();
		const scheduledRaw = String(form.get('scheduledAt') ?? '').trim();
		const divisionId = String(form.get('divisionId') ?? '').trim();
		const designOwnerId = String(form.get('designOwnerId') ?? '').trim() || null;
		const copyOwnerId = String(form.get('copyOwnerId') ?? '').trim() || null;
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		if (!divisionId) return fail(400, { error: 'Divisi wajib.' });
		if (
			actor.systemRole !== 'MOD' &&
			(actor.divisionId !== divisionId || actor.divisionId === null)
		)
			return fail(403, { error: 'Hanya untuk divisimu.' });
		let scheduledAt: Date | null = null;
		if (scheduledRaw) {
			scheduledAt = new Date(scheduledRaw);
			if (Number.isNaN(scheduledAt.getTime()))
				return fail(400, { error: 'Target publikasi tidak valid.' });
		}
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const division = await db.query.divisions.findFirst({
			where: eq(divisions.id, divisionId)
		});
		if (!division || division.eventId !== actor.eventId)
			return fail(400, { error: 'Divisi tidak valid.' });
		for (const ownerId of [designOwnerId, copyOwnerId]) {
			if (!ownerId) continue;
			const owner = await db.query.members.findFirst({ where: eq(members.id, ownerId) });
			if (!owner || owner.eventId !== actor.eventId)
				return fail(400, { error: 'PIC tidak valid.' });
		}
		const id = crypto.randomUUID();
		await db.insert(publications).values({
			id,
			eventId: actor.eventId,
			divisionId,
			title,
			channel,
			format,
			caption,
			scheduledAt,
			designOwnerId,
			copyOwnerId,
			createdBy: actor.memberId
		});
		return { success: 'Ide konten dibuat.' };
	},

	advance: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const pubId = String(form.get('pubId') ?? '');
		const to = String(form.get('status') ?? '');
		const url = String(form.get('publishedUrl') ?? '').trim() || null;
		const reason = String(form.get('reason') ?? '').trim() || null;
		const pub = await loadPublication(db, actor, pubId);
		if (!canTransition(PUBLICATION_TRANSITIONS, pub.status, to))
			return fail(400, { error: `Transisi ${pub.status} ke ${to} tidak valid.` });
		if (
			!canAdvancePublication(
				actor,
				{
					divisionId: pub.divisionId,
					designOwnerId: pub.designOwnerId,
					copyOwnerId: pub.copyOwnerId
				},
				to
			)
		)
			throw error(403, 'Tidak boleh ubah konten ini.');
		if (to === 'PUBLISHED' && (!url || !validUrl(url)))
			return fail(400, { error: 'Tautan posting valid wajib saat published.' });
		if (to === 'CANCELLED' && !reason) return fail(400, { error: 'Tulis alasan pembatalan.' });
		await db
			.update(publications)
			.set({
				status: to as typeof pub.status,
				publishedUrl: to === 'PUBLISHED' ? url : pub.publishedUrl,
				approvedBy: to === 'APPROVED' ? actor.memberId : pub.approvedBy,
				approvedAt: to === 'APPROVED' ? new Date() : pub.approvedAt,
				cancelReason: to === 'CANCELLED' ? reason : pub.cancelReason,
				updatedAt: new Date()
			})
			.where(eq(publications.id, pubId));
		return { success: `Konten jadi ${to}.` };
	},

	reschedule: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const pubId = String(form.get('pubId') ?? '');
		const scheduledRaw = String(form.get('scheduledAt') ?? '').trim();
		const reason = String(form.get('reason') ?? '').trim();
		if (!reason) return fail(400, { error: 'Tulis alasan penjadwalan ulang.' });
		const scheduledAt = new Date(scheduledRaw);
		if (Number.isNaN(scheduledAt.getTime()))
			return fail(400, { error: 'Target publikasi tidak valid.' });
		const pub = await loadPublication(db, actor, pubId);
		if (pub.status === 'PUBLISHED' || pub.status === 'CANCELLED')
			return fail(400, { error: 'Konten selesai tidak bisa dijadwalkan ulang.' });
		if (
			!canAdvancePublication(
				actor,
				{
					divisionId: pub.divisionId,
					designOwnerId: pub.designOwnerId,
					copyOwnerId: pub.copyOwnerId
				},
				'DRAFT'
			)
		)
			throw error(403, 'Tidak boleh ubah konten ini.');
		await db
			.update(publications)
			.set({ scheduledAt, scheduleNote: reason, updatedAt: new Date() })
			.where(eq(publications.id, pubId));
		return { success: 'Jadwal diubah.' };
	}
};
