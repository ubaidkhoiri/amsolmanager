import { check, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { divisions } from './divisions';
import { events } from './events';
import { members } from './members';

export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE']);

export const transactionStatusEnum = pgEnum('transaction_status', ['ACTIVE', 'VOIDED']);

export const budgets = pgTable(
	'budgets',
	{
		id: uuid('id').primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'restrict' }),
		divisionId: uuid('division_id')
			.notNull()
			.references(() => divisions.id, { onDelete: 'restrict' }),
		category: text('category').notNull().default(''),
		plannedAmount: numeric('planned_amount', { precision: 19, scale: 2 }).notNull(),
		notes: text('notes').notNull().default(''),
		createdBy: uuid('created_by')
			.notNull()
			.references(() => members.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [check('budgets_planned_non_negative', sql`${table.plannedAmount} >= 0`)]
);

export const transactions = pgTable(
	'transactions',
	{
		id: uuid('id').primaryKey(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'restrict' }),
		divisionId: uuid('division_id').references(() => divisions.id, { onDelete: 'restrict' }),
		budgetId: uuid('budget_id').references(() => budgets.id, { onDelete: 'restrict' }),
		type: transactionTypeEnum('type').notNull(),
		amount: numeric('amount', { precision: 19, scale: 2 }).notNull(),
		category: text('category').notNull().default(''),
		description: text('description').notNull().default(''),
		transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
		evidenceUrl: text('evidence_url'),
		recordedBy: uuid('recorded_by')
			.notNull()
			.references(() => members.id, { onDelete: 'restrict' }),
		status: transactionStatusEnum('status').notNull().default('ACTIVE'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [check('transactions_amount_positive', sql`${table.amount} > 0`)]
);
