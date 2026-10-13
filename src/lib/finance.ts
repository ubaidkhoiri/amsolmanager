// Finance calculation rules (PRD FR-09, SDD section 12). Framework-free so
// unit tests cover them without SvelteKit or a database.

export interface MoneyRow {
	type: 'INCOME' | 'EXPENSE';
	amount: string;
	status: 'ACTIVE' | 'VOIDED';
	divisionId: string | null;
}

// Nominal must be positive with at most two decimals. Returns integer cents
// so all math below stays exact, never floating-point.
export function parseAmountToCents(raw: string): number | null {
	if (raw.includes('-')) return null;
	const text = raw.trim().replace(/[^0-9.]/g, '');
	if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
	const cents = Math.round(parseFloat(text) * 100);
	if (!Number.isSafeInteger(cents) || cents <= 0) return null;
	return cents;
}

export function rowToCents(row: MoneyRow): number {
	const [whole, frac = ''] = row.amount.split('.');
	return Number(whole) * 100 + Number((frac + '00').slice(0, 2));
}

// Only ACTIVE rows count. Income and expense stay separate so the balance
// can never confuse the two.
export function summarizeLedger(rows: MoneyRow[]): {
	income: number;
	expense: number;
	balance: number;
} {
	let income = 0;
	let expense = 0;
	for (const row of rows) {
		if (row.status !== 'ACTIVE') continue;
		const cents = rowToCents(row);
		if (row.type === 'INCOME') income += cents;
		else expense += cents;
	}
	return { income, expense, balance: income - expense };
}

export interface BudgetSummary {
	planned: number;
	realized: number;
	remaining: number;
	diff: number;
	percent: number | null;
}

// Realization counts ACTIVE expense rows tied to this division. Rows without
// a division stay in the event summary only, never in a division budget.
export function summarizeBudget(
	planned: number,
	rows: MoneyRow[],
	divisionId: string
): BudgetSummary {
	const realized = rows
		.filter((r) => r.status === 'ACTIVE' && r.type === 'EXPENSE' && r.divisionId === divisionId)
		.reduce((sum, r) => sum + rowToCents(r), 0);
	return {
		planned,
		realized,
		remaining: planned - realized,
		diff: realized - planned,
		percent: planned === 0 ? null : (realized / planned) * 100
	};
}

export function formatRupiah(cents: number): string {
	const sign = cents < 0 ? '-' : '';
	const whole = Math.floor(Math.abs(cents) / 100).toLocaleString('id-ID');
	return `${sign}Rp${whole}`;
}
