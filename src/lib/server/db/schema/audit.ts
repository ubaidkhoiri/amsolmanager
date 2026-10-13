import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';

export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	actorMemberId: uuid('actor_member_id'),
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	beforeData: jsonb('before_data'),
	afterData: jsonb('after_data'),
	reason: text('reason'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const AUDIT_ACTIONS = [
	'MEMBER_STATUS',
	'ROTATE_CODE',
	'DECISION_REVISE',
	'TRANSACTION_CREATE',
	'TRANSACTION_CORRECT',
	'TRANSACTION_VOID',
	'BUDGET_SET',
	'EVENT_CONFIG'
] as const;
