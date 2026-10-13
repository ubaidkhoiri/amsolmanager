import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, ne } from 'drizzle-orm';
import { canManageTask, type Actor } from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import { divisions, members, tasks } from '../../../lib/server/db/schema';
import {
	canTransition,
	isTaskOverdue,
	TASK_TRANSITIONS,
	taskRequiresAssigneeAndDue
} from '../../../lib/workflow';
import type { Actions, PageServerLoad } from './$types';

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const base = [eq(tasks.eventId, actor.eventId), ne(tasks.status, 'CANCELLED')];
	const scopeFilter =
		actor.systemRole === 'MOD'
			? and(...base)
			: actor.systemRole === 'DIVISION_ADMIN' && actor.divisionId
				? and(...base, eq(tasks.divisionId, actor.divisionId))
				: and(...base, eq(tasks.assignedTo, actor.memberId));
	const [rows, allDivisions, allMembers] = await Promise.all([
		db.query.tasks.findMany({ where: scopeFilter, orderBy: asc(tasks.dueAt) }),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) }),
		db.query.members.findMany()
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	const memberName = new Map(allMembers.map((m) => [m.id, m.name]));
	return {
		actor,
		tasks: rows.map((t) => ({
			id: t.id,
			title: t.title,
			description: t.description,
			status: t.status,
			priority: t.priority,
			dueAt: t.dueAt?.toISOString() ?? null,
			overdue: isTaskOverdue(t.dueAt, t.status),
			division: divisionName.get(t.divisionId) ?? '?',
			assignee: t.assignedTo ? (memberName.get(t.assignedTo) ?? '?') : null,
			fromDecision: t.sourceDecisionId !== null,
			canManage: canManageTask(actor, { divisionId: t.divisionId, assignedTo: t.assignedTo }),
			nextStatuses: TASK_TRANSITIONS[t.status] ?? []
		})),
		members: allMembers.map((m) => ({ id: m.id, name: m.name }))
	};
};

export const actions: Actions = {
	setStatus: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const taskId = String(form.get('taskId') ?? '');
		const to = String(form.get('status') ?? '');
		const target = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
		if (!target || target.eventId !== actor.eventId)
			return fail(404, { error: 'Tugas tidak ada.' });
		if (!canManageTask(actor, { divisionId: target.divisionId, assignedTo: target.assignedTo }))
			throw error(403, 'Tidak boleh ubah tugas ini.');
		if (!canTransition(TASK_TRANSITIONS, target.status, to))
			return fail(400, { error: `Transisi ${target.status} ke ${to} tidak valid.` });
		if (taskRequiresAssigneeAndDue(to) && (!target.assignedTo || !target.dueAt))
			return fail(400, { error: 'Isi PIC dan deadline dulu sebelum jalan.' });
		await db
			.update(tasks)
			.set({
				status: to as typeof target.status,
				completedAt: to === 'DONE' ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(tasks.id, taskId));
		return { success: `Tugas jadi ${to}.` };
	},

	assign: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const taskId = String(form.get('taskId') ?? '');
		const assignedTo = String(form.get('assignedTo') ?? '').trim() || null;
		const dueAtRaw = String(form.get('dueAt') ?? '').trim();
		const target = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
		if (!target || target.eventId !== actor.eventId)
			return fail(404, { error: 'Tugas tidak ada.' });
		if (!canManageTask(actor, { divisionId: target.divisionId, assignedTo: target.assignedTo }))
			throw error(403, 'Tidak boleh ubah tugas ini.');
		let dueAt: Date | null = target.dueAt;
		if (dueAtRaw) {
			dueAt = new Date(dueAtRaw);
			if (Number.isNaN(dueAt.getTime())) return fail(400, { error: 'Deadline tidak valid.' });
		}
		if (assignedTo) {
			const assignee = await db.query.members.findFirst({ where: eq(members.id, assignedTo) });
			if (!assignee || assignee.eventId !== actor.eventId)
				return fail(400, { error: 'PIC tidak valid.' });
		}
		await db
			.update(tasks)
			.set({ assignedTo, dueAt, updatedAt: new Date() })
			.where(eq(tasks.id, taskId));
		return { success: 'PIC dan deadline disimpan.' };
	}
};
