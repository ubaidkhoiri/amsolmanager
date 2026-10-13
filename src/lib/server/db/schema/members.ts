import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { divisions } from './divisions';
import { events } from './events';

export const systemRoleEnum = pgEnum('system_role', ['MOD', 'DIVISION_ADMIN', 'COMMITTEE']);
export const memberStatusEnum = pgEnum('member_status', ['ACTIVE', 'INACTIVE']);

export const members = pgTable('members', {
	id: uuid('id').primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'restrict' }),
	divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
	name: text('name').notNull(),
	organizationalPosition: text('organizational_position'),
	systemRole: systemRoleEnum('system_role').notNull(),
	status: memberStatusEnum('status').notNull().default('ACTIVE'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
