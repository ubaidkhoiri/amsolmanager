import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Cek cepat isi staging: sisa member tes, event, jumlah divisi.
// Hanya cetak hitungan, tak pernah cetak secret atau isi baris.
const line = fs
	.readFileSync(new URL('../.env', import.meta.url), 'utf8')
	.split('\n')
	.find((l) => l.startsWith('TEST_DATABASE_URL='));
const url = line.slice('TEST_DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
const sql = neon(url);
const members = await sql.query(
	"SELECT count(*)::int AS c FROM members WHERE name LIKE '\\_\\_sec\\_%' ESCAPE '\\' OR name LIKE '\\_\\_test\\_%' ESCAPE '\\'"
);
const events = await sql.query('SELECT slug FROM events');
const divisions = await sql.query('SELECT count(*)::int AS c FROM divisions');
console.log('sisa member tes di staging:', members[0].c);
console.log('events:', events.map((r) => r.slug).join(','));
console.log('divisions:', divisions[0].c);
