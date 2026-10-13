import { describe, expect, it } from 'vitest';
import {
	canTransition,
	DECISION_TRANSITIONS,
	isTaskOverdue,
	MEETING_TRANSITIONS,
	taskRequiresAssigneeAndDue,
	TASK_TRANSITIONS
} from '../../src/lib/workflow';
import {
	canEditDecision,
	canFinalizeDecision,
	canManageMeeting,
	canManageTask,
	type Actor
} from '../../src/lib/server/auth/permissions';

const mod: Actor = {
	memberId: 'm-mod',
	eventId: 'e1',
	divisionId: null,
	systemRole: 'MOD',
	name: 'Mod'
};
const adminA: Actor = {
	memberId: 'm-a',
	eventId: 'e1',
	divisionId: 'div-a',
	systemRole: 'DIVISION_ADMIN',
	name: 'Admin A'
};
const committee: Actor = {
	memberId: 'm-c',
	eventId: 'e1',
	divisionId: 'div-a',
	systemRole: 'COMMITTEE',
	name: 'Panitia'
};

describe('meeting transitions', () => {
	it('follows draft to archived path', () => {
		expect(canTransition(MEETING_TRANSITIONS, 'DRAFT', 'SCHEDULED')).toBe(true);
		expect(canTransition(MEETING_TRANSITIONS, 'SCHEDULED', 'IN_PROGRESS')).toBe(true);
		expect(canTransition(MEETING_TRANSITIONS, 'IN_PROGRESS', 'COMPLETED')).toBe(true);
		expect(canTransition(MEETING_TRANSITIONS, 'COMPLETED', 'ARCHIVED')).toBe(true);
	});

	it('rejects skips and backwards moves', () => {
		expect(canTransition(MEETING_TRANSITIONS, 'DRAFT', 'COMPLETED')).toBe(false);
		expect(canTransition(MEETING_TRANSITIONS, 'COMPLETED', 'DRAFT')).toBe(false);
		expect(canTransition(MEETING_TRANSITIONS, 'ARCHIVED', 'DRAFT')).toBe(false);
	});
});

describe('decision transitions', () => {
	it('allows draft to final via discussion', () => {
		expect(canTransition(DECISION_TRANSITIONS, 'DRAFT', 'NEEDS_DISCUSSION')).toBe(true);
		expect(canTransition(DECISION_TRANSITIONS, 'NEEDS_DISCUSSION', 'FINAL')).toBe(true);
		expect(canTransition(DECISION_TRANSITIONS, 'DRAFT', 'FINAL')).toBe(true);
	});

	it('freezes final rows in place', () => {
		expect(canTransition(DECISION_TRANSITIONS, 'FINAL', 'DRAFT')).toBe(false);
		expect(canTransition(DECISION_TRANSITIONS, 'SUPERSEDED', 'DRAFT')).toBe(false);
	});
});

describe('task rules', () => {
	it('walks backlog to done with blocked loop', () => {
		expect(canTransition(TASK_TRANSITIONS, 'BACKLOG', 'TODO')).toBe(true);
		expect(canTransition(TASK_TRANSITIONS, 'TODO', 'IN_PROGRESS')).toBe(true);
		expect(canTransition(TASK_TRANSITIONS, 'IN_PROGRESS', 'BLOCKED')).toBe(true);
		expect(canTransition(TASK_TRANSITIONS, 'BLOCKED', 'IN_PROGRESS')).toBe(true);
		expect(canTransition(TASK_TRANSITIONS, 'IN_PROGRESS', 'DONE')).toBe(true);
		expect(canTransition(TASK_TRANSITIONS, 'DONE', 'TODO')).toBe(false);
	});

	it('requires PIC and deadline past planning', () => {
		expect(taskRequiresAssigneeAndDue('BACKLOG')).toBe(false);
		expect(taskRequiresAssigneeAndDue('TODO')).toBe(true);
		expect(taskRequiresAssigneeAndDue('DONE')).toBe(true);
	});

	it('derives overdue from date and status', () => {
		const past = new Date('2026-01-01T00:00:00Z');
		const future = new Date('2027-01-01T00:00:00Z');
		const now = new Date('2026-06-01T00:00:00Z');
		expect(isTaskOverdue(past, 'TODO', now)).toBe(true);
		expect(isTaskOverdue(future, 'TODO', now)).toBe(false);
		expect(isTaskOverdue(past, 'DONE', now)).toBe(false);
		expect(isTaskOverdue(null, 'TODO', now)).toBe(false);
	});
});

describe('meeting and decision permissions', () => {
	it('lets MOD manage everything', () => {
		expect(canManageMeeting(mod, { divisionId: null })).toBe(true);
		expect(canEditDecision(mod, { divisionId: null, status: 'FINAL' })).toBe(true);
		expect(canFinalizeDecision(mod)).toBe(true);
	});

	it('scopes division admin to own division', () => {
		expect(canManageMeeting(adminA, { divisionId: 'div-a' })).toBe(true);
		expect(canManageMeeting(adminA, { divisionId: 'div-b' })).toBe(false);
		expect(canManageMeeting(adminA, { divisionId: null })).toBe(false);
		expect(canManageMeeting(committee, { divisionId: 'div-a' })).toBe(false);
	});

	it('blocks non-MOD from final decisions', () => {
		expect(canEditDecision(adminA, { divisionId: 'div-a', status: 'DRAFT' })).toBe(true);
		expect(canEditDecision(adminA, { divisionId: 'div-a', status: 'FINAL' })).toBe(false);
		expect(canEditDecision(committee, { divisionId: 'div-a', status: 'DRAFT' })).toBe(false);
		expect(canFinalizeDecision(adminA)).toBe(false);
	});
});

describe('task permissions', () => {
	const own = { divisionId: 'div-a', assignedTo: 'm-c' };
	it('grants MOD all and admin own division', () => {
		expect(canManageTask(mod, own)).toBe(true);
		expect(canManageTask(adminA, own)).toBe(true);
		expect(canManageTask(adminA, { divisionId: 'div-b', assignedTo: null })).toBe(false);
	});

	it('limits committee to assigned tasks', () => {
		expect(canManageTask(committee, own)).toBe(true);
		expect(canManageTask(committee, { divisionId: 'div-a', assignedTo: 'm-other' })).toBe(false);
	});
});
