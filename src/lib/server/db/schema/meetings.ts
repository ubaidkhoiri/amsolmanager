import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';

export const meetingTypeEnum = pgEnum('meeting_type', ['PLENARY', 'DIVISION']);
export const meetingStatusEnum = pgEnum('meeting_status', [
	'DRAFT',
	'SCHEDULED',
	'IN_PROGRESS',
	'COMPLETED',
	'ARCHIVED',
	'CANCELLED'
]);

export const meetings = pgTable('meetings', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	meetingType: meetingTypeEnum('meeting_type').notNull(),
	divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
	startsAt: timestamp('starts_at', { withTimezone: true }),
	location: text('location'),
	agenda: text('agenda').notNull().default(''),
	status: meetingStatusEnum('status').notNull().default('DRAFT'),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
