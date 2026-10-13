import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';
import { taskPriorityEnum, tasks } from './tasks';

export const supportStatusEnum = pgEnum('support_status', [
	'SUBMITTED',
	'UNDER_REVIEW',
	'NEEDS_INFORMATION',
	'ACCEPTED',
	'IN_PROGRESS',
	'COMPLETED',
	'REJECTED',
	'CANCELLED'
]);

export const supportRequests = pgTable('support_requests', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	requestingDivisionId: uuid('requesting_division_id')
		.notNull()
		.references(() => divisions.id, { onDelete: 'restrict' }),
	targetDivisionId: uuid('target_division_id')
		.notNull()
		.references(() => divisions.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	reason: text('reason').notNull().default(''),
	priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),
	neededBy: timestamp('needed_by', { withTimezone: true }),
	status: supportStatusEnum('status').notNull().default('SUBMITTED'),
	requestedBy: uuid('requested_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	acceptedBy: uuid('accepted_by').references(() => members.id, { onDelete: 'restrict' }),
	response: text('response'),
	linkedTaskId: uuid('linked_task_id').references(() => tasks.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	completedAt: timestamp('completed_at', { withTimezone: true })
});
