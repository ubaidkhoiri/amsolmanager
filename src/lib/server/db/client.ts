import { DATABASE_URL } from '$app/env/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sanitizeDatabaseUrl } from '../../db-url';
import * as schema from './schema';

export function createDb(url: string) {
	const sql = neon(sanitizeDatabaseUrl(url));
	return drizzle({ client: sql, schema });
}

export type Db = ReturnType<typeof createDb>;

export function resolveDatabaseUrl(
	platformEnv?: Record<string, string | undefined>
): string | undefined {
	if (platformEnv?.DATABASE_URL) return platformEnv.DATABASE_URL;
	if (DATABASE_URL) return DATABASE_URL;
	if (typeof process !== 'undefined') return process.env.DATABASE_URL;
	return undefined;
}

export function getDb(platformEnv?: Record<string, string | undefined>): Db {
	const url = resolveDatabaseUrl(platformEnv);
	if (!url) throw new Error('DATABASE_URL is not configured');
	return createDb(url);
}
