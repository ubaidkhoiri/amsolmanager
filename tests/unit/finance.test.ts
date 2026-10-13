import { describe, expect, it } from 'vitest';
import {
	canManageBudget,
	canManageTransaction,
	type Actor
} from '../../src/lib/server/auth/permissions';
import {
	formatRupiah,
	parseAmountToCents,
	summarizeBudget,
	summarizeLedger,
	type MoneyRow
} from '../../src/lib/finance';

const mod: Actor = {
	memberId: 'm-mod',
	eventId: 'e1',
	divisionId: null,
	systemRole: 'MOD',
	name: 'Mod',
	position: null
};
const bendahara: Actor = {
	memberId: 'm-b',
	eventId: 'e1',
	divisionId: null,
	systemRole: 'COMMITTEE',
	name: 'Bendahara',
	position: 'Bendahara'
};
const committee: Actor = {
	memberId: 'm-c',
	eventId: 'e1',
	divisionId: 'div-a',
	systemRole: 'COMMITTEE',
	name: 'Panitia',
	position: null
};

describe('parseAmountToCents', () => {
	it('accepts positive rupiah values', () => {
		expect(parseAmountToCents('250000')).toBe(25000000);
		expect(parseAmountToCents('1500.50')).toBe(150050);
	});

	it('rejects zero, negative, and malformed input', () => {
		expect(parseAmountToCents('0')).toBeNull();
		expect(parseAmountToCents('-500')).toBeNull();
		expect(parseAmountToCents('12.345')).toBeNull();
		expect(parseAmountToCents('abc')).toBeNull();
	});
});

describe('summarizeLedger', () => {
	const rows: MoneyRow[] = [
		{ type: 'INCOME', amount: '1000000.00', status: 'ACTIVE', divisionId: null },
		{ type: 'EXPENSE', amount: '250000.00', status: 'ACTIVE', divisionId: 'div-a' },
		{ type: 'EXPENSE', amount: '999999.00', status: 'VOIDED', divisionId: 'div-a' }
	];
	it('keeps income and expense separate and skips voided rows', () => {
		const summary = summarizeLedger(rows);
		expect(summary.income).toBe(100000000);
		expect(summary.expense).toBe(25000000);
		expect(summary.balance).toBe(75000000);
	});
});

describe('summarizeBudget', () => {
	const rows: MoneyRow[] = [
		{ type: 'EXPENSE', amount: '250000.00', status: 'ACTIVE', divisionId: 'div-a' },
		{ type: 'EXPENSE', amount: '100000.00', status: 'ACTIVE', divisionId: 'div-b' },
		{ type: 'INCOME', amount: '50000.00', status: 'ACTIVE', divisionId: 'div-a' }
	];
	it('counts only matching division expense', () => {
		const summary = summarizeBudget(100000000, rows, 'div-a');
		expect(summary.realized).toBe(25000000);
		expect(summary.remaining).toBe(75000000);
		expect(summary.diff).toBe(-75000000);
		expect(summary.percent).toBeCloseTo(25);
	});

	it('returns null percent on zero budget', () => {
		expect(summarizeBudget(0, rows, 'div-a').percent).toBeNull();
	});
});

describe('finance permissions', () => {
	it('lets MOD and Bendahara write, others read only', () => {
		expect(canManageTransaction(mod)).toBe(true);
		expect(canManageTransaction(bendahara)).toBe(true);
		expect(canManageTransaction(committee)).toBe(false);
		expect(canManageBudget(mod)).toBe(true);
		expect(canManageBudget(bendahara)).toBe(false);
	});
});

describe('formatRupiah', () => {
	it('formats cents in Indonesian style', () => {
		expect(formatRupiah(25000000)).toBe('Rp250.000');
	});
});
