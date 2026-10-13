import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';

export const publicationStatusEnum = pgEnum('publication_status', [
	'IDEA',
	'DRAFT',
	'REVIEW',
	'APPROVED',
	'PUBLISHED',
	'CANCELLED'
]);

export const publications = pgTable('publications', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	divisionId: uuid('division_id')
		.notNull()
		.references(() => divisions.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	channel: text('channel').notNull().default(''),
	format: text('format').notNull().default(''),
	caption: text('caption').notNull().default(''),
	scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
	status: publicationStatusEnum('status').notNull().default('IDEA'),
	designOwnerId: uuid('design_owner_id').references(() => members.id, { onDelete: 'restrict' }),
	copyOwnerId: uuid('copy_owner_id').references(() => members.id, { onDelete: 'restrict' }),
	assetUrl: text('asset_url'),
	publishedUrl: text('published_url'),
	approvedBy: uuid('approved_by').references(() => members.id, { onDelete: 'restrict' }),
	approvedAt: timestamp('approved_at', { withTimezone: true }),
	cancelReason: text('cancel_reason'),
	scheduleNote: text('schedule_note'),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
