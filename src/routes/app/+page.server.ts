import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { getDb } from '../../lib/server/db/client';
import { decisions, meetings, tasks } from '../../lib/server/db/schema';
import { isTaskOverdue } from '../../lib/workflow';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const actor = event.locals.actor;
	if (!actor) return { actor: null };
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const meetingScope =
		actor.systemRole === 'MOD' || actor.divisionId === null
			? eq(meetings.eventId, actor.eventId)
			: and(
					eq(meetings.eventId, actor.eventId),
					or(eq(meetings.divisionId, actor.divisionId), isNull(meetings.divisionId))
				);
	const [upcoming, myTasks, recentDecisions] = await Promise.all([
		db.query.meetings.findMany({
			where: and(meetingScope, inArray(meetings.status, ['SCHEDULED', 'IN_PROGRESS'] as const)),
			orderBy: asc(meetings.startsAt)
		}),
		db.query.tasks.findMany({
			where: and(
				eq(tasks.eventId, actor.eventId),
				eq(tasks.assignedTo, actor.memberId),
				inArray(tasks.status, ['TODO', 'IN_PROGRESS', 'BLOCKED'] as const)
			),
			orderBy: asc(tasks.dueAt)
		}),
		db.query.decisions.findMany({
			where: and(eq(decisions.eventId, actor.eventId), eq(decisions.status, 'FINAL')),
			orderBy: desc(decisions.decidedAt)
		})
	]);
	return {
		actor,
		upcoming: upcoming.slice(0, 5).map((m) => ({
			id: m.id,
			title: m.title,
			status: m.status,
			meetingType: m.meetingType,
			startsAt: m.startsAt?.toISOString() ?? null
		})),
		myTasks: myTasks.slice(0, 5).map((t) => ({
			id: t.id,
			title: t.title,
			status: t.status,
			dueAt: t.dueAt?.toISOString() ?? null,
			overdue: isTaskOverdue(t.dueAt, t.status)
		})),
		recentDecisions: recentDecisions.slice(0, 5).map((d) => ({
			id: d.id,
			meetingId: d.meetingId,
			title: d.title,
			version: d.version,
			decidedAt: d.decidedAt?.toISOString() ?? null
		}))
	};
};
