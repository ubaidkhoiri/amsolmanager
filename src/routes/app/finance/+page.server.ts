import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import {
	canManageBudget,
	canManageTransaction,
	type Actor
} from '../../../lib/server/auth/permissions';
import { getDb } from '../../../lib/server/db/client';
import { auditLogs, budgets, divisions, transactions } from '../../../lib/server/db/schema';
import {
	formatRupiah,
	parseAmountToCents,
	summarizeBudget,
	summarizeLedger,
	type MoneyRow
} from '../../../lib/finance';
import type { Actions, PageServerLoad } from './$types';

function requireActor(event: { locals: App.Locals }): Actor {
	if (!event.locals.actor) throw error(401, 'Harus masuk dulu.');
	return event.locals.actor;
}

function publicTransaction(t: typeof transactions.$inferSelect) {
	return {
		id: t.id,
		type: t.type,
		amount: t.amount,
		category: t.category,
		description: t.description,
		date: t.transactionDate.toISOString().slice(0, 10),
		status: t.status,
		divisionId: t.divisionId
	};
}

export const load: PageServerLoad = async (event) => {
	const actor = requireActor(event);
	const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
	const [rows, allBudgets, allDivisions] = await Promise.all([
		db.query.transactions.findMany({
			where: eq(transactions.eventId, actor.eventId),
			orderBy: desc(transactions.transactionDate)
		}),
		db.query.budgets.findMany({ where: eq(budgets.eventId, actor.eventId) }),
		db.query.divisions.findMany({ where: eq(divisions.eventId, actor.eventId) })
	]);
	const moneyRows: MoneyRow[] = rows.map((t) => ({
		type: t.type,
		amount: t.amount,
		status: t.status,
		divisionId: t.divisionId
	}));
	const ledger = summarizeLedger(moneyRows);
	const divisionName = new Map(allDivisions.map((d) => [d.id, d.name]));
	const budgetCards = allBudgets.map((b) => {
		const planned = Math.round(Number(b.plannedAmount) * 100);
		const summary = summarizeBudget(planned, moneyRows, b.divisionId);
		return {
			id: b.id,
			division: divisionName.get(b.divisionId) ?? '?',
			category: b.category,
			planned: formatRupiah(summary.planned),
			realized: formatRupiah(summary.realized),
			remaining: formatRupiah(summary.remaining),
			diff: formatRupiah(summary.diff),
			percent: summary.percent === null ? 'tidak tersedia' : `${summary.percent.toFixed(1)}%`
		};
	});
	return {
		actor,
		canWrite: canManageTransaction(actor),
		canBudget: canManageBudget(actor),
		income: formatRupiah(ledger.income),
		expense: formatRupiah(ledger.expense),
		balance: formatRupiah(ledger.balance),
		transactions: rows.map(publicTransaction),
		budgets: budgetCards,
		divisions: allDivisions.map((d) => ({ id: d.id, name: d.name }))
	};
};

export const actions: Actions = {
	create: async (event) => {
		const actor = requireActor(event);
		if (!canManageTransaction(actor)) throw error(403, 'Hanya Bendahara atau MOD.');
		const form = await event.request.formData();
		const type = String(form.get('type') ?? '');
		const cents = parseAmountToCents(String(form.get('amount') ?? ''));
		const category = String(form.get('category') ?? '')
			.trim()
			.slice(0, 120);
		const description = String(form.get('description') ?? '')
			.trim()
			.slice(0, 2000);
		const dateRaw = String(form.get('date') ?? '').trim();
		const divisionId = String(form.get('divisionId') ?? '').trim() || null;
		const evidenceUrl = String(form.get('evidenceUrl') ?? '').trim() || null;
		if (type !== 'INCOME' && type !== 'EXPENSE')
			return fail(400, { error: 'Jenis harus INCOME atau EXPENSE.' });
		if (cents === null) return fail(400, { error: 'Nominal harus angka positif.' });
		const transactionDate = new Date(dateRaw || Date.now());
		if (Number.isNaN(transactionDate.getTime()))
			return fail(400, { error: 'Tanggal tidak valid.' });
		if (evidenceUrl && !/^https?:\/\/.+/i.test(evidenceUrl))
			return fail(400, { error: 'Tautan bukti harus http atau https.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		if (divisionId) {
			const division = await db.query.divisions.findFirst({
				where: and(eq(divisions.id, divisionId), eq(divisions.eventId, actor.eventId))
			});
			if (!division) return fail(400, { error: 'Divisi tidak valid.' });
		}
		const id = crypto.randomUUID();
		const after = {
			type,
			amount: (cents / 100).toFixed(2),
			category,
			description,
			divisionId,
			date: transactionDate.toISOString()
		};
		await db.transaction(async (tx) => {
			await tx.insert(transactions).values({
				id,
				eventId: actor.eventId,
				divisionId,
				type: type as 'INCOME' | 'EXPENSE',
				amount: (cents / 100).toFixed(2),
				category,
				description,
				transactionDate,
				evidenceUrl,
				recordedBy: actor.memberId
			});
			await tx.insert(auditLogs).values({
				id: crypto.randomUUID(),
				eventId: actor.eventId,
				actorMemberId: actor.memberId,
				action: 'TRANSACTION_CREATE',
				entityType: 'transaction',
				entityId: id,
				beforeData: null,
				afterData: after,
				reason: null
			});
		});
		return { success: 'Transaksi dicatat.' };
	},

	correct: async (event) => {
		const actor = requireActor(event);
		if (!canManageTransaction(actor)) throw error(403, 'Hanya Bendahara atau MOD.');
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const cents = parseAmountToCents(String(form.get('amount') ?? ''));
		const reason = String(form.get('reason') ?? '').trim();
		if (cents === null) return fail(400, { error: 'Nominal harus angka positif.' });
		if (reason.length < 3) return fail(400, { error: 'Tulis alasan koreksi.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const row = await db.query.transactions.findFirst({
			where: and(eq(transactions.id, id), eq(transactions.eventId, actor.eventId))
		});
		if (!row) throw error(404, 'Transaksi tidak ada.');
		if (row.status !== 'ACTIVE') return fail(400, { error: 'Hanya transaksi aktif.' });
		const before = publicTransaction(row);
		const amount = (cents / 100).toFixed(2);
		await db.transaction(async (tx) => {
			await tx
				.update(transactions)
				.set({ amount, updatedAt: new Date() })
				.where(eq(transactions.id, id));
			await tx.insert(auditLogs).values({
				id: crypto.randomUUID(),
				eventId: actor.eventId,
				actorMemberId: actor.memberId,
				action: 'TRANSACTION_CORRECT',
				entityType: 'transaction',
				entityId: id,
				beforeData: before,
				afterData: { ...before, amount },
				reason
			});
		});
		return { success: 'Koreksi disimpan dengan jejak audit.' };
	},

	void: async (event) => {
		const actor = requireActor(event);
		if (!canManageTransaction(actor)) throw error(403, 'Hanya Bendahara atau MOD.');
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const reason = String(form.get('reason') ?? '').trim();
		if (reason.length < 3) return fail(400, { error: 'Tulis alasan pembatalan.' });
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const row = await db.query.transactions.findFirst({
			where: and(eq(transactions.id, id), eq(transactions.eventId, actor.eventId))
		});
		if (!row) throw error(404, 'Transaksi tidak ada.');
		if (row.status !== 'ACTIVE') return fail(400, { error: 'Sudah dibatalkan.' });
		await db.transaction(async (tx) => {
			await tx
				.update(transactions)
				.set({ status: 'VOIDED', updatedAt: new Date() })
				.where(eq(transactions.id, id));
			await tx.insert(auditLogs).values({
				id: crypto.randomUUID(),
				eventId: actor.eventId,
				actorMemberId: actor.memberId,
				action: 'TRANSACTION_VOID',
				entityType: 'transaction',
				entityId: id,
				beforeData: publicTransaction(row),
				afterData: null,
				reason
			});
		});
		return { success: 'Transaksi dibatalkan, riwayat tetap ada.' };
	},

	setBudget: async (event) => {
		const actor = requireActor(event);
		if (!canManageBudget(actor)) throw error(403, 'Hanya MOD.');
		const form = await event.request.formData();
		const divisionId = String(form.get('divisionId') ?? '').trim();
		const category = String(form.get('category') ?? '')
			.trim()
			.slice(0, 120);
		const cents = parseAmountToCents(String(form.get('amount') ?? ''));
		const notes = String(form.get('notes') ?? '')
			.trim()
			.slice(0, 2000);
		if (!divisionId) return fail(400, { error: 'Divisi wajib.' });
		if (cents === null && String(form.get('amount') ?? '').trim() !== '0')
			return fail(400, { error: 'Nominal harus angka nol atau positif.' });
		const planned = cents ?? 0;
		const db = getDb(event.platform?.env as Record<string, string | undefined> | undefined);
		const division = await db.query.divisions.findFirst({
			where: and(eq(divisions.id, divisionId), eq(divisions.eventId, actor.eventId))
		});
		if (!division) return fail(400, { error: 'Divisi tidak valid.' });
		const existing = await db.query.budgets.findFirst({
			where: and(
				eq(budgets.eventId, actor.eventId),
				eq(budgets.divisionId, divisionId),
				eq(budgets.category, category)
			)
		});
		const amount = (planned / 100).toFixed(2);
		if (existing) {
			const before = { plannedAmount: existing.plannedAmount, notes: existing.notes };
			await db.transaction(async (tx) => {
				await tx
					.update(budgets)
					.set({ plannedAmount: amount, notes, updatedAt: new Date() })
					.where(eq(budgets.id, existing.id));
				await tx.insert(auditLogs).values({
					id: crypto.randomUUID(),
					eventId: actor.eventId,
					actorMemberId: actor.memberId,
					action: 'BUDGET_SET',
					entityType: 'budget',
					entityId: existing.id,
					beforeData: before,
					afterData: { plannedAmount: amount, notes },
					reason: null
				});
			});
			return { success: 'Anggaran diperbarui.' };
		}
		const id = crypto.randomUUID();
		await db.transaction(async (tx) => {
			await tx.insert(budgets).values({
				id,
				eventId: actor.eventId,
				divisionId,
				category,
				plannedAmount: amount,
				notes,
				createdBy: actor.memberId
			});
			await tx.insert(auditLogs).values({
				id: crypto.randomUUID(),
				eventId: actor.eventId,
				actorMemberId: actor.memberId,
				action: 'BUDGET_SET',
				entityType: 'budget',
				entityId: id,
				beforeData: null,
				afterData: { plannedAmount: amount, notes },
				reason: null
			});
		});
		return { success: 'Anggaran dibuat.' };
	}
};
