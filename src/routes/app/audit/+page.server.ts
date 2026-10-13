import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '../../../lib/server/db/client';
import { auditLogs } from '../../../lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	if (event.locals.actor.systemRole !== 'MOD') throw error(403, 'Hanya MOD.');
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const rows = await db.query.auditLogs.findMany({
		where: eq(auditLogs.eventId, event.locals.actor.eventId),
		orderBy: desc(auditLogs.createdAt),
		limit: 200
	});
	return {
		logs: rows.map((l) => ({
			action: l.action,
			entity: `${l.entityType}:${l.entityId.slice(0, 8)}`,
			before: l.beforeData === null ? null : JSON.stringify(l.beforeData),
			after: l.afterData === null ? null : JSON.stringify(l.afterData),
			reason: l.reason,
			at: l.createdAt.toISOString().slice(0, 16).replace('T', ' ')
		}))
	};
};
