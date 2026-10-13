import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import {
	canEditDecision,
	canFinalizeDecision,
	canManageMeeting,
	canManageMinutes,
	canManageTask,
	type Actor
} from '../../../../lib/server/auth/permissions';
import { getDb } from '../../../../lib/server/db/client';
import { decisions, meetings, minuteItems, tasks } from '../../../../lib/server/db/schema';
import { canTransition, DECISION_TRANSITIONS, MEETING_TRANSITIONS } from '../../../../lib/workflow';
import type { Actions, PageServerLoad } from './$types';

type Db = ReturnType<typeof getDb>;

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

async function loadMeeting(db: Db, actor: Actor, id: string) {
	const meeting = await db.query.meetings.findFirst({ where: eq(meetings.id, id) });
	if (!meeting || meeting.eventId !== actor.eventId) throw error(404, 'Musyawarah tidak ada.');
	if (
		actor.systemRole !== 'MOD' &&
		actor.divisionId !== meeting.divisionId &&
		meeting.divisionId !== null
	)
		throw error(403, 'Di luar cakupan divisimu.');
	return meeting;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const meeting = await loadMeeting(db, actor, event.params.id);
	const [minutes, meetingDecisions] = await Promise.all([
		db.query.minuteItems.findMany({
			where: eq(minuteItems.meetingId, meeting.id),
			orderBy: asc(minuteItems.createdAt)
		}),
		db.query.decisions.findMany({
			where: eq(decisions.meetingId, meeting.id),
			orderBy: desc(decisions.version)
		})
	]);
	const memberRows = await db.query.members.findMany();
	const memberName = new Map(memberRows.map((m) => [m.id, m.name]));
	const canManage = canManageMeeting(actor, { divisionId: meeting.divisionId });
	return {
		actor,
		meeting: {
			id: meeting.id,
			title: meeting.title,
			type: meeting.meetingType,
			status: meeting.status,
			startsAt: meeting.startsAt?.toISOString() ?? null,
			location: meeting.location,
			agenda: meeting.agenda,
			divisionId: meeting.divisionId
		},
		canManage,
		canFinalize: canFinalizeDecision(actor),
		minutes: minutes.map((m) => ({
			id: m.id,
			topic: m.topic,
			summary: m.discussionSummary,
			proposal: m.proposal,
			outcome: m.outcome,
			status: m.status,
			author: memberName.get(m.createdBy) ?? '?'
		})),
		decisions: meetingDecisions.map((d) => ({
			id: d.id,
			title: d.title,
			content: d.content,
			status: d.status,
			version: d.version,
			decidedAt: d.decidedAt?.toISOString() ?? null,
			decider: d.decidedBy ? (memberName.get(d.decidedBy) ?? '?') : null,
			supersedes: d.supersedesDecisionId,
			canEdit: canEditDecision(actor, { divisionId: d.divisionId, status: d.status })
		})),
		nextStatuses: MEETING_TRANSITIONS[meeting.status] ?? []
	};
};

export const actions: Actions = {
	setStatus: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		if (!canManageMeeting(actor, { divisionId: meeting.divisionId }))
			throw error(403, 'Tidak boleh ubah musyawarah ini.');
		const to = String((await event.request.formData()).get('status') ?? '');
		if (!canTransition(MEETING_TRANSITIONS, meeting.status, to))
			return fail(400, { error: `Transisi ${meeting.status} ke ${to} tidak valid.` });
		await db
			.update(meetings)
			.set({ status: to as typeof meeting.status, updatedAt: new Date() })
			.where(eq(meetings.id, meeting.id));
		return { success: `Status jadi ${to}.` };
	},

	addMinute: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		if (!canManageMinutes(actor, { divisionId: meeting.divisionId }))
			throw error(403, 'Tidak boleh catat notulen ini.');
		const form = await event.request.formData();
		const topic = String(form.get('topic') ?? '').trim();
		if (topic.length < 3 || topic.length > 120)
			return fail(400, { error: 'Topik 3 sampai 120 karakter.' });
		await db.insert(minuteItems).values({
			id: crypto.randomUUID(),
			meetingId: meeting.id,
			divisionId: meeting.divisionId,
			topic,
			discussionSummary: String(form.get('summary') ?? '').trim() || null,
			proposal: String(form.get('proposal') ?? '').trim() || null,
			outcome: String(form.get('outcome') ?? '').trim() || null,
			createdBy: actor.memberId
		});
		return { success: 'Notulen ditambah.' };
	},

	setMinuteStatus: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		if (!canManageMinutes(actor, { divisionId: meeting.divisionId }))
			throw error(403, 'Tidak boleh ubah notulen ini.');
		const form = await event.request.formData();
		const minuteId = String(form.get('minuteId') ?? '');
		const status = String(form.get('status') ?? '');
		if (status !== 'OPEN' && status !== 'DONE') return fail(400, { error: 'Status tidak valid.' });
		const target = await db.query.minuteItems.findFirst({ where: eq(minuteItems.id, minuteId) });
		if (!target || target.meetingId !== meeting.id)
			return fail(404, { error: 'Notulen tidak ada.' });
		await db
			.update(minuteItems)
			.set({ status: status as typeof target.status, updatedAt: new Date() })
			.where(eq(minuteItems.id, minuteId));
		return { success: 'Notulen diperbarui.' };
	},

	addDecision: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		if (!canManageMeeting(actor, { divisionId: meeting.divisionId }))
			throw error(403, 'Tidak boleh tambah keputusan.');
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const content = String(form.get('content') ?? '').trim();
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		if (!content) return fail(400, { error: 'Isi keputusan wajib.' });
		await db.insert(decisions).values({
			id: crypto.randomUUID(),
			eventId: actor.eventId,
			meetingId: meeting.id,
			divisionId: meeting.divisionId,
			title,
			content,
			createdBy: actor.memberId
		});
		return { success: 'Keputusan draft dibuat.' };
	},

	setDecisionStatus: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		const form = await event.request.formData();
		const decisionId = String(form.get('decisionId') ?? '');
		const to = String(form.get('status') ?? '');
		const target = await db.query.decisions.findFirst({ where: eq(decisions.id, decisionId) });
		if (!target || target.meetingId !== meeting.id)
			return fail(404, { error: 'Keputusan tidak ada.' });
		if (!canEditDecision(actor, { divisionId: target.divisionId, status: target.status }))
			throw error(403, 'Tidak boleh ubah keputusan ini.');
		if (to === 'FINAL') {
			if (!canFinalizeDecision(actor)) throw error(403, 'Hanya MOD finalkan keputusan.');
			await db
				.update(decisions)
				.set({
					status: 'FINAL',
					decidedBy: actor.memberId,
					decidedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(decisions.id, decisionId));
			return { success: 'Keputusan difinalkan.' };
		}
		if (!canTransition(DECISION_TRANSITIONS, target.status, to))
			return fail(400, { error: `Transisi ${target.status} ke ${to} tidak valid.` });
		await db
			.update(decisions)
			.set({ status: to as typeof target.status, updatedAt: new Date() })
			.where(eq(decisions.id, decisionId));
		return { success: `Keputusan jadi ${to}.` };
	},

	reviseDecision: async (event) => {
		const actor = requireActor(event);
		if (!canFinalizeDecision(actor)) throw error(403, 'Hanya MOD revisi keputusan final.');
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		const form = await event.request.formData();
		const decisionId = String(form.get('decisionId') ?? '');
		const content = String(form.get('content') ?? '').trim();
		if (!content) return fail(400, { error: 'Isi revisi wajib.' });
		const target = await db.query.decisions.findFirst({ where: eq(decisions.id, decisionId) });
		if (!target || target.meetingId !== meeting.id)
			return fail(404, { error: 'Keputusan tidak ada.' });
		if (target.status !== 'FINAL')
			return fail(400, { error: 'Hanya keputusan final yang direvisi.' });
		const newId = crypto.randomUUID();
		await db.insert(decisions).values({
			id: newId,
			eventId: target.eventId,
			meetingId: target.meetingId,
			divisionId: target.divisionId,
			title: target.title,
			content,
			status: 'DRAFT',
			version: target.version + 1,
			supersedesDecisionId: target.id,
			createdBy: actor.memberId
		});
		await db
			.update(decisions)
			.set({ status: 'SUPERSEDED', updatedAt: new Date() })
			.where(and(eq(decisions.id, target.id), eq(decisions.status, 'FINAL')));
		return { success: `Revisi v${target.version + 1} dibuat, versi lama tersimpan.` };
	},

	createTask: async (event) => {
		const actor = requireActor(event);
		if (actor.systemRole === 'COMMITTEE') throw error(403, 'Panitia tidak bisa buat tugas.');
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const meeting = await loadMeeting(db, actor, event.params.id);
		const form = await event.request.formData();
		const decisionId = String(form.get('decisionId') ?? '');
		const title = String(form.get('title') ?? '').trim();
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		const source = await db.query.decisions.findFirst({ where: eq(decisions.id, decisionId) });
		if (!source || source.meetingId !== meeting.id)
			return fail(404, { error: 'Keputusan tidak ada.' });
		const divisionId = source.divisionId ?? meeting.divisionId ?? actor.divisionId;
		if (!divisionId) return fail(400, { error: 'Tugas wajib punya divisi.' });
		if (!canManageTask(actor, { divisionId, assignedTo: null }))
			throw error(403, 'Di luar cakupan divisimu.');
		const id = crypto.randomUUID();
		await db.insert(tasks).values({
			id,
			eventId: actor.eventId,
			divisionId,
			title,
			description: `Dari keputusan: ${source.title}`,
			sourceDecisionId: source.id,
			createdBy: actor.memberId
		});
		return { success: 'Tugas dibuat dari keputusan.', taskId: id };
	}
};
