import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '..');
const drizzleDir = path.join(projectRoot, 'drizzle');
const journal = JSON.parse(fs.readFileSync(path.join(drizzleDir, 'meta', '_journal.json'), 'utf8'));

// MIGRATE_URL menang bila ada (untuk staging), kalau tidak .env DATABASE_URL.
let url = (process.env.MIGRATE_URL ?? '').replace(/^"|"$/g, '').trim();
if (!url) {
	const envLine = fs
		.readFileSync(path.join(projectRoot, '.env'), 'utf8')
		.split('\n')
		.find((l) => l.startsWith('DATABASE_URL='));
	if (!envLine) {
		console.error('migrate fail: MIGRATE_URL kosong dan DATABASE_URL missing in .env');
		process.exit(1);
	}
	url = envLine.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
}
const sql = neon(url);

await sql`CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
const applied = await sql`SELECT filename FROM schema_migrations`;
const done = new Set(applied.map((r) => r.filename));

for (const entry of journal.entries) {
	const file = `${entry.tag}.sql`;
	if (done.has(file)) {
		console.log(`skip ${file}: already applied`);
		continue;
	}
	const raw = fs.readFileSync(path.join(drizzleDir, file), 'utf8');
	const statements = raw
		.split('--> statement-breakpoint')
		.map((s) => s.trim())
		.filter(Boolean);
	for (const stmt of statements) {
		await sql.query(stmt);
	}
	await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
	console.log(`applied ${file}: ${statements.length} statements`);
}
console.log(`project root: ${projectRoot}`);
