import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '..');

const envLine = fs
	.readFileSync(path.join(projectRoot, '.env'), 'utf8')
	.split('\n')
	.find((l) => l.startsWith('DATABASE_URL='));
if (!envLine) {
	console.error('seed fail: DATABASE_URL missing in .env');
	process.exit(1);
}
const url = envLine.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
const sql = neon(url);

const divisions = ['PDD IT', 'Acara', 'Konsumsi', 'Perkab', 'P3K', 'Lighting', 'Tempat'];
const slugOf = (name) => name.toLowerCase().replace(/\s+/g, '-');

await sql`INSERT INTO events (id, name, slug, description, status) VALUES (${randomUUID()}, 'GenAwards: Cook Edition', 'genawards-cook-edition', 'Pengajian Akhir Tahun PAT', 'ACTIVE') ON CONFLICT (slug) DO NOTHING`;
const rows = await sql`SELECT id FROM events WHERE slug = 'genawards-cook-edition'`;
const eventId = rows[0].id;

for (const name of divisions) {
	await sql`INSERT INTO divisions (id, event_id, name, slug) VALUES (${randomUUID()}, ${eventId}, ${name}, ${slugOf(name)}) ON CONFLICT (event_id, slug) DO NOTHING`;
}
const count = await sql`SELECT count(*)::int AS n FROM divisions WHERE event_id = ${eventId}`;
console.log(`seed ok: event genawards-cook-edition, divisions=${count[0].n}`);
