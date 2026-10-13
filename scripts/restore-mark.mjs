import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Alat uji restore PITR, lihat docs/OPS.md. Target: TEST_DATABASE_URL.
// node scripts/restore-mark.mjs insert -> sisip marker, cetak T0 ISO
// node scripts/restore-mark.mjs check  -> 1 bila marker ada, 0 bila tidak
// node scripts/restore-mark.mjs clean  -> hapus marker
const mode = process.argv[2];
const fallback = fs
	.readFileSync(new URL('../.env', import.meta.url), 'utf8')
	.split('\n')
	.find((l) => l.startsWith('TEST_DATABASE_URL='))
	.slice('TEST_DATABASE_URL='.length)
	.replace(/^"|"$/g, '')
	.trim();
const sql = neon(process.argv[3] ?? fallback);

if (mode === 'insert') {
	const t0 = new Date().toISOString();
	const events = await sql.query("SELECT id FROM events WHERE slug = 'genawards-cook-edition'");
	await sql.query(
		"INSERT INTO members (id, event_id, name, system_role) VALUES (gen_random_uuid(), '" +
			events[0].id +
			"', '__restore_probe__', 'COMMITTEE')"
	);
	console.log('T0=' + t0);
} else if (mode === 'check') {
	const rows = await sql.query(
		"SELECT count(*)::int AS c FROM members WHERE name = '__restore_probe__'"
	);
	console.log(rows[0].c);
} else if (mode === 'clean') {
	await sql.query("DELETE FROM members WHERE name = '__restore_probe__'");
	console.log('cleaned');
} else {
	console.error('mode: insert|check|clean');
	process.exit(1);
}
