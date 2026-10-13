import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { members } from './members';

export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey(),
	memberId: uuid('member_id')
		.notNull()
		.references(() => members.id, { onDelete: 'restrict' }),
	sessionTokenHash: text('session_token_hash').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
});
