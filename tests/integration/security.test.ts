import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import {
	canAdvancePublication,
	canAdvanceSupport,
	canEditDecision,
	canFinalizeDecision,
	canManageBudget,
	canManageMembers,
	canManageMeeting,
	canManageTask,
	canManageTransaction,
	type Actor
} from '../../src/lib/server/auth/permissions';
import { validateSessionToken } from '../../src/lib/server/auth/session';
import { createDb, type Db } from '../../src/lib/server/db/client';
import { auditLogs } from '../../src/lib/server/db/schema/audit';
import { decisions } from '../../src/lib/server/db/schema/decisions';
import { divisions } from '../../src/lib/server/db/schema/divisions';
import { budgets, transactions } from '../../src/lib/server/db/schema/finance';
import { meetings } from '../../src/lib/server/db/schema/meetings';
import { members } from '../../src/lib/server/db/schema/members';
import { minuteItems } from '../../src/lib/server/db/schema/minute-items';
import { supportRequests } from '../../src/lib/server/db/schema/support-requests';
import { tasks } from '../../src/lib/server/db/schema/tasks';
import { summarizeBudget, summarizeLedger } from '../../src/lib/finance';

function loadDatabaseUrl(): string {
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
	const line = fs
		.readFileSync(path.join(root, '.env'), 'utf8')
		.split('\n')
		.find((l) => l.startsWith('DATABASE_URL='));
	if (!line) throw new Error('.env tanpa DATABASE_URL, integrasi batal');
	return line.slice('DATABASE_URL='.length).replace(/^"|"$/g, '').trim();
}

let db: Db;
let eventId = '';
let divA = '';
let divB = '';
const modId = crypto.randomUUID();
const adminAId = crypto.randomUUID();
const comBId = crypto.randomUUID();
const ids = [modId, adminAId, comBId];

let adminAActor: Actor;
let comBActor: Actor;

beforeAll(async () => {
	db = createDb(loadDatabaseUrl());
	const found = await db.query.events.findMany();
	const event = found.find((e) => e.slug === 'genawards-cook-edition');
	if (!event) throw new Error('seed event belum ada, jalanin scripts/db-seed.mjs dulu');
	eventId = event.id;

	const allDiv = await db.select().from(divisions).where(eq(divisions.eventId, eventId));
	const acara = allDiv.find((d) => d.slug === 'acara');
	const konsumsi = allDiv.find((d) => d.slug === 'konsumsi');
	if (!acara || !konsumsi) throw new Error('seed divisi belum ada');
	divA = acara.id;
	divB = konsumsi.id;

	await db.insert(members).values([
		{ id: modId, eventId, name: '__sec_mod__', systemRole: 'MOD' },
		{
			id: adminAId,
			eventId,
			divisionId: divA,
			name: '__sec_admin_a__',
			systemRole: 'DIVISION_ADMIN'
		},
		{
			id: comBId,
			eventId,
			divisionId: divB,
			name: '__sec_com_b__',
			organizationalPosition: 'Bendahara',
			systemRole: 'COMMITTEE'
		}
	]);
	adminAActor = {
		memberId: adminAId,
		eventId,
		divisionId: divA,
		systemRole: 'DIVISION_ADMIN',
		name: 'a',
		position: null
	};
	comBActor = {
		memberId: comBId,
		eventId,
		divisionId: divB,
		systemRole: 'COMMITTEE',
		name: 'c',
		position: 'Bendahara'
	};
});

afterAll(async () => {
	await db.delete(auditLogs).where(inArray(auditLogs.actorMemberId, ids));
	await db.delete(transactions).where(inArray(transactions.recordedBy, ids));
	await db.delete(budgets).where(inArray(budgets.createdBy, ids));
	await db.delete(supportRequests).where(inArray(supportRequests.requestedBy, ids));
	await db.delete(tasks).where(inArray(tasks.createdBy, ids));
	await db.delete(decisions).where(inArray(decisions.createdBy, ids));
	await db.delete(minuteItems).where(inArray(minuteItems.createdBy, ids));
	await db.delete(meetings).where(inArray(meetings.createdBy, ids));
	await db.delete(members).where(inArray(members.id, ids));
});

describe('negative security', () => {
	it('token sesi sampah ditolak', async () => {
		expect(await validateSessionToken(db, 'bukan-token-valid')).toBeNull();
	});

	it('DB tolak nominal transaksi negatif via check', async () => {
		await expect(
			db.insert(transactions).values({
				id: crypto.randomUUID(),
				eventId,
				type: 'EXPENSE',
				amount: '-5000.00',
				transactionDate: new Date(),
				recordedBy: modId
			})
		).rejects.toThrow();
	});

	it('DB tolak FK divisi fiktif', async () => {
		await expect(
			db.insert(meetings).values({
				id: crypto.randomUUID(),
				eventId,
				title: '__sec_bogus__',
				meetingType: 'DIVISION',
				divisionId: crypto.randomUUID(),
				agenda: '',
				createdBy: modId
			})
		).rejects.toThrow();
	});

	it('hanya MOD yang finalize keputusan dan kelola anggota', () => {
		expect(canFinalizeDecision(adminAActor)).toBe(false);
		expect(canFinalizeDecision(comBActor)).toBe(false);
		expect(canManageMembers(adminAActor)).toBe(false);
	});

	it('keputusan FINAL tak bisa diedit admin', () => {
		expect(canEditDecision(adminAActor, { divisionId: divA, status: 'FINAL' })).toBe(false);
		expect(canEditDecision(adminAActor, { divisionId: divA, status: 'DRAFT' })).toBe(true);
	});

	it('admin tak bisa kelola rapat pleno atau divisi lain', () => {
		expect(canManageMeeting(adminAActor, { divisionId: null })).toBe(false);
		expect(canManageMeeting(adminAActor, { divisionId: divB })).toBe(false);
		expect(canManageMeeting(adminAActor, { divisionId: divA })).toBe(true);
	});

	it('panitia tak bisa kelola tugas orang lain', () => {
		expect(canManageTask(comBActor, { divisionId: divB, assignedTo: adminAId })).toBe(false);
		expect(canManageTask(comBActor, { divisionId: divB, assignedTo: comBId })).toBe(true);
	});

	it('pengaju tak bisa terima permintaannya sendiri', () => {
		const req = {
			requestingDivisionId: divA,
			targetDivisionId: divB,
			requestedBy: adminAId,
			status: 'UNDER_REVIEW'
		};
		expect(canAdvanceSupport(adminAActor, req, 'ACCEPTED')).toBe(false);
		expect(canAdvanceSupport(adminAActor, req, 'CANCELLED')).toBe(true);
	});

	it('committee luar tak bisa putuskan permintaan orang', () => {
		const req = {
			requestingDivisionId: divA,
			targetDivisionId: divB,
			requestedBy: adminAId,
			status: 'UNDER_REVIEW'
		};
		expect(canAdvanceSupport(comBActor, req, 'ACCEPTED')).toBe(false);
	});

	it('bendahara boleh catat tapi tak boleh atur anggaran', () => {
		expect(canManageTransaction(comBActor)).toBe(true);
		expect(canManageBudget(comBActor)).toBe(false);
		expect(canManageTransaction(adminAActor)).toBe(false);
	});

	it('owner luar divisi tak bisa approve publikasi', () => {
		const pub = { divisionId: divA, designOwnerId: comBId, copyOwnerId: null };
		expect(canAdvancePublication(comBActor, pub, 'APPROVED')).toBe(false);
		expect(canAdvancePublication(comBActor, pub, 'REVIEW')).toBe(true);
	});
});

describe('e2e critical flow', () => {
	it('rapat jadi notulen jadi keputusan jadi tugas, bantuan diterima, uang tercatat', async () => {
		const meetingId = crypto.randomUUID();
		await db.insert(meetings).values({
			id: meetingId,
			eventId,
			title: '__sec_e2e__',
			meetingType: 'DIVISION',
			divisionId: divA,
			agenda: 'uji alur',
			status: 'COMPLETED',
			createdBy: adminAId
		});
		await db.insert(minuteItems).values({
			id: crypto.randomUUID(),
			meetingId,
			divisionId: divA,
			topic: 'konsumsi',
			outcome: 'butuh 50 box',
			status: 'DONE',
			createdBy: adminAId
		});
		const decisionId = crypto.randomUUID();
		await db.insert(decisions).values({
			id: decisionId,
			eventId,
			meetingId,
			divisionId: divA,
			title: 'Pesan 50 box',
			status: 'FINAL',
			decidedBy: modId,
			decidedAt: new Date(),
			createdBy: modId
		});
		const taskId = crypto.randomUUID();
		await db.insert(tasks).values({
			id: taskId,
			eventId,
			divisionId: divA,
			title: 'Pesan 50 box',
			assignedTo: adminAId,
			status: 'DONE',
			dueAt: new Date(),
			sourceDecisionId: decisionId,
			createdBy: adminAId
		});
		const reqId = crypto.randomUUID();
		await db.insert(supportRequests).values({
			id: reqId,
			eventId,
			requestingDivisionId: divA,
			targetDivisionId: divB,
			title: 'Siapkan 50 box',
			status: 'ACCEPTED',
			requestedBy: adminAId,
			acceptedBy: comBId,
			linkedTaskId: taskId,
			createdBy: adminAId
		});
		const budgetId = crypto.randomUUID();
		await db.insert(budgets).values({
			id: budgetId,
			eventId,
			divisionId: divB,
			category: 'konsumsi',
			plannedAmount: '200000.00',
			createdBy: modId
		});
		const txId = crypto.randomUUID();
		const now = new Date();
		await db.insert(transactions).values({
			id: txId,
			eventId,
			divisionId: divB,
			budgetId,
			type: 'EXPENSE',
			amount: '75000.00',
			category: 'konsumsi',
			description: '50 box',
			transactionDate: now,
			recordedBy: comBId
		});
		await db.insert(auditLogs).values({
			id: crypto.randomUUID(),
			eventId,
			actorMemberId: comBId,
			action: 'TRANSACTION_CREATE',
			entityType: 'transaction',
			entityId: txId,
			afterData: { amount: '75000.00' }
		});

		const linked = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
		expect(linked?.sourceDecisionId).toBe(decisionId);
		const req = await db.query.supportRequests.findFirst({
			where: eq(supportRequests.id, reqId)
		});
		expect(req?.linkedTaskId).toBe(taskId);
		const audit = await db.query.auditLogs.findFirst({
			where: eq(auditLogs.entityId, txId)
		});
		expect(audit?.action).toBe('TRANSACTION_CREATE');

		const rows = await db.select().from(transactions).where(eq(transactions.eventId, eventId));
		const ledger = summarizeLedger(
			rows.map((r) => ({
				amount: r.amount,
				type: r.type,
				status: r.status,
				divisionId: r.divisionId
			}))
		);
		expect(ledger.expense).toBe(7500000);
		const summary = summarizeBudget(
			20000000,
			rows.map((r) => ({
				amount: r.amount,
				type: r.type,
				status: r.status,
				divisionId: r.divisionId
			})),
			divB
		);
		expect(summary.remaining).toBe(12500000);
		expect(summary.percent).toBeCloseTo(37.5);
	});
});
