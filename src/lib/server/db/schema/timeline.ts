import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';

export const timelineCategoryEnum = pgEnum('timeline_category', [
	'PREPARATION',
	'MEETING',
	'EVENT',
	'LOGISTICS',
	'PUBLICATION',
	'D_DAY',
	'POST_EVENT'
]);

export const timelineStatusEnum = pgEnum('timeline_status', [
	'PLANNED',
	'IN_PROGRESS',
	'DONE',
	'CANCELLED'
]);

export const timelineItems = pgTable('timeline_items', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	category: timelineCategoryEnum('category').notNull().default('PREPARATION'),
	startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
	endsAt: timestamp('ends_at', { withTimezone: true }),
	status: timelineStatusEnum('status').notNull().default('PLANNED'),
	ownerMemberId: uuid('owner_member_id').references(() => members.id, { onDelete: 'restrict' }),
	linkedTaskId: uuid('linked_task_id'),
	linkedPublicationId: uuid('linked_publication_id'),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const TIMELINE_CATEGORY_LABELS: Record<string, string> = {
	PREPARATION: 'Persiapan',
	MEETING: 'Musyawarah',
	EVENT: 'Acara',
	LOGISTICS: 'Logistik',
	PUBLICATION: 'Publikasi',
	D_DAY: 'Hari-H',
	POST_EVENT: 'Pascaacara'
};
