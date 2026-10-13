export function sanitizeDatabaseUrl(url: string): string {
	// Secrets injected via stdin (wrangler secret put) can carry literal
	// quotes or trailing newlines that dotenv strips locally. Trim them
	// so local and Workers resolve the same value.
	let clean = url.trim();
	if (
		(clean.startsWith('"') && clean.endsWith('"')) ||
		(clean.startsWith("'") && clean.endsWith("'"))
	) {
		clean = clean.slice(1, -1).trim();
	}
	try {
		const parsed = new URL(clean);
		// neon-http rejects channel_binding in Workers URL parsing.
		// It only affects SCRAM channel binding over pooled connections,
		// TLS via sslmode=require stays intact.
		parsed.searchParams.delete('channel_binding');
		return parsed.toString();
	} catch {
		return clean;
	}
}
