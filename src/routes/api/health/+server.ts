import { json } from '@sveltejs/kit';
import { isDbConfigured } from '../../../lib/health';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const envUrl = (platform?.env as Record<string, string | undefined> | undefined)?.DATABASE_URL;
	const localUrl = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
	return json({
		app: 'amsolmanager',
		status: 'ok',
		dbConfigured: isDbConfigured(envUrl, localUrl)
	});
};
