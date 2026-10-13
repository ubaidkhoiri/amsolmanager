export type SystemRole = 'MOD' | 'DIVISION_ADMIN' | 'COMMITTEE';

export interface Actor {
	memberId: string;
	eventId: string;
	divisionId: string | null;
	systemRole: SystemRole;
	name: string;
}

export function canManageMembers(actor: Actor): boolean {
	return actor.systemRole === 'MOD';
}

export function hasDivisionScope(actor: Actor, divisionId: string): boolean {
	if (actor.systemRole === 'MOD') return true;
	return actor.divisionId !== null && actor.divisionId === divisionId;
}

export interface MeetingScope {
	divisionId: string | null;
}

// MOD manages all meetings. Division admins manage meetings inside their own
// division. Plenary meetings carry no division, so only MOD writes them.
export function canManageMeeting(actor: Actor, meeting: MeetingScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (actor.systemRole !== 'DIVISION_ADMIN') return false;
	return meeting.divisionId !== null && meeting.divisionId === actor.divisionId;
}

export function canManageMinutes(actor: Actor, meeting: MeetingScope): boolean {
	return canManageMeeting(actor, meeting);
}

export interface DecisionScope {
	divisionId: string | null;
	status: string;
}

// Only MOD finalizes. Admins may edit drafts in scope to propose corrections.
// FINAL rows are immutable in place; revisions create a superseding row.
export function canEditDecision(actor: Actor, decision: DecisionScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (decision.status === 'FINAL' || decision.status === 'SUPERSEDED') return false;
	if (actor.systemRole !== 'DIVISION_ADMIN') return false;
	if (decision.divisionId === null) return true;
	return decision.divisionId === actor.divisionId;
}

export function canFinalizeDecision(actor: Actor): boolean {
	return actor.systemRole === 'MOD';
}

export interface TaskScope {
	divisionId: string;
	assignedTo: string | null;
}

// MOD manages all tasks. Admins manage their division. Committee members
// manage only tasks assigned to them.
export function canManageTask(actor: Actor, task: TaskScope): boolean {
	if (actor.systemRole === 'MOD') return true;
	if (actor.systemRole === 'DIVISION_ADMIN') return task.divisionId === actor.divisionId;
	return task.assignedTo !== null && task.assignedTo === actor.memberId;
}
