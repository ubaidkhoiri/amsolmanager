import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { decisions } from './decisions';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';

export const taskStatusEnum = pgEnum('task_status', [
	'BACKLOG',
	'TODO',
	'IN_PROGRESS',
	'BLOCKED',
	'DONE',
	'CANCELLED'
]);
export const taskPriorityEnum = pgEnum('task_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	divisionId: uuid('division_id')
		.notNull()
		.references(() => divisions.id, { onDelete: 'restrict' }),
	title: text('title').notNull(),
	description: text('description').notNull().default(''),
	assignedTo: uuid('assigned_to').references(() => members.id, { onDelete: 'restrict' }),
	status: taskStatusEnum('status').notNull().default('BACKLOG'),
	priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),
	dueAt: timestamp('due_at', { withTimezone: true }),
	sourceDecisionId: uuid('source_decision_id').references(() => decisions.id, {
		onDelete: 'restrict'
	}),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	completedAt: timestamp('completed_at', { withTimezone: true })
});
