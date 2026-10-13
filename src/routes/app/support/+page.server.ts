import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, or } from 'drizzle-orm';
import { canAdvanceSupport, type Actor } from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import { divisions, supportRequests, tasks } from '../../../lib/server/db/schema';
import { canTransition, SUPPORT_TRANSITIONS } from '../../../lib/workflow';
import type { Actions, PageServerLoad } from './$types';

type Db = ReturnType<typeof getDb>;

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

function scopeOf(actor: Actor, r: { requestingDivisionId: string; targetDivisionId: string }) {
	return (
		actor.systemRole === 'MOD' ||
		actor.divisionId === r.requestingDivisionId ||
		actor.divisionId === r.targetDivisionId
	);
}

async function loadRequest(db: Db, actor: Actor, id: string) {
	const request = await db.query.supportRequests.findFirst({
		where: eq(supportRequests.id, id)
	});
	if (!request || request.eventId !== actor.eventId) throw error(404, 'Permintaan tidak ada.');
	if (!scopeOf(actor, request)) throw error(403, 'Di luar cakupan divisimu.');
	if (actor.systemRole === 'COMMITTEE' && actor.memberId !== request.requestedBy)
		throw error(403, 'Bukan permintaanmu.');
	return request;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const filter =
		actor.systemRole === 'MOD'
			? eq(supportRequests.eventId, actor.eventId)
			: actor.divisionId
				? and(
						eq(supportRequests.eventId, actor.eventId),
						or(
							eq(supportRequests.requestingDivisionId, actor.divisionId),
							eq(supportRequests.targetDivisionId, actor.divisionId)
						)
					)
				: and(
						eq(supportRequests.eventId, actor.eventId),
						eq(supportRequests.requestedBy, actor.memberId)
					);
	const [rows, allDivisions] = await Promise.all([
		db.query.supportRequests.findMany({ where: filter, orderBy: asc(supportRequests.neededBy) }),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) })
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	return {
		actor,
		requests: rows.map((r) => ({
			id: r.id,
			title: r.title,
			status: r.status,
			priority: r.priority,
			neededBy: r.neededBy?.toISOString() ?? null,
			from: divisionName.get(r.requestingDivisionId) ?? '?',
			to: divisionName.get(r.targetDivisionId) ?? '?',
			nextStatuses: SUPPORT_TRANSITIONS[r.status] ?? []
		})),
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name })),
		canCreate: actor.systemRole !== 'COMMITTEE' || actor.divisionId !== null
	};
};

export const actions: Actions = {
	create: async (event) => {
		const actor = requireActor(event);
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const reason = String(form.get('reason') ?? '').trim();
		const priority = String(form.get('priority') ?? 'MEDIUM');
		const neededByRaw = String(form.get('neededBy') ?? '').trim();
		const targetDivisionId = String(form.get('targetDivisionId') ?? '').trim();
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		if (!description) return fail(400, { error: 'Deskripsi kebutuhan wajib.' });
		if (!(PRIORITIES as readonly string[]).includes(priority))
			return fail(400, { error: 'Prioritas tidak valid.' });
		// Non-MOD requests on behalf of their own division.
		const requestingDivisionId =
			actor.systemRole === 'MOD'
				? String(form.get('requestingDivisionId') ?? '').trim()
				: (actor.divisionId ?? '');
		if (!requestingDivisionId) return fail(400, { error: 'Divisi peminta wajib.' });
		if (!targetDivisionId) return fail(400, { error: 'Divisi tujuan wajib.' });
		if (targetDivisionId === requestingDivisionId)
			return fail(400, { error: 'Divisi tujuan beda dengan peminta.' });
		let neededBy: Date | null = null;
		if (neededByRaw) {
			neededBy = new Date(neededByRaw);
			if (Number.isNaN(neededBy.getTime()))
				return fail(400, { error: 'Deadline kebutuhan tidak valid.' });
		}
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		for (const id of [requestingDivisionId, targetDivisionId]) {
			const division = await db.query.divisions.findFirst({ where: eq(divisions.id, id) });
			if (!division || division.eventId !== actor.eventId)
				return fail(400, { error: 'Divisi tidak valid.' });
		}
		if (actor.systemRole !== 'MOD' && actor.divisionId !== requestingDivisionId)
			return fail(403, { error: 'Hanya untuk divisimu.' });
		const id = crypto.randomUUID();
		await db.insert(supportRequests).values({
			id,
			eventId: actor.eventId,
			requestingDivisionId,
			targetDivisionId,
			title,
			description,
			reason,
			priority: priority as (typeof PRIORITIES)[number],
			neededBy,
			requestedBy: actor.memberId
		});
		return { success: 'Permintaan dikirim.', requestId: id };
	},

	advance: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const requestId = String(form.get('requestId') ?? '');
		const to = String(form.get('status') ?? '');
		const response = String(form.get('response') ?? '').trim() || null;
		const request = await loadRequest(db, actor, requestId);
		if (!canTransition(SUPPORT_TRANSITIONS, request.status, to))
			return fail(400, { error: `Transisi ${request.status} ke ${to} tidak valid.` });
		if (
			!canAdvanceSupport(
				actor,
				{
					requestingDivisionId: request.requestingDivisionId,
					targetDivisionId: request.targetDivisionId,
					requestedBy: request.requestedBy,
					status: request.status
				},
				to
			)
		)
			throw error(403, 'Tidak boleh ubah permintaan ini.');
		if ((to === 'NEEDS_INFORMATION' || to === 'REJECTED') && !response)
			return fail(400, { error: 'Tulis alasan respons dulu.' });
		await db
			.update(supportRequests)
			.set({
				status: to as typeof request.status,
				response,
				acceptedBy: to === 'ACCEPTED' ? actor.memberId : request.acceptedBy,
				completedAt: to === 'COMPLETED' ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(supportRequests.id, requestId));
		return { success: `Permintaan jadi ${to}.` };
	},

	linkTask: async (event) => {
		const actor = requireActor(event);
		if (actor.systemRole === 'COMMITTEE') throw error(403, 'Panitia tidak bisa buat tugas.');
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const requestId = String(form.get('requestId') ?? '');
		const title = String(form.get('title') ?? '').trim();
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		const request = await loadRequest(db, actor, requestId);
		if (request.status !== 'ACCEPTED' && request.status !== 'IN_PROGRESS')
			return fail(400, { error: 'Tugas hanya dari permintaan yang diterima.' });
		if (request.linkedTaskId) return fail(400, { error: 'Sudah punya tugas.' });
		const isTarget = actor.systemRole === 'MOD' || actor.divisionId === request.targetDivisionId;
		if (!isTarget) throw error(403, 'Hanya divisi penerima yang buat tugas.');
		const id = crypto.randomUUID();
		await db.insert(tasks).values({
			id,
			eventId: actor.eventId,
			divisionId: request.targetDivisionId,
			title,
			description: `Dari permintaan bantuan: ${request.title}`,
			createdBy: actor.memberId
		});
		await db
			.update(supportRequests)
			.set({ linkedTaskId: id, updatedAt: new Date() })
			.where(eq(supportRequests.id, requestId));
		return { success: 'Tugas dibuat dan terhubung.', taskId: id };
	}
};
