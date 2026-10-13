// Bootstrap once: create first MOD member + MOD access code, print code ONCE.
// Usage: node scripts/bootstrap-mod.mjs "Nama Lengkap"
// Refuses if an active MOD code already exists (rotate from Anggota page instead).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const name = process.argv[2]?.trim();
if (!name || name.length < 2 || name.length > 80) {
	console.error('usage: node scripts/bootstrap-mod.mjs "Nama Lengkap"');
	process.exit(1);
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, '..');
const envLine = fs
	.readFileSync(path.join(projectRoot, '.env'), 'utf8')
	.split('\n')
	.find((l) => l.startsWith('DATABASE_URL='));
if (!envLine) {
	console.error('bootstrap fail: DATABASE_URL missing in .env');
	process.exit(1);
}
const url = envLine.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
const sql = neon(url);

const events = await sql`SELECT id FROM events WHERE slug = 'genawards-cook-edition'`;
if (events.length === 0) {
	console.error('bootstrap fail: event not seeded, run db-seed first');
	process.exit(1);
}
const eventId = events[0].id;

const liveCodes =
	await sql`SELECT id FROM access_codes WHERE event_id = ${eventId} AND role = 'MOD' AND is_active = true`;
if (liveCodes.length > 0) {
	console.error('bootstrap refuse: kode MOD aktif sudah ada, rotasi dari halaman Anggota');
	process.exit(1);
}

let mods =
	await sql`SELECT id, name FROM members WHERE event_id = ${eventId} AND system_role = 'MOD' AND status = 'ACTIVE'`;
let memberId;
if (mods.length > 0) {
	memberId = mods[0].id;
	console.log(`member MOD ada: ${mods[0].name}`);
} else {
	memberId = randomUUID();
	await sql`INSERT INTO members (id, event_id, name, system_role, status) VALUES (${memberId}, ${eventId}, ${name}, 'MOD', 'ACTIVE')`;
	console.log(`member MOD dibuat: ${name}`);
}

const bytes = crypto.getRandomValues(new Uint8Array(18));
let binary = '';
for (const b of bytes) binary += String.fromCharCode(b);
const raw = `GA-${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
await sql`INSERT INTO access_codes (id, event_id, role, code_hash, version) VALUES (${randomUUID()}, ${eventId}, 'MOD', ${hash}, 1)`;
console.log('--- SIMPAN SEKARANG, TIDAK TAMPIL LAGI ---');
console.log(raw);
