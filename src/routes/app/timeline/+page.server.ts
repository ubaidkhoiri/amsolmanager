import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { canManageTimeline, type Actor } from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import {
	divisions,
	members,
	timelineCategoryEnum,
	timelineItems,
	timelineStatusEnum,
	TIMELINE_CATEGORY_LABELS
} from '../../../lib/server/db/schema';
import { canTransition, TIMELINE_TRANSITIONS } from '../../../lib/workflow';
import type { Actions, PageServerLoad } from './$types';

type Db = ReturnType<typeof getDb>;

type Category = (typeof timelineCategoryEnum.enumValues)[number];
type ItemStatus = (typeof timelineStatusEnum.enumValues)[number];

const CATEGORIES: Category[] = [...timelineCategoryEnum.enumValues];
const STATUSES: ItemStatus[] = [...timelineStatusEnum.enumValues];

function isCategory(value: string): value is Category {
	return (CATEGORIES as string[]).includes(value);
}

function isItemStatus(value: string): value is ItemStatus {
	return (STATUSES as string[]).includes(value);
}

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

async function loadItem(db: Db, actor: Actor, id: string) {
	const item = await db.query.timelineItems.findFirst({
		where: eq(timelineItems.id, id)
	});
	if (!item || item.eventId !== actor.eventId) throw error(404, 'Item tidak ada.');
	if (!canManageTimeline(actor, { divisionId: item.divisionId }))
		throw error(403, 'Di luar cakupan divisimu.');
	return item;
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const q = event.url.searchParams;
	const division = q.get('division')?.trim() || null;
	const category = q.get('category')?.trim() || null;
	const status = q.get('status')?.trim() || null;
	const from = q.get('from')?.trim() || null;
	const to = q.get('to')?.trim() || null;
	const clauses = [eq(timelineItems.eventId, actor.eventId)];
	if (division) clauses.push(eq(timelineItems.divisionId, division));
	if (category && isCategory(category)) clauses.push(eq(timelineItems.category, category));
	if (status && isItemStatus(status)) clauses.push(eq(timelineItems.status, status));
	if (from) {
		const d = new Date(from);
		if (!Number.isNaN(d.getTime())) clauses.push(gte(timelineItems.startsAt, d));
	}
	if (to) {
		const d = new Date(to);
		if (!Number.isNaN(d.getTime())) clauses.push(lte(timelineItems.startsAt, d));
	}
	const [rows, allDivisions] = await Promise.all([
		db.query.timelineItems.findMany({
			where: and(...clauses),
			orderBy: asc(timelineItems.startsAt)
		}),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) })
	]);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	const groups = new Map<string, typeof rows>();
	for (const r of rows) {
		const day = r.startsAt.toISOString().slice(0, 10);
		if (!groups.has(day)) groups.set(day, []);
		groups.get(day)?.push(r);
	}
	return {
		actor,
		groups: [...groups.entries()].map(([day, items]) => ({
			day,
			items: items.map((r) => ({
				id: r.id,
				title: r.title,
				category: TIMELINE_CATEGORY_LABELS[r.category] ?? r.category,
				status: r.status,
				starts: r.startsAt.toISOString().slice(0, 16).replace('T', ' '),
				end: r.endsAt ? r.endsAt.toISOString().slice(0, 16).replace('T', ' ') : null,
				division: r.divisionId ? (divisionName.get(r.divisionId) ?? '?') : 'Semua',
				nextStatuses: TIMELINE_TRANSITIONS[r.status] ?? []
			}))
		})),
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name })),
		categories: CATEGORIES.map((c) => ({ value: c, label: TIMELINE_CATEGORY_LABELS[c] })),
		statuses: STATUSES,
		filters: { division, category, status, from, to },
		canManage: actor.systemRole !== 'COMMITTEE'
	};
};

export const actions: Actions = {
	create: async (event) => {
		const actor = requireActor(event);
		if (actor.systemRole === 'COMMITTEE') throw error(403, 'Panitia tidak bisa buat timeline.');
		const form = await event.request.formData();
		const title = String(form.get('title') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const category = String(form.get('category') ?? 'PREPARATION');
		const startsRaw = String(form.get('startsAt') ?? '').trim();
		const endsRaw = String(form.get('endsAt') ?? '').trim();
		const divisionId = String(form.get('divisionId') ?? '').trim() || null;
		const ownerMemberId = String(form.get('ownerMemberId') ?? '').trim() || null;
		if (title.length < 3 || title.length > 120)
			return fail(400, { error: 'Judul 3 sampai 120 karakter.' });
		if (!isCategory(category)) return fail(400, { error: 'Kategori tidak valid.' });
		const startsAt = new Date(startsRaw);
		if (Number.isNaN(startsAt.getTime())) return fail(400, { error: 'Waktu mulai tidak valid.' });
		let endsAt: Date | null = null;
		if (endsRaw) {
			endsAt = new Date(endsRaw);
			if (Number.isNaN(endsAt.getTime())) return fail(400, { error: 'Waktu selesai tidak valid.' });
			if (endsAt < startsAt) return fail(400, { error: 'Selesai tidak boleh sebelum mulai.' });
		}
		if (actor.systemRole !== 'MOD' && divisionId !== actor.divisionId)
			return fail(403, { error: 'Hanya untuk divisimu.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		if (divisionId) {
			const division = await db.query.divisions.findFirst({
				where: eq(divisions.id, divisionId)
			});
			if (!division || division.eventId !== actor.eventId)
				return fail(400, { error: 'Divisi tidak valid.' });
		}
		if (ownerMemberId) {
			const owner = await db.query.members.findFirst({
				where: eq(members.id, ownerMemberId)
			});
			if (!owner || owner.eventId !== actor.eventId)
				return fail(400, { error: 'PIC tidak valid.' });
		}
		const id = crypto.randomUUID();
		await db.insert(timelineItems).values({
			id,
			eventId: actor.eventId,
			divisionId,
			title,
			description,
			category,
			startsAt,
			endsAt,
			ownerMemberId,
			createdBy: actor.memberId
		});
		return { success: 'Item timeline dibuat.' };
	},

	advance: async (event) => {
		const actor = requireActor(event);
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const form = await event.request.formData();
		const itemId = String(form.get('itemId') ?? '');
		const to = String(form.get('status') ?? '');
		const item = await loadItem(db, actor, itemId);
		if (!canTransition(TIMELINE_TRANSITIONS, item.status, to))
			return fail(400, { error: `Transisi ${item.status} ke ${to} tidak valid.` });
		await db
			.update(timelineItems)
			.set({ status: to as typeof item.status, updatedAt: new Date() })
			.where(eq(timelineItems.id, itemId));
		return { success: `Timeline jadi ${to}.` };
	}
};
