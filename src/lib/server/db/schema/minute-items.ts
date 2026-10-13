import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { meetings } from './meetings';
import { members } from './members';

export const minuteStatusEnum = pgEnum('minute_status', ['OPEN', 'DONE']);

export const minuteItems = pgTable('minute_items', {
	id: uuid('id').primaryKey(),
	meetingId: uuid('meeting_id')
		.notNull()
		.references(() => meetings.id, { onDelete: 'cascade' }),
	divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
	topic: text('topic').notNull(),
	discussionSummary: text('discussion_summary'),
	proposal: text('proposal'),
	outcome: text('outcome'),
	status: minuteStatusEnum('status').notNull().default('OPEN'),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
