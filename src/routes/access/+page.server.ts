import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { verifyAccessCode } from '../../lib/server/auth/access-code';
import { loginRateLimiter } from '../../lib/server/auth/rate-limit';
import {
	createSession,
	revokeSession,
	SESSION_COOKIE,
	SESSION_TTL_DAYS
} from '../../lib/server/auth/session';
import { getDb } from '../../lib/server/db/client';
import { members as membersTable } from '../../lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (locals.actor) redirect(303, '/app');
	const db = getDb(platform?.env as Record<string, string | undefined> | undefined);
	const active = await db.query.members.findMany({
		where: eq(membersTable.status, 'ACTIVE'),
		columns: { id: true, name: true, systemRole: true, divisionId: true }
	});
	const divisions = await db.query.divisions.findMany({ columns: { id: true, name: true } });
	const divisionName = new Map(divisions.map((d) => [d.id, d.name]));
	return {
		members: active.map((m) => ({
			id: m.id,
			name: m.name,
			systemRole: m.systemRole,
			division: m.divisionId ? (divisionName.get(m.divisionId) ?? null) : null
		}))
	};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress, platform, url }) => {
		const form = await request.formData();
		const memberId = String(form.get('memberId') ?? '').trim();
		const code = String(form.get('code') ?? '').trim();
		if (!memberId || !code) return fail(400, { error: 'Pilih nama dan isi kode akses.' });
		if (code.length > 200) return fail(400, { error: 'Kode tidak valid.' });
		const db = getDb(platform?.env as Record<string, string | undefined> | undefined);
		const result = await verifyAccessCode(db, loginRateLimiter, {
			memberId,
			code,
			rateKey: `login:${getClientAddress()}:${memberId}`
		});
		if (!result.ok) {
			if (result.reason === 'RATE_LIMITED')
				return fail(429, { error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' });
			return fail(401, { error: 'Nama atau kode salah.' });
		}
		const { token } = await createSession(db, result.member.memberId);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: SESSION_TTL_DAYS * 24 * 60 * 60
		});
		redirect(303, '/app');
	},
	logout: async ({ cookies, platform }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) {
			try {
				const db = getDb(platform?.env as Record<string, string | undefined> | undefined);
				await revokeSession(db, token);
			} catch {
				// logout tetap lanjut walau revoke gagal
			}
		}
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/access');
	}
};
