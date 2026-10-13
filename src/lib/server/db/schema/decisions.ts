import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';
import { meetings } from './meetings';
import { members } from './members';

export const decisionStatusEnum = pgEnum('decision_status', [
	'DRAFT',
	'NEEDS_DISCUSSION',
	'FINAL',
	'SUPERSEDED'
]);

export const decisions = pgTable('decisions', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	meetingId: uuid('meeting_id')
		.notNull()
		.references(() => meetings.id, { onDelete: 'restrict' }),
	divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	content: text('content').notNull().default(''),
	status: decisionStatusEnum('status').notNull().default('DRAFT'),
	version: integer('version').notNull().default(1),
	decidedBy: uuid('decided_by').references(() => members.id, { onDelete: 'restrict' }),
	decidedAt: timestamp('decided_at', { withTimezone: true }),
	supersedesDecisionId: uuid('supersedes_decision_id').references((): AnyPgColumn => decisions.id, {
		onDelete: 'restrict'
	}),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
