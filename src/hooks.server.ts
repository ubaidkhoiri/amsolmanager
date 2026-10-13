import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, validateSessionToken } from './lib/server/auth/session';
import { getDb } from './lib/server/db/client';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.actor = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		try {
			const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
			event.locals.actor = await validateSessionToken(db, token);
		} catch {
			event.locals.actor = null;
		}
	}
	return resolve(event);
};
