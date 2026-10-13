import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync('C:\\Users\\ubdd\\_code\\amsolmanager\\.env', 'utf8');
let url = env.split('\n').find((l) => l.startsWith('DATABASE_URL=')).slice('DATABASE_URL='.length).trim();
if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) url = url.slice(1, -1);
const sql = neon(url);
const ids = await sql`select id from members where name like '__test\\_%'`;
console.log('test members found: ' + ids.length);
for (const { id } of ids) {
	await sql`delete from sessions where member_id = ${id}`;
	await sql`delete from members where id = ${id}`;
}
const codes = await sql`delete from access_codes where version > 1 returning id`;
console.log('test codes removed: ' + codes.length);
const left = await sql`select count(*)::int as c from members where name like '__test\\_%'`;
console.log('remaining: ' + left[0].c);
