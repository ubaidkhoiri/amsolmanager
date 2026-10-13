export function isDbConfigured(envUrl?: string | null, localUrl?: string | null): boolean {
	return Boolean(envUrl ?? localUrl);
}
