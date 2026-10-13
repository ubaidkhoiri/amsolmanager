import { boolean, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { events } from './events';

export const divisions = pgTable(
	'divisions',
	{
		id: uuid('id').primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'restrict' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description'),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		unique('divisions_event_slug_unique').on(t.eventId, t.slug),
		unique('divisions_event_name_unique').on(t.eventId, t.name)
	]
);
