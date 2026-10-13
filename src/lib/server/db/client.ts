import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export function createDb(url: string) {
	const sql = neon(url);
	return drizzle({ client: sql });
}

export type Db = ReturnType<typeof createDb>;
