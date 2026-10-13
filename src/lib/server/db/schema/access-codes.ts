import { boolean, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';
import { systemRoleEnum } from './members';

export const accessCodes = pgTable(
	'access_codes',
	{
		id: uuid('id').primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'restrict' }),
		role: systemRoleEnum('role').notNull(),
		codeHash: text('code_hash').notNull().unique(),
		version: integer('version').notNull().default(1),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		rotatedAt: timestamp('rotated_at', { withTimezone: true })
	},
	(t) => [unique('access_codes_event_role_version_unique').on(t.eventId, t.role, t.version)]
);
