import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

const line = fs
	.readFileSync(new URL('../.env', import.meta.url), 'utf8')
	.split('\n')
	.find((l) => l.startsWith('DATABASE_URL='));
if (!line) {
	console.error('db ping fail: DATABASE_URL missing in .env');
	process.exit(1);
}
const url = line.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
const started = Date.now();
const rows = await neon(url).query('select 1 as ok');
console.log('db ping ok:', JSON.stringify(rows), `${Date.now() - started}ms`);
