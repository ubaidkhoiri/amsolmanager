import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// TEST_DATABASE_URL menang bila ada (staging). Tanpa itu, fallback ke
// DATABASE_URL produksi. Jangan set TEST_DATABASE_URL ke produksi.
export function loadDatabaseUrl(): string {
	const fromEnv = (process.env.TEST_DATABASE_URL ?? '').trim();
	if (fromEnv) return fromEnv;
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
	const lines = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n');
	for (const key of ['TEST_DATABASE_URL', 'DATABASE_URL']) {
		const line = lines.find((l) => l.startsWith(`${key}=`));
		if (line)
			return line
				.slice(key.length + 1)
				.replace(/^"|"$/g, '')
				.trim();
	}
	throw new Error('.env tanpa TEST_DATABASE_URL maupun DATABASE_URL, integrasi batal');
}
